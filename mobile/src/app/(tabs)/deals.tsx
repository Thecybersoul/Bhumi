import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Badge, EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button } from '@/components/form'
import type { ApiResult, DataRoomRequest, Lead, LeadStage, PropertyTransaction } from '@/lib/types'

const LEAD_STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Visit', 'Closed']

function cr(n: number | null | undefined) {
  if (n == null) return 'Value TBD'
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
const digits = (p: string) => p.replace(/[^\d+]/g, '')

export default function DealsScreen() {
  const api = useApi()
  const [view, setView] = useState<'pipeline' | 'leads' | 'documents'>('pipeline')
  const [txns, setTxns] = useState<PropertyTransaction[] | null>(null)
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [docs, setDocs] = useState<DataRoomRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, l, d] = await Promise.all([
        api.get<ApiResult<PropertyTransaction[]>>('/api/transactions'),
        api.get<ApiResult<Lead[]>>('/api/leads'),
        api.get<ApiResult<DataRoomRequest[]>>('/api/data-room'),
      ])
      setTxns(t.data)
      setLeads(l.data)
      setDocs(d.data)
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

  async function advanceLead(l: Lead, stage: LeadStage) {
    setBusy(l.id)
    try {
      await api.patch(`/api/leads?id=${encodeURIComponent(l.id)}&stage=${stage}`)
      setLeads((p) => p?.map((x) => (x.id === l.id ? { ...x, stage } : x)) ?? null)
    } catch (e) {
      setError((e as Error).message)
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

  const loading = txns === null && leads === null && docs === null && !error
  const tabs = [
    { id: 'pipeline', label: `Pipeline${txns ? ` (${txns.length})` : ''}` },
    { id: 'leads', label: `Leads${leads ? ` (${leads.length})` : ''}` },
    { id: 'documents', label: `Docs${docs ? ` (${docs.filter((d) => d.status === 'Pending').length})` : ''}` },
  ] as const

  const rc = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />

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
      ) : view === 'pipeline' ? (
        <FlatList
          data={txns ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListHeaderComponent={<Button label="+ New transaction" onPress={() => router.push('/transaction/new')} />}
          ListEmptyComponent={<EmptyState text="No transactions yet." />}
          renderItem={({ item: t }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/transaction/${t.id}`)}>
              <View style={s.head}>
                <Text style={s.title} numberOfLines={1}>{t.property_label}</Text>
                <Badge
                  label={t.outcome === 'In progress' ? t.stage : t.outcome}
                  tone={t.outcome === 'Closed' ? 'verified' : t.outcome === 'Lost' ? 'flagged' : 'progress'}
                />
              </View>
              <Text style={s.meta}>{t.reference} · {cr(t.deal_value_cr)} · {fmtDate(t.opened_at)}</Text>
              <Text style={s.meta}>{[t.buyer_name, t.seller_name].filter(Boolean).join(' ↔ ') || '—'}</Text>
            </TouchableOpacity>
          )}
        />
      ) : view === 'leads' ? (
        <FlatList
          data={leads ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListEmptyComponent={<EmptyState text="No leads yet." />}
          renderItem={({ item: l }) => {
            const idx = LEAD_STAGES.indexOf(l.stage)
            const next = LEAD_STAGES[idx + 1]
            return (
              <View style={s.card}>
                <View style={s.head}>
                  <Text style={s.title} numberOfLines={1}>{l.name}</Text>
                  <Badge label={l.stage} tone={l.stage === 'New' ? 'pending' : l.stage === 'Closed' ? 'verified' : 'progress'} />
                </View>
                <Text style={s.meta}>{l.kind} · {l.channel} · {fmtDate(l.created_at)}</Text>
                {(l.company || l.phone) && <Text style={s.meta}>{[l.company, l.phone].filter(Boolean).join(' · ')}</Text>}
                {l.notes ? <Text style={s.note}>{l.notes}</Text> : null}
                <View style={s.actions}>
                  {l.phone ? (
                    <>
                      <View style={{ flex: 1 }}><Button label="Call" tone="ghost" onPress={() => Linking.openURL(`tel:${digits(l.phone)}`)} /></View>
                      <View style={{ flex: 1 }}><Button label="WhatsApp" tone="ghost" onPress={() => Linking.openURL(`https://wa.me/${digits(l.phone).replace('+', '')}`)} /></View>
                    </>
                  ) : null}
                  {next ? (
                    <View style={{ flex: 1.3 }}>
                      <Button label={`→ ${next}`} busy={busy === l.id} onPress={() => advanceLead(l, next)} />
                    </View>
                  ) : null}
                </View>
              </View>
            )
          }}
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
              {d.status === 'Pending' ? (
                <View style={s.actions}>
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
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: text.base, fontWeight: '700', color: colors.navy, flex: 1 },
  meta: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  note: { fontSize: text.sm, color: colors.ink2, marginTop: 6, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, marginTop: space.sm },
})
