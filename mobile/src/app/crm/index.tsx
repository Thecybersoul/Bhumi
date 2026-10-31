import { useCallback, useMemo, useState } from 'react'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { Linking, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { telUrl, waUrl } from '@/lib/leads'
import { colors, radius, space, text } from '@/lib/theme'
import { ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import {
  FOLLOW_UP_DAYS, LISTS, LIST_KEYS, PLAYBOOK, STAGES, STAGE_WEIGHT, addDays, isOverdue, openingMessage, rupees, today,
  type CrmDeal, type ListKey, type Prospect,
} from '@/lib/crm'

/* The Sales CRM, the same as /admin/crm on the web: who to contact today
   (Home), who they are (Prospects), what's in play (Pipeline) and what to
   say (Playbook). Same /api/crm routes, so both surfaces always agree. */

type Tab = 'home' | 'prospects' | 'pipeline' | 'playbook'
const TABS: [Tab, string][] = [['home', 'Home'], ['prospects', 'Prospects'], ['pipeline', 'Pipeline'], ['playbook', 'Playbook']]
export const PIPE_STAGES = [2, 3, 4, 5] as const
export const PIPE_LABEL: Record<number, string> = { 2: 'Interested', 3: 'Proposal', 4: 'Won', 5: 'Lost' }
const PRIOS = ['A', 'B', 'C'] as const

export default function SalesCrm() {
  const api = useApi()
  const { user } = useSession()
  const me = user?.name ?? ''
  const params = useLocalSearchParams<{ tab?: string }>()
  const [tab, setTab] = useState<Tab>((TABS.find(([t]) => t === params.tab)?.[0] ?? 'home') as Tab)
  const [prospects, setProspects] = useState<Prospect[] | null>(null)
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [list, setList] = useState<ListKey>('B')
  const [prio, setPrio] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    try {
      const [p, d] = await Promise.all([
        api.get<{ data: Prospect[]; error?: string }>('/api/crm/prospects'),
        api.get<{ data: CrmDeal[]; error?: string }>('/api/crm/deals'),
      ])
      setError(p.error || d.error || null)
      setProspects(p.data)
      setDeals(d.data)
    } catch (e) {
      setError((e as Error).message)
      setProspects((cur) => cur ?? [])
    }
  }, [api])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const patchProspect = async (id: string, patch: Partial<Prospect>) => {
    setProspects((cur) => cur && cur.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    try {
      await api.patch(`/api/crm/prospects?id=${id}`, patch)
    } catch (e) {
      setError((e as Error).message)
      load()
    }
  }
  const setStage = (p: Prospect, stage: number) => {
    const patch: Partial<Prospect> = { stage }
    if (FOLLOW_UP_DAYS[stage] && (!p.next_date || p.next_date <= today())) patch.next_date = addDays(FOLLOW_UP_DAYS[stage])
    if (stage >= 1 && !p.last_contacted) patch.last_contacted = today()
    return patchProspect(p.id, patch)
  }
  const followedUp = (p: Prospect) =>
    patchProspect(p.id, { last_contacted: today(), next_date: addDays(FOLLOW_UP_DAYS[Math.max(1, p.stage)] ?? 3), stage: Math.max(1, p.stage) })
  const moveDeal = async (d: CrmDeal, stage: number) => {
    setDeals((cur) => cur.map((x) => (x.id === d.id ? { ...x, stage } : x)))
    try {
      await api.patch(`/api/crm/deals?id=${d.id}`, { stage })
    } catch (e) {
      setError((e as Error).message)
      load()
    }
  }

  const all = useMemo(() => prospects ?? [], [prospects])
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all
      .filter((p) => p.list === list && (!prio || p.prio === prio))
      .filter((p) => !needle || [p.name, p.kind, p.sector, p.area, p.requirement].join(' ').toLowerCase().includes(needle))
      .sort((a, b) => (a.prio ?? 'Z').localeCompare(b.prio ?? 'Z') || a.name.localeCompare(b.name))
  }, [all, list, prio, q])

  if (prospects === null) return <LoadingScreen />

  const overdueP = all.filter(isOverdue).sort((a, b) => (a.next_date ?? '').localeCompare(b.next_date ?? ''))
  const overdue = overdueP.length + deals.filter(isOverdue).length
  const startHere = all.filter((p) => p.prio === 'A' && p.stage === 0)
  const openDeals = deals.filter((d) => d.stage === 2 || d.stage === 3)
  const weighted = openDeals.reduce((s, d) => s + d.value * (STAGE_WEIGHT[d.stage] ?? 0), 0)
  const weightedCommission = openDeals.reduce((s, d) => s + d.commission * (STAGE_WEIGHT[d.stage] ?? 0), 0)
  const noCommission = openDeals.filter((d) => d.value > 0 && !d.commission).length
  const won = deals.filter((d) => d.stage === 4)
  const openProspect = (id: string) => router.push({ pathname: '/crm/prospect/[id]', params: { id } })

  return (
    <Screen>
      <View style={s.seg}>
        {TABS.map(([t, label]) => (
          <TouchableOpacity key={t} style={[s.segBtn, tab === t && s.segOn]} onPress={() => setTab(t)}>
            <Text style={[s.segText, tab === t && s.segTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} colors={[colors.navy]} />}
      >
        {error ? <ErrorBanner message={error} /> : null}

        {tab === 'home' ? (
          <>
            <Text style={[s.hello, overdue ? { color: colors.flagged } : null]}>
              {overdue ? `${overdue} follow-up${overdue > 1 ? 's' : ''} overdue or due today` : 'Nothing overdue. Good.'}
            </Text>
            <View style={s.kpis}>
              <Kpi label="Commission pipeline" value={rupees(weightedCommission)} note="weighted, per deal" />
              <Kpi label="Deals won" value={String(won.length)} note={`${rupees(won.reduce((a, d) => a + d.commission, 0))} commission`} />
              <Kpi label="Interested" value={String(all.filter((p) => p.stage === 2).length)} note="prospects" />
              <Kpi label="Overdue" value={String(overdue)} note="follow-ups" alert={overdue > 0} />
            </View>
            <Block title="Follow up now" icon="alarm-outline">
              {overdueP.length === 0 ? <Text style={s.empty}>No follow-ups due. Keep a next date on every prospect.</Text> : overdueP.map((p) => <MiniRow key={p.id} p={p} onPress={() => openProspect(p.id)} />)}
            </Block>
            <Block title="Start here" icon="flag-outline">
              {startHere.length === 0 ? <Text style={s.empty}>No Priority A prospects waiting to be contacted.</Text> : startHere.slice(0, 8).map((p) => <MiniRow key={p.id} p={p} onPress={() => openProspect(p.id)} />)}
            </Block>
            <Block title="Funnel" icon="funnel-outline">
              {STAGES.map((st, i) => {
                const n = all.filter((p) => p.stage === i).length
                const max = Math.max(1, ...STAGES.map((_, j) => all.filter((p) => p.stage === j).length))
                return (
                  <View key={st} style={s.bar}>
                    <Text style={s.barLabel}>{st}</Text>
                    <View style={s.barTrack}><View style={[s.barFill, { width: `${(n / max) * 100}%` }]} /></View>
                    <Text style={s.barN}>{n}</Text>
                  </View>
                )
              })}
            </Block>
            <Block title="Your lists" icon="list-outline">
              {LIST_KEYS.map((k) => (
                <TouchableOpacity key={k} style={s.row} onPress={() => { setList(k); setTab('prospects') }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{LISTS[k].label}</Text>
                    <Text style={s.rowSub}>{LISTS[k].hint}</Text>
                  </View>
                  <Text style={s.rowRight}>{all.filter((p) => p.list === k).length}</Text>
                </TouchableOpacity>
              ))}
            </Block>
          </>
        ) : tab === 'prospects' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {LIST_KEYS.map((k) => (
                <Chip key={k} on={list === k} label={`${LISTS[k].label} · ${all.filter((p) => p.list === k).length}`} onPress={() => setList(k)} />
              ))}
            </ScrollView>
            <TextInput style={s.search} placeholder="Search name, area, requirement…" placeholderTextColor={colors.muted} value={q} onChangeText={setQ} />
            <View style={[s.chips, { marginBottom: space.md }]}>
              {PRIOS.map((x) => <Chip key={x} on={prio === x} label={`Priority ${x}`} onPress={() => setPrio(prio === x ? '' : x)} />)}
              <Chip on={false} label="+ Prospect" onPress={() => router.push({ pathname: '/crm/prospect/[id]', params: { id: 'new', list } })} gold />
            </View>
            {shown.length === 0 ? (
              <Text style={s.empty}>{all.some((p) => p.list === list) ? 'No prospects match.' : `No ${LISTS[list].label.toLowerCase()} yet. Tap + Prospect to add one.`}</Text>
            ) : (
              shown.map((p) => <ProspectCard key={p.id} p={p} me={me} onOpen={() => openProspect(p.id)} onStage={(st) => setStage(p, st)} onFollowedUp={() => followedUp(p)} />)
            )}
          </>
        ) : tab === 'pipeline' ? (
          <>
            <View style={s.kpis}>
              <Kpi label="Open pipeline" value={rupees(openDeals.reduce((a, d) => a + d.value, 0))} note="Interested + Proposal" />
              <Kpi label="Weighted forecast" value={rupees(weighted)} note="30% / 60%" />
              <Kpi label="Projected commission" value={rupees(weightedCommission)} note={noCommission ? `${noCommission} without commission set` : 'from each deal’s terms'} alert={noCommission > 0} />
              <Kpi label="Won" value={rupees(won.reduce((a, d) => a + d.value, 0))} note={`${rupees(won.reduce((a, d) => a + d.commission, 0))} commission`} />
            </View>
            <TouchableOpacity style={s.primary} onPress={() => router.push({ pathname: '/crm/deal/[id]', params: { id: 'new' } })}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={s.primaryText}>Add a deal</Text>
            </TouchableOpacity>
            {PIPE_STAGES.map((st) => {
              const col = deals.filter((d) => d.stage === st)
              return (
                <Block key={st} title={`${PIPE_LABEL[st]} · ${col.length}`} icon={st === 4 ? 'trophy-outline' : st === 5 ? 'close-circle-outline' : 'briefcase-outline'}>
                  {col.length === 0 ? <Text style={s.empty}>No deals</Text> : null}
                  {col.map((d) => (
                    <View key={d.id} style={s.deal}>
                      <TouchableOpacity onPress={() => router.push({ pathname: '/crm/deal/[id]', params: { id: d.id } })}>
                        <Text style={s.rowTitle}>{d.name}</Text>
                        {d.parcel ? <Text style={s.rowSub} numberOfLines={2}>{d.parcel}</Text> : null}
                        {d.deal_type || d.expected_close ? <Text style={s.rowSub}>{[d.deal_type, d.expected_close ? `close ${d.expected_close}` : ''].filter(Boolean).join(' · ')}</Text> : null}
                        <Text style={s.money}>{d.value ? rupees(d.value) : 'Value not set'}</Text>
                        <Text style={[s.rowSub, d.value && !d.commission ? { color: colors.flagged } : null]}>
                          {d.commission ? `${rupees(d.commission)} commission` : d.value ? 'Commission not set' : ''}
                        </Text>
                        {d.next_date ? <Text style={[s.rowSub, isOverdue(d) && { color: colors.flagged, fontWeight: '700' }]}>Next: {d.next_date}</Text> : null}
                      </TouchableOpacity>
                      <View style={s.actions}>
                        {st === 3 || st === 4 ? <Small icon="arrow-back" label="Back" onPress={() => moveDeal(d, st - 1)} /> : null}
                        {st < 4 ? <Small icon="arrow-forward" label={st === 2 ? 'Proposal' : 'Won'} onPress={() => moveDeal(d, st + 1)} /> : null}
                        {st < 4 ? <Small icon="close" label="Lost" onPress={() => moveDeal(d, 5)} /> : null}
                        {st === 5 ? <Small icon="refresh" label="Reopen" onPress={() => moveDeal(d, 2)} /> : null}
                      </View>
                    </View>
                  ))}
                </Block>
              )
            })}
          </>
        ) : (
          <Playbook me={me} />
        )}
      </ScrollView>
    </Screen>
  )
}

/* ─── Pieces ─────────────────────────────────────────────── */

type IconName = keyof typeof Ionicons.glyphMap

function Kpi({ label, value, note, alert }: { label: string; value: string; note: string; alert?: boolean }) {
  return (
    <View style={[s.kpi, alert && { borderTopColor: colors.flagged }]}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, alert && { color: colors.flagged }]}>{value}</Text>
      <Text style={s.kpiNote} numberOfLines={2}>{note}</Text>
    </View>
  )
}

