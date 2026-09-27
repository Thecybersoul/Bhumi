import { useCallback, useEffect, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import { budget, CONTACT_ROLES, stageLabel, TYPE_LABEL } from '@/lib/leads'
import { uploadDocument, type PickedFile } from '@/lib/documents'
import type { Contact, Lead } from '@/lib/types'
import { Badge, Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, SectionTitle, TextField } from '@/components/form'
import { DocumentsPanel } from '@/components/documents'
import { ActivityFeed } from '@/components/activity'
import { ByLine, timeAgo } from '@/components/people'
import { RelatedMeetings } from '@/components/relatedMeetings'
import { ActionBtn, ContactActions } from '@/components/contacts'
import { PendingFiles, RelatedTasks } from '@/components/leadPanels'
import { LINK_ICON } from '@/components/entityPicker'
import Ionicons from '@expo/vector-icons/Ionicons'

interface Deal {
  id: string
  reference: string
  property_label: string
  stage: string
  outcome: string
  side: string
}
interface LinkRow {
  id: string
  entity_type: string
  entity_id: string
  entity_label: string
  role: string
  created_at: string
}

function openRecord(type: string, id: string) {
  if (type === 'property') router.push({ pathname: '/property/[id]', params: { id } })
  else if (type === 'transaction') router.push({ pathname: '/transaction/[id]', params: { id } })
  else if (type === 'meeting') router.push({ pathname: '/meeting/[id]', params: { id } })
  else if (type === 'lead') router.push({ pathname: '/lead/[id]', params: { id } })
  else router.push('/notes-tasks')
}

export default function ContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
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
  const [roles, setRoles] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<PickedFile[]>([])
  const [fileCat, setFileCat] = useState('KYC')

  const reload = useCallback(async () => {
    const r = await api.get<{ data: Contact; leads: Lead[]; deals: Deal[]; links: LinkRow[] }>(`/api/contacts/${id}`)
    setC(r.data)
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
    const body = { name: name.trim(), phone: phone.trim(), alt_phone: altPhone.trim(), email: email.trim(), company: company.trim(), roles, city: city.trim(), source: source.trim(), notes: notes.trim(), force }
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
      <Stack.Screen options={{ title: isNew ? 'New contact' : c?.name ?? 'Contact' }} />
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
            {c.company || c.city ? <Text style={s.meta}>{[c.company, c.city].filter(Boolean).join(' · ')}</Text> : null}
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

        {c && links.length ? (
          <Card>
            <SectionTitle>Tagged on</SectionTitle>
            {links.map((l) => (
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
})
