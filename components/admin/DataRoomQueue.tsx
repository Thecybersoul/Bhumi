'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/site/Icon'
import type { DataRoomRequest } from '@/lib/types'

/* Plan §9: access is released by a named advisor, never
   automatically. This queue is that decision point — approving
   assigns an advisor, and declining is a recorded outcome rather
   than a request left to expire in silence. */

const ADVISORS = ['A. Rao', 'S. Kulkarni', 'M. Iyer']

export default function DataRoomQueue({
  requests: initial,
  source,
}: {
  requests: DataRoomRequest[]
  source: 'live' | 'fallback'
}) {
  const router = useRouter()
  const [requests, setRequests] = useState(initial)
  const [toast, setToast] = useState<string | null>(null)

  async function decide(req: DataRoomRequest, status: DataRoomRequest['status'], advisor?: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status, assigned_advisor: advisor ?? r.assigned_advisor } : r))
    )

    const qs = new URLSearchParams({ id: req.id, status })
    if (advisor) qs.set('advisor', advisor)

    const res = await fetch(`/api/data-room?${qs}`, { method: 'PATCH' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setRequests(initial)
      setToast(body.error ?? 'Could not update')
    } else {
      setToast(
        body.persisted
          ? `${status}${advisor ? ` · assigned to ${advisor}` : ''}`
          : `${status} (not persisted — no database)`
      )
      if (body.persisted) router.refresh()
    }
    setTimeout(() => setToast(null), 2600)
  }

  const pending = requests.filter((r) => r.status === 'Pending')

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Data room requests</h1>
          <p>
            Headline parcel details are public; the memorandum is not. Every request is reviewed by a named
            advisor and released manually — an automated gate is not a gate. Declining is a decision that gets
            recorded, not a request left to expire.
          </p>
        </div>
        <span className={`sourcePill ${source === 'live' ? 'is-live' : 'is-fallback'}`}>
          {source === 'live' ? 'Live database' : 'Seeded data'}
        </span>
      </div>

      <div className="statRow">
        <div className="statTile is-gold">
          <span className="statTile__value">{pending.length}</span>
          <span className="statTile__label">Awaiting a decision</span>
          <span className="statTile__note">Target: one working day</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{requests.filter((r) => r.status === 'Approved').length}</span>
          <span className="statTile__label">Approved</span>
          <span className="statTile__note">Memorandum released</span>
        </div>
        <div className="statTile is-flagged">
          <span className="statTile__value">{requests.filter((r) => r.status === 'Declined').length}</span>
          <span className="statTile__label">Declined</span>
          <span className="statTile__note">Undertaking not accepted, or unverifiable buyer</span>
        </div>
        <div className="statTile">
          <span className="statTile__value">{requests.filter((r) => r.nda_accepted).length}</span>
          <span className="statTile__label">Accepted the undertaking</span>
          <span className="statTile__note">of {requests.length} requests</span>
        </div>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {requests.map((r) => (
          <article
            key={r.id}
            className="adminCard"
            style={{
              borderLeft: `3px solid ${
                r.status === 'Approved' ? 'var(--verified)' : r.status === 'Declined' ? 'var(--flagged)' : 'var(--gold)'
              }`,
            }}
          >
            <div className="adminCard__head">
              <div>
                <div className="row-wrap" style={{ marginBottom: 6 }}>
                  <span className="badge badge-navy">{r.parcel_code}</span>
                  <span
                    className={`badge badge-${
                      r.status === 'Approved' ? 'verified' : r.status === 'Declined' ? 'flagged' : 'pending'
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.nda_accepted ? (
                    <span className="badge badge-verified">
                      <Icon name="check" size={11} stroke={3} /> Undertaking accepted
                    </span>
                  ) : (
                    <span className="badge badge-flagged">Undertaking not accepted</span>
                  )}
                </div>
                <span className="adminCard__title">{r.name}</span>
                <div className="adminCard__sub">
                  {r.organisation}
                  {r.role && ` · ${r.role}`} · {r.buyer_type} · {r.ticket_size}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 4 }}>
                  {r.email} · {r.phone} ·{' '}
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--ink-2)', marginTop: 6 }}>{r.parcel_label}</div>
              </div>

              <div className="stack" style={{ gap: 8, minWidth: 210 }}>
                {r.status === 'Pending' ? (
                  <>
                    <select
                      defaultValue=""
                      onChange={(e) => e.target.value && decide(r, 'Approved', e.target.value)}
                      style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r)', fontSize: '.84rem' }}
                      disabled={!r.nda_accepted}
                      title={r.nda_accepted ? 'Approve and assign' : 'Cannot approve — undertaking not accepted'}
                    >
                      <option value="" disabled>
                        Approve and assign…
                      </option>
                      {ADVISORS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-sm btn-danger btn-block" onClick={() => decide(r, 'Declined')}>
                      Decline
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: '.82rem', color: 'var(--muted)', textAlign: 'right' }}>
                    {r.assigned_advisor ? (
                      <>
                        Advisor: <strong style={{ color: 'var(--navy)' }}>{r.assigned_advisor}</strong>
                      </>
                    ) : (
                      'No advisor assigned'
                    )}
                    <button
                      className="btn btn-sm btn-ghost btn-block"
                      style={{ marginTop: 8 }}
                      onClick={() => decide(r, 'Pending')}
                    >
                      Reopen
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!r.nda_accepted && (
              <p style={{ fontSize: '.82rem', color: 'var(--flagged)', lineHeight: 1.6 }}>
                The confidentiality undertaking was not accepted, so the memorandum cannot be released. The
                request is recorded here so the enquiry is not simply lost.
              </p>
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
