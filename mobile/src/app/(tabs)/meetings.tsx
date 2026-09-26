import { useCallback, useMemo, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { MeetingCard } from '@/components/meetingCard'
import { KIND_ICON, KINDS, dayLabel, needsOutcome } from '@/lib/meetings'
import type { Meeting, MeetingKind } from '@/lib/types'

type View_ = 'upcoming' | 'past'

/* Every meeting, call, site visit and discussion, by day. Upcoming
   runs soonest-first; Past runs latest-first, with meetings whose
   outcome was never written up flagged at the top. */
export default function MeetingsScreen() {
  const api = useApi()
  const [items, setItems] = useState<Meeting[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View_>('upcoming')
  const [kind, setKind] = useState<MeetingKind | 'All'>('All')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ data: Meeting[]; error?: string }>('/api/meetings')
      setItems(r.data)
      setError(r.error?.includes('meetings') ? 'Meetings table missing — run migration 012.' : null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load meetings')
      setItems([])
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const { sections, owed, counts } = useMemo(() => {
    const all = (items ?? []).filter((m) => kind === 'All' || m.kind === kind)
    const now = Date.now()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const upcoming = all
      .filter((m) => new Date(m.scheduled_at).getTime() >= startOfToday.getTime() && !needsOutcome(m))
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    const past = all
      .filter((m) => new Date(m.scheduled_at).getTime() < startOfToday.getTime() || needsOutcome(m))
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
    const owedList = past.filter(needsOutcome)
    const list = view === 'upcoming' ? upcoming : past.filter((m) => !needsOutcome(m))
    const groups = new Map<string, Meeting[]>()
    for (const m of list) {
      const k = dayLabel(m.scheduled_at)
      groups.set(k, [...(groups.get(k) ?? []), m])
    }
    return {
      sections: [...groups.entries()].map(([title, data]) => ({ title, data })),
      owed: owedList,
      counts: { upcoming: upcoming.length, past: past.length, week: upcoming.filter((m) => new Date(m.scheduled_at).getTime() < now + 7 * 86_400_000).length },
    }
  }, [items, view, kind])

  if (items === null) return <LoadingScreen />

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(m) => m.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
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
        ListHeaderComponent={
          <View>
            {error ? <ErrorBanner message={error} /> : null}
            <View style={s.switcher}>
              {(
                [
                  ['upcoming', `Upcoming · ${counts.upcoming}`],
                  ['past', `Past · ${counts.past}`],
                ] as const
              ).map(([id, label]) => (
                <TouchableOpacity key={id} style={[s.sw, view === id && s.swOn]} onPress={() => setView(id)}>
                  <Text style={[s.swText, view === id && s.swTextOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.kinds}>
              {(['All', ...KINDS] as const).map((k) => (
                <TouchableOpacity key={k} style={[s.kind, kind === k && s.kindOn]} onPress={() => setKind(k)}>
                  {k !== 'All' ? <Ionicons name={KIND_ICON[k]} size={12} color={kind === k ? colors.white : colors.ink2} /> : null}
                  <Text style={[s.kindText, kind === k && { color: colors.white }]}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {owed.length ? (
              <View style={s.owed}>
                <View style={s.owedHead}>
                  <Ionicons name="create-outline" size={16} color={colors.pending} />
                  <Text style={s.owedTitle}>
                    {owed.length} meeting{owed.length > 1 ? 's' : ''} need{owed.length > 1 ? '' : 's'} an outcome
                  </Text>
                </View>
                {owed.slice(0, 3).map((m) => (
                  <MeetingCard key={m.id} m={m} showDay />
                ))}
              </View>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={s.day}>{section.title}</Text>}
        renderItem={({ item }) => <MeetingCard m={item} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="calendar-clear-outline" size={34} color={colors.line} />
            <Text style={s.emptyTitle}>{view === 'upcoming' ? 'Nothing scheduled' : 'No past meetings yet'}</Text>
            <Text style={s.emptyText}>Log site visits, calls and discussions, and tie each one to its listing, deal or task.</Text>
          </View>
        }
      />
      <TouchableOpacity style={s.fab} onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: 'new' } })} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color={colors.white} />
        <Text style={s.fabText}>Log meeting</Text>
      </TouchableOpacity>
    </Screen>
  )
}

const s = StyleSheet.create({
  switcher: { flexDirection: 'row', gap: 6, marginBottom: space.sm },
  sw: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  swOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  swText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  swTextOn: { color: colors.white },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: space.sm },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  kindOn: { backgroundColor: colors.goldDeep, borderColor: colors.goldDeep },
  kindText: { fontSize: text['2xs'], fontWeight: '700', color: colors.ink2 },
  owed: { backgroundColor: colors.pendingBg, borderRadius: 18, padding: space.sm, paddingBottom: 2, marginBottom: space.sm },
  owedHead: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4, marginBottom: 6 },
  owedTitle: { fontSize: text.sm, fontWeight: '800', color: colors.pending },
  day: { fontSize: text.xs, fontWeight: '800', color: colors.navy, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: space.md, marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: space.xl * 1.5, paddingHorizontal: space.lg, gap: 6 },
  emptyTitle: { fontSize: text.md, fontWeight: '800', color: colors.ink2 },
  emptyText: { fontSize: text.sm, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  fab: {
    position: 'absolute',
    right: space.lg,
    bottom: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: colors.white, fontWeight: '800', fontSize: text.sm },
})
