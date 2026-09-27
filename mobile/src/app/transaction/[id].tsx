import { useCallback, useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, SectionTitle, TextField, ToggleRow } from '@/components/form'
import { DocumentsPanel } from '@/components/documents'
import { ActivityFeed } from '@/components/activity'
import { ByLine } from '@/components/people'
import { RelatedMeetings } from '@/components/relatedMeetings'
import { EmailButton, EmailLog, MeetNowButton } from '@/components/google'
import { ContactPickerSheet, PeoplePanel } from '@/components/contacts'
import { PendingFiles, RelatedTasks } from '@/components/leadPanels'
import { uploadDocument, type PickedFile } from '@/lib/documents'
import type { ApiResult, CommissionType, PropertyTransaction, Representing, TransactionStage } from '@/lib/types'

const STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
const REPRESENTING: Representing[] = ['Buyer', 'Seller', 'Both']
const COMMISSION: CommissionType[] = ['Percentage', 'Flat']

function dealEmail(t: PropertyTransaction, who: 'buyer' | 'seller') {
  const name = (who === 'buyer' ? t.buyer_name : t.seller_name) || ''
  return {
    to: (who === 'buyer' ? t.buyer_email : t.seller_email) || '',
    subject: `${t.property_label} — next steps | Bhumi Estates`,
    body: [
      `Dear ${name ? name.split(' ')[0] : 'Sir / Madam'},`,
      `Following up on ${t.property_label}. We are now at the ${t.stage.toLowerCase()} stage.`,
      'Next steps:\n• \n• ',
      'Warm regards,',
    ].join('\n\n'),
    entity_type: 'transaction',
    entity_id: t.id,
    entity_label: `${t.reference} · ${t.property_label}`,
  }
}

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
  const [buyerEmail, setBuyerEmail] = useState('')
  const [seller, setSeller] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [representing, setRepresenting] = useState<Representing>('Both')
  const [value, setValue] = useState('')
  const [ctype, setCtype] = useState<CommissionType>('Percentage')
  const [cvalue, setCvalue] = useState('')
  const [advisor, setAdvisor] = useState('')
  const [notes, setNotes] = useState('')

  const [losing, setLosing] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [party, setParty] = useState<{ buyer: string | null; seller: string | null }>({ buyer: null, seller: null })
  const [picking, setPicking] = useState<'buyer' | 'seller' | null>(null)
  const [files, setFiles] = useState<PickedFile[]>([])
  const [fileCat, setFileCat] = useState('Agreement')


  const hydrate = useCallback((x: PropertyTransaction) => {
    setT(x)
    setLabel(x.property_label)
    setBuyer(x.buyer_name)
    setBuyerPhone(x.buyer_phone ?? '')
    setBuyerEmail(x.buyer_email ?? '')
    setSeller(x.seller_name)
    setSellerPhone(x.seller_phone ?? '')
    setSellerEmail(x.seller_email ?? '')
    setRepresenting(x.representing)
    setValue(x.deal_value_cr != null ? String(x.deal_value_cr) : '')
    setCtype(x.commission_type)
    setCvalue(x.commission_value != null ? String(x.commission_value) : '')
    setAdvisor(x.advisor ?? '')
    setNotes(x.notes ?? '')
    setParty({ buyer: x.buyer_contact_id ?? null, seller: x.seller_contact_id ?? null })
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
      buyer_email: buyerEmail.trim(),
      seller_name: seller.trim(),
      seller_phone: sellerPhone.trim(),
      seller_email: sellerEmail.trim(),
      representing,
      deal_value_cr: value.trim() === '' ? null : Number(value),
      commission_type: ctype,
      commission_value: cvalue.trim() === '' ? null : Number(cvalue),
      advisor: advisor.trim(),
      notes: notes.trim(),
      // Picked from contacts: sent as-is. Typed: matched by phone on the server.
      ...(party.buyer ? { buyer_contact_id: party.buyer } : {}),
      ...(party.seller ? { seller_contact_id: party.seller } : {}),
    }
    try {
      if (isNew) {
        const r = await api.post<{ id?: string; reference?: string }>('/api/transactions', body)
        if (r.id) {
          for (const f of files) await uploadDocument(api, f, { entity_type: 'transaction', entity_id: r.id, entity_label: `${r.reference ?? ''} · ${label.trim()}`, category: fileCat })
          // Straight into the new deal, where its documents and people live.
          router.replace({ pathname: '/transaction/[id]', params: { id: r.id } })
          return
        }
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

        {t?.lead_id ? (
          <TouchableOpacity style={s.fromLead} onPress={() => router.push({ pathname: '/lead/[id]', params: { id: t.lead_id! } })}>
            <Text style={s.fromLeadText}>Came from a lead — open it and the listings shown →</Text>
          </TouchableOpacity>
        ) : null}

        {t && (
          <Card>
            <SectionTitle>Documents</SectionTitle>
            <DocumentsPanel entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
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
          <PartyLink side="buyer" id={party.buyer} onPick={() => setPicking('buyer')} />
          <TextField label="Buyer" value={buyer} onChange={(v) => (setBuyer(v), setParty((p) => ({ ...p, buyer: null })))} />
          <TextField label="Buyer phone" value={buyerPhone} onChange={(v) => (setBuyerPhone(v), setParty((p) => ({ ...p, buyer: null })))} keyboard="phone-pad" />
          <TextField label="Buyer email" value={buyerEmail} onChange={setBuyerEmail} keyboard="email-address" />
          <PartyLink side="seller" id={party.seller} onPick={() => setPicking('seller')} />
          <TextField label="Seller" value={seller} onChange={(v) => (setSeller(v), setParty((p) => ({ ...p, seller: null })))} />
          <TextField label="Seller phone" value={sellerPhone} onChange={(v) => (setSellerPhone(v), setParty((p) => ({ ...p, seller: null })))} keyboard="phone-pad" />
          <TextField label="Seller email" value={sellerEmail} onChange={setSellerEmail} keyboard="email-address" />
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

        {isNew ? (
          <Card>
            <SectionTitle>Documents</SectionTitle>
            <PendingFiles files={files} onChange={setFiles} entityType="transaction" category={fileCat} onCategory={setFileCat} />
          </Card>
        ) : null}

        <Button label={isNew ? (files.length ? `Create deal + ${files.length} file${files.length > 1 ? 's' : ''}` : 'Create deal') : 'Save changes'} onPress={save} busy={busy} />

        {t && (
          <Card style={{ marginTop: space.lg }}>
            <SectionTitle>Meetings & calls</SectionTitle>
            <RelatedMeetings entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
          </Card>
        )}

        {t && (
          <Card>
            <SectionTitle>Contact</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <EmailButton compact label={t.buyer_name ? `Email ${t.buyer_name.split(' ')[0]}` : 'Email buyer'} draft={dealEmail(t, 'buyer')} />
              <EmailButton compact label={t.seller_name ? `Email ${t.seller_name.split(' ')[0]}` : 'Email seller'} draft={dealEmail(t, 'seller')} />
            </View>
            <View style={{ marginTop: 8 }}>
              <MeetNowButton entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} title={`Call · ${t.property_label}`} />
            </View>
            <View style={{ marginTop: space.sm }}>
              <EmailLog entityType="transaction" entityId={t.id} />
            </View>
          </Card>
        )}

        {t && (
          <Card>
            <SectionTitle>Follow-ups</SectionTitle>
            <RelatedTasks entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
          </Card>
        )}

        {t && (
          <Card>
            <SectionTitle>Also involved</SectionTitle>
            <PeoplePanel entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} roles={['Lawyer', 'Broker', 'Landowner', 'Surveyor', 'Investor', 'Other']} emptyText="Tag the lawyers, brokers or co-owners on this deal." />
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
      <ContactPickerSheet
        visible={picking !== null}
        onClose={() => setPicking(null)}
        defaultRole={picking === 'seller' ? 'Seller' : 'Buyer'}
        title={picking === 'seller' ? 'Who is selling?' : 'Who is buying?'}
        onPick={(c) => {
          if (picking === 'seller') {
            setSeller(c.name)
            setSellerPhone(c.phone ?? '')
            setSellerEmail(c.email ?? '')
            setParty((p) => ({ ...p, seller: c.id }))
          } else {
            setBuyer(c.name)
            setBuyerPhone(c.phone ?? '')
            setBuyerEmail(c.email ?? '')
            setParty((p) => ({ ...p, buyer: c.id }))
          }
        }}
      />
    </Screen>
  )
}

function PartyLink({ side, id, onPick }: { side: 'buyer' | 'seller'; id: string | null; onPick: () => void }) {
  return (
    <View style={s.party}>
      {id ? (
        <TouchableOpacity onPress={() => router.push({ pathname: '/contact/[id]', params: { id } })}>
          <Text style={s.partyLink}>{side === 'buyer' ? 'Buyer' : 'Seller'}’s contact card →</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity onPress={onPick}>
        <Text style={s.partyPick}>{id ? 'Change' : `Pick ${side} from contacts`}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  fromLead: { backgroundColor: colors.verifiedBg, borderRadius: 12, padding: space.md, marginBottom: space.md },
  fromLeadText: { color: colors.verified, fontWeight: '800', fontSize: text.sm },
  party: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  partyLink: { color: colors.goldDeep, fontWeight: '800', fontSize: text.sm },
  partyPick: { color: colors.navy, fontWeight: '800', fontSize: text.sm },
  ref: { fontSize: text.sm, color: colors.muted, fontWeight: '600' },
  lost: { color: colors.flagged, fontSize: text.base, fontWeight: '600', marginVertical: space.sm },
  muted: { fontSize: text.sm, color: colors.muted },
  meeting: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  mTitle: { fontSize: text.base, fontWeight: '700', color: colors.navy },
})
