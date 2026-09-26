import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi, ApiError } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import { ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import type { ApiResult, Task } from '@/lib/types'

interface Dashboard {
  source: 'live' | 'fallback'
  kpi: {
    activeValue: number
    activeCount: number
    closedValue: number
    closedCount: number
    lostCount: number
    commissionCollected: number
    commissionPending: number
    winRatePct: number
    verificationsInReview: number
    medianTurnaroundDays: number
  }
  pipelineByStage: { stage: string; count: number }[]
  inventoryByStatus: { status: string; count: number; value: number }[]
  leadsByChannel: { channel: string; count: number }[]
  upcomingMeetings: { id: string; title: string; with: string; scheduled_at: string; txnRef: string }[]
  pendingDataRoom: number
}

type IconName = keyof typeof Ionicons.glyphMap

function cr(n: number) {
  if (!n) return '₹0'
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const INVENTORY_TONE: Record<string, string> = { Live: colors.verified, Reserved: colors.progress, Sold: colors.goldDeep }

export default function DashboardScreen() {
  const api = useApi()
  const [data, setData] = useState<Dashboard | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([
        api.get<Dashboard>('/api/dashboard'),
        api.get<ApiResult<Task[]>>('/api/tasks').catch(() => ({ data: [] as Task[] })),
      ])
      setData(d)
      setTasks(t.data)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load the dashboard')
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!data && !error) return <LoadingScreen />

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  const due = tasks
    .filter((t) => t.status === 'Open' && t.due_at && new Date(t.due_at) <= endOfToday)
    .sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? ''))
  const overdue = due.filter((t) => new Date(t.due_at!).getTime() < Date.now()).length
  const maxStage = Math.max(1, ...(data?.pipelineByStage.map((s) => s.count) ?? [1]))
  const invTotal = Math.max(1, data?.inventoryByStatus.reduce((a, s) => a + s.count, 0) ?? 1)

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: space.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} colors={[colors.navy]} />}
      >
        <View style={s.hero}>
          <Text style={s.hello}>{greeting()}</Text>
          <Text style={s.date}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          {data ? (
            <View style={s.heroStats}>
              <HeroStat value={cr(data.kpi.activeValue)} label="Active pipeline" />
              <View style={s.heroDivider} />
              <HeroStat value={String(data.kpi.activeCount)} label="Open deals" />
              <View style={s.heroDivider} />
              <HeroStat value={String(due.length)} label={overdue ? `Due · ${overdue} late` : 'Due today'} alert={overdue > 0} />
            </View>
          ) : null}
        </View>

        <View style={s.body}>
          {error && <ErrorBanner message={error} />}

          <View style={s.quick}>
            <Quick icon="add-circle-outline" label="Listing" onPress={() => router.push({ pathname: '/property/[id]', params: { id: 'new' } })} />
            <Quick icon="briefcase-outline" label="Deal" onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: 'new' } })} />
            <Quick icon="checkbox-outline" label="Task" onPress={() => router.push('/notes-tasks')} />
            <Quick icon="folder-open-outline" label="Docs" onPress={() => router.push('/documents')} />
          </View>

          {data && (
            <>
              <View style={s.grid}>
                <Kpi icon="trophy-outline" tint={colors.verified} value={cr(data.kpi.closedValue)} label="Closed value" note={`${data.kpi.closedCount} closed`} />
                <Kpi icon="cash-outline" tint={colors.goldDeep} value={cr(data.kpi.commissionCollected)} label="Commission in" note={`${cr(data.kpi.commissionPending)} pending`} />
                <Kpi icon="trending-up-outline" tint={colors.progress} value={`${data.kpi.winRatePct}%`} label="Win rate" note={`${data.kpi.lostCount} lost`} />
                <Kpi
                  icon="shield-checkmark-outline"
                  tint={colors.navy600}
                  value={String(data.kpi.verificationsInReview)}
                  label="In verification"
                  note={data.kpi.medianTurnaroundDays ? `${data.kpi.medianTurnaroundDays}d median` : 'No cases closed yet'}
                />
              </View>

              <Section title="Today" action={due.length ? 'All tasks' : undefined} onAction={() => router.push('/notes-tasks')}>
                {due.length === 0 ? (
                  <Empty icon="sunny-outline" text="Nothing due today." />
                ) : (
                  due.slice(0, 5).map((t) => {
                    const late = new Date(t.due_at!).getTime() < Date.now()
                    return (
                      <TouchableOpacity key={t.id} style={s.line} onPress={() => router.push('/notes-tasks')}>
                        <Ionicons name={late ? 'alert-circle' : 'ellipse-outline'} size={18} color={late ? colors.flagged : colors.navy500} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.lineTitle} numberOfLines={1}>{t.title}</Text>
                          {t.entity_label ? <Text style={s.lineSub} numberOfLines={1}>{t.entity_label}</Text> : null}
                        </View>
                        <Text style={[s.lineRight, late && { color: colors.flagged }]}>
                          {new Date(t.due_at!).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      </TouchableOpacity>
                    )
                  })
                )}
              </Section>

              <Section title="Upcoming meetings">
                {data.upcomingMeetings.length === 0 ? (
                  <Empty icon="calendar-outline" text="Nothing scheduled." />
                ) : (
                  data.upcomingMeetings.slice(0, 4).map((m) => (
                    <View key={m.id} style={s.line}>
                      <View style={s.dateChip}>
                        <Text style={s.dateDay}>{new Date(m.scheduled_at).getDate()}</Text>
                        <Text style={s.dateMon}>{new Date(m.scheduled_at).toLocaleDateString('en-IN', { month: 'short' })}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.lineTitle} numberOfLines={1}>{m.title}</Text>
                        <Text style={s.lineSub} numberOfLines={1}>{m.with} · {m.txnRef}</Text>
                      </View>
                    </View>
                  ))
                )}
              </Section>

              <Section title="Deal pipeline" action="Open" onAction={() => router.push('/deals')}>
                {data.pipelineByStage.every((x) => x.count === 0) ? (
                  <Empty icon="briefcase-outline" text="No deals in progress." />
                ) : (
                  data.pipelineByStage.map((x) => (
                    <View key={x.stage} style={s.bar}>
                      <Text style={s.barLabel}>{x.stage}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: `${(x.count / maxStage) * 100}%` }]} />
                      </View>
                      <Text style={s.barValue}>{x.count}</Text>
                    </View>
                  ))
                )}
              </Section>

              <Section title="Inventory" action="Listings" onAction={() => router.push('/properties')}>
                <View style={s.stack}>
                  {data.inventoryByStatus.map((x) =>
                    x.count ? (
                      <View key={x.status} style={{ flex: x.count / invTotal, backgroundColor: INVENTORY_TONE[x.status] ?? colors.navy }} />
                    ) : null
                  )}
                </View>
                {data.inventoryByStatus.map((x) => (
                  <View key={x.status} style={s.invRow}>
                    <View style={[s.swatch, { backgroundColor: INVENTORY_TONE[x.status] ?? colors.navy }]} />
                    <Text style={[s.lineTitle, { flex: 1 }]}>{x.status}</Text>
                    <Text style={s.lineSub}>{x.count} · </Text>
                    <Text style={s.lineRight}>{cr(x.value)}</Text>
                  </View>
                ))}
              </Section>

              <Section title="Leads by channel" action={data.pendingDataRoom ? `${data.pendingDataRoom} doc requests` : undefined} onAction={() => router.push('/deals')}>
                {data.leadsByChannel.length === 0 ? (
                  <Empty icon="people-outline" text="No leads yet." />
                ) : (
                  data.leadsByChannel.map((c) => (
                    <View key={c.channel} style={s.invRow}>
                      <Text style={[s.lineTitle, { flex: 1 }]}>{c.channel}</Text>
                      <Text style={s.lineRight}>{c.count}</Text>
                    </View>
                  ))
                )}
              </Section>

              {data.source === 'fallback' ? (
                <Text style={s.fallback}>Showing sample data — the database returned nothing.</Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  )
}

