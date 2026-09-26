import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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

function statusTone(s: Property['status']): 'live' | 'progress' | 'flagged' {
  return s === 'Live' ? 'live' : s === 'Reserved' ? 'progress' : 'flagged'
}
const stageColor = (s: StageStatus) =>
  s === 'Verified' ? colors.verified : s === 'Flagged' ? colors.flagged : s === 'In progress' ? colors.progress : colors.muted

export default function PropertiesScreen() {
  const api = useApi()
  const [view, setView] = useState<'listings' | 'verification'>('listings')
  const [props, setProps] = useState<Property[] | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('live')
  const [cases, setCases] = useState<VerificationCase[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [nc, setNc] = useState({ parcel_label: '', location: '', client_name: '', advisor: '' })

  const load = useCallback(async () => {
    try {
      const [p, v] = await Promise.all([
        api.get<ApiResult<Property[]>>('/api/properties?admin=1'),
        api.get<ApiResult<VerificationCase[]>>('/api/verifications'),
      ])
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
          renderItem={({ item: p }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/property/${encodeURIComponent(p.id)}`)}>
              <View style={s.head}>
                <Text style={s.title} numberOfLines={2}>{p.title}</Text>
                <Badge label={p.status} tone={statusTone(p.status)} />
              </View>
              <Text style={s.meta}>{p.code} · {p.location}</Text>
              <Text style={s.meta}>{p.built_up_sqft ? `${p.built_up_sqft.toLocaleString('en-IN')} sq ft` : `${p.extent_acres} acres`}</Text>
            </TouchableOpacity>
          )}
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
              {c.flag_reason ? <Text style={s.flag}>⚑ {c.flag_reason}</Text> : null}
            </View>
          )}
        />
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
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
