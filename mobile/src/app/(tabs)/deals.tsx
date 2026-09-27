import { useCallback, useEffect, useMemo, useState } from 'react'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { FlatList, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi, ApiError } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import { budget, followUpDue, isSelling, LEAD_PIPELINE, leadIsOpen, stageLabel, telUrl, TYPE_LABEL, waUrl, whenShort } from '@/lib/leads'
import { Badge, EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button } from '@/components/form'
import { Avatar, ByLine, timeAgo } from '@/components/people'
import type { ApiResult, Contact, DataRoomRequest, Lead, PropertyTransaction } from '@/lib/types'

type View_ = 'leads' | 'pipeline' | 'contacts' | 'requests'
const LEAD_FILTERS = ['Open', 'Due now', ...LEAD_PIPELINE, 'Nurture', 'Converted', 'Lost'] as const
const ROLE_FILTERS = ['All', 'Buyer', 'Seller', 'Landowner', 'Investor', 'Broker', 'Lawyer'] as const
const PRIORITY_RANK: Record<string, number> = { Hot: 0, Warm: 1, Cold: 2 }

function cr(n: number | null | undefined) {
  if (n == null) return 'Value TBD'
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

export default function DealsScreen() {
  const api = useApi()
  const params = useLocalSearchParams<{ view?: string }>()
  const [view, setView] = useState<View_>('pipeline')
  const [txns, setTxns] = useState<PropertyTransaction[] | null>(null)
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [docs, setDocs] = useState<DataRoomRequest[] | null>(null)
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [contactsReady, setContactsReady] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [leadFilter, setLeadFilter] = useState<(typeof LEAD_FILTERS)[number]>('Open')
  const [q, setQ] = useState('')
  const [role, setRole] = useState<(typeof ROLE_FILTERS)[number]>('All')

  // Home's "Leads" and "+ Lead" land here on the right view.
  useEffect(() => {
    if (params.view && ['leads', 'pipeline', 'contacts', 'requests'].includes(params.view)) {
      setView(params.view as View_)
      router.setParams({ view: undefined })
    }
  }, [params.view])

  const load = useCallback(async () => {
    try {
      const [t, l, d, c] = await Promise.all([
        api.get<ApiResult<PropertyTransaction[]>>('/api/transactions'),
        api.get<ApiResult<Lead[]>>('/api/leads'),
        api.get<ApiResult<DataRoomRequest[]>>('/api/data-room'),
        api.get<{ data: Contact[]; ready: boolean }>('/api/contacts').catch(() => ({ data: [] as Contact[], ready: false })),
      ])
      setTxns(t.source === 'live' ? t.data : [])
      setLeads(l.source === 'live' ? l.data : [])
      setDocs(d.source === 'live' ? d.data : [])
      setContacts(c.data)
      setContactsReady(c.ready)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load deals')
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function advanceLead(l: Lead, stage: string) {
    setBusy(l.id)
    setLeads((p) => p?.map((x) => (x.id === l.id ? { ...x, stage: stage as Lead['stage'] } : x)) ?? null)
    try {
      await api.patch(`/api/leads?id=${encodeURIComponent(l.id)}&stage=${stage}`)
    } catch (e) {
      setError((e as Error).message)
      load()
    } finally {
      setBusy(null)
    }
  }

  async function decide(d: DataRoomRequest, status: 'Approved' | 'Declined') {
    setBusy(d.id)
    try {
      await api.patch(`/api/data-room?id=${encodeURIComponent(d.id)}&status=${status}`)
      setDocs((p) => p?.map((x) => (x.id === d.id ? { ...x, status } : x)) ?? null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const needle = q.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const shownLeads = useMemo(() => {
    const all = leads ?? []
    const match = (l: Lead) =>
      !needle ||
      `${l.name} ${l.company} ${l.locations ?? ''} ${l.corridor ?? ''} ${l.property_code ?? ''}`.toLowerCase().includes(needle) ||
      (digits.length >= 3 && (l.phone ?? '').replace(/\D/g, '').includes(digits))
    const f = leadFilter
    const byFilter = (l: Lead) =>
      f === 'Open'
        ? leadIsOpen(l.stage) && l.stage !== 'Nurture'
        : f === 'Due now'
          ? followUpDue(l)
          : f === 'Converted'
            ? l.stage === 'Converted' || (l.stage === 'Closed' && !!l.transaction_id)
            : f === 'Lost'
              ? l.stage === 'Lost' || (l.stage === 'Closed' && !l.transaction_id)
              : l.stage === f
    return all
      .filter((l) => byFilter(l) && match(l))
      .sort(
        (a, b) =>
          Number(followUpDue(b)) - Number(followUpDue(a)) ||
          (PRIORITY_RANK[a.priority ?? 'Warm'] ?? 1) - (PRIORITY_RANK[b.priority ?? 'Warm'] ?? 1) ||
          (a.next_follow_up_at ?? '9').localeCompare(b.next_follow_up_at ?? '9') ||
          b.created_at.localeCompare(a.created_at)
      )
  }, [leads, leadFilter, needle, digits])

  const shownContacts = useMemo(
    () =>
      (contacts ?? []).filter(
        (c) =>
          (role === 'All' || c.roles?.includes(role)) &&
          (!needle || `${c.name} ${c.company ?? ''} ${c.email} ${c.city ?? ''}`.toLowerCase().includes(needle) || (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)))
      ),
    [contacts, role, needle, digits]
  )

  const count = (f: (typeof LEAD_FILTERS)[number]) =>
    f === 'Open' ? (leads ?? []).filter((l) => leadIsOpen(l.stage) && l.stage !== 'Nurture').length : f === 'Due now' ? (leads ?? []).filter(followUpDue).length : null

  const loading = txns === null && leads === null && !error
  const tabs = [
    { id: 'leads', label: `Leads${leads ? ` ${(leads ?? []).filter((l) => leadIsOpen(l.stage)).length}` : ''}` },
    { id: 'pipeline', label: `Deals${txns ? ` ${txns.filter((t) => t.outcome === 'In progress').length}` : ''}` },
    { id: 'contacts', label: `People${contacts ? ` ${contacts.length}` : ''}` },
    { id: 'requests', label: `Docs${docs ? ` ${docs.filter((d) => d.status === 'Pending').length}` : ''}` },
  ] as const

  const rc = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />
  const search = (placeholder: string) => (
    <View style={s.search}>
      <Ionicons name="search" size={16} color={colors.muted} />
      <TextInput style={s.searchInput} value={q} onChangeText={setQ} placeholder={placeholder} placeholderTextColor={colors.muted} />
      {q ? (
        <TouchableOpacity onPress={() => setQ('')} hitSlop={10}>
          <Ionicons name="close-circle" size={17} color={colors.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  )

  return (
    <Screen>
      <View style={s.switcher}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.id} style={[s.sw, view === t.id && s.swOn]} onPress={() => setView(t.id)}>
            <Text style={[s.swText, view === t.id && s.swTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingScreen />
      ) : view === 'leads' ? (
        <FlatList
          data={shownLeads}
          keyExtractor={(l) => l.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Button label="+ New lead" onPress={() => router.push({ pathname: '/lead/[id]', params: { id: 'new' } })} />
              <View style={{ height: space.sm }} />
              {search('Name, phone, area, listing')}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
                {LEAD_FILTERS.map((f) => {
                  const n = count(f)
                  return (
                    <TouchableOpacity key={f} style={[s.chip, leadFilter === f && (f === 'Due now' ? s.chipGold : s.chipOn)]} onPress={() => setLeadFilter(f)}>
                      <Text style={[s.chipText, leadFilter === f && { color: f === 'Due now' ? colors.goldDeep : colors.white }]}>
                        {stageLabel(f)}
                        {n != null ? ` · ${n}` : ''}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={<EmptyState text={leads?.length ? 'Nothing here.' : 'No leads yet. Website enquiries land here — add calls, walk-ins and referrals with “New lead”.'} />}
          renderItem={({ item: l }) => {
            const next = LEAD_PIPELINE[LEAD_PIPELINE.indexOf(l.stage as (typeof LEAD_PIPELINE)[number]) + 1]
            const due = followUpDue(l)
            const want = [TYPE_LABEL[l.property_type ?? ''], l.locations || l.corridor, budget(l.budget_min_cr, l.budget_max_cr)].filter(Boolean).join(' · ')
            return (
              <View style={[s.card, due && s.cardDue]}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/lead/[id]', params: { id: l.id } })}>
                  <View style={s.head}>
                    <View style={[s.dot, { backgroundColor: l.priority === 'Hot' ? colors.flagged : l.priority === 'Cold' ? colors.progress : colors.gold }]} />
                    <Text style={s.title} numberOfLines={1}>{l.name}</Text>
                    <View style={[s.intent, isSelling(l.intent) && { backgroundColor: colors.goldTint }]}>
                      <Text style={[s.intentText, isSelling(l.intent) && { color: colors.goldDeep }]}>{l.intent ?? 'Buy'}</Text>
                    </View>
                    <Badge label={stageLabel(l.stage)} tone={l.stage === 'Visit' ? 'progress' : l.stage.toLowerCase()} />
                  </View>
                  <Text style={s.meta}>{want || `${l.kind}${l.property_code ? ` · ${l.property_code}` : ''}`}</Text>
                  {due ? (
                    <Text style={s.due}>⏰ Follow up {whenShort(l.next_follow_up_at!)}</Text>
                  ) : (
                    <Text style={s.meta}>
                      {l.channel} · {timeAgo(l.created_at)}
                      {l.assigned_to ? ` · ${l.assigned_to}` : ''}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={s.actions}>
                  {l.phone ? (
                    <>
                      <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(telUrl(l.phone))}>
                        <Ionicons name="call" size={16} color={colors.navy} />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(waUrl(l.phone, `Hello ${l.name.split(' ')[0]}, this is Bhumi Estates.`))}>
                        <Ionicons name="logo-whatsapp" size={16} color={colors.navy} />
                      </TouchableOpacity>
                    </>
                  ) : null}
                  <View style={{ flex: 1 }} />
                  {next && leadIsOpen(l.stage) ? (
                    <TouchableOpacity style={s.next} disabled={busy === l.id} onPress={() => advanceLead(l, next)}>
                      <Text style={s.nextText}>{stageLabel(next)} →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )
          }}
        />
      ) : view === 'contacts' ? (
        <FlatList
          data={shownContacts}
          keyExtractor={(c) => c.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Button label="+ New contact" onPress={() => router.push({ pathname: '/contact/[id]', params: { id: 'new' } })} />
              <View style={{ height: space.sm }} />
              {search('Name, phone, company')}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
                {ROLE_FILTERS.map((r) => (
                  <TouchableOpacity key={r} style={[s.chip, role === r && s.chipOn]} onPress={() => setRole(r)}>
                    <Text style={[s.chipText, role === r && { color: colors.white }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <EmptyState text={!contactsReady ? 'The contact book needs database migration 015 (Setup, on the website).' : contacts?.length ? 'Nobody matches.' : 'No contacts yet. Leads and deal parties are added here automatically.'} />
          }
          renderItem={({ item: c }) => (
            <View style={s.card}>
              <TouchableOpacity style={s.head} onPress={() => router.push({ pathname: '/contact/[id]', params: { id: c.id } })}>
                <Avatar name={c.name} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{c.name}</Text>
                  <Text style={s.meta} numberOfLines={1}>{[c.roles?.join(', '), c.company, c.phone].filter(Boolean).join(' · ') || 'No role yet'}</Text>
                  {c.open_leads || c.deal_count ? (
                    <Text style={s.metaGold}>
                      {[c.open_leads ? `${c.open_leads} open lead${c.open_leads > 1 ? 's' : ''}` : '', c.deal_count ? `${c.deal_count} deal${c.deal_count > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                {c.phone ? (
                  <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(telUrl(c.phone))}>
                    <Ionicons name="call" size={16} color={colors.navy} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          )}
        />
      ) : view === 'pipeline' ? (
        <FlatList
          data={txns ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListHeaderComponent={<Button label="+ New deal" onPress={() => router.push('/transaction/new')} />}
          ListEmptyComponent={<EmptyState text="No deals yet. Convert a lead, or start one here." />}
          renderItem={({ item: t }) => (
            <TouchableOpacity style={[s.card, { marginTop: space.sm, marginBottom: 0 }]} onPress={() => router.push(`/transaction/${t.id}`)}>
              <View style={s.head}>
                <Text style={s.title} numberOfLines={1}>{t.property_label}</Text>
                <Badge label={t.outcome === 'In progress' ? t.stage : t.outcome} tone={t.outcome === 'Closed' ? 'verified' : t.outcome === 'Lost' ? 'flagged' : 'progress'} />
              </View>
              <Text style={s.meta}>{t.reference} · {cr(t.deal_value_cr)} · {fmtDate(t.opened_at)}</Text>
              <Text style={s.meta}>{[t.buyer_name, t.seller_name].filter(Boolean).join(' ↔ ') || '—'}</Text>
              <ByLine record={t} createdAt={t.opened_at} compact />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={docs ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListEmptyComponent={<EmptyState text="No document requests." />}
          renderItem={({ item: d }) => (
            <View style={s.card}>
              <View style={s.head}>
                <Text style={s.title} numberOfLines={1}>{d.name}</Text>
                <Badge label={d.status} tone={d.status === 'Approved' ? 'verified' : d.status === 'Declined' ? 'flagged' : 'pending'} />
              </View>
              <Text style={s.meta}>{d.parcel_label || d.parcel_code} · {d.buyer_type} · {d.ticket_size || 'ticket n/a'}</Text>
              <Text style={s.meta}>{[d.organisation, d.email, d.phone].filter(Boolean).join(' · ')}</Text>
              {d.status !== 'Pending' && d.updated_by ? <ByLine record={{ updated_by: d.updated_by, updated_at: d.updated_at }} /> : null}
              {d.status === 'Pending' ? (
                <View style={[s.actions, { borderTopWidth: 0 }]}>
                  <View style={{ flex: 1 }}><Button label="Approve" busy={busy === d.id} onPress={() => decide(d, 'Approved')} /></View>
                  <View style={{ flex: 1 }}><Button label="Decline" tone="danger" onPress={() => decide(d, 'Declined')} /></View>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  switcher: { flexDirection: 'row', gap: 6, padding: space.lg, paddingBottom: space.sm },
  sw: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  swOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  swText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  swTextOn: { color: colors.white },
  list: { padding: space.lg, paddingTop: space.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, paddingHorizontal: 12, backgroundColor: colors.white },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: text.base, color: colors.ink },
  filters: { gap: 6, paddingVertical: space.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipGold: { backgroundColor: colors.goldTint, borderColor: colors.gold },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.sm },
  cardDue: { borderColor: '#F0C9C4', borderLeftWidth: 4, borderLeftColor: colors.flagged },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: text.base, fontWeight: '700', color: colors.navy, flex: 1 },
  intent: { backgroundColor: colors.progressBg, borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2 },
  intentText: { fontSize: 10, fontWeight: '800', color: colors.progress, textTransform: 'uppercase' },
  meta: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  metaGold: { fontSize: text.xs, color: colors.goldDeep, fontWeight: '700', marginTop: 3 },
  due: { fontSize: text.sm, color: colors.flagged, fontWeight: '800', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.line2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  next: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 100, backgroundColor: colors.navyTint },
  nextText: { fontSize: text.sm, fontWeight: '800', color: colors.navy },
})
