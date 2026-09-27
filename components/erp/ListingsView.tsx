'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, MapPin, Plus, Search } from 'lucide-react'
import { api, type Audited } from './lib'
import { Avatar, Banner, Empty, Loading, Pill } from './ui'

interface Listing extends Audited {
  id: string
  code: string
  title: string
  status: string
  location: string
  img_url?: string
  extent_acres?: number
  built_up_sqft?: number
  price_total_cr?: number
  price_per_acre_cr?: number
  price_per_sqft?: number
  price_type?: string
}

function price(p: Listing) {
  if (p.price_total_cr) return `₹${p.price_total_cr} Cr`
  if (p.price_per_acre_cr) return `₹${p.price_per_acre_cr} Cr / acre`
  if (p.price_per_sqft) return `₹${p.price_per_sqft.toLocaleString('en-IN')} / sq ft`
  return p.price_type ?? ''
}

/* The marketplace inventory: a photo card per listing, with price, the
   number of documents on file and who touched it last. */
export default function ListingsView() {
  const [items, setItems] = useState<Listing[] | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('live')
  const [docs, setDocs] = useState<Record<string, number>>({})
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | 'Draft' | 'Live' | 'Reserved' | 'Sold'>('All')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [going, setGoing] = useState<string | null>(null)

  const load = () =>
    Promise.all([
      api.get<{ data: Listing[]; source: 'live' | 'fallback' }>('/api/properties?admin=1'),
      api.get<{ data: { entity_id: string | null }[] }>('/api/documents?entity_type=property').catch(() => ({ data: [] })),
    ])
      .then(([p, d]) => {
        setItems(p.data)
        setSource(p.source)
        const c: Record<string, number> = {}
        for (const x of d.data) if (x.entity_id) c[x.entity_id] = (c[x.entity_id] ?? 0) + 1
        setDocs(c)
      })
      .catch((e) => {
        setError((e as Error).message)
        setItems([])
      })

  useEffect(() => {
    load()
  }, [])

  /* Going live is always one deliberate step: a draft (from the Property
     Register, a WhatsApp post or by hand) is checked, then made Live here
     or on its page. */
  async function goLive(e: React.MouseEvent, p: { id: string; code: string; title: string }) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Make ${p.code} · ${p.title} live on the website?

It appears on the public marketplace straight away.`)) return
    setGoing(p.id)
    try {
      await api.put(`/api/properties/${encodeURIComponent(p.id)}`, { status: 'Live' })
      setNote(`${p.code} is live on the website.`)
      load()
    } catch (err) {
      setNote((err as Error).message)
    } finally {
      setGoing(null)
    }
  }

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase()
    return (items ?? []).filter((p) => (status === 'All' || p.status === status) && (!n || `${p.code} ${p.title} ${p.location}`.toLowerCase().includes(n)))
  }, [items, q, status])

  return (
    <div>
      <div className="erpHead">
        <div>
          <h1>Listings</h1>
          <p>What’s on the marketplace, its documents, and who changed it last.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/admin/properties/new" className="erpBtn primary">
            <Plus size={16} /> New listing
          </Link>
        </div>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {note ? <Banner tone="ok">{note}</Banner> : null}
      {(() => {
        const drafts = (items ?? []).filter((p) => p.status === 'Draft').length
        return drafts > 0 && status !== 'Draft' ? (
          <Banner>
            {drafts} draft listing{drafts === 1 ? '' : 's'} waiting to be checked and made live (new Property Register entries arrive here automatically).{' '}
            <button type="button" className="erpLinkBtn" onClick={() => setStatus('Draft')}>Review drafts</button>
          </Banner>
        ) : null
      })()}
      {source === 'fallback' ? <Banner>Showing the built-in listings. Editing one saves them all to the live database.</Banner> : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: 13, color: 'var(--muted)' }} />
          <input className="erpInput" style={{ paddingLeft: 32 }} placeholder="Search code, title, location" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="erpChips">
          {(['All', 'Draft', 'Live', 'Reserved', 'Sold'] as const).map((s) => (
            <button key={s} className={`erpChip ${status === s ? 'is-on' : ''}`} onClick={() => setStatus(s)}>
              {s} {s === 'All' ? (items?.length ?? '') : (items ?? []).filter((p) => p.status === s).length}
            </button>
          ))}
        </div>
      </div>

      {items === null ? (
        <Loading />
      ) : shown.length === 0 ? (
        <div className="erpCard">
          <Empty>No listings match.</Empty>
        </div>
      ) : (
        <div className="erpListings">
          {shown.map((p) => (
            <Link key={p.id} href={`/admin/properties/${encodeURIComponent(p.id)}`} className="erpListing">
              <span className="erpListing__img" style={{ backgroundImage: p.img_url ? `url(${p.img_url})` : undefined }} />
              <div className="erpListing__body">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span className="erpListing__code">{p.code}</span>
                  <Pill label={p.status} />
                </div>
                <div className="erpListing__title">{p.title}</div>
                <div className="erpListing__meta">
                  <MapPin size={11} style={{ verticalAlign: -1 }} /> {p.location} · {p.built_up_sqft ? `${p.built_up_sqft.toLocaleString('en-IN')} sq ft` : `${p.extent_acres ?? 0} acres`}
                </div>
                <div className="erpListing__foot">
                  <span className="erpListing__price">{price(p)}</span>
                  {p.status === 'Draft' ? (
                    <button type="button" className="erpGoLive" onClick={(e) => goLive(e, p)} disabled={going === p.id}>
                      {going === p.id ? 'Publishing…' : 'Go live'}
                    </button>
                  ) : null}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', fontWeight: 700, color: docs[p.id] ? 'var(--gold-deep)' : 'var(--muted)' }}>
                      <FileText size={13} /> {docs[p.id] ?? 0}
                    </span>
                    {p.updated_by || p.created_by ? <Avatar name={p.updated_by || p.created_by} size={20} /> : null}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
