import { useEffect, useState } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { colors, radius, space, text } from '@/lib/theme'
import { ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, Field, TextField } from '@/components/form'
import { DateChips } from '@/components/crmDate'
import {
  LISTS, LIST_KEYS, SOURCES, STAGES, addDays, matchParcels, openingMessage, prioFromScore, today,
  type ListKey, type Parcel, type Prospect,
} from '@/lib/crm'

const blank = (list: ListKey): Prospect => ({
  id: '', list, name: '', kind: '', sector: '', prio: 'B', email: '', alt_emails: '', phone: '', area: '', requirement: '',
  trigger_why: '', history: '', stage: 0, next_date: addDays(1), value: null, owner: '', note: '', contact_person: '', website: '',
  source: '', source_url: '', deal_band: '', score: null, last_contacted: null, updated_at: '',
})

/* One prospect: everything the web drawer has, phone-shaped. Scoring
   sets the priority; Parcels to pitch shows live listings that fit, each
   with its reason, and turns one into a pipeline deal. */
export default function ProspectScreen() {
  const { id, list } = useLocalSearchParams<{ id: string; list?: string }>()
  const isNew = id === 'new'
  const api = useApi()
  const { user } = useSession()
  const me = user?.name ?? ''
  const nav = useNavigation()
  const [d, setD] = useState<Prospect | null>(isNew ? { ...blank((LIST_KEYS.includes(list as ListKey) ? list : 'B') as ListKey), owner: me } : null)
  const [listings, setListings] = useState<Parcel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isNew)
      api
        .get<{ data: Prospect[] }>('/api/crm/prospects')
        .then((r) => {
          const p = r.data.find((x) => x.id === id)
          if (p) setD({ ...p, owner: p.owner || me })
          else setError('This prospect no longer exists.')
        })
        .catch((e) => setError((e as Error).message))
    api
      .get<{ data: Parcel[]; source?: string }>('/api/properties?admin=1')
      .then((r) => r.source === 'live' && setListings(r.data))
      .catch(() => {})
  }, [api, id, isNew, me])

  useEffect(() => {
    nav.setOptions({ title: isNew ? 'New prospect' : d?.name || 'Prospect' })
  }, [nav, isNew, d?.name])

  if (!d) return error ? <Screen><ErrorBanner message={error} /></Screen> : <LoadingScreen />

  const set = <K extends keyof Prospect>(k: K, v: Prospect[K]) => setD((x) => (x ? { ...x, [k]: v } : x))
  const str = (k: keyof Prospect, label: string, opts: { multiline?: boolean; keyboard?: 'email-address' | 'phone-pad' | 'url' | 'numeric'; hint?: string } = {}) => (
    <TextField label={label} value={String(d[k] ?? '')} onChange={(v) => set(k, v as never)} {...opts} />
  )
  const msg = openingMessage(d, me)
  const matches = matchParcels(d, listings)

  async function save() {
    if (!d || !d.name.trim()) return setError('A name is required.')
    setBusy(true)
    setError(null)
    try {
      if (isNew) await api.post('/api/crm/prospects', d)
      else await api.patch(`/api/crm/prospects?id=${d.id}`, d)
      router.back()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function addToPipeline(l?: Parcel) {
    if (!d) return
    setBusy(true)
    setError(null)
    try {
      await api.post('/api/crm/deals', {
        name: l ? `${d.name} · ${l.code}` : d.name,
        parcel: l ? `${l.code}: ${l.title}` : d.requirement,
        property_code: l?.code ?? '',
        prospect_id: d.id,
        value: l?.price_total_cr ? Math.round(l.price_total_cr * 1e7) : 0,
        stage: 2,
        next_date: addDays(3),
      })
      if (d.stage < 2) await api.patch(`/api/crm/prospects?id=${d.id}`, { stage: 2, next_date: d.next_date && d.next_date > today() ? d.next_date : addDays(3) })
      router.replace({ pathname: '/sales', params: { view: 'opps' } })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function confirmDelete() {
    Alert.alert('Delete prospect?', d?.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/crm/prospects?id=${d?.id}`)
            router.back()
          } catch (e) {
            setError((e as Error).message)
          }
        },
      },
    ])
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {error ? <ErrorBanner message={error} /> : null}

          {!isNew ? (
            <View style={s.panel}>
              <Text style={s.panelTitle}>Opening message</Text>
              <Text style={s.msg} selectable>{msg}</Text>
              <TouchableOpacity style={s.pill} onPress={() => Share.share({ message: msg }).catch(() => {})}>
                <Ionicons name="share-outline" size={14} color={colors.navy} />
                <Text style={s.pillText}>Share</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isNew ? (
            <View style={s.panel}>
              <Text style={s.panelTitle}>Parcels to pitch</Text>
              {matches.length === 0 ? (
                <Text style={s.muted}>No live listing matches yet. Fill in where they build, their land ticket (e.g. 5–25 acres) and what they build, and matches appear here.</Text>
              ) : (
                matches.map(({ l, reasons }) => {
                  const brief = `${l.code}: ${l.title}. ${l.extent_acres} acres, ${l.location}.${l.price_total_cr ? ` ₹${l.price_total_cr} Cr.` : ''} Legally verified; title work done in-house.`
                  return (
                    <View key={l.code} style={s.match}>
                      <Text style={s.matchTitle}>{l.code} · {l.extent_acres} acres</Text>
                      <Text style={s.muted}>{l.title}</Text>
                      <Text style={s.reason}>{reasons.join(' · ')}</Text>
                      <View style={s.row}>
                        <TouchableOpacity style={s.pill} onPress={() => Share.share({ message: brief }).catch(() => {})}>
                          <Ionicons name="share-outline" size={14} color={colors.navy} />
                          <Text style={s.pillText}>Share brief</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.pill} onPress={() => addToPipeline(l)} disabled={busy}>
                          <Ionicons name="add" size={14} color={colors.navy} />
                          <Text style={s.pillText}>Add to pipeline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })
              )}
              <TouchableOpacity style={[s.pill, { marginTop: 8 }]} onPress={() => addToPipeline()} disabled={busy}>
                <Ionicons name="add" size={14} color={colors.navy} />
                <Text style={s.pillText}>Add to pipeline without a parcel</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Chips label="List" options={LIST_KEYS.map((k) => LISTS[k].one)} value={LISTS[d.list].one} onChange={(v) => set('list', LIST_KEYS.find((k) => LISTS[k].one === v) ?? 'B')} />
          {str('name', 'Company / name')}
          {str('contact_person', 'Decision-maker (name, role)')}
          <Chips label="Stage" options={STAGES} value={STAGES[d.stage]} onChange={(v) => set('stage', STAGES.indexOf(v))} />
          <DateChips label="Next action date" value={d.next_date} onChange={(v) => set('next_date', v)} hint="No date means it is not in the funnel." />
          <TextField
            label="Score (0–100)"
            value={d.score == null ? '' : String(d.score)}
            keyboard="numeric"
            hint={`Fit 40 · trigger 35 · contactability 25.${d.score != null ? ` Priority ${prioFromScore(d.score)}.` : ''}`}
            onChange={(v) => {
              const n = v.trim() === '' ? null : Math.max(0, Math.min(100, Number(v.replace(/\D/g, '')) || 0))
              setD((x) => (x ? { ...x, score: n, prio: n == null ? x.prio : prioFromScore(n) } : x))
            }}
          />
          <Chips label="Priority" options={['A', 'B', 'C'] as const} value={d.prio ?? ''} onChange={(v) => set('prio', v)} />
          {str('area', 'Areas they develop in')}
          {str('requirement', 'Requirement (size, place, budget)', { multiline: true })}
          {str('deal_band', 'Typical land ticket', { hint: 'e.g. 5–25 acres' })}
          {str('trigger_why', 'Why they should buy now', { multiline: true })}
          {str('kind', 'Kind')}
          {str('sector', 'Sector')}
          {str('phone', 'Phone', { keyboard: 'phone-pad' })}
          {str('email', 'Email', { keyboard: 'email-address' })}
          {str('alt_emails', 'Other emails', { keyboard: 'email-address' })}
          {str('website', 'Website', { keyboard: 'url' })}
          <Chips label="Source" options={SOURCES} value={(d.source as (typeof SOURCES)[number]) || ''} onChange={(v) => set('source', v)} />
          {str('source_url', 'Source link', { keyboard: 'url' })}
          <TextField label="Deal value (₹)" value={d.value == null ? '' : String(d.value)} keyboard="numeric" hint="Excluding commission." onChange={(v) => set('value', v.trim() === '' ? null : Number(v.replace(/\D/g, '')) || 0)} />
          {str('owner', 'Owner')}
          {str('history', 'Previous contact', { multiline: true })}
          {str('note', 'Notes', { multiline: true })}

          <Field label="">
            <Button label={isNew ? 'Add prospect' : 'Save'} onPress={save} busy={busy} disabled={!d.name.trim()} />
          </Field>
          {!isNew ? <Button label="Delete" tone="danger" onPress={confirmDelete} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const s = StyleSheet.create({
  body: { padding: space.md, paddingBottom: 80 },
  panel: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.md },
  panelTitle: { fontSize: text.md, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  msg: { fontSize: text.sm, color: colors.ink2, lineHeight: 20, marginBottom: 8 },
  muted: { fontSize: text.sm, color: colors.muted },
  match: { borderTopWidth: 1, borderTopColor: colors.line2, paddingTop: 8, marginTop: 8 },
  matchTitle: { fontSize: text.base, fontWeight: '800', color: colors.ink },
  reason: { fontSize: text.xs, color: colors.goldDeep, marginTop: 2, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.line, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.paper },
  pillText: { fontSize: text.xs, fontWeight: '700', color: colors.navy },
})
