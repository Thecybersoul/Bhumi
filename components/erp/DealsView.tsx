'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check, Columns3, List, Plus, Search, UserPlus, X } from 'lucide-react'
import { api, timeAgo, type Audited, type Contact, type Lead } from './lib'
import { Avatar, Banner, ByLine, Empty, Loading, Pill } from './ui'
import { LeadsBoard } from './LeadsBoard'
import { ContactActions } from './contacts'

type Row = Record<string, unknown> & Audited
interface Deal extends Row {
  id: string
  reference: string
  property_label: string
  stage: string
  outcome: string
  deal_value_cr?: number | null
  buyer_name?: string
  seller_name?: string
  opened_at: string
}
interface DocRequest extends Row {
  id: string
  name: string
  parcel_code: string
  parcel_label: string
  organisation?: string
  email?: string
  phone?: string
  buyer_type: string
  ticket_size?: string
  status: 'Pending' | 'Approved' | 'Declined'
  created_at: string
}

const STAGES = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
const cr = (n?: number | null) => (n == null ? 'Value TBD' : `₹${n >= 10 ? Math.round(n) : n.toFixed(1)} Cr`)

export default function DealsView() {
  const params = useSearchParams()
  const [tab, setTab] = useState<'pipeline' | 'leads' | 'contacts' | 'docs'>(() => {
    const t = params.get('tab')
    return t === 'leads' ? 'leads' : t === 'contacts' ? 'contacts' : t === 'documents' || t === 'docs' ? 'docs' : 'pipeline'
  })
  const [deals, setDeals] = useState<Deal[] | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [docs, setDocs] = useState<DocRequest[]>([])
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [contactsReady, setContactsReady] = useState(true)
  const [cq, setCq] = useState('')
  const [role, setRole] = useState('All')
  const [leadView, setLeadView] = useState<'board' | 'list'>('board')
  const [filter, setFilter] = useState<'In progress' | 'Closed' | 'Lost' | 'All'>('In progress')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, l, d, c] = await Promise.all([
        api.get<{ data: Deal[]; source: string }>('/api/transactions'),
        api.get<{ data: Lead[]; source: string }>('/api/leads'),
        api.get<{ data: DocRequest[]; source: string }>('/api/data-room'),
        api.get<{ data: Contact[]; ready: boolean }>('/api/contacts').catch(() => ({ data: [] as Contact[], ready: false })),
      ])
      setDeals(t.source === 'live' ? t.data : [])
      setLeads(l.source === 'live' ? l.data : [])
      setDocs(d.source === 'live' ? d.data : [])
      setContacts(c.data)
      setContactsReady(c.ready)
    } catch (e) {
      setError((e as Error).message)
      setDeals([])
    }
  }, [])
  useEffect(() => {
    load()
    try {
      if (localStorage.getItem('bhumi.leadView') === 'list') setLeadView('list')
    } catch {}
  }, [load])

  function switchLeadView(v: 'board' | 'list') {
    setLeadView(v)
    try {
      localStorage.setItem('bhumi.leadView', v)
    } catch {}
  }

  async function advance(l: Lead, stage: string) {
    setBusy(l.id)
    setLeads((p) => p.map((x) => (x.id === l.id ? { ...x, stage: stage as Lead['stage'] } : x)))
    try {
      await api.patch(`/api/leads?id=${encodeURIComponent(l.id)}&stage=${stage}`)
    } catch (e) {
      setError((e as Error).message)
      load()
    } finally {
      setBusy(null)
    }
  }

  async function decide(d: DocRequest, status: 'Approved' | 'Declined') {
    setBusy(d.id)
    try {
      await api.patch(`/api/data-room?id=${encodeURIComponent(d.id)}&status=${status}`)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const shown = (deals ?? []).filter((d) => filter === 'All' || d.outcome === filter)

  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Deals</h1>
          <p>Leads, the deals they become, the people behind both, and document requests from serious buyers.</p>
        </div>
        <div className="erpHead__actions">
          <Link href="/admin/deals/leads/new" className="erpBtn soft">
            <UserPlus size={16} /> New lead
          </Link>
          <Link href="/admin/deals/new" className="erpBtn primary">
            <Plus size={16} /> New deal
          </Link>
        </div>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="erpSeg">
        <button className={tab === 'leads' ? 'is-on' : ''} onClick={() => setTab('leads')}>
          Leads · {leads.filter((l) => !['Converted', 'Lost', 'Closed'].includes(l.stage)).length}
        </button>
        <button className={tab === 'pipeline' ? 'is-on' : ''} onClick={() => setTab('pipeline')}>
          Deals · {(deals ?? []).filter((d) => d.outcome === 'In progress').length}
        </button>
        <button className={tab === 'contacts' ? 'is-on' : ''} onClick={() => setTab('contacts')}>
          Contacts · {contacts?.length ?? 0}
        </button>
        <button className={tab === 'docs' ? 'is-on' : ''} onClick={() => setTab('docs')}>
          Document requests · {docs.filter((d) => d.status === 'Pending').length}
        </button>
      </div>

      {deals === null ? (
        <Loading />
      ) : tab === 'pipeline' ? (
        <>
          <div className="erpChips" style={{ marginBottom: 14 }}>
            {(['In progress', 'Closed', 'Lost', 'All'] as const).map((f) => (
              <button key={f} className={`erpChip ${filter === f ? 'is-on' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <div className="erpCard">
              <Empty>No deals here yet. Start one with “New deal”.</Empty>
            </div>
          ) : (
            <div className="erpListings">
              {shown.map((d) => {
                const idx = STAGES.indexOf(d.stage)
                return (
                  <Link key={d.id} href={`/admin/deals/${d.id}`} className="erpCard" style={{ display: 'block', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span className="erpListing__code">{d.reference}</span>
                      <Pill label={d.outcome === 'In progress' ? d.stage : d.outcome} tone={d.outcome === 'In progress' ? 'progress' : d.outcome} />
                    </div>
                    <div className="erpListing__title">{d.property_label}</div>
                    <div className="erpListing__meta">
                      {[d.buyer_name, d.seller_name].filter(Boolean).join(' ↔ ') || 'No parties yet'} · {cr(d.deal_value_cr)}
                    </div>
                    <div className="erpStages">
                      {STAGES.slice(0, 4).map((s, i) => (
                        <i key={s} className={i <= idx ? 'on' : ''} />
                      ))}
                    </div>
                    <ByLine record={d} createdAt={d.opened_at} compact />
                  </Link>
                )
              })}
            </div>
          )}
        </>
      ) : tab === 'leads' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
            <button className={`erpBtn ${leadView === 'board' ? 'soft' : 'ghost'} sm`} onClick={() => switchLeadView('board')}>
              <Columns3 size={14} /> Board
            </button>
            <button className={`erpBtn ${leadView === 'list' ? 'soft' : 'ghost'} sm`} onClick={() => switchLeadView('list')}>
              <List size={14} /> List
            </button>
          </div>
          <LeadsBoard leads={leads} view={leadView} busy={busy} onAdvance={advance} />
        </>
      ) : tab === 'contacts' ? (
        !contactsReady ? (
          <div className="erpCard">
            <Empty>The contact book needs database migration 015. Open Setup in the sidebar to apply it.</Empty>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ position: 'relative', flex: '1 1 260px' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }} />
                <input className="erpInput" style={{ paddingLeft: 32 }} placeholder="Search name, phone, company" value={cq} onChange={(e) => setCq(e.target.value)} />
              </div>
              <Link href="/admin/deals/contacts/new" className="erpBtn primary">
                <UserPlus size={16} /> New contact
              </Link>
            </div>
            <div className="erpChips" style={{ marginBottom: 12 }}>
              {['All', 'Buyer', 'Seller', 'Landowner', 'Investor', 'Broker', 'Lawyer'].map((r) => (
                <button key={r} className={`erpChip ${role === r ? 'is-on' : ''}`} onClick={() => setRole(r)}>
                  {r}
                </button>
              ))}
            </div>
            {(() => {
              const n = cq.trim().toLowerCase()
              const d = n.replace(/\D/g, '')
              const list = (contacts ?? []).filter(
                (c) =>
                  (role === 'All' || c.roles?.includes(role)) &&
                  (!n || `${c.name} ${c.company ?? ''} ${c.email} ${c.city ?? ''}`.toLowerCase().includes(n) || (d.length >= 3 && c.phone.replace(/\D/g, '').includes(d)))
              )
              return list.length === 0 ? (
                <div className="erpCard">
                  <Empty>{contacts?.length ? 'Nobody matches.' : 'No contacts yet. Leads and deal parties are added here automatically.'}</Empty>
                </div>
              ) : (
                <div className="erpListings">
                  {list.map((c) => (
                    <div key={c.id} className="erpCard">
                      <Link href={`/admin/deals/contacts/${c.id}`} style={{ display: 'block', color: 'inherit' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Avatar name={c.name} size={34} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="erpListing__title" style={{ marginTop: 0 }}>{c.name}</div>
                            <div className="erpListing__meta">{[c.roles?.join(', '), c.company, c.city].filter(Boolean).join(' · ') || 'No role yet'}</div>
                          </div>
                        </div>
                        <div className="erpListing__meta" style={{ marginTop: 8 }}>
                          {[c.phone, c.email].filter(Boolean).join(' · ')}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
                          {c.open_leads ? <Pill label={`${c.open_leads} open lead${c.open_leads > 1 ? 's' : ''}`} tone="new" /> : null}
                          {c.deal_count ? <Pill label={`${c.deal_count} deal${c.deal_count > 1 ? 's' : ''}`} tone="progress" /> : null}
                        </div>
                      </Link>
                      <ContactActions name={c.name} phone={c.phone} />
                    </div>
                  ))}
                </div>
              )
            })()}
          </>
        )
      ) : docs.length === 0 ? (
        <div className="erpCard">
          <Empty>No document requests.</Empty>
        </div>
      ) : (
        <div className="erpListings">
          {docs.map((d) => (
            <div key={d.id} className="erpCard">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div className="erpListing__title" style={{ marginTop: 0 }}>{d.name}</div>
                <Pill label={d.status} />
              </div>
              <div className="erpListing__meta">
                {d.parcel_label || d.parcel_code} · {d.buyer_type} · {d.ticket_size || 'ticket n/a'}
              </div>
              <div className="erpListing__meta">{[d.organisation, d.email, d.phone].filter(Boolean).join(' · ')}</div>
              {d.status !== 'Pending' && d.updated_by ? <ByLine record={{ updated_by: d.updated_by, updated_at: d.updated_at }} /> : null}
              {d.status === 'Pending' ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button className="erpBtn primary sm" disabled={busy === d.id} onClick={() => decide(d, 'Approved')}>
                    <Check size={13} /> Approve
                  </button>
                  <button className="erpBtn danger sm" disabled={busy === d.id} onClick={() => decide(d, 'Declined')}>
                    <X size={13} /> Decline
                  </button>
                </div>
              ) : null}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <Avatar name={d.updated_by || 'Website'} size={16} />
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted)' }}>Requested {timeAgo(d.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
