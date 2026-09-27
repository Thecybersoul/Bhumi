'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CircleAlert, CircleCheck, Loader2, MapPin, NotebookPen, SquareCheck, UserPlus } from 'lucide-react'
import { api } from './lib'

/* The free WhatsApp import on the web: the twin of the app's review card
   (mobile/src/components/whatsappImport.tsx), over the same /api/whatsapp.
   A post is read without AI; the fields it found are shown for checking,
   and one click saves Draft listings or a lead, the contact and the link. */

type PropertyType = 'land-parcels' | 'large-land-parcels' | 'commercial' | 'residential' | 'villas' | 'warehouses'
type Zone = 'North' | 'East' | 'South' | 'West'
interface Draft {
  kind: 'listing' | 'lead'
  title: string
  found: string[]
  include?: boolean
  code?: string
  property_type?: PropertyType
  location?: string
  zone?: Zone
  extent_acres?: number
  price_per_acre_cr?: number
  price_total_cr?: number
  price_per_sqft?: number
  plot_area_sqft?: number
  built_up_sqft?: number
  intent?: string
  areas?: string
  size?: string
  budget?: string
  [k: string]: unknown
}
interface Contact {
  id?: string
  name?: string
  phone?: string
  role: 'Agent' | 'Landowner' | 'Seller' | 'Buyer'
  agency?: string
}
interface Parsed {
  result: { drafts: Draft[]; contact: Contact | null; text: string; empty: boolean }
  codes: string[]
  duplicates: { id: string; code: string; title: string }[][]
  existing_contact: { id: string; name: string } | null
}
interface Saved {
  created: { type: 'listing' | 'lead' | 'contact'; id: string; label: string }[]
  problems: string[]
}

const TYPES: [PropertyType, string][] = [
  ['land-parcels', 'Land'],
  ['large-land-parcels', 'Large land'],
  ['residential', 'Residential'],
  ['villas', 'Villa'],
  ['commercial', 'Commercial'],
  ['warehouses', 'Warehouse'],
]
const ZONES: Zone[] = ['North', 'East', 'South', 'West']
const ROLES: Contact['role'][] = ['Agent', 'Landowner', 'Seller', 'Buyer']
const HREF = { listing: '/admin/properties/', lead: '/admin/deals/leads/', contact: '/admin/deals/contacts/' } as const
const numOrUndef = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(/,/g, '')))

