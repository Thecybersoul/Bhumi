import { useCallback, useEffect, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import { budget, CONTACT_ROLES, stageLabel, TYPE_LABEL, waUrl } from '@/lib/leads'
import { AGENT_SPECIALTIES, AGENT_STATUSES, agentShareLakh, lakh, type DealMoney, type Involvement } from '@/lib/agents'
import { uploadDocument, type PickedFile } from '@/lib/documents'
import type { Contact, Lead, Property } from '@/lib/types'
import { Badge, Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, SectionTitle, TextField } from '@/components/form'
import { DocumentsPanel } from '@/components/documents'
import { ActivityFeed } from '@/components/activity'
import { ByLine, timeAgo } from '@/components/people'
import { RelatedMeetings } from '@/components/relatedMeetings'
import { ActionBtn, ContactActions } from '@/components/contacts'
import { listingMessage, PendingFiles, RelatedTasks } from '@/components/leadPanels'
import { EntityPicker, LINK_ICON } from '@/components/entityPicker'
import { InvolvementRow, Stars } from '@/components/agents'
import Ionicons from '@expo/vector-icons/Ionicons'

interface Deal {
  id: string
  reference: string
  property_label: string
  stage: string
  outcome: string
  side: string
}
type LinkRow = Omit<Involvement, 'contact'> & { created_at: string }
const KIND: Record<string, string> = { property: 'Listing', transaction: 'Deal', lead: 'Lead' }

function openRecord(type: string, id: string) {
  if (type === 'property') router.push({ pathname: '/property/[id]', params: { id } })
  else if (type === 'transaction') router.push({ pathname: '/transaction/[id]', params: { id } })
  else if (type === 'meeting') router.push({ pathname: '/meeting/[id]', params: { id } })
  else if (type === 'lead') router.push({ pathname: '/lead/[id]', params: { id } })
  else router.push('/notes-tasks')
}

export default function ContactScreen() {
  const { id, agent } = useLocalSearchParams<{ id: string; agent?: string }>()
  const isNew = id === 'new'
  const api = useApi()

  const [c, setC] = useState<Contact | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dup, setDup] = useState<Contact | null>(null)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [roles, setRoles] = useState<string[]>(isNew && agent === '1' ? ['Agent'] : [])
  const [money, setMoney] = useState<Record<string, DealMoney>>({})
  const [sharing, setSharing] = useState(false)
  // Agent profile (migration 016)
  const [agency, setAgency] = useState('')
  const [rera, setRera] = useState('')
  const [areas, setAreas] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [share, setShare] = useState('')
  const [agentStatus, setAgentStatus] = useState('Active')
  const [rating, setRating] = useState<number | null>(null)
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')
  const [city, setCity] = useState('')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<PickedFile[]>([])
  const [fileCat, setFileCat] = useState('KYC')

  const reload = useCallback(async () => {
    const r = await api.get<{ data: Contact; leads: Lead[]; deals: Deal[]; links: LinkRow[]; deal_money?: Record<string, DealMoney> }>(`/api/contacts/${id}`)
    setC(r.data)
    setMoney(r.deal_money ?? {})
    setAgency(r.data.agency ?? '')
    setRera(r.data.rera_number ?? '')
    setAreas(r.data.operating_areas ?? '')
    setSpecialties(r.data.specialties ?? [])
    setShare(r.data.default_share_pct != null ? String(r.data.default_share_pct) : '')
    setAgentStatus(r.data.agent_status ?? 'Active')
    setRating(r.data.rating ?? null)
    setGstin(r.data.gstin ?? '')
    setPan(r.data.pan ?? '')
    setLeads(r.leads)
    setDeals(r.deals)
    setLinks(r.links)
    setName(r.data.name)
    setPhone(r.data.phone ?? '')
    setAltPhone(r.data.alt_phone ?? '')
    setEmail(r.data.email ?? '')
    setCompany(r.data.company ?? '')
    setRoles(r.data.roles ?? [])
    setCity(r.data.city ?? '')
    setSource(r.data.source ?? '')
    setNotes(r.data.notes ?? '')
  }, [api, id])

  useEffect(() => {
    if (isNew) return
    reload()
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the contact'))
      .finally(() => setLoading(false))
  }, [isNew, reload])

  async function save(force = false) {
    if (!name.trim()) return setError('A contact needs a name')
    setBusy(true)
    setError(null)
    setDup(null)
    const isAgentNow = roles.includes('Agent')
    const body = {
      name: name.trim(), phone: phone.trim(), alt_phone: altPhone.trim(), email: email.trim(), company: company.trim(), roles, city: city.trim(), source: source.trim(), notes: notes.trim(), force,
      // Only sent for agents, so a plain contact still saves on a database without migration 016.
      ...(isAgentNow
        ? { agency: agency.trim(), rera_number: rera.trim(), operating_areas: areas.trim(), specialties, default_share_pct: share.trim() === '' ? null : Number(share), agent_status: agentStatus, rating, gstin: gstin.trim(), pan: pan.trim() }
        : {}),
    }
    try {
      if (isNew) {
        const r = await api.post<{ id?: string }>('/api/contacts', body)
        if (r.id) {
          for (const f of files) await uploadDocument(api, f, { entity_type: 'contact', entity_id: r.id, entity_label: name.trim(), category: fileCat })
          router.replace({ pathname: '/contact/[id]', params: { id: r.id } })
        } else router.back()
        return
      }
      await api.put(`/api/contacts/${id}`, body)
      await reload()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.body.duplicate) setDup(e.body.duplicate as Contact)
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function remove() {
    if (!c) return
    Alert.alert(`Delete ${c.name}?`, 'Their leads and deals stay, unlinked.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.del(`/api/contacts/${c.id}`)
          router.back()
        },
      },
    ])
  }

  if (loading) return <LoadingScreen />
  if (!isNew && !c) return <ErrorBanner message={error ?? 'Contact not found'} />

  return (
    <Screen>
      <Stack.Screen options={{ title: isNew ? (roles.includes('Agent') ? 'New agent' : 'New contact') : c?.name ?? 'Contact' }} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {error ? <ErrorBanner message={error} /> : null}
        {dup ? (
          <View style={[s.row, { marginBottom: space.md }]}>
            <ActionBtn icon="person" label={`Open ${dup.name.split(' ')[0]}`} tone="primary" onPress={() => router.replace({ pathname: '/contact/[id]', params: { id: dup.id } })} />
            <ActionBtn icon="person-add-outline" label="Save anyway" onPress={() => save(true)} />
          </View>
        ) : null}
        {saved ? <Text style={s.saved}>Saved. Their details on open leads and deals were updated too.</Text> : null}

        {c ? (
          <Card>
            <View style={s.badges}>
              {(c.roles ?? []).map((r) => (
                <Badge key={r} label={r} tone="progress" />
              ))}
            </View>
            {c.agency || c.company || c.city ? <Text style={s.meta}>{[c.agency, c.company, c.city].filter(Boolean).join(' · ')}</Text> : null}
            {c.roles?.includes('Agent') && (c.rating || c.operating_areas) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {c.rating ? <Stars n={c.rating} size={12} /> : null}
                {c.operating_areas ? <Text style={[s.meta, { marginTop: 0, flex: 1 }]} numberOfLines={1}>Works {c.operating_areas}</Text> : null}
              </View>
            ) : null}
            <ByLine record={c} createdAt={c.created_at} />
            <View style={{ marginTop: space.sm }}>
              <ContactActions name={c.name} phone={c.phone} email={c.email} />
            </View>
            {c.alt_phone ? (
              <View style={{ marginTop: 8 }}>
                <ContactActions name={c.name} phone={c.alt_phone} />
              </View>
            ) : null}
          </Card>
        ) : null}

        {c ? (
          <Card>
            <SectionTitle>Documents</SectionTitle>
            <DocumentsPanel entityType="contact" entityId={c.id} entityLabel={c.name} />
          </Card>
        ) : null}

        {c ? (
          <Card>
            <SectionTitle>Leads</SectionTitle>
            {leads.length === 0 ? <Text style={s.empty}>No leads for {c.name.split(' ')[0]} yet.</Text> : null}
            {leads.map((l) => (
              <TouchableOpacity key={l.id} style={s.item} onPress={() => router.push({ pathname: '/lead/[id]', params: { id: l.id } })}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{l.intent ?? 'Buy'} · {[TYPE_LABEL[l.property_type ?? ''], l.locations].filter(Boolean).join(', ') || l.kind}</Text>
                  <Text style={s.meta}>{[budget(l.budget_min_cr, l.budget_max_cr), timeAgo(l.created_at)].filter(Boolean).join(' · ')}</Text>
                </View>
                <Badge label={stageLabel(l.stage)} tone={l.stage === 'Visit' ? 'progress' : l.stage.toLowerCase()} />
              </TouchableOpacity>
            ))}
            <View style={{ marginTop: space.sm }}>
              <Button label={`Start a lead for ${c.name.split(' ')[0]}`} tone="ghost" onPress={() => router.push({ pathname: '/lead/[id]', params: { id: 'new', contact: c.id } })} />
            </View>
          </Card>
        ) : null}

        {c && deals.length ? (
          <Card>
            <SectionTitle>Deals</SectionTitle>
            {deals.map((d) => (
              <TouchableOpacity key={d.id} style={s.item} onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: d.id } })}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{d.property_label}</Text>
                  <Text style={s.meta}>{d.reference} · {d.side}</Text>
                </View>
                <Badge label={d.outcome === 'In progress' ? d.stage : d.outcome} tone={d.outcome === 'In progress' ? 'progress' : d.outcome.toLowerCase()} />
              </TouchableOpacity>
            ))}
          </Card>
        ) : null}

        {c && roles.includes('Agent') ? (
          <Card>
            <SectionTitle>Work & commissions</SectionTitle>
            {(() => {
              const work = links.filter((l) => ['property', 'transaction', 'lead'].includes(l.entity_type))
              const onDeals = work.filter((l) => l.entity_type === 'transaction' && l.share_type && l.share_type !== 'Paid by their client')
              const amount = (l: LinkRow) => l.payout_amount_lakh ?? (money[l.entity_id] ? agentShareLakh(l, money[l.entity_id]) : null) ?? 0
              const paid = onDeals.filter((l) => l.payout_status === 'Paid').reduce((x, l) => x + amount(l), 0)
              const owed = onDeals.filter((l) => l.payout_status === 'Due' || l.payout_status === 'Invoiced').reduce((x, l) => x + amount(l), 0)
              const pipeline = onDeals.filter((l) => !l.payout_status || l.payout_status === 'Not due').reduce((x, l) => x + amount(l), 0)
              return (
                <>
                  <View style={s.totals}>
                    <View style={s.total}>
                      <Text style={s.totalLabel}>Paid</Text>
                      <Text style={s.totalValue}>{lakh(paid)}</Text>
                    </View>
                    <View style={s.total}>
                      <Text style={s.totalLabel}>Owed now</Text>
                      <Text style={[s.totalValue, owed > 0 && { color: colors.pending }]}>{lakh(owed)}</Text>
                    </View>
                    <View style={s.total}>
                      <Text style={s.totalLabel}>Open deals</Text>
                      <Text style={s.totalValue}>{lakh(pipeline)}</Text>
                    </View>
                  </View>
                  {work.length === 0 ? <Text style={s.empty}>Not on any listing, deal or lead yet. Add them from the record’s Agents card.</Text> : null}
                  {work.map((l) => (
                    <InvolvementRow
                      key={l.id}
                      r={{ ...l, contact: null }}
                      deal={money[l.entity_id] ?? null}
                      record={{ kind: KIND[l.entity_type] ?? l.entity_type, label: l.entity_label, onOpen: () => openRecord(l.entity_type, l.entity_id) }}
                      onChange={reload}
                    />
                  ))}
                  {c.phone ? (
                    sharing ? (
                      <View style={{ marginTop: space.sm }}>
                        <EntityPicker
                          value={{ entity_type: 'general', entity_id: null, entity_label: '' }}
                          types={['property']}
                          label="Listing to share with them"
                          onChange={async (v) => {
                            if (!v.entity_id) return
                            const all = await api.get<{ data: Property[] }>('/api/properties?admin=1')
                            const p = all.data.find((x) => x.id === v.entity_id)
                            if (p) Linking.openURL(waUrl(c.phone, listingMessage(c.name, p).replace("that fits what you're looking for", 'for your buyers')))
                            // Remember who has it: tagged as a co-broker on the listing.
                            await api.post('/api/contact-links', { contact_id: c.id, entity_type: 'property', entity_id: v.entity_id, entity_label: v.entity_label, role: 'Co-broker' }).catch(() => {})
                            setSharing(false)
                            reload()
                          }}
                        />
                      </View>
                    ) : (
                      <View style={{ marginTop: space.sm }}>
                        <Button label={`Share a listing with ${c.name.split(' ')[0]}`} tone="ghost" onPress={() => setSharing(true)} />
                      </View>
                    )
                  ) : null}
                </>
              )
            })()}
          </Card>
        ) : null}

        {c && links.some((l) => !roles.includes('Agent') || !['property', 'transaction', 'lead'].includes(l.entity_type)) ? (
          <Card>
            <SectionTitle>Tagged on</SectionTitle>
            {links.filter((l) => !roles.includes('Agent') || !['property', 'transaction', 'lead'].includes(l.entity_type)).map((l) => (
              <TouchableOpacity key={l.id} style={s.item} onPress={() => openRecord(l.entity_type, l.entity_id)}>
                <Ionicons name={LINK_ICON[l.entity_type] ?? 'link-outline'} size={16} color={colors.goldDeep} />
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{l.entity_label}</Text>
                  <Text style={s.meta}>{[l.role, timeAgo(l.created_at)].filter(Boolean).join(' · ')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        ) : null}

        {c ? (
          <Card>
            <SectionTitle>Follow-ups</SectionTitle>
            <RelatedTasks entityType="contact" entityId={c.id} entityLabel={c.name} suggest={`Call ${c.name.split(' ')[0]}`} />
          </Card>
        ) : null}

        <Card>
          <SectionTitle>Details</SectionTitle>
          <TextField label="Name" value={name} onChange={setName} />
          <TextField label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" placeholder="98450 12345" />
          <TextField label="Other phone" value={altPhone} onChange={setAltPhone} keyboard="phone-pad" />
          <TextField label="Email" value={email} onChange={setEmail} keyboard="email-address" />
          <TextField label="Company" value={company} onChange={setCompany} />
          <Text style={s.label}>Roles</Text>
          <View style={s.chips}>
            {CONTACT_ROLES.map((r) => (
              <TouchableOpacity key={r} style={[s.chip, roles.includes(r) && s.chipOn]} onPress={() => setRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}>
                <Text style={[s.chipText, roles.includes(r) && { color: colors.white }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {roles.includes('Agent') ? (
            <View style={s.agentBox}>
              <Text style={[s.label, { color: colors.goldDeep }]}>Agent profile</Text>
              <TextField label="Agency / firm" value={agency} onChange={setAgency} />
              <TextField label="Areas they cover" value={areas} onChange={setAreas} placeholder="Devanahalli, Hoskote, Budigere" />
              <Text style={s.label}>Property types</Text>
              <View style={s.chips}>
                {AGENT_SPECIALTIES.map((t) => (
                  <TouchableOpacity key={t} style={[s.chip, specialties.includes(t) && s.chipOn]} onPress={() => setSpecialties((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}>
                    <Text style={[s.chipText, specialties.includes(t) && { color: colors.white }]}>{TYPE_LABEL[t] ?? t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextField label="Usual share (% of our commission)" value={share} onChange={setShare} keyboard="numeric" placeholder="25" />
              <Text style={s.label}>Status</Text>
              <View style={s.chips}>
                {AGENT_STATUSES.map((x) => (
                  <TouchableOpacity key={x} style={[s.chip, agentStatus === x && s.chipOn]} onPress={() => setAgentStatus(x)}>
                    <Text style={[s.chipText, agentStatus === x && { color: colors.white }]}>{x}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.label}>Rating</Text>
              <View style={{ marginBottom: space.md }}>
                <Stars n={rating} onChange={setRating} size={24} />
              </View>
              <TextField label="RERA agent registration no." value={rera} onChange={setRera} />
              <TextField label="GSTIN" value={gstin} onChange={setGstin} />
              <TextField label="PAN" value={pan} onChange={setPan} />
            </View>
          ) : null}
          <TextField label="City / area" value={city} onChange={setCity} />
          <TextField label="How we know them" value={source} onChange={setSource} placeholder="Referred by…, walk-in, website" />
          <TextField label="Notes" value={notes} onChange={setNotes} multiline />
        </Card>

        {isNew ? (
          <Card>
            <SectionTitle>Documents</SectionTitle>
            <PendingFiles files={files} onChange={setFiles} entityType="contact" category={fileCat} onCategory={setFileCat} />
          </Card>
        ) : null}

        <Button label={isNew ? 'Save contact' : 'Save changes'} onPress={() => save()} busy={busy} />

        {c ? (
          <>
            <Card style={{ marginTop: space.lg }}>
              <SectionTitle>Meetings</SectionTitle>
              <RelatedMeetings entityType="contact" entityId={c.id} entityLabel={c.name} />
            </Card>
            <Card>
              <SectionTitle>History</SectionTitle>
              <ActivityFeed entityType="contact" entityId={c.id} emptyText="No changes recorded yet." />
            </Card>
            <View style={{ marginTop: space.lg }}>
              <Button label="Delete contact" tone="danger" onPress={remove} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  saved: { color: colors.verified, fontWeight: '700', marginBottom: space.sm },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  meta: { fontSize: text.xs, color: colors.muted, marginTop: 4 },
  empty: { fontSize: text.sm, color: colors.muted, paddingVertical: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  title: { fontSize: text.base, fontWeight: '700', color: colors.navy },
  label: { fontSize: text.sm, fontWeight: '700', color: colors.ink2, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.lg * 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: text.sm, fontWeight: '600', color: colors.ink2 },
  agentBox: { borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.goldTint, borderRadius: radius.base, padding: space.md, marginBottom: space.md },
  totals: { flexDirection: 'row', gap: 8, marginBottom: space.sm },
  total: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: 10 },
  totalLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4, color: colors.muted, textTransform: 'uppercase' },
  totalValue: { fontSize: text.lg, fontWeight: '800', color: colors.navy, marginTop: 2 },
})
