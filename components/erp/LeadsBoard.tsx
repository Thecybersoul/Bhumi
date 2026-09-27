'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlarmClock, ArrowRight, MessageCircle, Phone, Search, UserPlus } from 'lucide-react'
import {
  budget,
  followUpDue,
  isSelling,
  LEAD_OUTCOMES,
  LEAD_PIPELINE,
  leadIsOpen,
  stageLabel,
  telHref,
  timeAgo,
  TYPE_LABEL,
  waHref,
  type Lead,
} from './lib'
import { Empty, Pill } from './ui'

const PRIORITY_RANK: Record<string, number> = { Hot: 0, Warm: 1, Cold: 2 }
const whenShort = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

/** Most urgent first: an overdue follow-up, then hot, then the soonest follow-up, then newest. */
function byUrgency(a: Lead, b: Lead) {
  const due = Number(followUpDue(b)) - Number(followUpDue(a))
  if (due) return due
  const pr = (PRIORITY_RANK[a.priority ?? 'Warm'] ?? 1) - (PRIORITY_RANK[b.priority ?? 'Warm'] ?? 1)
  if (pr) return pr
  const fa = a.next_follow_up_at ?? '9'
  const fb = b.next_follow_up_at ?? '9'
  if (fa !== fb) return fa.localeCompare(fb)
  return b.created_at.localeCompare(a.created_at)
}

