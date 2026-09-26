import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { EmptyState, LoadingScreen, Screen } from '@/components/ui'
import { Avatar, timeAgo } from '@/components/people'

interface Item {
  id: string
  kind: string
  title: string
  body: string
  actor: string
  created_at: string
  app_path: string | null
}

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  lead: 'person-add',
  document_request: 'document-lock',
  deal: 'briefcase',
  meeting: 'people',
  task: 'checkbox',
  listing: 'map',
  document: 'document-attach',
  google: 'logo-google',
}

/* Everything the rest of the team did that you should know about,
   plus website enquiries. Opening it marks everything read. */
export default function NotificationsScreen() {
  const api = useApi()
  const [items, setItems] = useState<Item[] | null>(null)
  const [seenAt, setSeenAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ items: Item[]; seen_at: string | null }>('/api/notifications?limit=60')
      setItems(r.items)
      setSeenAt(r.seen_at)
      api.post('/api/notifications/seen').catch(() => {})
    } catch {
      setItems([])
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  if (items === null) return <LoadingScreen />

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: space.lg, flexGrow: 1 }}
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
        ListEmptyComponent={<EmptyState text="All quiet. Team updates and website enquiries will show up here." />}
        renderItem={({ item: n }) => {
          const unread = !seenAt || n.created_at > seenAt
          return (
            <TouchableOpacity style={[s.row, unread && s.unread]} onPress={() => n.app_path && router.push(n.app_path as never)} activeOpacity={0.7}>
              <View style={s.iconWrap}>
                <Avatar name={n.actor} size={34} />
                <View style={s.kind}>
                  <Ionicons name={ICON[n.kind] ?? 'notifications'} size={11} color={colors.white} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{n.title}</Text>
                {n.body ? (
                  <Text style={s.body} numberOfLines={2}>
                    {n.body}
                  </Text>
                ) : null}
                <Text style={s.time}>{timeAgo(n.created_at)}</Text>
              </View>
              {unread ? <View style={s.dot} /> : null}
            </TouchableOpacity>
          )
        }}
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: 8 },
  unread: { borderColor: colors.gold, backgroundColor: colors.goldTint },
  iconWrap: { position: 'relative' },
  kind: { position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  title: { fontSize: text.base, fontWeight: '800', color: colors.ink },
  body: { fontSize: text.sm, color: colors.ink2, marginTop: 2, lineHeight: 19 },
  time: { fontSize: text['2xs'], color: colors.muted, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold, marginTop: 6 },
})