function HeroStat({ value, label, alert }: { value: string; label: string; alert?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.heroValue, alert && { color: colors.goldSoft }]}>{value}</Text>
      <Text style={s.heroLabel}>{label}</Text>
    </View>
  )
}

function Quick({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.quickItem} onPress={onPress}>
      <View style={s.quickIcon}>
        <Ionicons name={icon} size={22} color={colors.navy} />
      </View>
      <Text style={s.quickLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function Kpi({ icon, tint, value, label, note }: { icon: IconName; tint: string; value: string; label: string; note: string }) {
  return (
    <View style={s.kpi}>
      <View style={[s.kpiIcon, { backgroundColor: `${tint}18` }]}>
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text style={s.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiNote}>{note}</Text>
    </View>
  )
}

function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {action ? (
          <TouchableOpacity onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={s.sectionAction}>{action}</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.goldDeep} />
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  )
}

function Empty({ icon, text: msg }: { icon: IconName; text: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={s.emptyText}>{msg}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.navy, paddingHorizontal: space.lg, paddingTop: 4, paddingBottom: 44 },
  hello: { color: colors.white, fontSize: text.xl, fontWeight: '800' },
  date: { color: 'rgba(255,255,255,0.65)', fontSize: text.sm, marginTop: 2 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg },
  heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: space.sm },
  heroValue: { color: colors.white, fontSize: text.xl, fontWeight: '800' },
  heroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: text['2xs'], fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { paddingHorizontal: space.lg, marginTop: -28 },
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
  quickLabel: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  kpi: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md },
  kpiIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: colors.navy },
  kpiLabel: { fontSize: text.sm, fontWeight: '700', color: colors.ink, marginTop: 2 },
  kpiNote: { fontSize: text.xs, color: colors.muted, marginTop: 2 },
  section: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: text.md, fontWeight: '800', color: colors.navy },
  sectionAction: { fontSize: text.xs, fontWeight: '700', color: colors.goldDeep },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line2 },
  lineTitle: { fontSize: text.base, fontWeight: '600', color: colors.ink },
  lineSub: { fontSize: text.xs, color: colors.muted, marginTop: 1 },
  lineRight: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  dateChip: { width: 42, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.goldTint, alignItems: 'center' },
  dateDay: { fontSize: text.lg, fontWeight: '800', color: colors.goldDeep, lineHeight: 20 },
  dateMon: { fontSize: 10, fontWeight: '700', color: colors.goldDeep, textTransform: 'uppercase' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  barLabel: { width: 92, fontSize: text.sm, color: colors.ink2, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line2, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.navy500 },
  barValue: { width: 22, textAlign: 'right', fontSize: text.sm, fontWeight: '800', color: colors.navy },
  stack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.line2, marginVertical: 8 },
  invRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line2 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  emptyText: { fontSize: text.sm, color: colors.muted },
  fallback: { fontSize: text.xs, color: colors.muted, textAlign: 'center' },
})
