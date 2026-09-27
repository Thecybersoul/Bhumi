'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, CircleAlert, Clock, MessageCircle, Plus, Trash2, UserRound } from 'lucide-react'
import {
  api,
  budget,
  cr,
  fromLocalInput,
  isSelling,
  SHOWN_STATUSES,
  stageLabel,
  timeAgo,
  toLocalInput,
  TYPE_LABEL,
  waHref,
  type Contact,
  type Lead,
  type MatchItem,
  type Shown,
} from './lib'
import { Banner, Empty, Loading, Pill } from './ui'
import { EntityPicker, NO_LINK } from './records'
import { ContactPicker } from './contacts'

interface ListingLite {
  id: string
  code: string
  title: string
  location: string
  status: string
  property_type?: string
  value_cr?: number | null
  price_total_cr?: number | null
  extent_acres?: number
  price_per_acre_cr?: number
  built_up_sqft?: number
  price_per_sqft?: number
}
type LeadLite = Pick<Lead, 'id' | 'name' | 'phone' | 'intent' | 'stage' | 'priority' | 'property_type' | 'locations' | 'budget_min_cr' | 'budget_max_cr' | 'contact_id'>

const SITE = 'https://www.bhumiestates.in'
const valueOf = (p: ListingLite) =>
  p.value_cr ?? p.price_total_cr ?? (p.extent_acres && p.price_per_acre_cr ? p.extent_acres * p.price_per_acre_cr : p.built_up_sqft && p.price_per_sqft ? (p.built_up_sqft * p.price_per_sqft) / 1e7 : null)

/** The WhatsApp message that goes with a listing: what it is, where,
    the price, and the marketplace link. */
export function listingMessage(name: string, p: ListingLite) {
  const v = valueOf(p)
  return [
    `Hello ${name.split(' ')[0]}, sharing a property that fits what you're looking for:`,
    `*${p.title}* (${p.code})`,
    [p.location, v ? cr(v) : ''].filter(Boolean).join(' · '),
    `${SITE}/marketplace/${encodeURIComponent(p.code)}`,
    'Happy to arrange a site visit. — Bhumi Estates',
  ].join('\n')
}

let listingCache: Promise<ListingLite[]> | null = null
function loadListings() {
  listingCache ??= api
    .get<{ data: ListingLite[]; source: string }>('/api/properties?admin=1')
    .then((r) => (r.source === 'live' ? r.data : []))
    .catch(() => [])
  return listingCache
}

/* ─── Listings shown to a lead ───────────────────────────── */

