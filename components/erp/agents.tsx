'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Check, ChevronDown, ChevronUp, MessageCircle, Phone, Plus, Star, Trash2, UserPlus, Wallet } from 'lucide-react'
import {
  AGENT_LINK_ROLES,
  agentShareLakh,
  api,
  isAgent,
  lakh,
  ourCommissionLakh,
  PAYOUT_STATUSES,
  SHARE_TYPES,
  shareLabel,
  telHref,
  timeAgo,
  waHref,
  type Contact,
  type DealMoney,
  type Involvement,
} from './lib'
import { Banner, Empty, Loading, Pill } from './ui'
import { ContactPicker } from './contacts'

/* ═══════════════════════════════════════════════════════════
   Agents on a record — the outside brokers working alongside
   Bhumi Estates on a listing, a deal or a lead, each with the part
   they play, their share, and (on a deal) whether they've been paid.
   ═══════════════════════════════════════════════════════════ */

type Entity = 'property' | 'transaction' | 'lead' | 'task' | 'note' | 'meeting' | 'verification'

const DEFAULT_ROLE: Record<string, string> = { property: 'Listing agent', transaction: 'Buyer’s agent', lead: 'Referral' }
const isAgentRow = (r: Involvement) => isAgent(r.contact) || (AGENT_LINK_ROLES as readonly string[]).includes(r.role)

export function Stars({ n, onChange, size = 13 }: { n?: number | null; onChange?: (n: number | null) => void; size?: number }) {
  return (
    <span className="erpStars" title={n ? `${n} of 5` : 'Not rated'}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={n && i <= n ? 'var(--gold)' : 'none'}
          color={n && i <= n ? 'var(--gold)' : 'var(--line)'}
          style={onChange ? { cursor: 'pointer' } : undefined}
          onClick={onChange ? () => onChange(n === i ? null : i) : undefined}
        />
      ))}
    </span>
  )
}

/** One agent's line on a record: who, what part, their terms and — on
    a deal — what they're owed and whether it's been paid. */
