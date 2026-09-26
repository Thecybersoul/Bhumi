import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { space } from '@/lib/theme'
import { Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, MediaField, SectionTitle, TextField, ToggleRow } from '@/components/form'
import type { ApiResult, Property, PropertyStatus, PropertyTypeSlug, PriceType, Zone } from '@/lib/types'

const TYPES: PropertyTypeSlug[] = ['land-parcels', 'residential', 'villas', 'commercial', 'warehouses', 'large-land-parcels']
const STATUSES: PropertyStatus[] = ['Live', 'Reserved', 'Sold']
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
        await api.post('/api/properties', { ...payload(), use_cases: [], amenities: '', risk: 'Low', img_url: f.img_url || '/img/p1.jpg' })
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

        <Button label={isNew ? 'Publish listing' : 'Save changes'} onPress={save} busy={busy} />
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
