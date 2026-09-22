import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Badge, EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import type { ApiResult, Lead, PropertyTransaction } from '@/lib/types'

function cr(n: number | null | undefined) {
  if (n == null) return 'Value TBD'
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
function txnTone(t: PropertyTransaction): 'verified' | 'flagged' | 'progress' {
  return t.outcome === 'Closed' ? 'verified' : t.outcome === 'Lost' ? 'flagged' : 'progress'
}
function leadTone(l: Lead): 'pending' | 'progress' | 'verified' {
  return l.stage === 'New' ? 'pending' : l.stage === 'Closed' ? 'verified' : 'progress'
}

export default function DealsScreen() {
  const api = useApi()
  const [view, setView] = useState<'pipeline' | 'leads'>('pipeline')
  const [transactions, setTransactions] = useState<PropertyTransaction[] | null>(null)
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([
        api.get<ApiResult<PropertyTransaction[]>>('/api/transactions'),
        api.get<ApiResult<Lead[]>>('/api/leads'),
      ])
      setTransactions(t.data)
      setLeads(l.data)
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

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const loading = transactions === null && leads === null && !error

  return (
    <Screen>
      <View style={styles.switcher}>
        <TouchableOpacity
          style={[styles.switchBtn, view === 'pipeline' && styles.switchBtnActive]}
          onPress={() => setView('pipeline')}
        >
          <Text style={[styles.switchText, view === 'pipeline' && styles.switchTextActive]}>
            Pipeline {transactions ? `(${transactions.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.switchBtn, view === 'leads' && styles.switchBtnActive]} onPress={() => setView('leads')}>
          <Text style={[styles.switchText, view === 'leads' && styles.switchTextActive]}>
            Leads {leads ? `(${leads.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <LoadingScreen />
      ) : view === 'pipeline' ? (
        <FlatList
          data={transactions ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          ListEmptyComponent={<EmptyState text="No transactions yet." />}
          renderItem={({ item: t }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>{t.property_label}</Text>
                <Badge label={t.outcome === 'In progress' ? t.stage : t.outcome} tone={txnTone(t)} />
              </View>
              <Text style={styles.cardMeta}>
                {t.reference} · {cr(t.deal_value_cr)} · {fmtDate(t.opened_at)}
              </Text>
              <Text style={styles.cardMeta}>{t.buyer_name || t.seller_name || '—'}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={leads ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          ListEmptyComponent={<EmptyState text="No leads yet." />}
          renderItem={({ item: l }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>{l.name}</Text>
                <Badge label={l.stage} tone={leadTone(l)} />
              </View>
              <Text style={styles.cardMeta}>{l.kind} · {l.channel} · {fmtDate(l.created_at)}</Text>
              {(l.phone || l.company) && <Text style={styles.cardMeta}>{[l.company, l.phone].filter(Boolean).join(' · ')}</Text>}
            </View>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row', gap: 8, padding: space.lg, paddingBottom: space.sm },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  switchBtnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  switchText: { fontSize: text.sm, fontWeight: '600', color: colors.ink2 },
  switchTextActive: { color: colors.white },
  list: { padding: space.lg, paddingTop: space.sm, gap: space.sm },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: text.base, fontWeight: '700', color: colors.navy, flex: 1 },
  cardMeta: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
})
