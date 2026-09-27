import { useCallback, useEffect, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import {
  budget,
  followUpDue,
  inDays,
  isSelling,
  LEAD_CHANNELS,
  LEAD_INTENTS,
  LEAD_PIPELINE,
  LEAD_PRIORITIES,
  LEAD_TIMELINES,
  PROPERTY_TYPES,
  stageLabel,
  TYPE_LABEL,
  whenShort,
} from '@/lib/leads'
import { uploadDocument, type PickedFile } from '@/lib/documents'
import type { Contact, Lead } from '@/lib/types'
import { Badge, Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, SectionTitle, TextField } from '@/components/form'
import { AgentsPanel } from '@/components/agents'
import { WhenField } from '@/components/when'
import { DocumentsPanel } from '@/components/documents'
import { ActivityFeed } from '@/components/activity'
import { ByLine, timeAgo } from '@/components/people'
import { RelatedMeetings } from '@/components/relatedMeetings'
import { MeetNowButton } from '@/components/google'
import { ActionBtn, ContactActions, ContactPickerSheet } from '@/components/contacts'
import { ConvertPanel, LeadMatches, PendingFiles, RelatedTasks, ShownPanel } from '@/components/leadPanels'

type Preset = Parameters<typeof ConvertPanel>[0]['preset']

export default function LeadScreen() {
  const { id, contact: contactParam } = useLocalSearchParams<{ id: string; contact?: string }>()
  const isNew = id === 'new'
  const api = useApi()

  const [lead, setLead] = useState<Lead | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [ready, setReady] = useState(true)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [intent, setIntent] = useState<string>('Buy')
  const [ptype, setPtype] = useState<string>('')
  const [locations, setLocations] = useState('')
  const [bmin, setBmin] = useState('')
  const [bmax, setBmax] = useState('')
  const [size, setSize] = useState('')
  const [timeline, setTimeline] = useState('')
  const [priority, setPriority] = useState<string>('Warm')
  const [channel, setChannel] = useState<string>('Call')
  const [owner, setOwner] = useState('')
  const [team, setTeam] = useState<string[]>([])
  const [followUp, setFollowUp] = useState('')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<PickedFile[]>([])
  const [fileCat, setFileCat] = useState('KYC')

  const [converting, setConverting] = useState(false)
  const [preset, setPreset] = useState<Preset>(null)
  const [losing, setLosing] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [picking, setPicking] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const hydrate = useCallback((l: Lead) => {
    setLead(l)
    setName(l.name ?? '')
    setPhone(l.phone ?? '')
    setEmail(l.email ?? '')
    setCompany(l.company ?? '')
    setIntent(l.intent ?? 'Buy')
    setPtype(l.property_type ?? '')
    setLocations(l.locations || l.corridor || '')
    setBmin(l.budget_min_cr != null ? String(l.budget_min_cr) : '')
    setBmax(l.budget_max_cr != null ? String(l.budget_max_cr) : '')
    setSize(l.size_requirement ?? '')
    setTimeline(l.timeline ?? '')
    setPriority(l.priority ?? 'Warm')
    setChannel(l.channel ?? 'Form')
    setOwner(l.assigned_to ?? '')
    setFollowUp(l.next_follow_up_at ?? '')
    setSource(l.source ?? '')
    setNotes(l.notes ?? '')
  }, [])

  const reload = useCallback(async () => {
    const r = await api.get<{ data: Lead; contact: Contact | null; ready: boolean }>(`/api/leads/${id}`)
    hydrate(r.data)
    setContact(r.contact)
    setReady(r.ready)
  }, [api, id, hydrate])

  useEffect(() => {
    api
      .get<{ user: { name: string }; team: { name: string }[] }>('/api/admin/me')
      .then((r) => {
        setTeam(r.team.map((t) => t.name))
        if (isNew) setOwner((o) => o || r.user.name)
      })
      .catch(() => {})
    if (isNew) {
      if (contactParam) {
        api
          .get<{ data: Contact }>(`/api/contacts/${contactParam}`)
          .then((r) => {
            setContact(r.data)
            setName(r.data.name)
            setPhone(r.data.phone ?? '')
            setEmail(r.data.email ?? '')
            setCompany(r.data.company ?? '')
            if (r.data.roles?.includes('Seller') || r.data.roles?.includes('Landowner')) setIntent('Sell')
          })
          .catch(() => {})
      }
      return
    }
    reload()
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the lead'))
      .finally(() => setLoading(false))
  }, [api, isNew, reload, contactParam])

  function body() {
    const num = (v: string) => (v.trim() === '' ? null : Number(v))
    return {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim(),
      intent,
      property_type: ptype,
      locations: locations.trim(),
      budget_min_cr: num(bmin),
      budget_max_cr: num(bmax),
      size_requirement: size.trim(),
      timeline,
      priority,
      channel,
      assigned_to: owner,
      next_follow_up_at: followUp || null,
      source: source.trim(),
      notes: notes.trim(),
    }
  }

  async function save() {
    if (!name.trim()) return setError('Who is the lead? Add a name.')
    if (isNew && !contact && !phone.trim() && !email.trim()) return setError('Add a phone number or an email so the lead can be reached.')
    setBusy(true)
    setError(null)
    try {
      if (isNew) {
        const r = await api.post<{ id?: string }>('/api/leads', { ...body(), kind: intent === 'Sell' ? 'Listing request' : 'Enquiry', ...(contact ? { contact_id: contact.id } : {}) })
        if (r.id) {
          for (const f of files) await uploadDocument(api, f, { entity_type: 'lead', entity_id: r.id, entity_label: name.trim(), category: fileCat })
          router.replace({ pathname: '/lead/[id]', params: { id: r.id } })
        } else router.back()
        return
      }
      await api.put(`/api/leads/${id}`, body())
      await reload()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function patch(p: Record<string, unknown>) {
    setError(null)
    try {
      await api.put(`/api/leads/${id}`, p)
      await reload()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function remove() {
    if (!lead) return
    Alert.alert('Delete this lead?', 'Their contact card stays.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.del(`/api/leads/${lead.id}`)
          router.back()
        },
      },
    ])
  }

  if (loading) return <LoadingScreen />
  if (!isNew && !lead) return <ErrorBanner message={error ?? 'Lead not found'} />

  const selling = isSelling(intent)
  const open = lead ? !['Converted', 'Lost', 'Closed'].includes(lead.stage) : true
  const at = lead ? LEAD_PIPELINE.indexOf(lead.stage as (typeof LEAD_PIPELINE)[number]) : -1

  return (
    <Screen>
      <Stack.Screen options={{ title: isNew ? 'New lead' : lead?.name ?? 'Lead' }} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {error ? <ErrorBanner message={error} /> : null}
        {saved ? <Text style={s.saved}>Saved.</Text> : null}
        {!ready && !isNew ? <Text style={s.warn}>Requirements, follow-ups and listings shown need database migration 015 (Setup, on the website).</Text> : null}

        {lead ? (
          <Card>
            <View style={s.badges}>
              <Badge label={stageLabel(lead.stage)} tone={lead.stage === 'Visit' ? 'progress' : lead.stage.toLowerCase()} />
              <Badge label={lead.intent ?? 'Buy'} tone="progress" />
              {lead.priority ? <Badge label={lead.priority} tone={lead.priority.toLowerCase()} /> : null}
            </View>
            <Text style={s.want}>{[TYPE_LABEL[lead.property_type ?? ''], lead.locations || lead.corridor, budget(lead.budget_min_cr, lead.budget_max_cr)].filter(Boolean).join(' · ') || lead.kind}</Text>
            <ByLine record={lead} createdAt={lead.created_at} />
            {lead.transaction_id ? (
              <TouchableOpacity style={s.converted} onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: lead.transaction_id! } })}>
                <Text style={s.convertedText}>Converted{lead.converted_at ? ` ${timeAgo(lead.converted_at)}` : ''} — open the deal →</Text>
              </TouchableOpacity>
            ) : null}

            <SectionTitle>Pipeline</SectionTitle>
            <View style={s.pipe}>
              {LEAD_PIPELINE.map((st, i) => (
                <TouchableOpacity
                  key={st}
                  style={[s.step, lead.stage === st && s.stepOn, i < at && s.stepDone]}
                  disabled={!open && lead.stage !== 'Nurture'}
                  onPress={() => patch({ stage: st })}
                >
                  <Text style={[s.stepText, lead.stage === st && { color: colors.white }, i < at && { color: colors.navy }]}>{stageLabel(st)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {open ? (
              losing ? (
                <View style={{ marginTop: space.sm }}>
                  <TextField label="Why was it lost?" value={lostReason} onChange={setLostReason} placeholder="Bought elsewhere, budget too low…" />
                  <View style={s.row}>
                    <View style={{ flex: 1 }}><Button label="Cancel" tone="ghost" onPress={() => setLosing(false)} /></View>
                    <View style={{ flex: 1 }}><Button label="Mark lost" tone="danger" onPress={() => patch({ stage: 'Lost', lost_reason: lostReason.trim() }).then(() => setLosing(false))} /></View>
                  </View>
                </View>
              ) : (
                <View style={[s.row, { marginTop: space.sm }]}>
                  <View style={{ flex: 1.4 }}><Button label="Convert to deal" onPress={() => (setPreset(null), setConverting(true))} /></View>
                  {lead.stage !== 'Nurture' ? <View style={{ flex: 1 }}><Button label="Nurture" tone="ghost" onPress={() => patch({ stage: 'Nurture' })} /></View> : null}
                  <View style={{ flex: 1 }}><Button label="Lost" tone="danger" onPress={() => setLosing(true)} /></View>
                </View>
              )
            ) : (
              <View style={{ marginTop: space.sm }}>
                {lead.stage === 'Lost' ? <Text style={s.lost}>Lost{lead.lost_reason ? `: ${lead.lost_reason}` : ''}</Text> : null}
                {!lead.transaction_id ? <Button label="Reopen lead" tone="ghost" onPress={() => patch({ stage: 'Contacted', lost_reason: '' })} /> : null}
              </View>
            )}
            {converting ? (
              <View style={s.convert}>
                <ConvertPanel lead={lead} preset={preset} onCancel={() => setConverting(false)} />
              </View>
            ) : null}
          </Card>
        ) : null}

        {lead ? (
          <Card>
            <SectionTitle>Reach them</SectionTitle>
            {followUpDue(lead) ? <Text style={s.due}>Follow-up due {whenShort(lead.next_follow_up_at!)}</Text> : null}
            <ContactActions name={lead.name} phone={lead.phone} email={lead.email} entity={{ entity_type: 'lead', entity_id: lead.id, entity_label: lead.name }} />
            <View style={[s.row, { marginTop: 8 }]}>
              <ActionBtn icon="checkmark-done" label="Log a call" onPress={() => patch({ last_contacted_at: new Date().toISOString(), ...(lead.stage === 'New' ? { stage: 'Contacted' } : {}) })} />
            </View>
            <View style={{ marginTop: 8 }}>
              <MeetNowButton entityType="lead" entityId={lead.id} entityLabel={lead.name} title={`Call with ${lead.name}`} />
            </View>
            <Text style={s.meta}>
              {lead.last_contacted_at ? `Last contacted ${timeAgo(lead.last_contacted_at)}` : 'Not contacted yet'}
              {lead.assigned_to ? ` · Owner: ${lead.assigned_to}` : ''}
            </Text>
          </Card>
        ) : null}

        {lead ? (
          <Card>
            <SectionTitle>Documents</SectionTitle>
            <DocumentsPanel entityType="lead" entityId={lead.id} entityLabel={lead.name} />
          </Card>
        ) : null}

        {lead && ready ? (
          <>
            <Card>
              <SectionTitle>{selling ? 'Listings (theirs & shared)' : 'Listings shown'}</SectionTitle>
              <ShownPanel key={refreshKey} lead={lead} onChange={() => setRefreshKey((k) => k + 1)} />
            </Card>
            <Card>
              <SectionTitle>Matches</SectionTitle>
              <LeadMatches
                lead={lead}
                refreshKey={refreshKey}
                onShortlist={() => setRefreshKey((k) => k + 1)}
                onDealWith={(l) => {
                  setPreset(l)
                  setConverting(true)
                }}
              />
            </Card>
            <Card>
              <SectionTitle>Follow-ups</SectionTitle>
              <RelatedTasks entityType="lead" entityId={lead.id} entityLabel={lead.name} suggest={`Call ${lead.name.split(' ')[0]} back`} />
            </Card>
          </>
        ) : null}

        <Card>
          <SectionTitle>Person</SectionTitle>
          {contact ? (
            <TouchableOpacity onPress={() => router.push({ pathname: '/contact/[id]', params: { id: contact.id } })}>
              <Text style={s.link}>Contact card: {contact.name} →</Text>
            </TouchableOpacity>
          ) : null}
          <TextField label="Name" value={name} onChange={setName} />
          <TextField label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" placeholder="98450 12345" />
          <TextField label="Email" value={email} onChange={setEmail} keyboard="email-address" />
          <TextField label="Company (optional)" value={company} onChange={setCompany} />
          {!isNew && !contact && ready ? <Button label="Link to a contact on file" tone="ghost" onPress={() => setPicking(true)} /> : null}
        </Card>

        <Card>
          <SectionTitle>{selling ? 'What they are selling' : 'What they are looking for'}</SectionTitle>
          <Chips label="They want to" options={LEAD_INTENTS} value={intent as (typeof LEAD_INTENTS)[number]} onChange={setIntent} />
          <Text style={s.label}>Property type</Text>
          <View style={s.chips}>
            {PROPERTY_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[s.chip, ptype === t && s.chipOn]} onPress={() => setPtype(ptype === t ? '' : t)}>
                <Text style={[s.chipText, ptype === t && { color: colors.white }]}>{TYPE_LABEL[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextField label={selling ? 'Where it is' : 'Preferred areas'} value={locations} onChange={setLocations} placeholder="Devanahalli, Hoskote, North Bengaluru" />
          <View style={s.row}>
            <View style={{ flex: 1 }}><TextField label={selling ? 'Asking from (₹ Cr)' : 'Budget from (₹ Cr)'} value={bmin} onChange={setBmin} keyboard="numeric" /></View>
            <View style={{ flex: 1 }}><TextField label={selling ? 'Asking up to (₹ Cr)' : 'Budget up to (₹ Cr)'} value={bmax} onChange={setBmax} keyboard="numeric" /></View>
          </View>
          <Text style={s.hint}>0.85 = ₹85 lakh</Text>
          <TextField label="Size" value={size} onChange={setSize} placeholder="2–5 acres, 30×40 site, 3 BHK" />
          <Chips label="Timeline" options={LEAD_TIMELINES} value={timeline as (typeof LEAD_TIMELINES)[number]} onChange={setTimeline} />
          <TextField label="Notes" value={notes} onChange={setNotes} multiline placeholder="Family decision, loan pre-approved, wants east-facing…" />
        </Card>

        <Card>
          <SectionTitle>Handling</SectionTitle>
          <Chips label="Priority" options={LEAD_PRIORITIES} value={priority as (typeof LEAD_PRIORITIES)[number]} onChange={setPriority} />
          {team.length ? <Chips label="Owner" options={team} value={owner} onChange={setOwner} /> : null}
          <WhenField label="Next follow-up" value={followUp} onChange={setFollowUp} />
          <View style={[s.chips, { marginTop: -6 }]}>
            {([['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]] as const).map(([l, n]) => (
              <TouchableOpacity key={l} style={s.chip} onPress={() => setFollowUp(inDays(n))}>
                <Text style={s.chipText}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Chips label="Came in through" options={LEAD_CHANNELS} value={channel as (typeof LEAD_CHANNELS)[number]} onChange={setChannel} />
          <TextField label="Source detail" value={source} onChange={setSource} placeholder="Who referred them, which portal" />
        </Card>

        {isNew ? (
          <Card>
            <SectionTitle>Documents</SectionTitle>
            <PendingFiles files={files} onChange={setFiles} entityType="lead" category={fileCat} onCategory={setFileCat} />
          </Card>
        ) : null}

        <Button label={isNew ? (files.length ? `Add lead + ${files.length} file${files.length > 1 ? 's' : ''}` : 'Add lead') : 'Save changes'} onPress={save} busy={busy} />

        {lead ? (
          <>
            <Card style={{ marginTop: space.lg }}>
              <SectionTitle>Agents</SectionTitle>
              <AgentsPanel entityType="lead" entityId={lead.id} entityLabel={lead.name} />
            </Card>
            <Card>
              <SectionTitle>Site visits & meetings</SectionTitle>
              <RelatedMeetings entityType="lead" entityId={lead.id} entityLabel={lead.name} />
            </Card>
            <Card>
              <SectionTitle>History</SectionTitle>
              <ActivityFeed entityType="lead" entityId={lead.id} emptyText="No changes recorded yet." />
            </Card>
            <View style={{ marginTop: space.lg }}>
              <Button label="Delete lead" tone="danger" onPress={remove} />
            </View>
          </>
        ) : null}
      </ScrollView>
      <ContactPickerSheet
        visible={picking}
        onClose={() => setPicking(false)}
        defaultRole={selling ? 'Seller' : 'Buyer'}
        onPick={(c) => patch({ contact_id: c.id, name: c.name, phone: c.phone || phone, email: c.email || email })}
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  want: { fontSize: text.md, color: colors.ink, fontWeight: '600', marginTop: 8 },
  saved: { color: colors.verified, fontWeight: '700', marginBottom: space.sm },
  warn: { color: colors.pending, fontSize: text.sm, marginBottom: space.sm },
  converted: { marginTop: space.sm, padding: 10, borderRadius: radius.base, backgroundColor: colors.verifiedBg },
  convertedText: { color: colors.verified, fontWeight: '800', fontSize: text.sm },
  pipe: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  step: { flexGrow: 1, paddingVertical: 9, paddingHorizontal: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: 'center', backgroundColor: colors.white },
  stepOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  stepDone: { backgroundColor: colors.navyTint, borderColor: colors.navyTint },
  stepText: { fontSize: text.xs, fontWeight: '800', color: colors.ink2 },
  row: { flexDirection: 'row', gap: 8 },
  lost: { color: colors.flagged, fontWeight: '700', marginBottom: 8 },
  convert: { marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.line2 },
  due: { color: colors.flagged, fontWeight: '800', fontSize: text.sm, marginBottom: 8 },
  meta: { fontSize: text.xs, color: colors.muted, marginTop: 8 },
  link: { color: colors.goldDeep, fontWeight: '800', fontSize: text.sm, marginBottom: space.sm },
  label: { fontSize: text.sm, fontWeight: '700', color: colors.ink2, marginBottom: 6 },
  hint: { fontSize: text.xs, color: colors.muted, marginTop: -8, marginBottom: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: text.sm, fontWeight: '600', color: colors.ink2 },
})
