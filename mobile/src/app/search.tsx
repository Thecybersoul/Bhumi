import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router, Stack } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import { Screen } from '@/components/ui'

/* One box for everything — people and agents by name, phone, agency or
   RERA number; listings by code, title, place or survey number; deals,
   leads, meetings, tasks, notes and documents. The app's twin of the
   web admin's ⌘K palette, over the same /api/search. */

interface Hit {
  type: 'lead' | 'contact' | 'agent' | 'property' | 'transaction' | 'meeting' | 'task' | 'note' | 'document'
  id: string
  title: string
  sub: string
  entity_type?: string | null
  entity_id?: string | null
}

const GROUP: Record<Hit['type'], [string, keyof typeof Ionicons.glyphMap]> = {
  agent: ['Agents', 'ribbon-outline'],
  contact: ['Contacts', 'person-circle-outline'],
  lead: ['Leads', 'person-outline'],
  property: ['Listings', 'map-outline'],
  transaction: ['Deals', 'briefcase-outline'],
  meeting: ['Meetings', 'people-outline'],
  task: ['Tasks', 'checkmark-circle-outline'],
  note: ['Notes', 'document-text-outline'],
  document: ['Documents', 'folder-open-outline'],
}

function openRecord(type?: string | null, id?: string | null, fallback = '/notes-tasks') {
  if (!type || !id) return router.push(fallback as never)
  if (type === 'property') router.push({ pathname: '/property/[id]', params: { id } })
  else if (type === 'transaction') router.push({ pathname: '/transaction/[id]', params: { id } })
  else if (type === 'lead') router.push({ pathname: '/lead/[id]', params: { id } })
  else if (type === 'contact' || type === 'agent') router.push({ pathname: '/contact/[id]', params: { id } })
  else if (type === 'meeting') router.push({ pathname: '/meeting/[id]', params: { id } })
  else router.push(fallback as never)
}

function open(h: Hit) {
  if (h.type === 'task' || h.type === 'note') return openRecord(h.entity_type, h.entity_id)
  if (h.type === 'document') return openRecord(h.entity_type, h.entity_id, '/documents')
  openRecord(h.type, h.id)
}

export default function SearchScreen() {
  const api = useApi()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setHits([])
      return
    }
    setBusy(true)
    const t = setTimeout(() => {
      api
        .get<{ data: Hit[] }>(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => setHits(r.data))
        .catch(() => setHits([]))
        .finally(() => setBusy(false))
    }, 200)
    return () => clearTimeout(t)
  }, [q, api])

  const groups = useMemo(() => {
    const order = Object.keys(GROUP) as Hit['type'][]
    return order.map((t) => [t, hits.filter((h) => h.type === t)] as const).filter(([, list]) => list.length)
  }, [hits])

  const term = q.trim()
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={s.bar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={s.input}
          value={q}
          onChangeText={setQ}
          autoFocus
          placeholder="People, agents, listings, deals, documents…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCorrect={false}
        />
        {busy ? <ActivityIndicator color={colors.navy} /> : q ? (
          <TouchableOpacity onPress={() => setQ('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: 0, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {term.length < 2 ? (
          <Text style={s.hint}>Type a name, phone number, agency, survey number or deal reference.</Text>
        ) : !busy && !hits.length ? (
          <Text style={s.hint}>Nothing matches “{term}”.</Text>
        ) : null}
        {groups.map(([type, list]) => (
          <View key={type}>
            <Text style={s.group}>{GROUP[type][0]}</Text>
            {list.map((h) => (
              <TouchableOpacity key={`${h.type}${h.id}`} style={s.row} onPress={() => open(h)}>
                <Ionicons name={GROUP[h.type][1]} size={18} color={colors.goldDeep} />
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{h.title}</Text>
                  {h.sub ? <Text style={s.sub} numberOfLines={1}>{h.sub}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.line} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {term ? (
          <TouchableOpacity style={s.ask} onPress={() => router.push({ pathname: '/assistant', params: { q: term } })}>
            <Ionicons name="sparkles" size={18} color={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: colors.white }]}>Ask the assistant</Text>
              <Text style={[s.sub, { color: colors.goldTint }]} numberOfLines={1}>“{term}”</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: space.lg, paddingHorizontal: 14, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  input: { flex: 1, paddingVertical: 13, fontSize: text.base, color: colors.ink },
  hint: { fontSize: text.sm, color: colors.muted, paddingVertical: space.md },
  group: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: colors.muted, textTransform: 'uppercase', marginTop: space.md, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  title: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  sub: { fontSize: text.xs, color: colors.muted, marginTop: 2 },
  ask: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: space.lg, padding: 14, borderRadius: radius.base, backgroundColor: colors.navy },
})
