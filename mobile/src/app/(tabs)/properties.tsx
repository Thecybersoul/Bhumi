import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { API_URL } from '@/lib/config'
import { Avatar } from '@/components/people'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Badge, EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, TextField } from '@/components/form'
import type { ApiResult, Property, StageStatus, VerificationCase, VerificationStageKey } from '@/lib/types'

const STAGE_LABEL: Record<VerificationStageKey, string> = {
  documents: 'Documents',
  title: 'Title & zoning',
  site: 'Disputes & site',
  report: 'Report',
}
const CYCLE: StageStatus[] = ['Not started', 'In progress', 'Verified', 'Flagged']

function statusTone(s: Property['status']): 'live' | 'progress' | 'flagged' | 'draft' {
  return s === 'Live' ? 'live' : s === 'Reserved' ? 'progress' : s === 'Draft' ? 'draft' : 'flagged'
}
const stageColor = (s: StageStatus) =>
  s === 'Verified' ? colors.verified : s === 'Flagged' ? colors.flagged : s === 'In progress' ? colors.progress : colors.muted

export default function PropertiesScreen() {
  const api = useApi()
  const [view, setView] = useState<'listings' | 'verification'>('listings')
  const [props, setProps] = useState<Property[] | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('live')
  const [cases, setCases] = useState<VerificationCase[] | null>(null)
  const [docCount, setDocCount] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [nc, setNc] = useState({ parcel_label: '', location: '', client_name: '', advisor: '' })

  const load = useCallback(async () => {
    try {
      const [p, v, d] = await Promise.all([
        api.get<ApiResult<Property[]>>('/api/properties?admin=1'),
        api.get<ApiResult<VerificationCase[]>>('/api/verifications'),
        api.get<{ data: { entity_id: string | null }[] }>('/api/documents?entity_type=property').catch(() => ({ data: [] })),
      ])
      const counts: Record<string, number> = {}
      for (const x of d.data) if (x.entity_id) counts[x.entity_id] = (counts[x.entity_id] ?? 0) + 1
      setDocCount(counts)
      setProps(p.data)
      setSource(p.source)
      setCases(v.data)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load')
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

  async function cycle(c: VerificationCase, key: VerificationStageKey) {
    const cur = c.stages.find((x) => x.key === key)?.status ?? 'Not started'
    const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length]
    try {
      await api.patch('/api/verifications', {
        id: c.id,
        stage: key,
        status: next,
        flag_reason: next === 'Flagged' ? 'Flagged by advisor' : '',
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function addCase() {
    if (!nc.parcel_label.trim()) return setError('A parcel label is required')
    try {
      await api.post('/api/verifications', nc)
      setNc({ parcel_label: '', location: '', client_name: '', advisor: '' })
      setAdding(false)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (props === null && cases === null && !error) return <LoadingScreen />
  const rc = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />

  return (
    <Screen>
      <View style={s.switcher}>
        {(['listings', 'verification'] as const).map((v) => (
          <TouchableOpacity key={v} style={[s.sw, view === v && s.swOn]} onPress={() => setView(v)}>
            <Text style={[s.swText, view === v && s.swTextOn]}>
              {v === 'listings' ? `Marketplace (${props?.length ?? 0})` : `Verification (${cases?.length ?? 0})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <ErrorBanner message={error} />}

      {view === 'listings' ? (
        <FlatList
          data={props ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListHeaderComponent={
            <View>
              {source === 'fallback' ? (
                <Text style={s.hint}>Showing built-in listings. Editing one saves them all to the live database.</Text>
              ) : null}
              <Button label="+ New listing" onPress={() => router.push('/property/new')} />
            </View>
          }
          ListEmptyComponent={<EmptyState text="No listings yet." />}
          renderItem={({ item: p }) => {
            const img = p.img_url ? (p.img_url.startsWith('http') ? p.img_url : `${API_URL}${p.img_url}`) : null
            const price = p.price_total_cr
              ? `₹${p.price_total_cr} Cr`
              : p.price_per_acre_cr
                ? `₹${p.price_per_acre_cr} Cr / acre`
                : p.price_per_sqft
                  ? `₹${p.price_per_sqft.toLocaleString('en-IN')} / sq ft`
                  : p.price_type
            const docs = docCount[p.id] ?? 0
            return (
              <TouchableOpacity style={s.listing} activeOpacity={0.8} onPress={() => router.push(`/property/${encodeURIComponent(p.id)}`)}>
                {img ? <Image source={{ uri: img }} style={s.thumb} /> : <View style={[s.thumb, s.thumbEmpty]}><Ionicons name="image-outline" size={22} color={colors.muted} /></View>}
                <View style={{ flex: 1, padding: space.md, paddingLeft: 12 }}>
                  <View style={s.head}>
                    <Text style={s.code}>{p.code}</Text>
                    <Badge label={p.status} tone={statusTone(p.status)} />
                  </View>
                  <Text style={[s.title, { flex: 0 }]} numberOfLines={2}>{p.title}</Text>
                  <Text style={s.meta} numberOfLines={1}>
                    <Ionicons name="location-outline" size={12} color={colors.muted} /> {p.location}
                    {'  ·  '}
                    {p.built_up_sqft ? `${p.built_up_sqft.toLocaleString('en-IN')} sq ft` : `${p.extent_acres} acres`}
                  </Text>
                  <View style={s.foot}>
                    <Text style={s.price}>{price}</Text>
                    <View style={[s.docs, { gap: 8 }]}>
                      <View style={s.docs}>
                        <Ionicons name="document-text-outline" size={13} color={docs ? colors.goldDeep : colors.muted} />
                        <Text style={[s.docsText, docs > 0 && { color: colors.goldDeep }]}>{docs}</Text>
                      </View>
                      {p.updated_by || p.created_by ? <Avatar name={p.updated_by || p.created_by} size={18} /> : null}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      ) : (
        <FlatList
          data={cases ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListHeaderComponent={
            <View>
              <Button label={adding ? 'Cancel' : '+ New verification case'} tone={adding ? 'ghost' : 'primary'} onPress={() => setAdding((a) => !a)} />
              {adding ? (
                <View style={[s.card, { marginTop: space.sm }]}>
                  <TextField label="Parcel" value={nc.parcel_label} onChange={(v) => setNc({ ...nc, parcel_label: v })} />
                  <TextField label="Location" value={nc.location} onChange={(v) => setNc({ ...nc, location: v })} />
                  <TextField label="Client" value={nc.client_name} onChange={(v) => setNc({ ...nc, client_name: v })} />
                  <TextField label="Advisor" value={nc.advisor} onChange={(v) => setNc({ ...nc, advisor: v })} />
                  <Button label="Open case" onPress={addCase} />
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={<EmptyState text="No verification cases yet." />}
          renderItem={({ item: c }) => (
            <View style={s.card}>
              <View style={s.head}>
                <Text style={s.title} numberOfLines={2}>{c.parcel_label}</Text>
                <Badge label={c.outcome} tone={c.outcome === 'Verified' ? 'verified' : c.outcome === 'Flagged' ? 'flagged' : 'progress'} />
              </View>
              <Text style={s.meta}>{c.reference} · {c.location}{c.advisor ? ` · ${c.advisor}` : ''}</Text>
              <Text style={s.hintSmall}>Tap a stage to move it along</Text>
              <View style={s.stages}>
                {(Object.keys(STAGE_LABEL) as VerificationStageKey[]).map((k) => {
                  const st = c.stages.find((x) => x.key === k)?.status ?? 'Not started'
                  return (
                    <TouchableOpacity key={k} style={[s.stage, { borderColor: stageColor(st) }]} onPress={() => cycle(c, k)}>
                      <Text style={[s.stageName, { color: stageColor(st) }]}>{STAGE_LABEL[k]}</Text>
                      <Text style={s.stageStatus}>{st}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              {c.flag_reason ? <Text style={s.flag}>{c.flag_reason}</Text> : null}
            </View>
          )}
        />
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  listing: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, marginBottom: 10, overflow: 'hidden' },
  thumb: { width: 104, alignSelf: 'stretch', minHeight: 124, backgroundColor: colors.line2 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  code: { fontSize: text['2xs'], fontWeight: '800', color: colors.muted, letterSpacing: 0.6 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontSize: text.base, fontWeight: '800', color: colors.navy },
  docs: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  docsText: { fontSize: text.xs, fontWeight: '700', color: colors.muted },
  switcher: { flexDirection: 'row', gap: 8, padding: space.lg, paddingBottom: space.sm },
  sw: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  swOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  swText: { fontSize: text.sm, fontWeight: '700', color: colors.ink2 },
  swTextOn: { color: colors.white },
  list: { padding: space.lg, paddingTop: space.sm },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.sm, marginTop: 2 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  title: { fontSize: text.base, fontWeight: '700', color: colors.navy, flex: 1 },
  meta: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  hint: { fontSize: text.sm, color: colors.pending, marginBottom: space.sm },
  hintSmall: { fontSize: text.xs, color: colors.muted, marginTop: space.sm },
  stages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  stage: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, minWidth: '47%', flexGrow: 1 },
  stageName: { fontSize: text.sm, fontWeight: '700' },
  stageStatus: { fontSize: text.xs, color: colors.muted, marginTop: 2 },
  flag: { color: colors.flagged, fontSize: text.sm, marginTop: 8 },
})
