import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Card, CardTitle, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'

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
  advisorStats: { name: string; total: number; active: number; closedValue: number; winRate: number | null }[]
  leadsByChannel: { channel: string; count: number }[]
  upcomingMeetings: { id: string; title: string; with: string; scheduled_at: string; txnRef: string }[]
  pendingDataRoom: number
}

function cr(n: number) {
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}

export default function DashboardScreen() {
  const api = useApi()
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setData(await api.get<Dashboard>('/api/dashboard'))
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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        {error && <ErrorBanner message={error} />}
        {data && (
          <>
            <View style={styles.grid}>
              <Card style={styles.tile}>
                <Text style={styles.kpiValue}>{cr(data.kpi.activeValue)}</Text>
                <Text style={styles.kpiLabel}>Active pipeline</Text>
                <Text style={styles.kpiNote}>{data.kpi.activeCount} in progress</Text>
              </Card>
              <Card style={styles.tile}>
                <Text style={[styles.kpiValue, { color: colors.verified }]}>{cr(data.kpi.closedValue)}</Text>
                <Text style={styles.kpiLabel}>Closed value</Text>
                <Text style={styles.kpiNote}>{data.kpi.closedCount} closed</Text>
              </Card>
              <Card style={styles.tile}>
                <Text style={[styles.kpiValue, { color: colors.goldDeep }]}>{cr(data.kpi.commissionCollected)}</Text>
                <Text style={styles.kpiLabel}>Commission collected</Text>
                <Text style={styles.kpiNote}>{cr(data.kpi.commissionPending)} pending</Text>
              </Card>
              <Card style={styles.tile}>
                <Text style={styles.kpiValue}>{data.kpi.winRatePct}%</Text>
                <Text style={styles.kpiLabel}>Win rate</Text>
                <Text style={styles.kpiNote}>{data.kpi.closedCount} closed · {data.kpi.lostCount} lost</Text>
              </Card>
            </View>

            <Card>
              <CardTitle>Verifications in review</CardTitle>
              <Text style={styles.kpiValue}>{data.kpi.verificationsInReview}</Text>
              <Text style={styles.kpiNote}>Median {data.kpi.medianTurnaroundDays || '—'}d to certificate</Text>
            </Card>

            <Card>
              <CardTitle>Transaction pipeline</CardTitle>
              {data.pipelineByStage.every((s) => s.count === 0) ? (
                <Text style={styles.muted}>No deals in progress.</Text>
              ) : (
                data.pipelineByStage.map((s) => (
                  <View key={s.stage} style={styles.row}>
                    <Text style={styles.rowLabel}>{s.stage}</Text>
                    <Text style={styles.rowValue}>{s.count}</Text>
                  </View>
                ))
              )}
            </Card>

            <Card>
              <CardTitle>Inventory by status</CardTitle>
              {data.inventoryByStatus.map((s) => (
                <View key={s.status} style={styles.row}>
                  <Text style={styles.rowLabel}>{s.status}</Text>
                  <Text style={styles.rowValue}>
                    {s.count} · {cr(s.value)}
                  </Text>
                </View>
              ))}
            </Card>

            <Card>
              <CardTitle>Upcoming meetings</CardTitle>
              {data.upcomingMeetings.length === 0 ? (
                <Text style={styles.muted}>Nothing scheduled.</Text>
              ) : (
                data.upcomingMeetings.map((m) => (
                  <View key={m.id} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>{m.title}</Text>
                      <Text style={styles.muted}>{m.with} · {m.txnRef}</Text>
                    </View>
                    <Text style={styles.rowValue}>
                      {new Date(m.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                ))
              )}
            </Card>

            <Card>
              <CardTitle>Leads by channel</CardTitle>
              {data.leadsByChannel.length === 0 ? (
                <Text style={styles.muted}>No leads yet.</Text>
              ) : (
                data.leadsByChannel.map((c) => (
                  <View key={c.channel} style={styles.row}>
                    <Text style={styles.rowLabel}>{c.channel}</Text>
                    <Text style={styles.rowValue}>{c.count}</Text>
                  </View>
                ))
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { padding: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  tile: { flexBasis: '47%', flexGrow: 1 },
  kpiValue: { fontSize: text['2xl'], fontWeight: '700', color: colors.navy },
  kpiLabel: { fontSize: text.base, fontWeight: '600', color: colors.ink, marginTop: 2 },
  kpiNote: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
  },
  rowLabel: { fontSize: text.base, color: colors.ink2, fontWeight: '600' },
  rowValue: { fontSize: text.base, color: colors.navy, fontWeight: '700' },
  muted: { fontSize: text.md, color: colors.muted },
})
