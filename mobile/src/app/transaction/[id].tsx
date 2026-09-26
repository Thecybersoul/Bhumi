import { useCallback, useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, SectionTitle, TextField, ToggleRow } from '@/components/form'
import { DocumentsPanel } from '@/components/documents'
import { ActivityFeed } from '@/components/activity'
import { ByLine } from '@/components/people'
import { RelatedMeetings } from '@/components/relatedMeetings'
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

  const [losing, setLosing] = useState(false)
  const [lostReason, setLostReason] = useState('')


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

  // Alert.prompt is iOS-only, so the reason is asked for inline.
  async function markLost() {
    const reason = lostReason.trim()
    await patch({ mark_lost: true, lost_reason: reason }, { outcome: 'Lost', lost_reason: reason })
    setLosing(false)
    setLostReason('')
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
            <ByLine record={t} createdAt={t.opened_at} />
            <SectionTitle>Stage</SectionTitle>
            <Chips label="" options={STAGES} value={t.stage} onChange={(stage) => patch({ stage }, { stage, outcome: stage === 'Closed' ? 'Closed' : 'In progress' })} />
            {t.outcome === 'Lost' ? (
              <>
                <Text style={s.lost}>Lost{t.lost_reason ? `: ${t.lost_reason}` : ''}</Text>
                <Button label="Reopen deal" tone="ghost" onPress={() => patch({ reopen: true }, { outcome: 'In progress', lost_reason: '' })} />
              </>
            ) : t.outcome === 'In progress' ? (
              losing ? (
                <View>
                  <TextField label="Why was it lost?" value={lostReason} onChange={setLostReason} placeholder="Buyer went with another parcel, price gap…" />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}><Button label="Cancel" tone="ghost" onPress={() => setLosing(false)} /></View>
                    <View style={{ flex: 1 }}><Button label="Mark lost" tone="danger" onPress={markLost} /></View>
                  </View>
                </View>
              ) : (
                <Button label="Mark as lost" tone="danger" onPress={() => setLosing(true)} />
              )
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
            <SectionTitle>Meetings & calls</SectionTitle>
            <RelatedMeetings entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
          </Card>
        )}

        {t && (
          <Card>
            <SectionTitle>Documents</SectionTitle>
            <DocumentsPanel entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
          </Card>
        )}

        {t && (
          <Card>
            <SectionTitle>History</SectionTitle>
            <ActivityFeed entityType="transaction" entityId={t.id} emptyText="No changes recorded yet." />
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
