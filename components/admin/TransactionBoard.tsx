'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/site/Icon'
import type {
  PropertyTransaction,
  TransactionStage,
  TransactionOutcome,
  TransactionMeeting,
  MeetingStatus,
  Representing,
  CommissionType,
  Property,
} from '@/lib/types'

/* The deal pipeline. A transaction advances through five stages;
   "Closed" and "Lost" are the two ways it stops moving. Meetings
   and documents are patched as whole arrays — the client already
   holds the current one, so it sends the array back complete
   rather than the server trying to diff it, the same approach
   verification stages use. */

const STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
const MEETING_CYCLE: MeetingStatus[] = ['Scheduled', 'Completed', 'Cancelled']

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function commissionLabel(t: PropertyTransaction) {
  if (t.commission_value == null) return '—'
  return t.commission_type === 'Percentage' ? `${t.commission_value}%` : `₹${t.commission_value} L`
}

export default function TransactionBoard({
  transactions: initial,
  properties,
  source,
}: {
  transactions: PropertyTransaction[]
  properties: Property[]
  source: 'live' | 'fallback'
}) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initial)
  const [filter, setFilter] = useState<'all' | TransactionOutcome>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [meetingFormFor, setMeetingFormFor] = useState<string | null>(null)
  const [docFormFor, setDocFormFor] = useState<string | null>(null)

  const shown = filter === 'all' ? transactions : transactions.filter((t) => t.outcome === filter)

  const aggregate = useMemo(() => {
    const active = transactions.filter((t) => t.outcome === 'In progress')
    const closed = transactions.filter((t) => t.outcome === 'Closed')
    const closedValue = closed.reduce((sum, t) => sum + (t.deal_value_cr ?? 0), 0)
    const upcoming = transactions
      .flatMap((t) => t.meetings.map((m) => ({ ...m, txnRef: t.reference, txnId: t.id })))
      .filter((m) => m.status === 'Scheduled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    const byStage = STAGES.map((s) => ({ stage: s, count: active.filter((t) => t.stage === s).length }))
    return {
      total: transactions.length,
      active: active.length,
      closed: closed.length,
      lost: transactions.filter((t) => t.outcome === 'Lost').length,
      closedValue,
      upcoming,
      byStage,
    }
  }, [transactions])

  function say(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  function patchLocal(id: string, patch: Partial<PropertyTransaction>) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  async function sendPatch(id: string, body: Record<string, unknown>, busyKey: string, label: string) {
    setBusy(busyKey)
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Update failed')
      say(data.persisted ? label : `${label} (not persisted — no database)`)
      if (data.persisted) router.refresh()
    } catch (e) {
      // The optimistic update already applied stands — reverting to
      // the page-load snapshot would erase every other local change
      // made this session, not just this one failed request.
      say(`Could not save: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  async function setStage(t: PropertyTransaction, stage: TransactionStage) {
    if (t.stage === stage || busy) return
    const outcome: TransactionOutcome = stage === 'Closed' ? 'Closed' : t.outcome === 'Closed' ? 'In progress' : t.outcome
    const closed_at = stage === 'Closed' ? t.closed_at ?? new Date().toISOString() : outcome === 'In progress' ? null : t.closed_at
    patchLocal(t.id, { stage, outcome, closed_at })
    await sendPatch(t.id, { stage }, `${t.id}:stage`, `Stage set to ${stage}`)
  }

  async function markLost(t: PropertyTransaction) {
    if (busy) return
    const reason = window.prompt('Why was this deal lost? This stays on the record.')
    if (reason === null) return
    patchLocal(t.id, { outcome: 'Lost', closed_at: new Date().toISOString(), lost_reason: reason })
    await sendPatch(t.id, { mark_lost: true, lost_reason: reason }, `${t.id}:lost`, 'Marked lost')
  }

  async function reopen(t: PropertyTransaction) {
    if (busy) return
    patchLocal(t.id, { outcome: 'In progress', closed_at: null, lost_reason: '' })
    await sendPatch(t.id, { reopen: true }, `${t.id}:reopen`, 'Reopened')
  }

  async function toggleCommission(t: PropertyTransaction) {
    if (busy) return
    const next = !t.commission_collected
    patchLocal(t.id, { commission_collected: next })
    await sendPatch(
      t.id,
      { commission_collected: next },
      `${t.id}:commission`,
      next ? 'Commission marked collected' : 'Commission marked pending'
    )
  }

  async function addMeeting(t: PropertyTransaction, form: FormData) {
    const title = String(form.get('title') ?? '').trim()
    const when = String(form.get('when') ?? '')
    if (!title || !when) return
    const meeting: TransactionMeeting = {
      id: crypto.randomUUID(),
      title: title.slice(0, 160),
      with: String(form.get('with') ?? '').slice(0, 160),
      scheduled_at: new Date(when).toISOString(),
      status: 'Scheduled',
      notes: String(form.get('notes') ?? '').slice(0, 300),
    }
    const meetings = [...t.meetings, meeting]
    patchLocal(t.id, { meetings })
    setMeetingFormFor(null)
    await sendPatch(t.id, { meetings }, `${t.id}:meeting`, 'Meeting added')
  }

  async function cycleMeeting(t: PropertyTransaction, meetingId: string) {
    if (busy) return
    const meetings = t.meetings.map((m) =>
      m.id === meetingId ? { ...m, status: MEETING_CYCLE[(MEETING_CYCLE.indexOf(m.status) + 1) % MEETING_CYCLE.length] } : m
    )
    patchLocal(t.id, { meetings })
    await sendPatch(t.id, { meetings }, `${t.id}:meetingstatus`, 'Meeting updated')
  }

  async function addDocument(t: PropertyTransaction, form: FormData) {
    const label = String(form.get('label') ?? '').trim()
    const url = String(form.get('url') ?? '').trim()
    if (!label || !url) return
    const documents = [...t.documents, { id: crypto.randomUUID(), label: label.slice(0, 120), url: url.slice(0, 500) }]
    patchLocal(t.id, { documents })
    setDocFormFor(null)
    await sendPatch(t.id, { documents }, `${t.id}:document`, 'Document added')
  }

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Transactions</h1>
          <p>
            Every parcel or unit actually being bought or sold through Bhumi Estates — linked to a listing or
            standing alone for an off-market deal. Click a stage to move a deal along it.
          </p>
        </div>
        <div className="row-wrap" style={{ gap: 10 }}>
          <span className={`sourcePill ${source === 'live' ? 'is-live' : 'is-fallback'}`}>
            {source === 'live' ? 'Live database' : 'Seeded data'}
          </span>
          <button className="btn btn-sm btn-primary" onClick={() => setShowNew((v) => !v)}>
            {showNew ? 'Close' : '+ New transaction'}
          </button>
        </div>
      </div>

      <div className="statRow">
        <div className="statTile">
          <span className="statTile__value">{aggregate.total}</span>
          <span className="statTile__label">Transactions on record</span>
          <span className="statTile__note">{aggregate.active} in progress</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{aggregate.closed}</span>
          <span className="statTile__label">Closed</span>
          <span className="statTile__note">
            {aggregate.closedValue ? `₹${aggregate.closedValue.toLocaleString('en-IN')} Cr total` : 'No value on record yet'}
          </span>
        </div>
        <div className="statTile is-flagged">
          <span className="statTile__value">{aggregate.lost}</span>
          <span className="statTile__label">Lost</span>
          <span className="statTile__note">
            {aggregate.total ? Math.round((aggregate.lost / aggregate.total) * 100) : 0}% of transactions on record
          </span>
        </div>
        <div className="statTile is-gold">
          <span className="statTile__value">{aggregate.upcoming.length}</span>
          <span className="statTile__label">Scheduled meetings</span>
          <span className="statTile__note">
            {aggregate.upcoming[0] ? `Next: ${fmtDateTime(aggregate.upcoming[0].scheduled_at)}` : 'None on the calendar'}
          </span>
        </div>
      </div>

      <div className="adminGrid two" style={{ marginBottom: 20 }}>
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Active pipeline by stage</span>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {aggregate.byStage.map((s) => {
              const max = Math.max(...aggregate.byStage.map((x) => x.count), 1)
              return (
                <div key={s.stage}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{s.stage}</span>
                    <strong style={{ color: 'var(--navy)' }}>{s.count}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.count / max) * 100}%`, height: '100%', background: 'var(--navy-600)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Meetings</span>
          </div>
          {aggregate.upcoming.length === 0 ? (
            <p style={{ fontSize: '.83rem', color: 'var(--muted)' }}>Nothing scheduled.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {aggregate.upcoming.slice(0, 6).map((m) => (
                <div key={m.id} className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem' }}>
                  <span style={{ color: 'var(--ink-2)' }}>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)', marginRight: 8 }}>{m.txnRef}</span>
                    {m.title}
                  </span>
                  <strong style={{ color: 'var(--navy)', whiteSpace: 'nowrap' }}>{fmtDateTime(m.scheduled_at)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewTransactionForm
          properties={properties}
          onCreated={(t) => {
            setTransactions((prev) => [t, ...prev])
            setShowNew(false)
            say('Transaction opened')
            router.refresh()
          }}
          onError={say}
        />
      )}

      <div className="row-wrap" style={{ marginBottom: 18 }}>
        {(['all', 'In progress', 'Closed', 'Lost'] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? 'selected' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${transactions.length})` : `${f} (${transactions.filter((t) => t.outcome === f).length})`}
          </button>
        ))}
      </div>

      <div className="pipeline">
        {shown.length === 0 && (
          <div className="emptyPanel">
            <Icon name="handshake" size={26} />
            <h3>No transactions yet</h3>
            <p>Open the first one with "New transaction" above.</p>
          </div>
        )}

        {shown.map((t) => (
          <article
            key={t.id}
            className={`pipelineCase ${
              t.outcome === 'Lost' ? 'is-flagged' : t.outcome === 'Closed' ? 'is-verified' : 'is-progress'
            }`}
          >
            <div className="pipelineCase__head">
              <div>
                <span className="pipelineCase__ref">
                  {t.reference} {t.off_market && <span className="badge badge-navy">Off-market</span>}
                </span>
                <div className="pipelineCase__label">{t.property_label}</div>
                <div className="pipelineCase__meta">
                  {t.buyer_name && `Buyer: ${t.buyer_name}`}
                  {t.seller_name && ` · Seller: ${t.seller_name}`}
                  {` · Representing ${t.representing}`}
                  {t.advisor && ` · ${t.advisor}`}
                </div>
              </div>
              <div className="row-wrap">
                <span
                  className={`badge badge-${t.outcome === 'Closed' ? 'verified' : t.outcome === 'Lost' ? 'flagged' : 'progress'}`}
                >
                  {t.outcome}
                </span>
                {t.deal_value_cr ? (
                  <span style={{ fontSize: '.76rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                    ₹{t.deal_value_cr} Cr
                  </span>
                ) : null}
              </div>
            </div>

            {t.outcome === 'Lost' ? (
              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                {t.lost_reason && (
                  <p style={{ fontSize: '.83rem', color: 'var(--flagged)', lineHeight: 1.6 }}>
                    <Icon name="flag" size={13} /> {t.lost_reason}
                  </p>
                )}
                <button className="btn btn-sm btn-ghost" onClick={() => reopen(t)} disabled={busy === `${t.id}:reopen`}>
                  Reopen
                </button>
              </div>
            ) : (
              <div className="pipelineTrack txnTrack">
                {STAGES.map((s, i) => {
                  const currentIdx = STAGES.indexOf(t.stage)
                  const tone = i < currentIdx ? 'is-verified' : i === currentIdx ? 'is-progress' : ''
                  return (
                    <button
                      key={s}
                      className={`pipelineStage ${tone}`}
                      onClick={() => setStage(t, s)}
                      disabled={busy === `${t.id}:stage`}
                      title={`Set stage to ${s}`}
                    >
                      <span className="pipelineStage__num">{i + 1}</span>
                      <span className="pipelineStage__name">{s}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="row-wrap" style={{ justifyContent: 'space-between', marginTop: 14, fontSize: '.82rem' }}>
              <span style={{ color: 'var(--ink-2)' }}>
                Commission: {commissionLabel(t)}
                {t.commission_value != null && (
                  <button
                    className={`badge ${t.commission_collected ? 'badge-verified' : 'badge-pending'}`}
                    style={{ marginLeft: 8, cursor: 'pointer', border: 0 }}
                    onClick={() => toggleCommission(t)}
                    disabled={busy === `${t.id}:commission`}
                  >
                    {t.commission_collected ? 'Collected' : 'Pending'}
                  </button>
                )}
              </span>
              <span style={{ color: 'var(--muted)' }}>
                Opened {fmtDate(t.opened_at)}
                {t.closed_at && ` · Closed ${fmtDate(t.closed_at)}`}
              </span>
            </div>

            <div className="adminGrid two" style={{ marginTop: 14, gap: 14 }}>
              <div>
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '.78rem', color: 'var(--navy)' }}>Meetings</strong>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => setMeetingFormFor(meetingFormFor === t.id ? null : t.id)}
                  >
                    + Add
                  </button>
                </div>
                {t.meetings.length === 0 && meetingFormFor !== t.id && (
                  <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 6 }}>None scheduled.</p>
                )}
                <div className="stack" style={{ gap: 6, marginTop: 6 }}>
                  {t.meetings.map((m) => (
                    <div key={m.id} className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.78rem' }}>
                      <span>
                        {m.title} <span style={{ color: 'var(--muted)' }}>· {fmtDateTime(m.scheduled_at)}</span>
                      </span>
                      <button
                        className={`badge badge-${
                          m.status === 'Completed' ? 'verified' : m.status === 'Cancelled' ? 'flagged' : 'progress'
                        }`}
                        style={{ cursor: 'pointer', border: 0 }}
                        onClick={() => cycleMeeting(t, m.id)}
                      >
                        {m.status}
                      </button>
                    </div>
                  ))}
                </div>
                {meetingFormFor === t.id && (
                  <form
                    className="stack"
                    style={{ gap: 8, marginTop: 10 }}
                    onSubmit={(e) => {
                      e.preventDefault()
                      addMeeting(t, new FormData(e.currentTarget))
                    }}
                  >
                    <input name="title" placeholder="What is this meeting for?" required />
                    <input name="with" placeholder="With (buyer, seller, both)" />
                    <input name="when" type="datetime-local" required />
                    <div className="row-wrap">
                      <button type="submit" className="btn btn-xs btn-primary">
                        Save meeting
                      </button>
                      <button type="button" className="btn btn-xs btn-ghost" onClick={() => setMeetingFormFor(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div>
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '.78rem', color: 'var(--navy)' }}>Documents</strong>
                  <button className="btn btn-xs btn-ghost" onClick={() => setDocFormFor(docFormFor === t.id ? null : t.id)}>
                    + Add
                  </button>
                </div>
                {t.documents.length === 0 && docFormFor !== t.id && (
                  <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 6 }}>None uploaded.</p>
                )}
                <div className="stack" style={{ gap: 6, marginTop: 6 }}>
                  {t.documents.map((d) => (
                    <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.78rem' }}>
                      <Icon name="download" size={12} /> {d.label}
                    </a>
                  ))}
                </div>
                {docFormFor === t.id && (
                  <form
                    className="stack"
                    style={{ gap: 8, marginTop: 10 }}
                    onSubmit={(e) => {
                      e.preventDefault()
                      addDocument(t, new FormData(e.currentTarget))
                    }}
                  >
                    <input name="label" placeholder="e.g. Sale agreement" required />
                    <input name="url" type="url" placeholder="Link to the file" required />
                    <div className="row-wrap">
                      <button type="submit" className="btn btn-xs btn-primary">
                        Save document
                      </button>
                      <button type="button" className="btn btn-xs btn-ghost" onClick={() => setDocFormFor(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {t.outcome === 'In progress' && (
              <div style={{ marginTop: 14, textAlign: 'right' }}>
                <button className="btn btn-xs btn-ghost" onClick={() => markLost(t)} disabled={busy === `${t.id}:lost`}>
                  Mark lost
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </>
  )
}

function NewTransactionForm({
  properties,
  onCreated,
  onError,
}: {
  properties: Property[]
  onCreated: (t: PropertyTransaction) => void
  onError: (msg: string) => void
}) {
  const [offMarket, setOffMarket] = useState(false)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const propertyId = offMarket ? '' : String(form.get('property_id') ?? '')
    const selected = properties.find((p) => p.id === propertyId)
    const propertyLabel = offMarket ? String(form.get('property_label') ?? '') : selected ? `${selected.code} — ${selected.title}` : ''

    setSaving(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId || undefined,
          property_label: propertyLabel,
          buyer_name: form.get('buyer_name'),
          buyer_phone: form.get('buyer_phone'),
          seller_name: form.get('seller_name'),
          seller_phone: form.get('seller_phone'),
          representing: form.get('representing') as Representing,
          deal_value_cr: form.get('deal_value_cr'),
          commission_type: form.get('commission_type') as CommissionType,
          commission_value: form.get('commission_value'),
          advisor: form.get('advisor'),
          notes: form.get('notes'),
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not open transaction')
      onCreated({
        id: body.reference,
        reference: body.reference,
        property_id: propertyId || null,
        property_label: propertyLabel,
        off_market: offMarket,
        stage: 'Enquiry',
        outcome: 'In progress',
        buyer_name: String(form.get('buyer_name') ?? ''),
        buyer_phone: String(form.get('buyer_phone') ?? ''),
        seller_name: String(form.get('seller_name') ?? ''),
        seller_phone: String(form.get('seller_phone') ?? ''),
        representing: form.get('representing') as Representing,
        deal_value_cr: form.get('deal_value_cr') ? Number(form.get('deal_value_cr')) : null,
        commission_type: form.get('commission_type') as CommissionType,
        commission_value: form.get('commission_value') ? Number(form.get('commission_value')) : null,
        commission_collected: false,
        advisor: String(form.get('advisor') ?? ''),
        meetings: [],
        documents: [],
        notes: String(form.get('notes') ?? ''),
        opened_at: new Date().toISOString(),
      })
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="adminCard" style={{ marginBottom: 20 }}>
      <div className="adminCard__head">
        <span className="adminCard__title">New transaction</span>
      </div>

      <div className="row-wrap" style={{ marginBottom: 14 }}>
        <button type="button" className={`chip ${!offMarket ? 'selected' : ''}`} onClick={() => setOffMarket(false)}>
          Listed property
        </button>
        <button type="button" className={`chip ${offMarket ? 'selected' : ''}`} onClick={() => setOffMarket(true)}>
          Off-market deal
        </button>
      </div>

      <div className="form-grid">
        {offMarket ? (
          <div className="form-group span2">
            <label>Property or deal description</label>
            <input name="property_label" placeholder="e.g. 2-acre parcel, Sarjapur Road (unlisted)" required />
          </div>
        ) : (
          <div className="form-group span2">
            <label>Property</label>
            <select name="property_id" required defaultValue="">
              <option value="" disabled>
                Select a listing…
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Buyer name</label>
          <input name="buyer_name" />
        </div>
        <div className="form-group">
          <label>Buyer phone <span className="hint">optional</span></label>
          <input name="buyer_phone" inputMode="tel" />
        </div>
        <div className="form-group">
          <label>Seller name</label>
          <input name="seller_name" />
        </div>
        <div className="form-group">
          <label>Seller phone <span className="hint">optional</span></label>
          <input name="seller_phone" inputMode="tel" />
        </div>

        <div className="form-group">
          <label>Representing</label>
          <select name="representing" defaultValue="Both">
            <option value="Buyer">Buyer</option>
            <option value="Seller">Seller</option>
            <option value="Both">Both</option>
          </select>
        </div>
        <div className="form-group">
          <label>Advisor <span className="hint">optional</span></label>
          <input name="advisor" />
        </div>

        <div className="form-group">
          <label>Deal value (₹ Cr) <span className="hint">optional</span></label>
          <input name="deal_value_cr" type="number" step="0.01" min="0" />
        </div>
        <div className="form-group">
          <label>Commission type</label>
          <select name="commission_type" defaultValue="Percentage">
            <option value="Percentage">Percentage</option>
            <option value="Flat">Flat (₹ L)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Commission value <span className="hint">optional</span></label>
          <input name="commission_value" type="number" step="0.01" min="0" />
        </div>

        <div className="form-group span2">
          <label>Notes <span className="hint">optional</span></label>
          <textarea name="notes" rows={2} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 14 }}>
        {saving ? 'Opening…' : 'Open transaction'}
      </button>
    </form>
  )
}