export function InvolvementRow({
  r,
  deal,
  showRecord,
  onChange,
  onRemove,
}: {
  r: Involvement
  deal?: DealMoney | null
  /** On an agent's own page: show which record this is, not who. */
  showRecord?: { href: string | null; label: string; kind: string }
  onChange: () => void
  onRemove?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(r.role)
  const [shareType, setShareType] = useState<string>(r.share_type ?? '')
  const [shareValue, setShareValue] = useState(r.share_value != null ? String(r.share_value) : '')
  const [notes, setNotes] = useState(r.notes ?? '')
  const [amount, setAmount] = useState(r.payout_amount_lakh != null ? String(r.payout_amount_lakh) : '')
  const [ref, setRef] = useState(r.payout_ref ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const expected = deal ? agentShareLakh(r, deal) : null
  const payable = r.share_type && r.share_type !== 'Paid by their client'
  const onDeal = r.entity_type === 'transaction'

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      await api.patch(`/api/contact-links?id=${r.id}`, body)
      onChange()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const saveTerms = () =>
    patch({ role, share_type: shareType, share_value: shareValue.trim() === '' ? null : Number(shareValue), notes }).then(() => setOpen(false))
  const setPayout = (payout_status: string) =>
    patch({
      payout_status,
      ...(payout_status === 'Paid' ? { payout_amount_lakh: amount.trim() ? Number(amount) : expected, payout_ref: ref.trim() } : {}),
    })

  const c = r.contact
  return (
    <div className="erpAgentRow">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showRecord ? (
            <>
              <div className="erpRow__sub" style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: '.05em', fontSize: 10.5 }}>{showRecord.kind}</div>
              {showRecord.href ? (
                <Link href={showRecord.href} className="erpRow__title" style={{ display: 'block' }}>
                  {showRecord.label}
                </Link>
              ) : (
                <div className="erpRow__title">{showRecord.label}</div>
              )}
            </>
          ) : c ? (
            <Link href={`/admin/deals/contacts/${c.id}`} className="erpRow__title" style={{ display: 'block' }}>
              {c.name}
              {c.agent_status === 'Preferred' ? <BadgeCheck size={14} color="var(--verified)" style={{ verticalAlign: -2, marginLeft: 4 }} /> : null}
            </Link>
          ) : null}
          <div className="erpRow__sub" style={{ whiteSpace: 'normal' }}>
            {[!showRecord ? c?.agency : '', r.role, shareLabel(r), onDeal && expected != null && payable ? `≈ ${lakh(expected)}` : ''].filter(Boolean).join(' · ')}
          </div>
        </div>
        {onDeal && payable ? <Pill label={r.payout_status || 'Not due'} tone={r.payout_status === 'Paid' ? 'verified' : r.payout_status === 'Due' || r.payout_status === 'Invoiced' ? 'pending' : r.payout_status === 'Waived' ? 'cancelled' : 'new'} /> : null}
        {!showRecord && c?.phone ? (
          <>
            <a className="erpIconBtn" href={telHref(c.phone)} title={`Call ${c.phone}`}>
              <Phone size={14} />
            </a>
            <a className="erpIconBtn" href={waHref(c.phone, `Hello ${c.name.split(' ')[0]}, this is Bhumi Estates regarding ${r.entity_label}.`)} target="_blank" rel="noreferrer" title="WhatsApp">
              <MessageCircle size={14} />
            </a>
          </>
        ) : null}
        <button type="button" className="erpIconBtn" onClick={() => setOpen((o) => !o)} title="Terms & payout">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {r.payout_status === 'Paid' ? (
        <div className="erpRow__sub" style={{ color: 'var(--verified)', fontWeight: 700 }}>
          <Check size={11} style={{ verticalAlign: -1 }} /> Paid {lakh(r.payout_amount_lakh)}
          {r.paid_at ? ` · ${timeAgo(r.paid_at)}` : ''}
          {r.payout_ref ? ` · ref ${r.payout_ref}` : ''}
        </div>
      ) : null}
      {open ? (
        <div className="erpAgentRow__edit">
          <div className="erpSub" style={{ marginTop: 0 }}>Part they play</div>
          <div className="erpChips">
            {AGENT_LINK_ROLES.map((x) => (
              <button type="button" key={x} className={`erpChip sm ${role === x ? 'is-on' : ''}`} onClick={() => setRole(x)}>
                {x}
              </button>
            ))}
          </div>
          <div className="erpSub">Their share</div>
          <div className="erpChips">
            {SHARE_TYPES.map((x) => (
              <button type="button" key={x} className={`erpChip sm ${shareType === x ? 'is-on' : ''}`} onClick={() => setShareType(x)}>
                {x}
              </button>
            ))}
          </div>
          {shareType && shareType !== 'Paid by their client' ? (
            <input
              className="erpInput"
              style={{ marginTop: 8 }}
              inputMode="decimal"
              value={shareValue}
              onChange={(e) => setShareValue(e.target.value)}
              placeholder={shareType === 'Flat' ? 'Amount in ₹ lakh, e.g. 2.5' : 'Percent, e.g. 25'}
            />
          ) : null}
          <input className="erpInput" style={{ marginTop: 8 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms in words — e.g. 50:50 co-broke, paid on registration" />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" className="erpBtn primary sm" onClick={saveTerms} disabled={busy}>
              Save terms
            </button>
            {onRemove ? (
              <button type="button" className="erpBtn danger sm" onClick={onRemove}>
                <Trash2 size={13} /> Remove
              </button>
            ) : null}
          </div>

          {onDeal && payable ? (
            <>
              <div className="erpSub">
                <Wallet size={11} style={{ verticalAlign: -1 }} /> Payout
              </div>
              <div className="erpForm two" style={{ gap: 8 }}>
                <input className="erpInput" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={expected != null ? `Amount (₹ lakh) — expected ${Number(expected.toFixed(2))}` : 'Amount (₹ lakh)'} />
                <input className="erpInput" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Payment ref / UTR / invoice no." />
              </div>
              <div className="erpChips" style={{ marginTop: 8 }}>
                {PAYOUT_STATUSES.map((x) => (
                  <button type="button" key={x} className={`erpChip sm ${(r.payout_status || 'Not due') === x ? 'is-on' : ''}`} onClick={() => setPayout(x)} disabled={busy}>
                    {x === 'Paid' ? 'Mark paid' : x}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {error ? <Banner tone="error">{error}</Banner> : null}
        </div>
      ) : null}
    </div>
  )
}

/** Agents on one listing, deal or lead — add, set terms, track payouts,
    and (listing, lead) see who works the area. */
export function AgentsPanel({
  entityType,
  entityId,
  entityLabel,
  deal,
  suggest = entityType === 'property' || entityType === 'lead',
}: {
  entityType: Entity
  entityId: string
  entityLabel: string
  deal?: DealMoney | null
  suggest?: boolean
}) {
  const [rows, setRows] = useState<Involvement[] | null>(null)
  const [ready, setReady] = useState({ contacts: true, agents: true })
  const [adding, setAdding] = useState(false)
  const [role, setRole] = useState(DEFAULT_ROLE[entityType] ?? 'Co-broker')
  const [suggestions, setSuggestions] = useState<{ item: Contact; reasons: string[] }[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get<{ data: Involvement[]; ready: boolean; agents: boolean }>(`/api/contact-links?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      .then((r) => {
        setRows(r.data.filter(isAgentRow))
        setReady({ contacts: r.ready, agents: r.agents })
      })
      .catch(() => setRows([]))
    if (suggest)
      api
        .get<{ data: { item: Contact; reasons: string[] }[] }>(`/api/agents/suggest?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
        .then((r) => setSuggestions(r.data))
        .catch(() => setSuggestions([]))
  }, [entityType, entityId, suggest])
  useEffect(load, [load])

  async function add(a: Contact) {
    setError(null)
    try {
      await api.post('/api/contact-links', {
        contact_id: a.id,
        entity_type: entityType,
        entity_id: entityId,
        entity_label: entityLabel,
        role,
        // Their usual cut, ready to adjust.
        ...(ready.agents && a.default_share_pct != null ? { share_type: 'Percent of our commission', share_value: a.default_share_pct, ...(entityType === 'transaction' ? { payout_status: 'Not due' } : {}) } : {}),
      })
      setAdding(false)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  async function remove(r: Involvement) {
    if (!confirm(`Remove ${r.contact?.name ?? 'this agent'} from ${entityLabel}?`)) return
    setRows((p) => p?.filter((x) => x.id !== r.id) ?? null)
    await api.del(`/api/contact-links?id=${r.id}`).catch((e) => setError(e.message))
    load()
  }

  const money = useMemo(() => {
    if (entityType !== 'transaction' || !deal) return null
    const ours = ourCommissionLakh(deal)
    const payable = (rows ?? []).filter((r) => r.share_type && r.share_type !== 'Paid by their client')
    const shares = payable.map((r) => agentShareLakh(r, deal))
    const known = shares.every((x) => x != null)
    const agents = shares.reduce<number>((a, b) => a + (b ?? 0), 0)
    const paid = payable.filter((r) => r.payout_status === 'Paid').reduce((a, r) => a + (r.payout_amount_lakh ?? agentShareLakh(r, deal) ?? 0), 0)
    return { ours, agents, known, net: ours != null ? ours - agents : null, paid, owed: agents - paid }
  }, [entityType, deal, rows])

  if (!ready.contacts) return <p className="erpEmpty">Agents arrive with migrations 015 and 016 — see Setup.</p>
  return (
    <div>
      {!ready.agents ? <Banner tone="warn">Commission shares and payouts need migration 016 — see Setup.</Banner> : null}
      {money ? (
        <div className="erpSplit">
          <div>
            <span>Our commission</span>
            <b>{lakh(money.ours)}</b>
          </div>
          <div>
            <span>Agents</span>
            <b>− {money.known ? lakh(money.agents) : '?'}</b>
          </div>
          <div className="is-net">
            <span>Bhumi net</span>
            <b>{money.net != null && money.known ? lakh(money.net) : '—'}</b>
          </div>
          {money.agents > 0 ? (
            <div className="erpSplit__foot">
              {lakh(money.paid)} paid out · {lakh(Math.max(0, money.owed))} still to pay
            </div>
          ) : null}
          {money.ours == null ? <div className="erpSplit__foot">Set the deal value and commission to see the split.</div> : null}
        </div>
      ) : null}

      {rows === null ? (
        <Loading />
      ) : rows.length === 0 && !adding ? (
        <Empty>No outside agent on this {entityType === 'transaction' ? 'deal' : entityType === 'property' ? 'listing' : entityType}.</Empty>
      ) : (
        rows.map((r) => <InvolvementRow key={r.id} r={r} deal={deal} onChange={load} onRemove={() => remove(r)} />)
      )}
      {error ? <Banner tone="error">{error}</Banner> : null}

      {adding ? (
        <div style={{ marginTop: 10 }}>
          <div className="erpChips" style={{ marginBottom: 8 }}>
            {AGENT_LINK_ROLES.map((x) => (
              <button type="button" key={x} className={`erpChip sm ${role === x ? 'is-gold' : ''}`} onClick={() => setRole(x)}>
                {x}
              </button>
            ))}
          </div>
          <ContactPicker agentsOnly onPick={add} defaultRole="Agent" exclude={(rows ?? []).map((r) => r.contact?.id ?? '')} autoFocus placeholder="Search agents by name, agency, phone or area" />
          <button type="button" className="erpBtn ghost sm" style={{ marginTop: 8 }} onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="erpBtn ghost block" style={{ borderStyle: 'dashed', marginTop: 6 }} onClick={() => setAdding(true)}>
          <UserPlus size={15} /> Add an agent
        </button>
      )}

      {suggest && suggestions.length ? (
        <>
          <div className="erpSub">Agents who work this area</div>
          {suggestions.map((s) => (
            <div key={s.item.id} className="erpMatch">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/admin/deals/contacts/${s.item.id}`} className="erpRow__title" style={{ display: 'block' }}>
                  {s.item.name}
                </Link>
                <div className="erpRow__sub">{[s.item.agency, s.item.operating_areas].filter(Boolean).join(' · ')}</div>
                <div className="erpReasons">
                  {s.reasons.map((x) => (
                    <span key={x} className="ok">
                      <Check size={11} /> {x}
                    </span>
                  ))}
                  {s.item.rating ? <Stars n={s.item.rating} size={11} /> : null}
                </div>
              </div>
              <button type="button" className="erpBtn soft sm" onClick={() => add(s.item)}>
                <Plus size={13} /> Add
              </button>
            </div>
          ))}
        </>
      ) : null}
    </div>
  )
}
