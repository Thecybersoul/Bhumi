'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { whatsapp } from '@/lib/content/brand'
import Icon from '@/components/site/Icon'
import type { Lead, LeadStage } from '@/lib/types'

/* One inbox for every conversion path (Plan §7, §13).

   A lead arrives carrying the inputs it was qualified by — the
   tool result, the checklist answers, the survey number — so the
   first reply can be an answer rather than a discovery call. */

const STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Visit', 'Closed']

export default function LeadInbox({ leads: initial, source }: { leads: Lead[]; source: 'live' | 'fallback' }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initial)
  const [kind, setKind] = useState('')
  const [stage, setStage] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const kinds = useMemo(() => Array.from(new Set(initial.map((l) => l.kind))), [initial])

  const shown = leads.filter((l) => {
    if (kind && l.kind !== kind) return false
    if (stage && l.stage !== stage) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${l.name} ${l.company} ${l.email} ${l.phone} ${l.source}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  async function advance(lead: Lead) {
    const idx = STAGES.indexOf(lead.stage)
    if (idx === STAGES.length - 1) return
    const next = STAGES[idx + 1]

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage: next } : l)))

    const res = await fetch(`/api/leads?id=${encodeURIComponent(lead.id)}&stage=${next}`, { method: 'PATCH' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setLeads(initial)
      setToast(body.error ?? 'Could not update')
    } else {
      setToast(body.persisted ? `Moved to ${next}` : `Moved to ${next} (not persisted — no database)`)
      if (body.persisted) router.refresh()
    }
    setTimeout(() => setToast(null), 2600)
  }

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Lead inbox</h1>
          <p>
            Every conversion path in one place — WhatsApp, page forms, tool results, checklist downloads and
            data room requests. Each lead carries the inputs it was qualified by, so the first reply can be an
            answer.
          </p>
        </div>
        <span className={`sourcePill ${source === 'live' ? 'is-live' : 'is-fallback'}`}>
          {source === 'live' ? 'Live database' : 'Seeded data'}
        </span>
      </div>

      <div className="statRow">
        {STAGES.slice(0, 4).map((s) => (
          <div key={s} className={`statTile ${s === 'New' ? 'is-gold' : s === 'Visit' ? 'is-verified' : ''}`}>
            <span className="statTile__value">{leads.filter((l) => l.stage === s).length}</span>
            <span className="statTile__label">{s}</span>
            <span className="statTile__note">
              {s === 'New' ? 'Not yet contacted' : s === 'Qualified' ? 'Budget and intent confirmed' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="mkFilters" style={{ marginBottom: 20 }}>
        <div className="mkFilters__row">
          <input
            className="mkFilters__search"
            placeholder="Search name, company, email or source…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--r)', fontSize: '.85rem' }}
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mkFilters__row">
          <span className="mkFilters__label">Path</span>
          <div className="chips">
            <button className={`chip ${!kind ? 'selected' : ''}`} onClick={() => setKind('')}>
              All
            </button>
            {kinds.map((k) => (
              <button key={k} className={`chip ${kind === k ? 'selected' : ''}`} onClick={() => setKind(kind === k ? '' : k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="adminCard" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Path</th>
                <th>Contact</th>
                <th>Qualifying detail</th>
                <th>Source</th>
                <th>Stage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: '.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td>
                    <span className="badge badge-navy leadRow__kind">{l.kind}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{l.name}</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>
                      {l.company && `${l.company} · `}
                      {l.phone}
                    </div>
                    {l.email && <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{l.email}</div>}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <div className="payloadChips">
                      {Object.entries(l.payload ?? {}).map(([k, v]) => (
                        <span key={k} className="payloadChip">
                          {k.replace(/_/g, ' ')}: {String(v)}
                        </span>
                      ))}
                    </div>
                    {l.notes && (
                      <div style={{ fontSize: '.78rem', color: 'var(--ink-2)', marginTop: 5, lineHeight: 1.5 }}>
                        {l.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.73rem', color: 'var(--muted)' }}>
                    {l.source}
                    <div>{l.channel}</div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${
                        l.stage === 'New' ? 'pending' : l.stage === 'Closed' ? 'sold' : l.stage === 'Visit' ? 'verified' : 'progress'
                      }`}
                    >
                      {l.stage}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      {l.phone && (
                        <a
                          className="btn btn-sm btn-ghost btn-icon"
                          href={whatsapp(`Hi ${l.name.split(' ')[0]}, this is Bhumi Estates following up on your enquiry.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Reply on WhatsApp"
                        >
                          <Icon name="whatsapp" size={14} />
                        </a>
                      )}
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => advance(l)}
                        disabled={l.stage === 'Closed'}
                        title={l.stage === 'Closed' ? 'Final stage' : `Advance to ${STAGES[STAGES.indexOf(l.stage) + 1]}`}
                      >
                        {l.stage === 'Closed' ? '✓' : '→'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 44, color: 'var(--muted)' }}>
                    No leads match those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </>
  )
}