export function ShownPanel({ lead, onChange }: { lead: Lead; onChange?: () => void }) {
  const [rows, setRows] = useState<Shown[] | null>(null)
  const [listings, setListings] = useState<Record<string, ListingLite>>({})
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const load = useCallback(() => {
    api
      .get<{ data: Shown[] }>(`/api/lead-listings?lead_id=${lead.id}`)
      .then((r) => setRows(r.data))
      .catch((e) => {
        setError(e.message)
        setRows([])
      })
  }, [lead.id])
  useEffect(() => {
    load()
    loadListings().then((l) => setListings(Object.fromEntries(l.map((x) => [x.id, x]))))
  }, [load])

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      load()
      onChange?.()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const add = (property_id: string) => run(() => api.post('/api/lead-listings', { lead_id: lead.id, property_id }).then(() => setAdding(false)))
  const setStatus = (r: Shown, status: string) => run(() => api.patch(`/api/lead-listings?id=${r.id}`, { status }))
  const saveFeedback = (r: Shown) => run(() => api.patch(`/api/lead-listings?id=${r.id}`, { feedback }).then(() => setEditing(null)))
  const drop = (r: Shown) => confirm(`Remove ${r.property_label} from ${lead.name}'s list?`) && run(() => api.del(`/api/lead-listings?id=${r.id}`))

  return (
    <div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty>Nothing shown yet. Add listings from the suggestions below, or pick one.</Empty>
      ) : (
        rows.map((r) => {
          const p = listings[r.property_id]
          return (
            <div key={r.id} className="erpShown">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/admin/properties/${r.property_id}`} className="erpRow__title" style={{ display: 'block' }}>
                    {r.property_label}
                  </Link>
                  <div className="erpRow__sub">
                    {[p?.location, p ? cr(valueOf(p)) : '', r.visited_at ? `visited ${timeAgo(r.visited_at)}` : r.shared_at ? `shared ${timeAgo(r.shared_at)}` : `added ${timeAgo(r.created_at)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <Pill label={r.status} />
              </div>
              <div className="erpChips" style={{ marginTop: 8 }}>
                {SHOWN_STATUSES.map((s) => (
                  <button key={s} type="button" className={`erpChip sm ${r.status === s ? 'is-on' : ''}`} onClick={() => setStatus(r, s)}>
                    {s}
                  </button>
                ))}
              </div>
              {editing === r.id ? (
                <div className="erpForm" style={{ marginTop: 8 }}>
                  <textarea className="erpInput" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What did they say? Liked the frontage, road too narrow, price high…" autoFocus />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="erpBtn primary sm" onClick={() => saveFeedback(r)}>
                      Save feedback
                    </button>
                    <button type="button" className="erpBtn ghost sm" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : r.feedback ? (
                <p className="erpShown__feedback" onClick={() => (setEditing(r.id), setFeedback(r.feedback ?? ''))}>
                  “{r.feedback}”
                </p>
              ) : null}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {lead.phone && p ? (
                  <a
                    className="erpBtn ghost sm"
                    href={waHref(lead.phone, listingMessage(lead.name, p))}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => r.status === 'Shortlisted' && setStatus(r, 'Shared')}
                  >
                    <MessageCircle size={13} /> Send on WhatsApp
                  </a>
                ) : null}
                {editing !== r.id ? (
                  <button type="button" className="erpBtn ghost sm" onClick={() => (setEditing(r.id), setFeedback(r.feedback ?? ''))}>
                    {r.feedback ? 'Edit feedback' : 'Add feedback'}
                  </button>
                ) : null}
                <button type="button" className="erpBtn ghost sm" onClick={() => drop(r)} title="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })
      )}
      {adding ? (
        <div style={{ marginTop: 10 }}>
          <EntityPicker value={NO_LINK} types={['property']} label="Pick a listing" onChange={(v) => v.entity_id && add(v.entity_id)} />
        </div>
      ) : (
        <button type="button" className="erpBtn ghost block" style={{ borderStyle: 'dashed', marginTop: 6 }} onClick={() => setAdding(true)}>
          <Plus size={15} /> Add a listing
        </button>
      )}
    </div>
  )
}

/* ─── Matches ────────────────────────────────────────────── */

function Reasons({ m }: { m: MatchItem<unknown> }) {
  return (
    <div className="erpReasons">
      {m.reasons.map((r) => (
        <span key={r} className="ok">
          <Check size={11} /> {r}
        </span>
      ))}
      {m.concerns.map((r) => (
        <span key={r} className="warn">
          <CircleAlert size={11} /> {r}
        </span>
      ))}
    </div>
  )
}

/** For a lead: listings that fit, and people on the other side of the
    deal (sellers for a buyer, buyers for a seller). */
export function LeadMatches({ lead, onShortlist, onConvertWith }: { lead: Lead; onShortlist: () => void; onConvertWith: (l: LeadLite) => void }) {
  const [data, setData] = useState<{ listings: MatchItem<ListingLite>[]; leads: MatchItem<LeadLite>[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    api
      .get<{ listings: MatchItem<ListingLite>[]; leads: MatchItem<LeadLite>[] }>(`/api/matches?lead_id=${lead.id}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [lead.id])
  useEffect(load, [load])

  async function shortlist(p: ListingLite) {
    try {
      await api.post('/api/lead-listings', { lead_id: lead.id, property_id: p.id })
      load()
      onShortlist()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const selling = isSelling(lead.intent)
  const noRequirement = !lead.property_type && !lead.locations && !lead.corridor && lead.budget_min_cr == null && lead.budget_max_cr == null
  if (error) return <Banner tone="error">{error}</Banner>
  if (!data) return <Loading />
  return (
    <div>
      {noRequirement ? <Banner tone="warn">Add the requirement — type, areas and budget — to get sharper matches.</Banner> : null}
      {!selling ? (
        <>
          <div className="erpSub">Listings that fit</div>
          {data.listings.length === 0 ? (
            <Empty>No listing fits yet.</Empty>
          ) : (
            data.listings.map((m) => (
              <div key={m.item.id} className="erpMatch">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/admin/properties/${m.item.id}`} className="erpRow__title" style={{ display: 'block' }}>
                    {m.item.code} · {m.item.title}
                  </Link>
                  <div className="erpRow__sub">{[m.item.location, cr(m.item.value_cr), m.item.status].filter(Boolean).join(' · ')}</div>
                  <Reasons m={m} />
                </div>
                {m.shown ? (
                  <span className="erpPill" style={{ color: 'var(--verified)', background: 'var(--verified-bg)' }}>
                    <Check size={11} /> On list
                  </span>
                ) : (
                  <button type="button" className="erpBtn soft sm" onClick={() => shortlist(m.item)}>
                    <Plus size={13} /> Shortlist
                  </button>
                )}
              </div>
            ))
          )}
        </>
      ) : null}
      <div className="erpSub">{selling ? 'Buyers looking for this' : 'Sellers with something similar'}</div>
      {data.leads.length === 0 ? (
        <Empty>{selling ? 'No open buyer lead fits yet.' : 'No open seller lead fits yet.'}</Empty>
      ) : (
        data.leads.map((m) => (
          <div key={m.item.id} className="erpMatch">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/admin/deals/leads/${m.item.id}`} className="erpRow__title" style={{ display: 'block' }}>
                {m.item.name}
              </Link>
              <div className="erpRow__sub">
                {[m.item.intent, TYPE_LABEL[m.item.property_type ?? ''], m.item.locations, budget(m.item.budget_min_cr, m.item.budget_max_cr), stageLabel(m.item.stage)].filter(Boolean).join(' · ')}
              </div>
              <Reasons m={m} />
            </div>
            <button type="button" className="erpBtn soft sm" onClick={() => onConvertWith(m.item)} title="Open a deal between these two">
              Deal <ArrowRight size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

/** For a listing: open buyer leads that fit it. */
export function ListingBuyers({ propertyId }: { propertyId: string }) {
  const [data, setData] = useState<MatchItem<LeadLite>[] | null>(null)
  const [shown, setShown] = useState<Shown[]>([])
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    Promise.all([
      api.get<{ leads: MatchItem<LeadLite>[] }>(`/api/matches?property_id=${propertyId}`),
      api.get<{ data: Shown[] }>(`/api/lead-listings?property_id=${propertyId}`),
    ])
      .then(([m, s]) => {
        setData(m.leads)
        setShown(s.data)
      })
      .catch((e) => setError(e.message))
  }, [propertyId])
  useEffect(load, [load])

  async function shortlist(l: LeadLite) {
    try {
      await api.post('/api/lead-listings', { lead_id: l.id, property_id: propertyId })
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const [leads, setLeads] = useState<Record<string, Lead>>({})
  useEffect(() => {
    if (!shown.length) return
    api
      .get<{ data: Lead[] }>('/api/leads')
      .then((r) => setLeads(Object.fromEntries(r.data.map((l) => [l.id, l]))))
      .catch(() => {})
  }, [shown.length])

  if (error) return <Banner tone="error">{error}</Banner>
  if (!data) return <Loading />
  return (
    <div>
      <div className="erpSub" style={{ marginTop: 0 }}>Shown to</div>
      {shown.length === 0 ? (
        <Empty>Not shown to anyone yet.</Empty>
      ) : (
        shown.map((s) => (
          <div key={s.id} className="erpRow" style={{ alignItems: 'flex-start' }}>
            <span className="erpRow__icon">
              <UserRound size={16} />
            </span>
            <div className="erpRow__body">
              <Link href={`/admin/deals/leads/${s.lead_id}`} className="erpRow__title" style={{ display: 'block' }}>
                {leads[s.lead_id]?.name ?? 'Lead'}
              </Link>
              <div className="erpRow__sub" style={{ whiteSpace: 'normal' }}>
                {s.feedback ? `“${s.feedback}” · ` : ''}
                {timeAgo(s.updated_at ?? s.created_at)}
              </div>
            </div>
            <Pill label={s.status} />
          </div>
        ))
      )}
      <div className="erpSub">Buyers it could suit</div>
      {data.filter((m) => !m.shown).length === 0 ? (
        <Empty>No other open buyer lead fits.</Empty>
      ) : (
        data
          .filter((m) => !m.shown)
          .map((m) => (
            <div key={m.item.id} className="erpMatch">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/admin/deals/leads/${m.item.id}`} className="erpRow__title" style={{ display: 'block' }}>
                  {m.item.name}
                </Link>
                <div className="erpRow__sub">{[TYPE_LABEL[m.item.property_type ?? ''], m.item.locations, budget(m.item.budget_min_cr, m.item.budget_max_cr)].filter(Boolean).join(' · ')}</div>
                <Reasons m={m} />
              </div>
              <button type="button" className="erpBtn soft sm" onClick={() => shortlist(m.item)}>
                <Plus size={13} /> Shortlist
              </button>
            </div>
          ))
      )}
    </div>
  )
}