export function WhatsAppImport({ source, photos = [] }: { source: string; photos?: { id: string; name: string; mime: string }[] }) {
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [kept, setKept] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    api
      .post<Parsed>('/api/whatsapp', { action: 'parse', text: source })
      .then((p) => {
        if (!live) return
        setParsed(p)
        setDrafts(p.result.drafts.map((d, i) => ({ ...d, include: true, ...(d.kind === 'listing' ? { code: p.codes[i] } : {}) })))
        setContact(p.result.contact ? { ...p.result.contact, ...(p.existing_contact ? { id: p.existing_contact.id, name: p.result.contact.name || p.existing_contact.name } : {}) } : null)
      })
      .catch((e) => live && setError((e as Error).message))
    return () => {
      live = false
    }
  }, [source])

  const edit = (i: number, patch: Partial<Draft>) => setDrafts((all) => all.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const setPerson = (patch: Partial<Contact>) => setContact((c) => ({ role: 'Seller', ...(c ?? {}), ...patch }))

  async function save() {
    setBusy(true)
    setError(null)
    try {
      setSaved(await api.post<Saved>('/api/whatsapp', { action: 'save', text: parsed?.result.text ?? source, drafts: drafts.filter((d) => d.include !== false), contact, photos }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function keep(kind: 'note' | 'task') {
    setBusy(true)
    try {
      const body = parsed?.result.text || source
      if (kind === 'note') await api.post('/api/notes', { body, entity_type: 'general' })
      else await api.post('/api/tasks', { title: body.split('\n')[0].slice(0, 140), entity_type: 'general' })
      setKept(kind === 'note' ? 'Saved as a note.' : 'Saved as a task.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !parsed) return <div className="erpChat__error"><CircleAlert size={14} /> {error}</div>
  if (!parsed) return <div className="erpChat__thinking"><Loader2 size={14} className="spin" /> Reading the post…</div>

  if (saved) {
    return (
      <div className="waImport">
        <div className="waImport__done"><CircleCheck size={17} /> {saved.created.some((c) => c.type !== 'contact') ? 'Saved' : 'Not saved'}</div>
        {saved.created.map((c) => (
          <Link key={`${c.type}${c.id}`} href={`${HREF[c.type]}${c.id}`} className="waImport__link">
            {c.type === 'listing' ? <MapPin size={14} /> : <UserPlus size={14} />} {c.type === 'listing' ? 'Draft listing' : c.type === 'lead' ? 'Lead' : 'Contact'}: {c.label}
          </Link>
        ))}
        {saved.problems.map((p) => <div key={p} className="erpChat__error"><CircleAlert size={14} /> {p}</div>)}
        {saved.created.some((c) => c.type === 'listing') && <p className="waImport__muted">Drafts stay off the website until someone sets them Live.</p>}
      </div>
    )
  }

  if (parsed.result.empty) {
    return (
      <div className="waImport">
        <b>No property details found</b>
        <p className="waImport__muted">This doesn’t read like a property post or a requirement. Keep it anyway?</p>
        {kept ? (
          <p className="waImport__ok">{kept}</p>
        ) : (
          <div className="waImport__row">
            <button type="button" className="erpBtn ghost" disabled={busy} onClick={() => keep('note')}><NotebookPen size={14} /> Save as note</button>
            <button type="button" className="erpBtn ghost" disabled={busy} onClick={() => keep('task')}><SquareCheck size={14} /> Make it a task</button>
          </div>
        )}
      </div>
    )
  }

  const chosen = drafts.filter((d) => d.include !== false)
  const nListings = chosen.filter((d) => d.kind === 'listing').length
  const nLeads = chosen.length - nListings

  return (
    <div className="waImport">
      <b>{drafts.length > 1 ? `${drafts.length} properties found` : drafts[0].kind === 'lead' ? 'A requirement: new lead' : 'A property: new draft listing'}</b>
      <p className="waImport__muted">Check the details and correct anything, then save.</p>
      {drafts.map((d, i) => (
        <div key={i} className={`waImport__draft ${d.include === false ? 'is-off' : ''}`}>
          <div className="waImport__head">
            {d.kind === 'listing' ? <MapPin size={14} /> : <UserPlus size={14} />}
            <span>{d.kind === 'listing' ? `Listing ${d.code ?? ''}` : `Lead · ${d.intent}`}</span>
            {drafts.length > 1 && (
              <label className="waImport__toggle">
                <input type="checkbox" checked={d.include !== false} onChange={(e) => edit(i, { include: e.target.checked })} /> Include
              </label>
            )}
          </div>
          {d.found.length > 0 && <div className="waImport__found">{d.found.map((f) => <span key={f}>{f}</span>)}</div>}
          {d.kind === 'listing' && parsed.duplicates[i]?.length > 0 && (
            <div className="waImport__warn">
              <CircleAlert size={14} /> Looks like a listing already on file:{' '}
              {parsed.duplicates[i].map((x) => <Link key={x.id} href={`/admin/properties/${x.id}`}>{x.code} · {x.title}</Link>)}
            </div>
          )}
          <label className="waImport__field">Title<input value={d.title} onChange={(e) => edit(i, { title: e.target.value })} /></label>
          {d.kind === 'listing' ? (
            <>
              <label className="waImport__field">Location<input value={d.location ?? ''} placeholder="Village / area, taluk" onChange={(e) => edit(i, { location: e.target.value })} /></label>
              <div className="waImport__pills">{TYPES.map(([v, l]) => <button type="button" key={v} className={d.property_type === v ? 'is-on' : ''} onClick={() => edit(i, { property_type: v })}>{l}</button>)}</div>
              <div className="waImport__pills">{ZONES.map((z) => <button type="button" key={z} className={d.zone === z ? 'is-on' : ''} onClick={() => edit(i, { zone: z })}>{z}</button>)}</div>
              <div className="waImport__grid">
                <label className="waImport__field">Extent (acres)<input inputMode="decimal" value={d.extent_acres ?? ''} onChange={(e) => edit(i, { extent_acres: numOrUndef(e.target.value) })} /></label>
                <label className="waImport__field">₹ Cr per acre<input inputMode="decimal" value={d.price_per_acre_cr ?? ''} onChange={(e) => edit(i, { price_per_acre_cr: numOrUndef(e.target.value) })} /></label>
                <label className="waImport__field">Total ₹ Cr<input inputMode="decimal" value={d.price_total_cr ?? ''} onChange={(e) => edit(i, { price_total_cr: numOrUndef(e.target.value) })} /></label>
                <label className="waImport__field">₹ per sq ft<input inputMode="decimal" value={d.price_per_sqft ?? ''} onChange={(e) => edit(i, { price_per_sqft: numOrUndef(e.target.value) })} /></label>
                <label className="waImport__field">{d.built_up_sqft !== undefined ? 'Built-up (sq ft)' : 'Plot (sq ft)'}<input inputMode="decimal" value={(d.built_up_sqft ?? d.plot_area_sqft) ?? ''} onChange={(e) => edit(i, d.built_up_sqft !== undefined ? { built_up_sqft: numOrUndef(e.target.value) } : { plot_area_sqft: numOrUndef(e.target.value) })} /></label>
                <label className="waImport__field">Listing code<input value={d.code ?? ''} onChange={(e) => edit(i, { code: e.target.value.toUpperCase() })} /></label>
              </div>
            </>
          ) : (
            <div className="waImport__grid">
              <label className="waImport__field">Areas<input value={d.areas ?? ''} onChange={(e) => edit(i, { areas: e.target.value })} /></label>
              <label className="waImport__field">Size<input value={d.size ?? ''} onChange={(e) => edit(i, { size: e.target.value })} /></label>
              <label className="waImport__field">Budget<input value={d.budget ?? ''} onChange={(e) => edit(i, { budget: e.target.value })} /></label>
            </div>
          )}
        </div>
      ))}
      <div className="waImport__draft">
        <div className="waImport__head"><UserPlus size={14} /><span>{contact?.role === 'Buyer' ? 'Buyer' : 'Who sent it'}</span></div>
        {contact?.id && <p className="waImport__muted">Already in your contacts: they’ll be linked, not added again.</p>}
        <div className="waImport__grid">
          <label className="waImport__field">Name<input value={contact?.name ?? ''} onChange={(e) => setPerson({ name: e.target.value })} /></label>
          <label className="waImport__field">Phone<input value={contact?.phone ?? ''} inputMode="tel" onChange={(e) => setPerson({ phone: e.target.value })} /></label>
          {contact?.role === 'Agent' && <label className="waImport__field">Agency<input value={contact.agency ?? ''} onChange={(e) => setPerson({ agency: e.target.value })} /></label>}
        </div>
        <div className="waImport__pills">{ROLES.map((r) => <button type="button" key={r} className={contact?.role === r ? 'is-on' : ''} onClick={() => setPerson({ role: r })}>{r}</button>)}</div>
      </div>
      {photos.length > 0 && <p className="waImport__muted">{photos.length} file{photos.length === 1 ? '' : 's'} will be filed on the {nListings > 1 ? 'first ' : ''}listing; the first photo becomes its picture.</p>}
      {error && <div className="erpChat__error"><CircleAlert size={14} /> {error}</div>}
      <button type="button" className="erpBtn" disabled={!chosen.length || busy} onClick={save}>
        {busy ? <Loader2 size={15} className="spin" /> : <CircleCheck size={15} />}{' '}
        {nListings && nLeads ? `Save ${nListings} listing${nListings > 1 ? 's' : ''} and ${nLeads} lead${nLeads > 1 ? 's' : ''}` : nListings ? (nListings > 1 ? `Save ${nListings} draft listings` : 'Save draft listing') : 'Save lead'}
      </button>
    </div>
  )
}
