import { useCallback, useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, SectionTitle, TextField, ToggleRow } from '@/components/form'
import { WhenField } from '@/components/when'
import type { ApiResult, CommissionType, PropertyTransaction, Representing, TransactionStage } from '@/lib/types'

const STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
const REPRESENTING: Representing[] = ['Buyer', 'Seller', 'Both']
const COMMISSION: CommissionType[] = ['Percentage', 'Flat']

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === 'new'
  const api = useApi()

  const [t, setT] = useState<PropertyTransaction | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [label, setLabel] = useState('')
  const [buyer, setBuyer] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [seller, setSeller] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [representing, setRepresenting] = useState<Representing>('Both')
  const [value, setValue] = useState('')
  const [ctype, setCtype] = useState<CommissionType>('Percentage')
  const [cvalue, setCvalue] = useState('')
  const [advisor, setAdvisor] = useState('')
  const [notes, setNotes] = useState('')

  const [mTitle, setMTitle] = useState('')
  const [mWith, setMWith] = useState('')
  const [mWhen, setMWhen] = useState('')

  const hydrate = useCallback((x: PropertyTransaction) => {
    setT(x)
    setLabel(x.property_label)
    setBuyer(x.buyer_name)
    setBuyerPhone(x.buyer_phone ?? '')
    setSeller(x.seller_name)
    setSellerPhone(x.seller_phone ?? '')
    setRepresenting(x.representing)
    setValue(x.deal_value_cr != null ? String(x.deal_value_cr) : '')
    setCtype(x.commission_type)
    setCvalue(x.commission_value != null ? String(x.commission_value) : '')
    setAdvisor(x.advisor ?? '')
    setNotes(x.notes ?? '')
  }, [])

  useEffect(() => {
    if (isNew) return
    api
      .get<ApiResult<PropertyTransaction[]>>('/api/transactions')
      .then((r) => {
        const found = r.data.find((x) => x.id === id)
        if (found) hydrate(found)
        else setError('Transaction not found')
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load'))
      .finally(() => setLoading(false))
  }, [api, id, isNew, hydrate])

  const patch = useCallback(
    async (body: Record<string, unknown>, local?: Partial<PropertyTransaction>) => {
      if (!t) return
      setError(null)
      try {
        await api.put(`/api/transactions/${t.id}`, body)
        setT((p) => (p ? { ...p, ...(local ?? (body as Partial<PropertyTransaction>)) } : p))
      } catch (e) {
        setError((e as Error).message)
      }
    },
    [api, t]
  )

  async function save() {
    if (!label.trim()) return setError('Give the deal a label, e.g. the parcel or unit')
    setBusy(true)
    setError(null)
    const body = {
      property_label: label.trim(),
      buyer_name: buyer.trim(),
      buyer_phone: buyerPhone.trim(),
      seller_name: seller.trim(),
      seller_phone: sellerPhone.trim(),
      representing,
      deal_value_cr: value.trim() === '' ? null : Number(value),
      commission_type: ctype,
      commission_value: cvalue.trim() === '' ? null : Number(cvalue),
      advisor: advisor.trim(),
      notes: notes.trim(),
    }
    try {
      if (isNew) {
        await api.post('/api/transactions', body)
      } else if (t) {
        await api.put(`/api/transactions/${t.id}`, body)
      }
      router.back()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function markLost() {
    Alert.prompt?.('Mark as lost', 'Why was it lost?', (reason) => patch({ mark_lost: true, lost_reason: reason ?? '' }, { outcome: 'Lost', lost_reason: reason ?? '' }))
    if (!Alert.prompt) patch({ mark_lost: true, lost_reason: '' }, { outcome: 'Lost' })
  }

  async function addMeeting() {
    if (!t || !mTitle.trim() || !mWhen) return setError('A meeting needs a title and a date')
    const meeting = {
      id: `m-${Date.now()}`,
      title: mTitle.trim(),
      with: mWith.trim() || buyer || seller,
      scheduled_at: mWhen,
      status: 'Scheduled' as const,
    }
    await patch({ meetings: [...t.meetings, meeting] }, { meetings: [...t.meetings, meeting] })
    setMTitle('')
    setMWith('')
    setMWhen('')
  }

  async function cycleMeeting(mid: string) {
    if (!t) return
    const order = ['Scheduled', 'Completed', 'Cancelled'] as const
    const meetings = t.meetings.map((m) => (m.id === mid ? { ...m, status: order[(order.indexOf(m.status) + 1) % 3] } : m))
    await patch({ meetings }, { meetings })
  }

  async function remove() {
    if (!t) return
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.del(`/api/transactions/${t.id}`)
          router.back()
        },
      },
    ])
  }

  if (loading) return <LoadingScreen />

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {error && <ErrorBanner message={error} />}

        {t && (
          <Card>
            <Text style={s.ref}>{t.reference} · {t.outcome}</Text>
            <SectionTitle>Stage</SectionTitle>
            <Chips label="" options={STAGES} value={t.stage} onChange={(stage) => patch({ stage }, { stage, outcome: stage === 'Closed' ? 'Closed' : 'In progress' })} />
            {t.outcome === 'Lost' ? (
              <>
                <Text style={s.lost}>Lost{t.lost_reason ? `: ${t.lost_reason}` : ''}</Text>
                <Button label="Reopen deal" tone="ghost" onPress={() => patch({ reopen: true }, { outcome: 'In progress', lost_reason: '' })} />
              </>
            ) : t.outcome === 'In progress' ? (
              <Button label="Mark as lost" tone="danger" onPress={markLost} />
            ) : null}
          </Card>
        )}

        <Card>
          <SectionTitle>Deal</SectionTitle>
          <TextField label="Property / deal label" value={label} onChange={setLabel} placeholder="e.g. 3 BHK, JP Nagar" />
          <TextField label="Deal value (₹ crore)" value={value} onChange={setValue} keyboard="numeric" />
          <Chips label="Representing" options={REPRESENTING} value={representing} onChange={setRepresenting} />
          <TextField label="Advisor" value={advisor} onChange={setAdvisor} />
        </Card>

        <Card>
          <SectionTitle>Parties</SectionTitle>
          <TextField label="Buyer" value={buyer} onChange={setBuyer} />
          <TextField label="Buyer phone" value={buyerPhone} onChange={setBuyerPhone} keyboard="phone-pad" />
          <TextField label="Seller" value={seller} onChange={setSeller} />
          <TextField label="Seller phone" value={sellerPhone} onChange={setSellerPhone} keyboard="phone-pad" />
        </Card>

        <Card>
          <SectionTitle>Commission</SectionTitle>
          <Chips label="Type" options={COMMISSION} value={ctype} onChange={setCtype} />
          <TextField label={ctype === 'Percentage' ? 'Percent of deal value' : 'Flat fee (₹ lakh)'} value={cvalue} onChange={setCvalue} keyboard="numeric" />
          {t && <ToggleRow label="Commission collected" value={t.commission_collected} onChange={(v) => patch({ commission_collected: v })} />}
        </Card>

        <Card>
          <SectionTitle>Notes</SectionTitle>
          <TextField label="" value={notes} onChange={setNotes} multiline />
        </Card>

        <Button label={isNew ? 'Create transaction' : 'Save changes'} onPress={save} busy={busy} />

        {t && (
          <Card style={{ marginTop: space.lg }}>
            <SectionTitle>Meetings</SectionTitle>
            {t.meetings.length === 0 ? <Text style={s.muted}>None scheduled.</Text> : null}
            {t.meetings.map((m) => (
              <View key={m.id} style={s.meeting}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mTitle}>{m.title}</Text>
                  <Text style={s.muted}>{m.with} · {new Date(m.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Button label={m.status} tone="ghost" onPress={() => cycleMeeting(m.id)} />
              </View>
            ))}
            <SectionTitle>Add a meeting</SectionTitle>
            <TextField label="Title" value={mTitle} onChange={setMTitle} placeholder="Site visit, agreement signing…" />
            <TextField label="With" value={mWith} onChange={setMWith} />
            <WhenField label="When" value={mWhen} onChange={setMWhen} />
            <Button label="Add meeting" tone="ghost" onPress={addMeeting} />
          </Card>
        )}

        {t && (
          <View style={{ marginTop: space.lg }}>
            <Button label="Delete transaction" tone="danger" onPress={remove} />
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  ref: { fontSize: text.sm, color: colors.muted, fontWeight: '600' },
  lost: { color: colors.flagged, fontSize: text.base, fontWeight: '600', marginVertical: space.sm },
  muted: { fontSize: text.sm, color: colors.muted },
  meeting: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  mTitle: { fontSize: text.base, fontWeight: '700', color: colors.navy },
})
