import { useCallback, useMemo, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { Linking, RefreshControl, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import type { Doc, DocEntity } from '@/lib/documents'
import { colors, radius, space, text } from '@/lib/theme'
import { EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { DocRow } from '@/components/documents'

const SECTION: Record<DocEntity, string> = {
  property: 'Listings',
  transaction: 'Deals',
  verification: 'Verification',
  lead: 'Leads',
  contact: 'Contacts',
  note: 'Notes',
  meeting: 'Meetings',
  task: 'Tasks',
  general: 'General',
}
const FILTERS: (DocEntity | 'all')[] = ['all', 'property', 'transaction', 'lead', 'contact', 'meeting', 'note', 'task']

/* Every document in the ERP in one searchable place — for the moment
   someone asks for "the EC on the Devanahalli parcel" and you don't
   remember which record it hangs off. */
export default function DocumentsScreen() {
  const api = useApi()
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<DocEntity | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ data: Doc[]; error?: string }>('/api/documents')
      setDocs(r.data)
      setError(r.error ? 'Documents table missing — run migration 011.' : null)
    } catch (e) {
      setError((e as Error).message)
      setDocs([])
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const sections = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = (docs ?? []).filter(
      (d) =>
        (filter === 'all' || d.entity_type === filter) &&
        (!needle || `${d.name} ${d.category} ${d.entity_label}`.toLowerCase().includes(needle))
    )
    const groups = new Map<string, Doc[]>()
    for (const d of list) {
      const key = `${SECTION[d.entity_type]} · ${d.entity_label || 'Unlabelled'}`
      groups.set(key, [...(groups.get(key) ?? []), d])
    }
    return [...groups.entries()].map(([title, data]) => ({ title, data, first: data[0] }))
  }, [docs, q, filter])

  async function open(d: Doc) {
    try {
      const { url } = await api.get<{ url: string }>(`/api/documents/${d.id}`)
      await Linking.openURL(url)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function goTo(d: Doc) {
    if (!d.entity_id) return
    if (d.entity_type === 'property') router.push({ pathname: '/property/[id]', params: { id: d.entity_id } })
    else if (d.entity_type === 'transaction') router.push({ pathname: '/transaction/[id]', params: { id: d.entity_id } })
    else if (d.entity_type === 'meeting') router.push({ pathname: '/meeting/[id]', params: { id: d.entity_id } })
    else if (d.entity_type === 'note') router.push('/notes-tasks')
  }

  if (docs === null) return <LoadingScreen />

  return (
    <Screen>
      <View style={s.top}>
        <View style={s.search}>
          <Ionicons name="search" size={17} color={colors.muted} />
          <TextInput
            style={s.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search name, category, listing…"
            placeholderTextColor={colors.muted}
          />
          {q ? (
            <TouchableOpacity onPress={() => setQ('')} hitSlop={10}>
              <Ionicons name="close-circle" size={17} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={s.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} style={[s.filter, filter === f && s.filterOn]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextOn]}>{f === 'all' ? 'All' : SECTION[f]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {error && <ErrorBanner message={error} />}
      <SectionList
        sections={sections}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: space.lg, paddingTop: 0, flexGrow: 1 }}
        stickySectionHeadersEnabled={false}
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
        ListEmptyComponent={
          <EmptyState text={q || filter !== 'all' ? 'Nothing matches.' : 'No documents yet. Attach them from a listing, deal or note.'} />
        }
        renderSectionHeader={({ section }) => (
          <TouchableOpacity style={s.header} onPress={() => goTo(section.first)}>
            <Text style={s.headerText} numberOfLines={1}>
              {section.title}
            </Text>
            {section.first.entity_id && section.first.entity_type !== 'general' ? (
              <Ionicons name="arrow-forward" size={14} color={colors.goldDeep} />
            ) : null}
          </TouchableOpacity>
        )}
        renderItem={({ item }) => (
          <View style={s.item}>
            <DocRow doc={item} onOpen={() => open(item)} />
          </View>
        )}
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  top: { padding: space.lg, paddingBottom: space.sm, gap: space.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: text.md, color: colors.ink },
  filters: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  filterOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  filterTextOn: { color: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md, marginBottom: 4 },
  headerText: { flexShrink: 1, fontSize: text.xs, fontWeight: '800', color: colors.navy, textTransform: 'uppercase', letterSpacing: 0.6 },
  item: { backgroundColor: colors.white, paddingHorizontal: space.md, borderRadius: 14, borderWidth: 1, borderColor: colors.line, marginBottom: 6, overflow: 'hidden' },
})
