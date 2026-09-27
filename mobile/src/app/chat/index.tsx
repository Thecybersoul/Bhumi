import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { colors, radius, space, text } from '@/lib/theme'
import { Screen } from '@/components/ui'
import { Avatar } from '@/components/people'
import { lastLine, when, type ConversationSummary } from '@/lib/chat'

/* Messages: the team room, then a conversation with each teammate,
   most recent first. Unread counts refresh whenever the screen is shown. */
export default function ChatList() {
  const api = useApi()
  const { user } = useSession()
  const [list, setList] = useState<ConversationSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ conversations: ConversationSummary[] }>('/api/messages')
      setList(r.conversations)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setList((l) => l ?? [])
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
      const t = setInterval(load, 15_000)
      return () => clearInterval(t)
    }, [load])
  )

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
      >
        {error ? <Text style={s.error}>{error}</Text> : null}
        {list === null ? <Text style={s.muted}>Loading…</Text> : null}
        {list?.map((c) => (
          <TouchableOpacity key={c.ref} style={s.row} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.ref, title: c.title } })}>
            {c.kind === 'team' ? (
              <View style={s.teamIcon}>
                <Ionicons name="people" size={20} color={colors.white} />
              </View>
            ) : (
              <Avatar name={c.title} size={44} />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={s.top}>
                <Text style={[s.title, c.unread ? s.bold : null]} numberOfLines={1}>{c.title}</Text>
                {c.last ? <Text style={[s.time, c.unread ? { color: colors.goldDeep } : null]}>{when(c.last.created_at)}</Text> : null}
              </View>
              <View style={s.top}>
                <Text style={[s.last, c.unread ? { color: colors.ink, fontWeight: '600' } : null]} numberOfLines={1}>{lastLine(c, user?.name)}</Text>
                {c.unread ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{c.unread > 99 ? '99+' : c.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {list && list.length === 1 && !error ? <Text style={s.muted}>Your teammates appear here once they have accounts.</Text> : null}
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: radius.base, padding: 12, borderWidth: 1, borderColor: colors.line },
  teamIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: text.md, fontWeight: '700', color: colors.ink },
  bold: { fontWeight: '800' },
  time: { fontSize: text.xs, color: colors.muted },
  last: { flex: 1, fontSize: text.sm, color: colors.muted, marginTop: 2 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  muted: { fontSize: text.sm, color: colors.muted, textAlign: 'center', marginTop: space.md },
  error: { fontSize: text.sm, color: colors.flagged, fontWeight: '600' },
})
