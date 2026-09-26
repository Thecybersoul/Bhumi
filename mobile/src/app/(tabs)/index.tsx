import { useCallback, useMemo, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi, ApiError } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { colors, radius, space, text } from '@/lib/theme'
import { ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Avatar, timeAgo } from '@/components/people'
import { ActivityRow } from '@/components/activity'
import { KIND_ICON, KIND_TINT, dayLabel, needsOutcome, timeOf } from '@/lib/meetings'
import type { Activity, ApiResult, Lead, Meeting, Property, PropertyTransaction, Task, TransactionStage } from '@/lib/types'

type IconName = keyof typeof Ionicons.glyphMap

const STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']

interface Data {
  tasks: Task[]
  meetings: Meeting[]
  deals: PropertyTransaction[]
  listings: Property[]
  leads: Lead[]
  activity: Activity[]
}

type AgendaItem =
  | { kind: 'meeting'; at: string; m: Meeting }
  | { kind: 'task'; at: string | null; t: Task; overdue: boolean }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const endOfDay = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/* Home is about what needs doing, not what it's worth: today's
   meetings and tasks, deals in motion, listings, new leads and what
   the rest of the team has been changing. */
export default function HomeScreen() {
  const api = useApi()
  const { user } = useSession()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const soft = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback)
      const [tasks, meetings, deals, listings, leads, activity] = await Promise.all([
        api.get<ApiResult<Task[]>>('/api/tasks'),
        soft(api.get<{ data: Meeting[] }>('/api/meetings'), { data: [] as Meeting[] }),
        api.get<ApiResult<PropertyTransaction[]>>('/api/transactions'),
        api.get<ApiResult<Property[]>>('/api/properties?admin=1'),
        soft(api.get<ApiResult<Lead[]>>('/api/leads'), { data: [] as Lead[], source: 'fallback' as const }),
        soft(api.get<{ data: Activity[] }>('/api/activity?limit=8'), { data: [] as Activity[] }),
      ])
      setData({
        tasks: tasks.source === 'live' ? tasks.data : [],
        meetings: meetings.data,
        deals: deals.source === 'live' ? deals.data : [],
        listings: listings.data,
        leads: leads.source === 'live' ? leads.data : [],
        activity: activity.data,
      })
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load')
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const view = useMemo(() => {
    if (!data) return null
    const now = Date.now()
    const today = endOfDay()
    const week = endOfDay(7)
    const open = data.tasks.filter((t) => t.status === 'Open')
    const overdue = open.filter((t) => t.due_at && new Date(t.due_at).getTime() < now)
    const dueToday = open.filter((t) => t.due_at && new Date(t.due_at).getTime() >= now && new Date(t.due_at).getTime() <= today)
    const live = data.meetings.filter((m) => m.status !== 'Cancelled')
    const meetingsToday = live.filter((m) => {
      const t = new Date(m.scheduled_at).getTime()
      return t <= today && t >= new Date().setHours(0, 0, 0, 0)
    })
    const agenda: AgendaItem[] = [
      ...overdue.map((t) => ({ kind: 'task' as const, at: t.due_at ?? null, t, overdue: true })),
      ...[
        ...meetingsToday.map((m) => ({ kind: 'meeting' as const, at: m.scheduled_at, m })),
        ...dueToday.map((t) => ({ kind: 'task' as const, at: t.due_at ?? null, t, overdue: false })),
      ].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')),
    ]
    const upcoming: AgendaItem[] = [
      ...live.filter((m) => new Date(m.scheduled_at).getTime() > today && new Date(m.scheduled_at).getTime() <= week).map((m) => ({ kind: 'meeting' as const, at: m.scheduled_at, m })),
      ...open.filter((t) => t.due_at && new Date(t.due_at).getTime() > today && new Date(t.due_at).getTime() <= week).map((t) => ({ kind: 'task' as const, at: t.due_at ?? null, t, overdue: false })),
    ]
      .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''))
      .slice(0, 6)
    const activeDeals = data.deals
      .filter((d) => d.outcome === 'In progress')
      .sort((a, b) => (b.updated_at ?? b.opened_at).localeCompare(a.updated_at ?? a.opened_at))
    const nextMeetingFor = (id: string) =>
      live.filter((m) => m.entity_type === 'transaction' && m.entity_id === id && new Date(m.scheduled_at).getTime() > now).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0]
    const byStatus = (s: string) => data.listings.filter((l) => l.status === s).length
    const recentListings = [...data.listings]
      .sort((a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at))
      .slice(0, 3)
    const newLeads = data.leads.filter((l) => l.stage === 'New')
    const owed = live.filter(needsOutcome)
    return { overdue, dueToday, meetingsToday, agenda, upcoming, activeDeals, nextMeetingFor, byStatus, recentListings, newLeads, owed, open }
  }, [data])

  if (!data && !error) return <LoadingScreen />
  const first = user?.name?.split(' ')[0]

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: space.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
            tintColor={colors.white}
            colors={[colors.navy]}
          />
        }
      >
        <View style={s.hero}>
          <Text style={s.hello}>
            {greeting()}
            {first ? `, ${first}` : ''}
          </Text>
          <Text style={s.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          {view ? (
            <View style={s.stats}>
              <Stat icon="checkbox" value={view.dueToday.length + view.overdue.length} label="Tasks due" alert={view.overdue.length ? `${view.overdue.length} late` : undefined} onPress={() => router.push('/notes-tasks')} />
              <Stat icon="people" value={view.meetingsToday.length} label="Meetings" onPress={() => router.push('/meetings')} />
              <Stat icon="briefcase" value={view.activeDeals.length} label="Open deals" onPress={() => router.push('/deals')} />
              <Stat icon="map" value={view.byStatus('Live')} label="Live listings" onPress={() => router.push('/properties')} />
            </View>
          ) : null}
        </View>

        <View style={s.body}>
          {error && <ErrorBanner message={error} />}

          <View style={s.quick}>
            <Quick icon="checkbox-outline" label="Task" onPress={() => router.push({ pathname: '/notes-tasks', params: { new: '1' } })} />
            <Quick icon="people-outline" label="Meeting" onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: 'new' } })} />
            <Quick icon="briefcase-outline" label="Deal" onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: 'new' } })} />
            <Quick icon="map-outline" label="Listing" onPress={() => router.push({ pathname: '/property/[id]', params: { id: 'new' } })} />
          </View>

          {view ? (
            <>
              <Section title="Today" icon="sunny-outline" action={view.open.length ? `${view.open.length} open tasks` : undefined} onAction={() => router.push('/notes-tasks')}>
                {view.agenda.length === 0 ? (
                  <Empty text="Nothing due and no meetings today." />
                ) : (
                  view.agenda.slice(0, 8).map((a) => <AgendaRow key={a.kind === 'meeting' ? `m${a.m.id}` : `t${a.t.id}`} a={a} />)
                )}
              </Section>

              {view.owed.length ? (
                <TouchableOpacity style={s.owed} onPress={() => router.push('/meetings')}>
                  <Ionicons name="create-outline" size={18} color={colors.pending} />
                  <Text style={s.owedText}>
                    {view.owed.length} past meeting{view.owed.length > 1 ? 's' : ''} still need{view.owed.length > 1 ? '' : 's'} an outcome written up
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.pending} />
                </TouchableOpacity>
              ) : null}

              <Section title="Coming up this week" icon="calendar-outline" action="Meetings" onAction={() => router.push('/meetings')}>
                {view.upcoming.length === 0 ? <Empty text="Nothing scheduled for the next 7 days." /> : view.upcoming.map((a) => <AgendaRow key={a.kind === 'meeting' ? `m${a.m.id}` : `t${a.t.id}`} a={a} withDay />)}
              </Section>

              <Section title="Deals in motion" icon="briefcase-outline" action="Pipeline" onAction={() => router.push('/deals')}>
                {view.activeDeals.length === 0 ? (
                  <Empty text="No open deals. Start one from a lead or listing." />
                ) : (
                  view.activeDeals.slice(0, 5).map((d) => {
                    const idx = STAGES.indexOf(d.stage)
                    const next = view.nextMeetingFor(d.id)
                    return (
                      <TouchableOpacity key={d.id} style={s.deal} onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: d.id } })}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.lineTitle} numberOfLines={1}>{d.property_label}</Text>
                          <Text style={s.lineSub} numberOfLines={1}>
                            {d.reference} · {[d.buyer_name, d.seller_name].filter(Boolean).join(' / ') || 'No parties yet'}
                          </Text>
                          <View style={s.stages}>
                            {STAGES.slice(0, 4).map((st, i) => (
                              <View key={st} style={[s.stageBar, i <= idx && { backgroundColor: colors.navy500 }]} />
                            ))}
                            <Text style={s.stageText}>{d.stage}</Text>
                          </View>
                          {next ? (
                            <Text style={s.nextMeet}>
                              <Ionicons name={KIND_ICON[next.kind]} size={11} color={colors.goldDeep} /> {next.kind} · {dayLabel(next.scheduled_at)}, {timeOf(next.scheduled_at)}
                            </Text>
                          ) : null}
                        </View>
                        {d.updated_by || d.created_by ? <Avatar name={d.updated_by || d.created_by} size={24} /> : null}
                      </TouchableOpacity>
                    )
                  })
                )}
              </Section>

              <Section title="Listings" icon="map-outline" action="All listings" onAction={() => router.push('/properties')}>
                <View style={s.statusRow}>
                  {(
                    [
                      ['Live', colors.verified, colors.verifiedBg],
                      ['Reserved', colors.progress, colors.progressBg],
                      ['Sold', colors.goldDeep, colors.goldTint],
                    ] as const
                  ).map(([st, fg, bg]) => (
                    <View key={st} style={[s.statusChip, { backgroundColor: bg }]}>
                      <Text style={[s.statusNum, { color: fg }]}>{view.byStatus(st)}</Text>
                      <Text style={[s.statusLabel, { color: fg }]}>{st}</Text>
                    </View>
                  ))}
                </View>
                {view.recentListings.map((p) => {
                  const img = p.img_url ? (p.img_url.startsWith('http') ? p.img_url : `${API_URL}${p.img_url}`) : null
                  return (
                    <TouchableOpacity key={p.id} style={s.listing} onPress={() => router.push(`/property/${encodeURIComponent(p.id)}`)}>
                      {img ? <Image source={{ uri: img }} style={s.thumb} /> : <View style={[s.thumb, { backgroundColor: colors.line2 }]} />}
                      <View style={{ flex: 1 }}>
                        <Text style={s.lineTitle} numberOfLines={1}>{p.title}</Text>
                        <Text style={s.lineSub} numberOfLines={1}>
                          {p.code} · {p.status}
                          {p.updated_by ? ` · edited by ${p.updated_by} ${timeAgo(p.updated_at)}` : p.created_by ? ` · added by ${p.created_by}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    </TouchableOpacity>
                  )
                })}
              </Section>

              {view.newLeads.length ? (
                <Section title="New leads to contact" icon="person-add-outline" action="Leads" onAction={() => router.push('/deals')}>
                  {view.newLeads.slice(0, 4).map((l) => (
                    <View key={l.id} style={s.line}>
                      <View style={s.leadDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.lineTitle} numberOfLines={1}>{l.name}</Text>
                        <Text style={s.lineSub} numberOfLines={1}>
                          {l.kind}
                          {l.property_code ? ` · ${l.property_code}` : ''} · {timeAgo(l.created_at)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </Section>
              ) : null}

              <Section title="Team activity" icon="pulse-outline" action="See all" onAction={() => router.push('/activity')}>
                {data?.activity.length ? data.activity.slice(0, 6).map((a) => <ActivityRow key={a.id} a={a} />) : <Empty text="Changes by the team will show here." />}
              </Section>
            </>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  )
}

function AgendaRow({ a, withDay }: { a: AgendaItem; withDay?: boolean }) {
  if (a.kind === 'meeting') {
    const m = a.m
    return (
      <TouchableOpacity style={s.line} onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: m.id } })}>
        <View style={[s.agendaIcon, { backgroundColor: `${KIND_TINT[m.kind]}18` }]}>
          <Ionicons name={KIND_ICON[m.kind]} size={15} color={KIND_TINT[m.kind]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.lineTitle} numberOfLines={1}>{m.title}</Text>
          <Text style={s.lineSub} numberOfLines={1}>
            {m.kind}
            {m.entity_label ? ` · ${m.entity_label}` : m.attendees ? ` · ${m.attendees}` : ''}
          </Text>
        </View>
        <Text style={s.lineRight}>{withDay ? `${dayLabel(m.scheduled_at).slice(0, 9)}\n` : ''}{timeOf(m.scheduled_at)}</Text>
      </TouchableOpacity>
    )
  }
  const t = a.t
  return (
    <TouchableOpacity style={s.line} onPress={() => router.push('/notes-tasks')}>
      <View style={[s.agendaIcon, { backgroundColor: a.overdue ? colors.flaggedBg : colors.navyTint }]}>
        <Ionicons name={a.overdue ? 'alert' : 'checkbox-outline'} size={15} color={a.overdue ? colors.flagged : colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.lineTitle} numberOfLines={1}>{t.title}</Text>
        <Text style={s.lineSub} numberOfLines={1}>
          {a.overdue ? 'Overdue' : 'Task'}
          {t.entity_label ? ` · ${t.entity_label}` : ''}
          {t.priority === 'High' ? ' · High priority' : ''}
        </Text>
      </View>
      <Text style={[s.lineRight, a.overdue && { color: colors.flagged }]}>
        {t.due_at ? (a.overdue || withDay ? `${dayLabel(t.due_at).slice(0, 9)}\n${timeOf(t.due_at)}` : timeOf(t.due_at)) : ''}
      </Text>
    </TouchableOpacity>
  )
}

function Stat({ icon, value, label, alert, onPress }: { icon: IconName; value: number; label: string; alert?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.stat} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={15} color={colors.goldSoft} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
      {alert ? <Text style={s.statAlert}>{alert}</Text> : null}
    </TouchableOpacity>
  )
}

function Quick({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.quickItem} onPress={onPress}>
      <View style={s.quickIcon}>
        <Ionicons name={icon} size={21} color={colors.navy} />
        <View style={s.plus}>
          <Ionicons name="add" size={11} color={colors.white} />
        </View>
      </View>
      <Text style={s.quickLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function Section({ title, icon, action, onAction, children }: { title: string; icon: IconName; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Ionicons name={icon} size={16} color={colors.navy} />
        <Text style={s.sectionTitle}>{title}</Text>
        {action ? (
          <TouchableOpacity onPress={onAction} hitSlop={8} style={s.actionBtn}>
            <Text style={s.sectionAction}>{action}</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.goldDeep} />
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  )
}

function Empty({ text: msg }: { text: string }) {
  return <Text style={s.empty}>{msg}</Text>
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.navy, paddingHorizontal: space.lg, paddingTop: 4, paddingBottom: 46 },
  hello: { color: colors.white, fontSize: text.xl, fontWeight: '800' },
  date: { color: 'rgba(255,255,255,0.65)', fontSize: text.sm, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 8, marginTop: space.lg },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statValue: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', marginTop: 1 },
  statAlert: { color: colors.goldSoft, fontSize: 10, fontWeight: '800', marginTop: 2 },
  body: { paddingHorizontal: space.lg, marginTop: -30 },
  quick: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: space.md,
    shadowColor: '#0A2A20',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.navyTint, alignItems: 'center', justifyContent: 'center' },
  plus: { position: 'absolute', right: -3, bottom: -3, width: 17, height: 17, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  quickLabel: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  section: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  sectionTitle: { fontSize: text.md, fontWeight: '800', color: colors.navy, flex: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionAction: { fontSize: text.xs, fontWeight: '700', color: colors.goldDeep },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line2 },
  agendaIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  lineTitle: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  lineSub: { fontSize: text.xs, color: colors.muted, marginTop: 1 },
  lineRight: { fontSize: text.xs, fontWeight: '800', color: colors.navy, textAlign: 'right' },
  owed: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.pendingBg, borderRadius: radius.lg, padding: space.md, marginBottom: space.md },
  owedText: { flex: 1, fontSize: text.sm, fontWeight: '700', color: colors.pending },
  deal: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.line2 },
  stages: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 7 },
  stageBar: { width: 22, height: 5, borderRadius: 3, backgroundColor: colors.line2 },
  stageText: { fontSize: text['2xs'], fontWeight: '800', color: colors.navy500, marginLeft: 6 },
  nextMeet: { fontSize: text['2xs'], fontWeight: '700', color: colors.goldDeep, marginTop: 5 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  statusChip: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  statusNum: { fontSize: text.lg, fontWeight: '800' },
  statusLabel: { fontSize: text['2xs'], fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  listing: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line2 },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  leadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginHorizontal: 12 },
  empty: { fontSize: text.sm, color: colors.muted, paddingVertical: 6 },
})
