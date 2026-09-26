'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check, MessageCircle, Phone, Plus, X } from 'lucide-react'
import { api, timeAgo, type Audited } from './lib'
import { Avatar, Banner, ByLine, Empty, Loading, Pill } from './ui'
import { EmailButton, MeetNowButton } from './google'

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
interface Lead extends Row {
  id: string
  name: string
  kind: string
  channel: string
  stage: string
  company?: string
  phone?: string
  email?: string
  notes?: string
  property_code?: string
  created_at: string
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
const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Visit', 'Closed']
const digits = (p: string) => p.replace(/[^\d+]/g, '')
const cr = (n?: number | null) => (n == null ? 'Value TBD' : `₹${n >= 10 ? Math.round(n) : n.toFixed(1)} Cr`)

export default function DealsView() {
  const params = useSearchParams()
  const [tab, setTab] = useState<'pipeline' | 'leads' | 'docs'>(
    params.get('tab') === 'leads' ? 'leads' : params.get('tab') === 'documents' || params.get('tab') === 'docs' ? 'docs' : 'pipeline'
  )
  const [deals, setDeals] = useState<Deal[] | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [docs, setDocs] = useState<DocRequest[]>([])
  const [filter, setFilter] = useState<'In progress' | 'Closed' | 'Lost' | 'All'>('In progress')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, l, d] = await Promise.all([
        api.get<{ data: Deal[]; source: string }>('/api/transactions'),
        api.get<{ data: Lead[]; source: string }>('/api/leads'),
        api.get<{ data: DocRequest[]; source: string }>('/api/data-room'),
      ])
      setDeals(t.source === 'live' ? t.data : [])
      setLeads(l.source === 'live' ? l.data : [])
      setDocs(d.source === 'live' ? d.data : [])
    } catch (e) {
      setError((e as Error).message)
      setDeals([])
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  async function advance(l: Lead, stage: string) {
    setBusy(l.id)
    try {
      await api.patch(`/api/leads?id=${encodeURIComponent(l.id)}&stage=${stage}`)
      await load()
    } catch (e) {
      setError((e as Error).message)
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
          <p>The pipeline, the leads that feed it, and document requests from serious buyers.</p>
        </div>
        <Link href="/admin/deals/new" className="erpBtn primary">
          <Plus size={16} /> New deal
        </Link>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="erpSeg">
        <button className={tab === 'pipeline' ? 'is-on' : ''} onClick={() => setTab('pipeline')}>
          Pipeline · {(deals ?? []).filter((d) => d.outcome === 'In progress').length}
        </button>
        <button className={tab === 'leads' ? 'is-on' : ''} onClick={() => setTab('leads')}>
          Leads · {leads.length}
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
        leads.length === 0 ? (
          <div className="erpCard">
            <Empty>No leads yet. Enquiries from the website land here.</Empty>
          </div>
        ) : (
          <div className="erpListings">
            {leads.map((l) => {
              const next = LEAD_STAGES[LEAD_STAGES.indexOf(l.stage) + 1]
              return (
                <div key={l.id} className="erpCard">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div className="erpListing__title" style={{ marginTop: 0 }}>{l.name}</div>
                    <Pill label={l.stage} tone={l.stage === 'New' ? 'pending' : l.stage === 'Closed' ? 'verified' : 'progress'} />
                  </div>
                  <div className="erpListing__meta">
                    {l.kind} · {l.channel} · {timeAgo(l.created_at)}
                    {l.property_code ? ` · ${l.property_code}` : ''}
                  </div>
                  {l.company || l.phone || l.email ? <div className="erpListing__meta">{[l.company, l.phone, l.email].filter(Boolean).join(' · ')}</div> : null}
                  {l.notes ? <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-2)', marginTop: 8 }}>{l.notes}</p> : null}
                  {l.updated_by && l.updated_by !== 'Website' ? <ByLine record={{ updated_by: l.updated_by, updated_at: l.updated_at }} /> : null}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                    {l.phone ? (
                      <>
                        <a className="erpBtn ghost sm" href={`tel:${digits(l.phone)}`}>
                          <Phone size={13} /> Call
                        </a>
                        <a className="erpBtn ghost sm" href={`https://wa.me/${digits(l.phone).replace('+', '')}`} target="_blank" rel="noreferrer">
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      </>
                    ) : null}
                    {l.email ? (
                      <EmailButton
                        label="Email"
                        draft={{
                          to: l.email,
                          subject: `Your enquiry${l.property_code ? ` about ${l.property_code}` : ''} | Bhumi Estates`,
                          body: [
                            `Dear ${l.name.split(' ')[0]},`,
                            `Thank you for reaching out to Bhumi Estates${l.property_code ? ` about ${l.property_code}` : ''}. I'd be glad to help.`,
                            'Could you share a convenient time for a quick call or a site visit?',
                            'Warm regards,',
                          ].join('\n\n'),
                          entity_type: 'lead',
                          entity_id: l.id,
                          entity_label: l.name,
                        }}
                      />
                    ) : null}
                    <MeetNowButton entityType="lead" entityId={l.id} entityLabel={l.name} title={`Call with ${l.name}`} label="Meet" />
                    {next ? (
                      <button className="erpBtn primary sm" disabled={busy === l.id} onClick={() => advance(l, next)}>
                        → {next}
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
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