function Block({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <View style={s.block}>
      <View style={s.blockHead}>
        <Ionicons name={icon} size={16} color={colors.navy} />
        <Text style={s.blockTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

export function PrioChip({ prio }: { prio: Prospect['prio'] }) {
  if (!prio) return null
  const bg = prio === 'A' ? colors.navy : prio === 'B' ? colors.gold : colors.muted
  return (
    <View style={[s.prio, { backgroundColor: bg }]}>
      <Text style={s.prioText}>{prio}</Text>
    </View>
  )
}

function MiniRow({ p, onPress }: { p: Prospect; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <PrioChip prio={p.prio} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{p.name}</Text>
        <Text style={s.rowSub} numberOfLines={1}>{[LISTS[p.list].one, p.area, STAGES[p.stage]].filter(Boolean).join(' · ')}</Text>
      </View>
      {p.next_date ? <Text style={[s.rowRight, isOverdue(p) && { color: colors.flagged }]}>{p.next_date.slice(5)}</Text> : null}
    </TouchableOpacity>
  )
}

function Chip({ label, on, onPress, gold }: { label: string; on: boolean; onPress: () => void; gold?: boolean }) {
  return (
    <TouchableOpacity style={[s.chip, on && s.chipOn, gold && s.chipGold]} onPress={onPress}>
      <Text style={[s.chipText, on && s.chipTextOn, gold && { color: colors.white }]}>{label}</Text>
    </TouchableOpacity>
  )
}

function Small({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.small} onPress={onPress} hitSlop={4}>
      <Ionicons name={icon} size={14} color={colors.navy} />
      <Text style={s.smallText}>{label}</Text>
    </TouchableOpacity>
  )
}

function ProspectCard({ p, me, onOpen, onStage, onFollowedUp }: { p: Prospect; me: string; onOpen: () => void; onStage: (st: number) => void; onFollowedUp: () => void }) {
  const msg = openingMessage(p, me)
  // Inline, not an Alert: Android alerts hold at most three buttons.
  const [picking, setPicking] = useState(false)
  return (
    <View style={s.card}>
      <TouchableOpacity onPress={onOpen} style={s.cardTop}>
        <PrioChip prio={p.prio} />
        <Text style={s.cardName}>{p.name}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </TouchableOpacity>
      {[p.kind, p.sector, p.deal_band].filter(Boolean).length ? <Text style={s.rowSub}>{[p.kind, p.sector, p.deal_band].filter(Boolean).join(' · ')}</Text> : null}
      {p.contact_person ? <Text style={s.rowSub}>Ask for: {p.contact_person}</Text> : null}
      {p.requirement ? <Text style={s.line}><Text style={s.b}>Needs: </Text>{p.requirement}</Text> : null}
      {p.trigger_why ? <Text style={s.line} numberOfLines={4}><Text style={s.b}>Why now: </Text>{p.trigger_why}</Text> : null}
      <View style={s.actions}>
        {p.email ? <Small icon="mail-outline" label="Email" onPress={() => Linking.openURL(`mailto:${p.email}?subject=${encodeURIComponent('Verified land parcels near Bengaluru')}&body=${encodeURIComponent(msg)}`)} /> : null}
        {p.phone ? <Small icon="call-outline" label="Call" onPress={() => Linking.openURL(telUrl(p.phone))} /> : null}
        {p.phone ? <Small icon="logo-whatsapp" label="WhatsApp" onPress={() => Linking.openURL(waUrl(p.phone, msg))} /> : null}
        <Small icon="swap-vertical" label={STAGES[p.stage]} onPress={() => setPicking((v) => !v)} />
        <Small icon="checkmark-done" label="Followed up" onPress={onFollowedUp} />
      </View>
      {picking ? (
        <View style={[s.chips, { marginTop: 8, marginBottom: 0 }]}>
          {STAGES.map((st, i) => (
            <Chip key={st} label={st} on={i === p.stage} onPress={() => { setPicking(false); if (i !== p.stage) onStage(i) }} />
          ))}
        </View>
      ) : null}
      {p.next_date ? <Text style={[s.rowSub, { marginTop: 6 }, isOverdue(p) && { color: colors.flagged, fontWeight: '700' }]}>Next: {p.next_date}</Text> : <Text style={[s.rowSub, { marginTop: 6, color: colors.flagged }]}>No next date</Text>}
    </View>
  )
}

/* The playbook as folds, each with a Share button that sends the text
   straight to WhatsApp, email or the clipboard. */
function Playbook({ me }: { me: string }) {
  const [open, setOpen] = useState<string | null>('stages')
  const you = me || '{Your name}'
  const sections: [string, string, string][] = [
    ['stages', 'Stages and what moves them', PLAYBOOK.stages.map(([a, b, c]) => `${a}: ${b}.\nMoves on when: ${c}.`).join('\n\n')],
    ['contacts', 'Who to contact, and the rhythm', PLAYBOOK.contacts.map(([a, b, c, d]) => `${a}\nDecides: ${b}\nFirst move: ${c}\nFollow-up: ${d}`).join('\n\n')],
    ['ladder', 'The offer ladder', PLAYBOOK.ladder.map(([a, b, c]) => `${a}: ${b}. (${c})`).join('\n\n')],
    ['call', 'Call script', PLAYBOOK.callScript.replace(/\{Your name\}/g, you)],
    ['whatsapp', 'WhatsApp after the call', PLAYBOOK.whatsapp.replace(/\{Your name\}/g, you)],
    ['emails', 'Email subject lines', PLAYBOOK.emails.map(([a, b]) => `${a}: ${b}`).join('\n')],
    ['objections', 'Objection answers', PLAYBOOK.objections.map(([a, b]) => `“${a}”\n${b}`).join('\n\n')],
    ['six', 'Six questions before a visit', PLAYBOOK.sixQuestions.map(([a, b], i) => `${i + 1}. ${a} ${b}`).join('\n\n')],
    ['ready', 'Parcel readiness checklist', PLAYBOOK.readiness.map(([a, b]) => `• ${a}: ${b}`).join('\n\n')],
    ['visit', 'Site visit protocol', PLAYBOOK.siteVisit.map(([a, b]) => `${a}: ${b}`).join('\n\n')],
    ['sectors', 'Sector angles', PLAYBOOK.sectors.map(([a, b]) => `${a}: ${b}`).join('\n')],
    ['rules', 'Rules of the road', PLAYBOOK.rules.map(([a, b]) => `${a}: ${b}`).join('\n\n')],
  ]
  return (
    <>
      <Text style={s.lede}>What to say, when. Tap a section to open it; Share sends it to WhatsApp, email or copy.</Text>
      {sections.map(([key, title, body]) => (
        <View key={key} style={s.fold}>
          <TouchableOpacity style={s.foldHead} onPress={() => setOpen(open === key ? null : key)}>
            <Text style={s.foldTitle}>{title}</Text>
            <Ionicons name={open === key ? 'chevron-up' : 'chevron-down'} size={18} color={colors.navy} />
          </TouchableOpacity>
          {open === key ? (
            <View style={s.foldBody}>
              <Text style={s.foldText} selectable>{body}</Text>
              <Small icon="share-outline" label="Share" onPress={() => Share.share({ message: body }).catch(() => {})} />
            </View>
          ) : null}
        </View>
      ))}
    </>
  )
}

const s = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: colors.navy, paddingHorizontal: space.md, paddingBottom: space.sm, gap: 6 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  segOn: { backgroundColor: colors.white },
  segText: { color: colors.goldTint, fontWeight: '700', fontSize: text.sm },
  segTextOn: { color: colors.navy },
  body: { padding: space.md, paddingBottom: 60 },
  hello: { fontSize: text.md, fontWeight: '700', color: colors.ink, marginBottom: space.sm },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md },
  kpi: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, borderTopWidth: 3, borderTopColor: colors.gold, padding: space.sm },
  kpiLabel: { fontSize: text['2xs'], fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  kpiValue: { fontSize: text.xl, fontWeight: '800', color: colors.navy, marginTop: 2 },
  kpiNote: { fontSize: text['2xs'], color: colors.muted },
  block: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.md },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  blockTitle: { fontSize: text.md, fontWeight: '800', color: colors.navy },
  empty: { color: colors.muted, fontSize: text.sm, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  rowTitle: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: text.xs, color: colors.muted, marginTop: 1 },
  rowRight: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  barLabel: { width: 74, fontSize: text.xs, color: colors.ink2 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.line2, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.navy600 },
  barN: { width: 26, textAlign: 'right', fontSize: text.xs, fontWeight: '700', color: colors.navy },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: space.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipGold: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  chipTextOn: { color: colors.white },
  search: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, paddingHorizontal: space.md, paddingVertical: 10, fontSize: 16, color: colors.ink, marginBottom: space.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardName: { flex: 1, fontSize: text.md, fontWeight: '800', color: colors.navy },
  line: { fontSize: text.sm, color: colors.ink2, marginTop: 5, lineHeight: 19 },
  b: { fontWeight: '700', color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  small: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.paper },
  smallText: { fontSize: text.xs, fontWeight: '700', color: colors.navy },
  prio: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  prioText: { color: colors.white, fontWeight: '800', fontSize: text.xs },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: radius.base, paddingVertical: 12, marginBottom: space.md },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: text.base },
  deal: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  money: { fontSize: text.md, fontWeight: '800', color: colors.navy, marginTop: 4 },
  lede: { fontSize: text.sm, color: colors.ink2, marginBottom: space.md },
  fold: { backgroundColor: colors.white, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, marginBottom: 8, overflow: 'hidden' },
  foldHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.md },
  foldTitle: { fontSize: text.base, fontWeight: '800', color: colors.navy, flex: 1 },
  foldBody: { paddingHorizontal: space.md, paddingBottom: space.md, borderTopWidth: 1, borderTopColor: colors.line2 },
  foldText: { fontSize: text.sm, color: colors.ink2, lineHeight: 20, marginVertical: space.sm },
})