function LeadCard({ l, busy, onAdvance }: { l: Lead; busy: boolean; onAdvance: (l: Lead, s: string) => void }) {
  const next = LEAD_PIPELINE[LEAD_PIPELINE.indexOf(l.stage) + 1]
  const due = followUpDue(l)
  const want = [TYPE_LABEL[l.property_type ?? ''], l.locations || l.corridor, budget(l.budget_min_cr, l.budget_max_cr)].filter(Boolean).join(' · ')
  return (
    <div className={`erpLeadCard ${due ? 'is-due' : ''}`}>
      <Link href={`/admin/deals/leads/${l.id}`} style={{ display: 'block', color: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`erpDot ${(l.priority ?? 'Warm').toLowerCase()}`} title={l.priority ?? 'Warm'} />
          <b className="erpLeadCard__name">{l.name}</b>
          <span className={`erpIntent ${isSelling(l.intent) ? 'sell' : ''}`}>{l.intent ?? 'Buy'}</span>
        </div>
        <div className="erpLeadCard__want">{want || `${l.kind}${l.property_code ? ` · ${l.property_code}` : ''}`}</div>
        {due ? (
          <div className="erpLeadCard__due">
            <AlarmClock size={12} /> Follow up {whenShort(l.next_follow_up_at!)}
          </div>
        ) : l.next_follow_up_at && leadIsOpen(l.stage) ? (
          <div className="erpLeadCard__meta">Next: {whenShort(l.next_follow_up_at)}</div>
        ) : (
          <div className="erpLeadCard__meta">
            {l.channel} · {timeAgo(l.created_at)}
            {l.assigned_to ? ` · ${l.assigned_to}` : ''}
          </div>
        )}
      </Link>
      <div className="erpLeadCard__actions">
        {l.phone ? (
          <>
            <a className="erpIconBtn" href={telHref(l.phone)} title={`Call ${l.phone}`}>
              <Phone size={14} />
            </a>
            <a className="erpIconBtn" href={waHref(l.phone, `Hello ${l.name.split(' ')[0]}, this is Bhumi Estates.`)} target="_blank" rel="noreferrer" title="WhatsApp">
              <MessageCircle size={14} />
            </a>
          </>
        ) : null}
        <span style={{ flex: 1 }} />
        {next && leadIsOpen(l.stage) ? (
          <button type="button" className="erpBtn ghost sm" disabled={busy} onClick={() => onAdvance(l, next)} title={`Move to ${stageLabel(next)}`}>
            {stageLabel(next)} <ArrowRight size={12} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function LeadsBoard({ leads, view, busy, onAdvance }: { leads: Lead[]; view: 'board' | 'list'; busy: string | null; onAdvance: (l: Lead, s: string) => void }) {
  const [q, setQ] = useState('')
  const [side, setSide] = useState<'All' | 'Buyers' | 'Sellers'>('All')
  const [dueOnly, setDueOnly] = useState(false)
  const [closed, setClosed] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    const d = n.replace(/\D/g, '')
    return leads
      .filter((l) => side === 'All' || (side === 'Sellers' ? isSelling(l.intent) : !isSelling(l.intent)))
      .filter((l) => !dueOnly || followUpDue(l))
      .filter(
        (l) =>
          !n ||
          `${l.name} ${l.company ?? ''} ${l.email ?? ''} ${l.locations ?? ''} ${l.corridor ?? ''} ${l.property_code ?? ''}`.toLowerCase().includes(n) ||
          (d.length >= 3 && (l.phone ?? '').replace(/\D/g, '').includes(d))
      )
  }, [leads, q, side, dueOnly])

  const open = filtered.filter((l) => leadIsOpen(l.stage) && l.stage !== 'Nurture').sort(byUrgency)
  const dueCount = leads.filter(followUpDue).length
  const outcome = (s: string) => filtered.filter((l) => (s === 'Converted' ? l.stage === 'Converted' || (l.stage === 'Closed' && l.transaction_id) : s === 'Lost' ? l.stage === 'Lost' || (l.stage === 'Closed' && !l.transaction_id) : l.stage === s))

  if (!leads.length) {
    return (
      <div className="erpCard">
        <Empty>No leads yet. Website enquiries land here, and you can add a call, walk-in or referral with “New lead”.</Empty>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <Link href="/admin/deals/leads/new" className="erpBtn primary">
            <UserPlus size={16} /> Add the first lead
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }} />
          <input className="erpInput" style={{ paddingLeft: 32 }} placeholder="Search name, phone, area, listing" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="erpChips">
          {(['All', 'Buyers', 'Sellers'] as const).map((x) => (
            <button key={x} className={`erpChip ${side === x ? 'is-on' : ''}`} onClick={() => setSide(x)}>
              {x}
            </button>
          ))}
          <button className={`erpChip ${dueOnly ? 'is-gold' : ''}`} onClick={() => setDueOnly((v) => !v)}>
            <AlarmClock size={12} style={{ verticalAlign: -2 }} /> Due now · {dueCount}
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="erpBoard">
          {LEAD_PIPELINE.map((s) => {
            const col = open.filter((l) => l.stage === s)
            return (
              <div key={s} className="erpBoard__col">
                <div className="erpBoard__head">
                  <span>{stageLabel(s)}</span>
                  <b>{col.length}</b>
                </div>
                {col.length === 0 ? <p className="erpBoard__empty">—</p> : col.map((l) => <LeadCard key={l.id} l={l} busy={busy === l.id} onAdvance={onAdvance} />)}
              </div>
            )
          })}
        </div>
      ) : open.length === 0 ? (
        <div className="erpCard">
          <Empty>Nothing open matches.</Empty>
        </div>
      ) : (
        <div className="erpCard" style={{ padding: 0 }}>
          {open.map((l) => (
            <div key={l.id} className="erpLeadRow">
              <Link href={`/admin/deals/leads/${l.id}`} className="erpLeadRow__main">
                <span className={`erpDot ${(l.priority ?? 'Warm').toLowerCase()}`} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <b>{l.name}</b> <span className={`erpIntent ${isSelling(l.intent) ? 'sell' : ''}`}>{l.intent ?? 'Buy'}</span>
                  <span className="erpRow__sub" style={{ display: 'block' }}>
                    {[TYPE_LABEL[l.property_type ?? ''], l.locations || l.corridor, budget(l.budget_min_cr, l.budget_max_cr), l.assigned_to].filter(Boolean).join(' · ') || l.kind}
                  </span>
                </span>
                <span className="erpRow__sub" style={{ color: followUpDue(l) ? 'var(--flagged)' : undefined, fontWeight: followUpDue(l) ? 700 : undefined, minWidth: 110, textAlign: 'right' }}>
                  {l.next_follow_up_at ? whenShort(l.next_follow_up_at) : timeAgo(l.created_at)}
                </span>
                <Pill label={stageLabel(l.stage)} tone={l.stage === 'Visit' ? 'progress' : l.stage} />
              </Link>
              {l.phone ? (
                <a className="erpIconBtn" href={telHref(l.phone)} title="Call">
                  <Phone size={14} />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="erpChips" style={{ marginTop: 18 }}>
        {LEAD_OUTCOMES.map((s) => (
          <button key={s} className={`erpChip ${closed === s ? 'is-on' : ''}`} onClick={() => setClosed(closed === s ? null : s)}>
            {s} · {outcome(s).length}
          </button>
        ))}
      </div>
      {closed ? (
        <div className="erpListings" style={{ marginTop: 12 }}>
          {outcome(closed).length === 0 ? (
            <div className="erpCard">
              <Empty>None.</Empty>
            </div>
          ) : (
            outcome(closed)
              .sort((a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at))
              .map((l) => <LeadCard key={l.id} l={l} busy={busy === l.id} onAdvance={onAdvance} />)
          )}
        </div>
      ) : null}
    </div>
  )
}
