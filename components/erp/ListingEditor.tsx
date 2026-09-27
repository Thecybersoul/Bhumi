'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FolderOpen, Handshake, History, Image as ImageIcon, LandPlot, ListChecks, Mail, Map, Ruler, Scale, Tag, Trash2, UserSearch, Users } from 'lucide-react'
import MediaPicker from '@/components/admin/MediaPicker'
import { api, type Audited } from './lib'
import { Banner, ByLine, Card, Chips, Field, Loading } from './ui'
import { ActivityFeed, RelatedMeetings } from './records'
import { DocsJump, DocumentsPanel, PendingDocs, uploadAll } from './documents'
import { PeoplePanel } from './contacts'
import { AgentsPanel } from './agents'
import { ListingBuyers, RelatedTasks } from './leadPanels'
import { EmailButton, EmailLog } from './google'

const TYPES = ['land-parcels', 'residential', 'villas', 'commercial', 'warehouses', 'large-land-parcels'] as const
const STATUSES = ['Draft', 'Live', 'Reserved', 'Sold'] as const
const PRICE_TYPES = ['Fixed', 'Negotiable', 'On Request'] as const
const ZONES = ['North', 'East', 'South', 'West'] as const

type P = Record<string, unknown> & Audited & { id: string; code: string; title: string; created_at: string }

const KEYS = [
  'code', 'title', 'location', 'corridor', 'extent_acres', 'price_per_acre_cr', 'price_total_cr', 'built_up_sqft', 'price_per_sqft',
  'description', 'img_url', 'plots_total', 'plots_available', 'plots_available_list', 'plot_size', 'conversion', 'conversion_order',
  'khata', 'authority', 'ownership', 'engagement', 'survey_number', 'dimensions', 'facing',
] as const
type Key = (typeof KEYS)[number]
const NUMERIC: Key[] = ['extent_acres', 'price_per_acre_cr', 'price_total_cr', 'built_up_sqft', 'price_per_sqft', 'plots_total', 'plots_available']

function listingEmail(p: P) {
  const s = (k: string) => (p[k] == null ? '' : String(p[k]))
  const facts = [
    ['Location', s('location')],
    ['Extent', p.built_up_sqft ? `${Number(p.built_up_sqft).toLocaleString('en-IN')} sq ft built-up` : p.extent_acres ? `${s('extent_acres')} acres` : ''],
    ['Price', p.price_total_cr ? `₹${s('price_total_cr')} Cr` : p.price_per_acre_cr ? `₹${s('price_per_acre_cr')} Cr per acre` : p.price_per_sqft ? `₹${Number(p.price_per_sqft).toLocaleString('en-IN')} per sq ft` : s('price_type')],
    ['Khata', s('khata')],
    ['Conversion', s('conversion')],
  ].filter(([, v]) => v)
  return {
    subject: `${p.title} — ${p.code} | Bhumi Estates`,
    body: [
      'Dear Sir / Madam,',
      `Thank you for your interest. Here are the details of ${p.title}:`,
      facts.map(([k, v]) => `• ${k}: ${v}`).join('\n'),
      `Full listing: https://www.bhumiestates.in/marketplace/${encodeURIComponent(p.code)}`,
      'Happy to share the title documents and arrange a site visit at your convenience.',
      'Warm regards,',
    ].join('\n\n'),
    entity_type: 'property',
    entity_id: p.id,
    entity_label: `${p.code} · ${p.title}`,
  }
}

