import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Badge, EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import type { ApiResult, Property } from '@/lib/types'

function statusTone(s: Property['status']): 'live' | 'progress' | 'flagged' {
  return s === 'Live' ? 'live' : s === 'Reserved' ? 'progress' : 'flagged'
}

export default function PropertiesScreen() {
  const api = useApi()
  const [properties, setProperties] = useState<Property[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiResult<Property[]>>('/api/properties?admin=1')
      setProperties(res.data)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load properties')
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

  if (properties === null && !error) return <LoadingScreen />

  return (
    <Screen>
      {error && <ErrorBanner message={error} />}
      <FlatList
        data={properties ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
        ListEmptyComponent={<EmptyState text="No listings yet." />}
        renderItem={({ item: p }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle} numberOfLines={2}>{p.title}</Text>
              <Badge label={p.status} tone={statusTone(p.status)} />
            </View>
            <Text style={styles.cardMeta}>
              {p.code} · {p.location}
            </Text>
            <Text style={styles.cardMeta}>
              {p.built_up_sqft ? `${p.built_up_sqft.toLocaleString('en-IN')} sq ft` : `${p.extent_acres} acres`}
            </Text>
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.sm },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: text.base, fontWeight: '700', color: colors.navy, flex: 1 },
  cardMeta: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
})
