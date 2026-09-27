import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, MediaField, SectionTitle, TextField, ToggleRow } from '@/components/form'
import { DocumentsPanel } from '@/components/documents'
import { ActivityFeed } from '@/components/activity'
import { ByLine } from '@/components/people'
import { RelatedMeetings } from '@/components/relatedMeetings'
import { EmailButton, EmailLog } from '@/components/google'
import { PeoplePanel } from '@/components/contacts'
import { AgentsPanel } from '@/components/agents'
import { ListingBuyers, PendingFiles, RelatedTasks } from '@/components/leadPanels'
import { uploadDocument, type PickedFile } from '@/lib/documents'
import type { ApiResult, Property, PropertyStatus, PropertyTypeSlug, PriceType, Zone } from '@/lib/types'

const TYPES: PropertyTypeSlug[] = ['land-parcels', 'residential', 'villas', 'commercial', 'warehouses', 'large-land-parcels']
const STATUSES: PropertyStatus[] = ['Draft', 'Live', 'Reserved', 'Sold']
const PRICE_TYPES: PriceType[] = ['Fixed', 'Negotiable', 'On Request']
const ZONES: Zone[] = ['North', 'East', 'South', 'West']

type Form = Record<string, string>

const toForm = (p: Partial<Property> & Record<string, unknown>): Form => {
  const keys = [
    'code', 'title', 'location', 'corridor', 'extent_acres', 'price_per_acre_cr', 'price_total_cr', 'built_up_sqft',
    'price_per_sqft', 'description', 'img_url', 'plots_total', 'plots_available', 'plots_available_list', 'plot_size',
    'conversion', 'conversion_order', 'khata', 'authority', 'ownership', 'engagement', 'survey_number', 'dimensions', 'facing',
  ]
  const f: Form = {}
  for (const k of keys) f[k] = p[k] == null ? '' : String(p[k])
  return f
}

const NUMERIC = ['extent_acres', 'price_per_acre_cr', 'price_total_cr', 'built_up_sqft', 'price_per_sqft', 'plots_total', 'plots_available']

/* A ready-to-edit email with the listing's essentials; its documents
   can be ticked as attachments in the composer. */
function listingEmail(p: Property & Record<string, unknown>) {
  const facts = [
    ['Location', p.location],
    ['Extent', p.built_up_sqft ? `${Number(p.built_up_sqft).toLocaleString('en-IN')} sq ft built-up` : p.extent_acres ? `${p.extent_acres} acres` : ''],
    ['Price', p.price_total_cr ? `₹${p.price_total_cr} Cr` : p.price_per_acre_cr ? `₹${p.price_per_acre_cr} Cr per acre` : p.price_per_sqft ? `₹${Number(p.price_per_sqft).toLocaleString('en-IN')} per sq ft` : String(p.price_type ?? '')],
    ['Khata', p.khata],
    ['Conversion', p.conversion],
  ].filter(([, v]) => v)
  return {
    subject: `${p.title} — ${p.code} | Bhumi Estates`,
    body: [
      'Dear Sir / Madam,',
      `Thank you for your interest. Here are the details of ${p.title}:`,
      facts.map(([k, v]) => `• ${k}: ${v}`).join('\n'),
      `Full listing: https://www.bhumiestates.in/marketplace/${encodeURIComponent(String(p.code))}`,
      'Happy to share the title documents and arrange a site visit at your convenience.',
      'Warm regards,',
    ].join('\n\n'),
    entity_type: 'property',
    entity_id: p.id,
    entity_label: `${p.code} · ${p.title}`,
  }
}