/* ─── Convert to a deal ──────────────────────────────────── */

export function ConvertPanel({ lead, preset, onCancel }: { lead: Lead; preset?: LeadLite | null; onCancel: () => void }) {
  const router = useRouter()
  const selling = isSelling(lead.intent)
  const [shown, setShown] = useState<Shown[]>([])
  const [listing, setListing] = useState<string>('')
  const [other, setOther] = useState<{ kind: 'lead' | 'contact'; id: string; name: string } | null>(preset ? { kind: 'lead', id: preset.id, name: preset.name } : null)
  const [picking, setPicking] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (preset) setOther({ kind: 'lead', id: preset.id, name: preset.name })
  }, [preset])
  useEffect(() => {
    api
      .get<{ data: Shown[] }>(`/api/lead-listings?lead_id=${lead.id}`)
      .then((r) => {
        setShown(r.data)
        const best = r.data.find((x) => x.status === 'Offer made') ?? r.data.find((x) => x.status === 'Interested')
        if (best) setListing(best.property_id)
      })
      .catch(() => {})
  }, [lead.id])

  const options = useMemo(() => shown.filter((s) => s.status !== 'Not interested'), [shown])

  async function go() {
    setBusy(true)
    setError(null)
    try {
      const r = await api.post<{ id?: string }>(`/api/leads/${lead.id}/convert`, {
        property_id: listing || undefined,
        counterpart_lead_id: other?.kind === 'lead' ? other.id : undefined,
        counterpart_contact_id: other?.kind === 'contact' ? other.id : undefined,
        deal_value_cr: value.trim() ? Number(value) : undefined,
      })
      router.push(r.id ? `/admin/deals/${r.id}` : '/admin/deals')
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="erpForm">
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-2)' }}>
        Opens a deal with <b>{lead.name}</b> as the {selling ? 'seller' : 'buyer'}. The lead is marked Converted and links to it.
      </p>
      <label className="erpField">
        <span>Listing</span>
        <select className="erpInput" value={listing} onChange={(e) => setListing(e.target.value)}>
          <option value="">Off-market / not listed</option>
          {options.map((s) => (
            <option key={s.id} value={s.property_id}>
              {s.property_label} — {s.status}
            </option>
          ))}
        </select>
      </label>
      <div className="erpField">
        <span>{selling ? 'Buyer' : 'Seller'} (optional)</span>
        {other ? (
          <div className="erpBanner ok" style={{ marginBottom: 0 }}>
            <UserRound size={15} /> <span style={{ flex: 1 }}>{other.name}</span>
            <button type="button" className="erpBtn ghost sm" onClick={() => setOther(null)}>
              Change
            </button>
          </div>
        ) : picking ? (
          <ContactPicker
            defaultRole={selling ? 'Buyer' : 'Seller'}
            autoFocus
            onPick={(c: Contact) => {
              setOther({ kind: 'contact', id: c.id, name: c.name })
              setPicking(false)
            }}
          />
        ) : (
          <button type="button" className="erpBtn ghost" onClick={() => setPicking(true)}>
            <Plus size={14} /> Pick from contacts
          </button>
        )}
      </div>
      <label className="erpField">
        <span>Deal value (₹ crore) — leave blank to use the listing price</span>
        <input className="erpInput" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="erpBtn primary" onClick={go} disabled={busy}>
          {busy ? 'Opening the deal…' : 'Create the deal'}
        </button>
        <button type="button" className="erpBtn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ─── Tasks on a record ──────────────────────────────────── */

interface TaskLite {
  id: string
  title: string
  status: 'Open' | 'Done'
  due_at?: string | null
  entity_type: string
  entity_id?: string | null
  created_by?: string | null
}

/** Open follow-ups on one record, with a one-line way to add the next. */
export function RelatedTasks({ entityType, entityId, entityLabel, suggest }: { entityType: string; entityId: string; entityLabel: string; suggest?: string }) {
  const [tasks, setTasks] = useState<TaskLite[] | null>(null)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    api
      .get<{ data: TaskLite[]; source: string }>('/api/tasks')
      .then((r) => setTasks((r.source === 'live' ? r.data : []).filter((t) => t.entity_type === entityType && t.entity_id === entityId)))
      .catch(() => setTasks([]))
  }, [entityType, entityId])
  useEffect(load, [load])

  async function add() {
    if (!title.trim()) return
    setError(null)
    try {
      await api.post('/api/tasks', { title: title.trim(), due_at: due || undefined, entity_type: entityType, entity_id: entityId, entity_label: entityLabel })
      setTitle('')
      setDue('')
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  async function toggle(t: TaskLite) {
    setTasks((p) => p?.map((x) => (x.id === t.id ? { ...x, status: x.status === 'Open' ? 'Done' : 'Open' } : x)) ?? null)
    await api.patch(`/api/tasks/${t.id}`, { status: t.status === 'Open' ? 'Done' : 'Open' }).catch((e) => setError(e.message))
  }

  const open = (tasks ?? []).filter((t) => t.status === 'Open')
  const done = (tasks ?? []).filter((t) => t.status === 'Done').slice(0, 3)
  return (
    <div>
      {tasks === null ? (
        <Loading />
      ) : open.length + done.length === 0 ? (
        <Empty>No follow-ups yet.</Empty>
      ) : (
        [...open, ...done].map((t) => {
          const late = t.status === 'Open' && t.due_at && new Date(t.due_at).getTime() < Date.now()
          return (
            <div key={t.id} className="erpRow" style={{ alignItems: 'flex-start' }}>
              <button type="button" className={`erpTick ${t.status === 'Done' ? 'is-on' : ''}`} onClick={() => toggle(t)} title={t.status === 'Open' ? 'Mark done' : 'Reopen'}>
                {t.status === 'Done' ? <Check size={13} /> : null}
              </button>
              <div className="erpRow__body">
                <div className="erpRow__title" style={{ textDecoration: t.status === 'Done' ? 'line-through' : undefined, color: t.status === 'Done' ? 'var(--muted)' : undefined }}>
                  {t.title}
                </div>
                <div className="erpRow__sub" style={{ color: late ? 'var(--flagged)' : undefined, fontWeight: late ? 700 : undefined }}>
                  <Clock size={11} style={{ verticalAlign: -1 }} />{' '}
                  {t.due_at ? `${late ? 'Overdue · ' : ''}${new Date(t.due_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'No due date'}
                </div>
              </div>
            </div>
          )
        })
      )}
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="erpForm" style={{ marginTop: 10 }}>
        <input className="erpInput" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={suggest ?? 'Next step, e.g. Call back about the site visit'} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="datetime-local" className="erpInput" value={toLocalInput(due)} onChange={(e) => setDue(fromLocalInput(e.target.value))} style={{ flex: 1 }} />
          <button type="button" className="erpBtn primary" onClick={add} disabled={!title.trim()}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  )
}
