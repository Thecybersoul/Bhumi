import { useEffect, useState } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { useApi } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, Field, TextField } from '@/components/form'
import { DateChips } from '@/components/crmDate'
import { DEAL_TYPES, rupees, type CrmDeal, type Parcel } from '@/lib/crm'

const PIPE: [number, string][] = [[2, 'Interested'], [3, 'Proposal'], [4, 'Won'], [5, 'Lost']]
const blankDeal = (): CrmDeal => ({ id: '', name: '', value: 0, commission: 0, stage: 2, parcel: '', property_code: '', deal_type: '', prospect_id: null, expected_close: null, note: '', next_date: null, updated_at: '' })

/* A pipeline deal. Commission is entered per deal, as an amount or
   worked out from a %, because it is agreed for each property. */
export default function DealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === 'new'
  const api = useApi()
  const nav = useNavigation()
  const [d, setD] = useState<CrmDeal | null>(isNew ? blankDeal() : null)
  const [listings, setListings] = useState<Parcel[]>([])
  const [pct, setPct] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isNew)
      api
        .get<{ data: CrmDeal[] }>('/api/crm/deals')
        .then((r) => {
          const x = r.data.find((y) => y.id === id)
          if (x) setD(x)
          else setError('This deal no longer exists.')
        })
        .catch((e) => setError((e as Error).message))
    api
      .get<{ data: Parcel[]; source?: string }>('/api/properties?admin=1')
      .then((r) => r.source === 'live' && setListings(r.data))
      .catch(() => {})
  }, [api, id, isNew])

  useEffect(() => {
    nav.setOptions({ title: isNew ? 'Add a deal' : d?.name || 'Deal' })
  }, [nav, isNew, d?.name])

  if (!d) return error ? <Screen><ErrorBanner message={error} /></Screen> : <LoadingScreen />
  const set = <K extends keyof CrmDeal>(k: K, v: CrmDeal[K]) => setD((x) => (x ? { ...x, [k]: v } : x))
  const num = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0

  async function save() {
    if (!d || !d.name.trim()) return setError('A name is required.')
    setBusy(true)
    setError(null)
    try {
      if (isNew) await api.post('/api/crm/deals', d)
      else await api.patch(`/api/crm/deals?id=${d.id}`, d)
      router.back()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function confirmDelete() {
    Alert.alert('Delete deal?', d?.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/crm/deals?id=${d?.id}`)
            router.back()
          } catch (e) {
            setError((e as Error).message)
          }
        },
      },
    ])
  }

  const listingCodes = listings.map((l) => l.code)
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {error ? <ErrorBanner message={error} /> : null}
          <TextField label="Company / deal name" value={d.name} onChange={(v) => set('name', v)} />
          <Chips label="Stage" options={PIPE.map(([, l]) => l)} value={PIPE.find(([n]) => n === d.stage)?.[1] ?? ''} onChange={(v) => set('stage', PIPE.find(([, l]) => l === v)?.[0] ?? 2)} />
          <TextField label="Parcel or property" value={d.parcel} onChange={(v) => set('parcel', v)} multiline />
          {listingCodes.length ? (
            <Chips
              label="Listing (from the ERP)"
              options={['None', ...listingCodes]}
              value={d.property_code || 'None'}
              onChange={(v) => {
                const l = listings.find((x) => x.code === v)
                setD((x) => (x ? { ...x, property_code: l ? l.code : '', parcel: l && !x.parcel ? `${l.code}: ${l.title}` : x.parcel } : x))
              }}
            />
          ) : null}
          <Chips label="Structure" options={DEAL_TYPES} value={d.deal_type} onChange={(v) => set('deal_type', v)} />
          <TextField label="Deal value (₹)" value={d.value ? String(d.value) : ''} keyboard="numeric" hint={d.value ? rupees(d.value) : undefined} onChange={(v) => set('value', num(v))} />
          <TextField
            label="Commission (₹)"
            value={d.commission ? String(d.commission) : ''}
            keyboard="numeric"
            hint={d.commission ? `${rupees(d.commission)}${d.value ? ` · ${Math.round((d.commission / d.value) * 10000) / 100}% of the deal value` : ''}` : 'Agreed for this property. Leave empty until it is agreed.'}
            onChange={(v) => set('commission', num(v))}
          />
          <TextField
            label="Or work it out from a %"
            value={pct}
            keyboard="numeric"
            placeholder="e.g. 1.5"
            hint={d.value ? 'Fills the commission above from the deal value.' : 'Enter the deal value first.'}
            onChange={(v) => {
              setPct(v)
              const p = Number(v.replace(',', '.'))
              if (d.value && p > 0) set('commission', Math.round((d.value * p) / 100))
            }}
          />
          <DateChips label="Next step date" value={d.next_date} onChange={(v) => set('next_date', v)} />
          <DateChips label="Expected close" value={d.expected_close} onChange={(v) => set('expected_close', v)} />
          <TextField label="Notes" value={d.note} onChange={(v) => set('note', v)} multiline />
          <Field label="">
            <Button label={isNew ? 'Add deal' : 'Save'} onPress={save} busy={busy} disabled={!d.name.trim()} />
          </Field>
          {!isNew ? <Button label="Delete" tone="danger" onPress={confirmDelete} /> : null}
          <Text style={s.fine}>Weighted forecast counts Interested at 30% and Proposal at 60%.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const s = StyleSheet.create({
  body: { padding: space.md, paddingBottom: 80 },
  fine: { fontSize: text.xs, color: colors.muted, marginTop: space.md },
})