export default function ListingEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const router = useRouter()
  const [orig, setOrig] = useState<P | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('live')
  const [f, setF] = useState<Record<Key, string>>(Object.fromEntries(KEYS.map((k) => [k, ''])) as Record<Key, string>)
  const [type, setType] = useState<(typeof TYPES)[number]>('land-parcels')
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('Live')
  const [priceType, setPriceType] = useState<(typeof PRICE_TYPES)[number]>('Negotiable')
  const [zone, setZone] = useState<(typeof ZONES)[number]>('North')
  const [featured, setFeatured] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fileCat, setFileCat] = useState('Title deed')

  function hydrate(p: P) {
    setOrig(p)
    setF(Object.fromEntries(KEYS.map((k) => [k, p[k] == null ? '' : String(p[k])])) as Record<Key, string>)
    setType((p.property_type as (typeof TYPES)[number]) ?? 'land-parcels')
    setStatus((p.status as (typeof STATUSES)[number]) ?? 'Live')
    setPriceType((p.price_type as (typeof PRICE_TYPES)[number]) ?? 'Negotiable')
    setZone((p.zone as (typeof ZONES)[number]) ?? 'North')
    setFeatured(Boolean(p.featured))
  }

  async function load() {
    const r = await api.get<{ data: P[]; source: 'live' | 'fallback' }>('/api/properties?admin=1')
    const p = r.data.find((x) => x.id === id || x.code === id)
    if (!p) return setError('Listing not found')
    setSource(r.source)
    hydrate(p)
  }

  useEffect(() => {
    if (isNew) return
    load()
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew])

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  function payload() {
    const body: Record<string, unknown> = { property_type: type, status, price_type: priceType, zone, featured }
    for (const k of KEYS) {
      const v = f[k].trim()
      body[k] = NUMERIC.includes(k) ? (v === '' ? (k === 'extent_acres' || k === 'price_per_acre_cr' ? 0 : null) : Number(v)) : v
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
        const r = await api.post<{ id?: string }>('/api/properties', { ...payload(), use_cases: [], amenities: '', risk: 'Low', img_url: f.img_url || '/img/p1.jpg' })
        if (r.id && files.length) await uploadAll(files, { entity_type: 'property', entity_id: r.id, entity_label: `${f.code.trim()} · ${f.title.trim()}`, category: fileCat })
        router.push(r.id ? `/admin/properties/${r.id}` : '/admin/properties')
        return
      }
      if (source === 'fallback') {
        // The built-in listings exist only in code: save them all to
        // the database (reads switch over once it has any row), with
        // this edit applied to this one.
        const all = (await api.get<{ data: P[] }>('/api/properties?admin=1')).data
        for (const p of all) {
          const { id: _id, created_at: _c, ...rest } = p
          void _id
          void _c
          await api.post('/api/properties', p.code === orig?.code ? { ...rest, ...payload() } : rest)
        }
        router.push('/admin/properties')
        return
      }
      await api.put(`/api/properties/${orig?.id ?? id}`, payload())
      await load()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (source === 'fallback') return setError('Built-in listing: save it once first, then it can be deleted.')
    if (!orig || !confirm(`Delete ${orig.code}? It disappears from the marketplace. This cannot be undone.`)) return
    await api.del(`/api/properties/${orig.id}`)
    router.push('/admin/properties')
  }

  if (loading) return <Loading />
  const live = orig && source === 'live'
  const label = orig ? `${orig.code} · ${orig.title}` : ''

  const text = (k: Key, lbl: string, hint?: string, full?: boolean) => (
    <Field label={lbl} hint={hint} full={full}>
      <input className="erpInput" value={f[k]} onChange={set(k)} inputMode={NUMERIC.includes(k) ? 'decimal' : undefined} />
    </Field>
  )

  return (
    <div className="erpPage">
      <Link href="/admin/properties" className="erpCard__action" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Listings
      </Link>
      <div className="erpHead">
        <div>
          <h1>{isNew ? 'New listing' : orig?.title}</h1>
          {orig ? (
            <>
              <p>
                {orig.code}
                {live && orig.status !== 'Draft' ? (
                  <>
                    {' · '}
                    <a href={`/marketplace/${encodeURIComponent(orig.code)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-deep)', fontWeight: 700 }}>
                      View on the marketplace ↗
                    </a>
                  </>
                ) : null}
              </p>
              {live ? <ByLine record={orig} createdAt={orig.created_at} /> : null}
            </>
          ) : null}
        </div>
        {live ? (
          <div className="erpHead__actions">
            <DocsJump entityType="property" entityId={orig!.id} />
          </div>
        ) : null}
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {saved ? <Banner tone="ok">Saved. The marketplace shows the change straight away.</Banner> : null}

      <div className="erpGrid main">
        <div className="erpCol">
          <Card title="Status" icon={Map}>
            <Chips options={STATUSES} value={status} onChange={setStatus} />
            <label className="erpToggle" style={{ marginTop: 14 }}>
              Featured on the homepage
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            </label>
          </Card>

          <Card title="Photo" icon={ImageIcon}>
            <MediaPicker value={f.img_url} onChange={(url) => setF((p) => ({ ...p, img_url: url }))} label="Listing image" />
          </Card>

          <Card title="Basics" icon={Map}>
            <div className="erpForm two">
              {text('code', 'Code', 'Unique, e.g. BLR-P-2603')}
              {text('title', 'Title')}
              <Field label="Type" full>
                <Chips options={TYPES} value={type} onChange={setType} />
              </Field>
              {text('location', 'Location')}
              {text('corridor', 'Corridor', 'e.g. devanahalli')}
              <Field label="Zone" full>
                <Chips options={ZONES} value={zone} onChange={setZone} />
              </Field>
              <Field label="Description" full>
                <textarea className="erpInput" value={f.description} onChange={set('description')} style={{ minHeight: 120 }} />
              </Field>
            </div>
          </Card>

          <Card title="Size & price" icon={Ruler}>
            <div className="erpForm two">
              {text('extent_acres', 'Extent (acres)')}
              {text('built_up_sqft', 'Built-up (sq ft)')}
              {text('price_per_acre_cr', 'Price per acre (₹ crore)')}
              {text('price_total_cr', 'Headline price, sold whole (₹ crore)')}
              {text('price_per_sqft', 'Price per sq ft (₹)')}
              {text('dimensions', 'Dimensions')}
              {text('facing', 'Facing')}
              <Field label="Price type" full>
                <Chips options={PRICE_TYPES} value={priceType} onChange={setPriceType} />
              </Field>
            </div>
          </Card>

          <Card title="Plotted layout" icon={LandPlot}>
            <div className="erpForm two">
              {text('plots_total', 'Total plots')}
              {text('plots_available', 'Plots still available')}
              {text('plots_available_list', 'Which plots are available')}
              {text('plot_size', 'Plot size')}
            </div>
          </Card>

          <Card title="Legal position" icon={Scale}>
            <div className="erpForm two">
              {text('conversion', 'Conversion')}
              {text('conversion_order', 'Conversion order no.')}
              {text('khata', 'Khata')}
              {text('authority', 'Authority')}
              {text('ownership', 'Ownership')}
              {text('survey_number', 'Survey number')}
              {text('engagement', 'Our role', 'Sourcing it, or appointed for sales and marketing', true)}
            </div>
          </Card>

          {isNew ? (
            <Card title="Documents" icon={FolderOpen}>
              <PendingDocs files={files} onChange={setFiles} entityType="property" category={fileCat} onCategory={setFileCat} />
            </Card>
          ) : null}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="erpBtn primary" style={{ flex: 1 }} onClick={save} disabled={busy}>
              {busy ? 'Saving…' : isNew ? (files.length ? `Publish listing + ${files.length} file${files.length > 1 ? 's' : ''}` : 'Publish listing') : 'Save changes'}
            </button>
            {orig ? (
              <button className="erpBtn danger" onClick={remove}>
                <Trash2 size={15} /> Delete
              </button>
            ) : null}
          </div>
        </div>

        <div className="erpCol">
          <Card title="Documents" icon={FolderOpen} id="documents">
            {live ? (
              <DocumentsPanel entityType="property" entityId={orig!.id} entityLabel={label} />
            ) : (
              <p className="erpEmpty">
                {isNew ? 'Add the title deed, EC, RTC, khata and sketches in the Documents box on the left — they upload when you publish.' : 'Save this built-in listing once to start attaching documents.'}
              </p>
            )}
          </Card>
          {live ? (
            <>
              <Card title="Clients" icon={UserSearch}>
                <ListingBuyers propertyId={orig!.id} />
              </Card>
              <Card title="Agents" icon={Handshake}>
                <AgentsPanel entityType="property" entityId={orig!.id} entityLabel={label} />
              </Card>
              <Card title="Owner & people" icon={Tag}>
                <PeoplePanel
                  hideAgents
                  entityType="property"
                  entityId={orig!.id}
                  entityLabel={label}
                  roles={['Landowner', 'Seller', 'Developer', 'Lawyer', 'Other']}
                  emptyText="Tag the landowner, developer or lawyer behind this listing."
                />
              </Card>
              <Card title="Follow-ups" icon={ListChecks}>
                <RelatedTasks entityType="property" entityId={orig!.id} entityLabel={label} />
              </Card>
              <Card title="Share with a client" icon={Mail}>
                <EmailButton block label="Email this listing" draft={listingEmail(orig!)} />
                <div style={{ marginTop: 10 }}>
                  <EmailLog entityType="property" entityId={orig!.id} />
                </div>
              </Card>
              <Card title="Site visits & meetings" icon={Users}>
                <RelatedMeetings entityType="property" entityId={orig!.id} entityLabel={label} defaultKind="Site visit" />
              </Card>
              <Card title="History" icon={History}>
                <ActivityFeed entityType="property" entityId={orig!.id} emptyText="No changes recorded yet." />
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
