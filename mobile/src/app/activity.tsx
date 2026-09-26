import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { EmptyState, LoadingScreen, Screen } from '@/components/ui'
import { ActivityRow } from '@/components/activity'
import { Avatar } from '@/components/people'
import type { Activity } from '@/lib/types'

/* The whole team's trail, newest first, filterable by person. */
export default function ActivityScreen() {
  const api = useApi()
  const [items, setItems] = useState<Activity[] | null>(null)
  const [who, setWho] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems((await api.get<{ data: Activity[] }>('/api/activity?limit=200')).data)
    } catch {
      setItems([])
    }
  }, [api])

  useEffect(() => {
    load()
  }, [load])

  const people = useMemo(() => [...new Set((items ?? []).map((a) => a.actor_name))].filter((n) => n !== 'Website'), [items])
  const list = (items ?? []).filter((a) => who === 'all' || a.actor_name === who)

  if (items === null) return <LoadingScreen />

  return (
    <Screen>
      <View style={s.filters}>
        <TouchableOpacity style={[s.chip, who === 'all' && s.chipOn]} onPress={() => setWho('all')}>
          <Text style={[s.chipText, who === 'all' && { color: colors.white }]}>Everyone</Text>
        </TouchableOpacity>
        {people.map((p) => (
          <TouchableOpacity key={p} style={[s.chip, who === p && s.chipOn]} onPress={() => setWho(p)}>
            <Avatar name={p} size={18} />
            <Text style={[s.chipText, who === p && { color: colors.white }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={list}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xl, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
            tintColor={colors.navy}
          />
        }
        renderItem={({ item }) => <ActivityRow a={item} />}
        ListEmptyComponent={<EmptyState text="No activity yet." />}
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: space.lg, paddingBottom: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
})