export default function PropertyScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const id = decodeURIComponent(rawId)
  const isNew = id === 'new'
  const api = useApi()

  const [orig, setOrig] = useState<(Property & Record<string, unknown>) | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('live')
  const [f, setF] = useState<Form>(toForm({ img_url: '' }))
  const [type, setType] = useState<PropertyTypeSlug>('land-parcels')
  const [status, setStatus] = useState<PropertyStatus>('Live')
  const [priceType, setPriceType] = useState<PriceType>('Negotiable')
  const [zone, setZone] = useState<Zone>('North')
  const [featured, setFeatured] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [files, setFiles] = useState<PickedFile[]>([])
  const [fileCat, setFileCat] = useState('Title deed')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    api
      .get<ApiResult<(Property & Record<string, unknown>)[]>>('/api/properties?admin=1')
      .then((r) => {
        const p = r.data.find((x) => x.id === id || x.code === id)
        if (!p) return setError('Listing not found')
        setOrig(p)
        setSource(r.source)
        setF(toForm(p))
        setType(p.property_type)
        setStatus(p.status)
        setPriceType(p.price_type)
        setZone(p.zone)
        setFeatured(Boolean(p.featured))
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load'))
      .finally(() => setLoading(false))
  }, [api, id, isNew])

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  function payload() {
    const body: Record<string, unknown> = {
      property_type: type,
      status,
      price_type: priceType,
      zone,
      featured,
    }
    for (const [k, v] of Object.entries(f)) {
      if (NUMERIC.includes(k)) body[k] = v.trim() === '' ? (k === 'extent_acres' || k === 'price_per_acre_cr' ? 0 : null) : Number(v)
      else body[k] = v.trim()
    }
    return body
  }

  async function save() {
    if (!f.code.trim() || !f.title.trim()) return setError('Code and title are required')
    if (!f.location.trim()) return setError('Location is required')
    setBusy(true)
    setError(null)
    try {
      if (isNew) {
        const out = await api.post<{ id?: string }>('/api/properties', { ...payload(), use_cases: [], amenities: '', risk: 'Low', img_url: f.img_url || '/img/p1.jpg' })
        // Files picked while filling it in go up now; then straight into the saved listing.
        if (out.id) {
          for (const file of files) await uploadDocument(api, file, { entity_type: 'property', entity_id: out.id, entity_label: `${f.code.trim()} · ${f.title.trim()}`, category: fileCat })
          return router.replace({ pathname: '/property/[id]', params: { id: out.id } })
        }
      } else if (source === 'fallback') {
        // The built-in listings only exist in code. Save them all to the
        // database first (reads switch to the database the moment it has
        // any row), then apply this edit to the copy of this one.
        const all = (await api.get<ApiResult<(Property & Record<string, unknown>)[]>>('/api/properties?admin=1')).data
        for (const p of all) {
          const { id: _id, created_at: _c, ...rest } = p
          void _id
          void _c
          await api.post('/api/properties', p.code === orig?.code ? { ...rest, ...payload() } : rest)
        }
      } else {
        await api.put(`/api/properties/${orig?.id ?? id}`, payload())
      }
      router.back()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  /** A draft goes live in one deliberate step, saving any edits with it. */
  function goLive() {
    if (!orig) return
    Alert.alert('Make it live?', `${orig.code} · ${orig.title} will appear on the website's marketplace straight away.`, [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Go live',
        onPress: async () => {
          setBusy(true)
          setError(null)
          try {
            await api.put(`/api/properties/${orig.id}`, { ...payload(), status: 'Live' })
            setStatus('Live')
            setOrig({ ...orig, status: 'Live' })
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        },
      },
    ])
  }

  function remove() {
    if (source === 'fallback') return setError('Built-in listing — edit and save it first, then it can be deleted.')
    Alert.alert('Delete listing?', 'It disappears from the marketplace. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/properties/${orig?.id ?? id}`)
            router.back()
          } catch (e) {
            setError((e as Error).message)
          }
        },
      },
    ])
  }

  if (loading) return <LoadingScreen />

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 70 }} keyboardShouldPersistTaps="handled">
        {error && <ErrorBanner message={error} />}
        {orig && source === 'live' ? (
          <View style={{ marginBottom: space.md }}>
            <ByLine record={orig} createdAt={orig.created_at} />
          </View>
        ) : null}
        {orig && source === 'live' && orig.status === 'Draft' ? (
          <View style={ls.draftBar}>
            <View style={{ flex: 1 }}>
              <Text style={ls.draftTitle}>Draft: only the team can see this</Text>
              <Text style={ls.draftText}>
                Check the particulars{String(orig.code).startsWith('P0') ? ' (from the Property Register, as stated by the owner)' : ''}, then make it live.
              </Text>
            </View>
            <TouchableOpacity style={ls.goLive} onPress={goLive} disabled={busy}>
              <Text style={ls.goLiveText}>{busy ? 'Publishing…' : 'Go live'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Card>
          <SectionTitle>Status</SectionTitle>
          <Chips label="" options={STATUSES} value={status} onChange={setStatus} />
          <ToggleRow label="Featured on the homepage" value={featured} onChange={setFeatured} />
        </Card>

        <Card>
          <SectionTitle>Photo</SectionTitle>
          <MediaField label="Listing image" value={f.img_url} onChange={set('img_url')} />
        </Card>

        <Card>
          <SectionTitle>Documents</SectionTitle>
          {orig && source === 'live' ? (
            <DocumentsPanel entityType="property" entityId={orig.id} entityLabel={`${orig.code} · ${orig.title}`} />
          ) : isNew ? (
            <PendingFiles files={files} onChange={setFiles} entityType="property" category={fileCat} onCategory={setFileCat} />
          ) : (
            <Text style={{ color: colors.muted, fontSize: text.sm }}>
              {isNew ? 'Publish the listing first, then attach its title deed, EC, RTC, khata and sketches here.' : 'Save this built-in listing once to start attaching documents.'}
            </Text>
          )}
        </Card>

        <Card>
          <SectionTitle>Basics</SectionTitle>
          <TextField label="Code" value={f.code} onChange={set('code')} hint="Unique, e.g. BLR-P-2603" />
          <TextField label="Title" value={f.title} onChange={set('title')} />
          <Chips label="Type" options={TYPES} value={type} onChange={setType} />
          <TextField label="Location" value={f.location} onChange={set('location')} />
          <TextField label="Corridor" value={f.corridor} onChange={set('corridor')} hint="e.g. devanahalli" />
          <Chips label="Zone" options={ZONES} value={zone} onChange={setZone} />
          <TextField label="Description" value={f.description} onChange={set('description')} multiline />
        </Card>

        <Card>
          <SectionTitle>Size & price</SectionTitle>
          <TextField label="Extent (acres)" value={f.extent_acres} onChange={set('extent_acres')} keyboard="numeric" />
          <TextField label="Price per acre (₹ crore)" value={f.price_per_acre_cr} onChange={set('price_per_acre_cr')} keyboard="numeric" />
          <TextField label="Headline price, sold whole (₹ crore)" value={f.price_total_cr} onChange={set('price_total_cr')} keyboard="numeric" />
          <TextField label="Built-up (sq ft)" value={f.built_up_sqft} onChange={set('built_up_sqft')} keyboard="numeric" />
          <TextField label="Price per sq ft (₹)" value={f.price_per_sqft} onChange={set('price_per_sqft')} keyboard="numeric" />
          <Chips label="Price type" options={PRICE_TYPES} value={priceType} onChange={setPriceType} />
        </Card>

        <Card>
          <SectionTitle>Plotted layout</SectionTitle>
          <TextField label="Total plots" value={f.plots_total} onChange={set('plots_total')} keyboard="numeric" />
          <TextField label="Plots still available" value={f.plots_available} onChange={set('plots_available')} keyboard="numeric" />
          <TextField label="Which plots are available" value={f.plots_available_list} onChange={set('plots_available_list')} />
          <TextField label="Plot size" value={f.plot_size} onChange={set('plot_size')} />
        </Card>

        <Card>
          <SectionTitle>Legal position</SectionTitle>
          <TextField label="Conversion" value={f.conversion} onChange={set('conversion')} />
          <TextField label="Conversion order no." value={f.conversion_order} onChange={set('conversion_order')} />
          <TextField label="Khata" value={f.khata} onChange={set('khata')} />
          <TextField label="Authority" value={f.authority} onChange={set('authority')} />
          <TextField label="Ownership" value={f.ownership} onChange={set('ownership')} />
          <TextField label="Survey number" value={f.survey_number} onChange={set('survey_number')} />
          <TextField label="Our role" value={f.engagement} onChange={set('engagement')} hint="Sourcing it, or appointed for sales and marketing" />
        </Card>


        <Button label={isNew ? (files.length ? `Publish listing + ${files.length} file${files.length > 1 ? 's' : ''}` : 'Publish listing') : 'Save changes'} onPress={save} busy={busy} />
        {orig && source === 'live' ? (
          <>
            <Card style={{ marginTop: space.lg }}>
              <SectionTitle>Clients</SectionTitle>
              <ListingBuyers propertyId={orig.id} />
            </Card>
            <Card>
              <SectionTitle>Owner & people</SectionTitle>
              <PeoplePanel hideAgents entityType="property" entityId={orig.id} entityLabel={`${orig.code} · ${orig.title}`} roles={['Landowner', 'Seller', 'Developer', 'Lawyer', 'Other']} emptyText="Tag the landowner, developer or lawyer behind this listing." />
            </Card>
            <Card>
              <SectionTitle>Agents</SectionTitle>
              <AgentsPanel entityType="property" entityId={orig.id} entityLabel={`${orig.code} · ${orig.title}`} />
            </Card>
            <Card>
              <SectionTitle>Follow-ups</SectionTitle>
              <RelatedTasks entityType="property" entityId={orig.id} entityLabel={`${orig.code} · ${orig.title}`} />
            </Card>
            <Card>
              <SectionTitle>Share with a client</SectionTitle>
              <EmailButton label="Email this listing" draft={listingEmail(orig)} />
              <View style={{ marginTop: space.sm }}>
                <EmailLog entityType="property" entityId={orig.id} />
              </View>
            </Card>
            <Card>
              <SectionTitle>Site visits & meetings</SectionTitle>
              <RelatedMeetings entityType="property" entityId={orig.id} entityLabel={`${orig.code} · ${orig.title}`} defaultKind="Site visit" />
            </Card>
            <Card>
              <SectionTitle>History</SectionTitle>
              <ActivityFeed entityType="property" entityId={orig.id} emptyText="No changes recorded yet." />
            </Card>
          </>
        ) : null}

        {!isNew && (
          <>
            <Card style={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0, marginTop: space.lg }}>
              <Button label="Delete listing" tone="danger" onPress={remove} />
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const ls = StyleSheet.create({
  draftBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.pendingBg, borderRadius: 12, padding: 12, marginBottom: space.md },
  draftTitle: { fontSize: text.sm, fontWeight: '800', color: colors.pending },
  draftText: { fontSize: text.xs, color: colors.pending, marginTop: 2, lineHeight: 17 },
  goLive: { backgroundColor: colors.verified, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10 },
  goLiveText: { color: colors.white, fontWeight: '800', fontSize: text.sm },
})
