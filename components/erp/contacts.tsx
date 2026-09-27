'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Phone, Plus, Search, UserPlus, UserRound, X } from 'lucide-react'
import { api, ApiError, CONTACT_ROLES, telHref, waHref, type Contact } from './lib'
import { Banner, Empty, Loading } from './ui'
import { EmailButton } from './google'

/* ─── Call · WhatsApp · Email ────────────────────────────── */

export function ContactActions({
  name,
  phone,
  email,
  entity,
  greeting,
  size = 'sm',
}: {
  name: string
  phone?: string | null
  email?: string | null
  /** Which record an email is filed against. */
  entity?: { entity_type: string; entity_id: string; entity_label: string }
  /** Opening line for a WhatsApp message. */
  greeting?: string
  size?: 'sm' | 'md'
}) {
  const first = name.split(' ')[0]
  const cls = `erpBtn ghost ${size === 'sm' ? 'sm' : ''}`
  if (!phone && !email) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {phone ? (
        <>
          <a className={cls} href={telHref(phone)} onClick={(e) => e.stopPropagation()}>
            <Phone size={13} /> Call
          </a>
          <a className={cls} href={waHref(phone, greeting ?? `Hello ${first}, this is Bhumi Estates.`)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            <MessageCircle size={13} /> WhatsApp
          </a>
        </>
      ) : null}
      {email ? (
        <EmailButton
          label="Email"
          draft={{
            to: email,
            subject: 'Bhumi Estates',
            body: `Dear ${first},\n\n\n\nWarm regards,`,
            entity_type: entity?.entity_type ?? 'general',
            entity_id: entity?.entity_id ?? '',
            entity_label: entity?.entity_label ?? name,
          }}
        />
      ) : null}
    </div>
  )
}

/* ─── Picking (or adding) a contact ─────────────────────── */

let cache: Promise<Contact[]> | null = null
/** The contact list, fetched once per page view and shared by every picker. */
export function loadContacts(refresh = false): Promise<Contact[]> {
  if (!cache || refresh) {
    cache = api
      .get<{ data: Contact[]; ready: boolean }>('/api/contacts')
      .then((r) => r.data)
      .catch(() => [])
  }
  return cache
}

export function NewContactForm({
  initial,
  defaultRole,
  onSaved,
  onCancel,
}: {
  initial?: Partial<Contact>
  defaultRole?: string
  onSaved: (c: Contact) => void
  onCancel?: () => void
}) {
  const agentMode = defaultRole === 'Agent'
  const [f, setF] = useState({ name: initial?.name ?? '', phone: initial?.phone ?? '', email: initial?.email ?? '', company: initial?.company ?? '', agency: '', operating_areas: '' })
  const [roles, setRoles] = useState<string[]>(initial?.roles ?? (defaultRole ? [defaultRole] : []))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dup, setDup] = useState<Contact | null>(null)

  async function save(force = false) {
    if (!f.name.trim()) return setError('A name is needed')
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/contacts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(agentMode ? f : { name: f.name, phone: f.phone, email: f.email, company: f.company }), roles, force }),
      })
      const body = await r.json().catch(() => ({}))
      if (r.status === 409 && body.duplicate) {
        setDup(body.duplicate)
        setError(body.error)
        return
      }
      if (!r.ok) throw new ApiError(body.error ?? 'Could not save')
      loadContacts(true)
      onSaved({ id: body.id, created_at: new Date().toISOString(), ...f, roles })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="erpForm">
      <input className="erpInput" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
      <div className="erpForm two" style={{ gap: 8 }}>
        <input className="erpInput" type="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className="erpInput" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      {agentMode ? (
        <>
          <input className="erpInput" placeholder="Agency / firm" value={f.agency} onChange={(e) => setF({ ...f, agency: e.target.value })} />
          <input className="erpInput" placeholder="Areas they work, e.g. Devanahalli, Hoskote" value={f.operating_areas} onChange={(e) => setF({ ...f, operating_areas: e.target.value })} />
        </>
      ) : (
        <input className="erpInput" placeholder="Company (optional)" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
      )}
      <div className="erpChips">
        {CONTACT_ROLES.map((r) => (
          <button type="button" key={r} className={`erpChip ${roles.includes(r) ? 'is-on' : ''}`} onClick={() => setRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}>
            {r}
          </button>
        ))}
      </div>
      {error ? <Banner tone={dup ? 'warn' : 'error'}>{error}</Banner> : null}
      {dup ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="erpBtn primary sm" onClick={() => onSaved(dup)}>
            Use {dup.name}
          </button>
          <button type="button" className="erpBtn ghost sm" onClick={() => save(true)}>
            Save as a different person
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="erpBtn primary sm" onClick={() => save()} disabled={busy}>
            {busy ? 'Saving…' : 'Save contact'}
          </button>
          {onCancel ? (
            <button type="button" className="erpBtn ghost sm" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Search the contact book, or add someone new without leaving the form. */
export function ContactPicker({
  onPick,
  placeholder = 'Search contacts by name, phone or company',
  defaultRole,
  exclude = [],
  autoFocus,
  agentsOnly,
}: {
  onPick: (c: Contact) => void
  placeholder?: string
  defaultRole?: string
  exclude?: string[]
  autoFocus?: boolean
  /** Only agents, searchable by agency and area too; "new" makes an agent. */
  agentsOnly?: boolean
}) {
  const [all, setAll] = useState<Contact[] | null>(null)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  useEffect(() => {
    loadContacts().then(setAll)
  }, [])
  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    const digits = n.replace(/\D/g, '')
    return (all ?? [])
      .filter((c) => !exclude.includes(c.id) && (!agentsOnly || c.roles?.includes('Agent')))
      .filter(
        (c) =>
          !n ||
          `${c.name} ${c.company ?? ''} ${c.email} ${c.agency ?? ''} ${c.operating_areas ?? ''}`.toLowerCase().includes(n) ||
          (digits.length >= 3 && String(c.phone).replace(/\D/g, '').includes(digits))
      )
      .slice(0, 8)
  }, [all, q, exclude, agentsOnly])

  if (adding) {
    const looksLikePhone = /^[\d+\s-]{6,}$/.test(q.trim())
    return (
      <NewContactForm
        initial={looksLikePhone ? { phone: q.trim() } : { name: q.trim() }}
        defaultRole={agentsOnly ? 'Agent' : defaultRole}
        onSaved={(c) => {
          setAdding(false)
          onPick(c)
        }}
        onCancel={() => setAdding(false)}
      />
    )
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }} />
        <input className="erpInput" style={{ paddingLeft: 32 }} placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus} />
      </div>
      <div className="erpPicker__list" style={{ maxHeight: 260, marginTop: 6 }}>
        {all === null ? (
          <Loading />
        ) : (
          list.map((c) => (
            <button type="button" key={c.id} className="erpPicker__opt" onClick={() => onPick(c)}>
              <UserRound size={16} color="var(--muted)" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="erpRow__title" style={{ display: 'block' }}>{c.name}</span>
                <span className="erpRow__sub" style={{ display: 'block' }}>
                  {(agentsOnly ? [c.agency, c.operating_areas, c.phone] : [c.roles?.join(', '), c.phone, c.company]).filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
          ))
        )}
        <button type="button" className="erpPicker__opt" onClick={() => setAdding(true)} style={{ color: 'var(--gold-deep)', fontWeight: 700 }}>
          <UserPlus size={16} /> {q.trim() ? `Add “${q.trim()}” as a new ${agentsOnly ? 'agent' : 'contact'}` : `Add a new ${agentsOnly ? 'agent' : 'contact'}`}
        </button>
      </div>
    </div>
  )
}

/* ─── People on a record ─────────────────────────────────── */

interface LinkRow {
  id: string
  role: string
  contact: { id: string; name: string; phone?: string; email?: string; roles?: string[]; company?: string } | null
}

const AGENT_ROLES = ['Listing agent', 'Buyer’s agent', 'Seller’s agent', 'Co-broker', 'Referral', 'Mandate holder']

/** Contacts tagged on one record, each with a role — the landowner on
    a listing, the buyer's lawyer on a deal, who a task is about. */
export function PeoplePanel({
  entityType,
  entityId,
  entityLabel,
  roles = ['Landowner', 'Buyer', 'Seller', 'Agent', 'Lawyer', 'Investor', 'Other'],
  emptyText = 'Nobody tagged yet.',
  hideAgents,
}: {
  entityType: 'lead' | 'transaction' | 'property' | 'task' | 'note' | 'meeting' | 'verification'
  entityId: string
  entityLabel: string
  roles?: string[]
  emptyText?: string
  /** On a page with its own Agents panel, don't list agents twice. */
  hideAgents?: boolean
}) {
  const [rows, setRows] = useState<LinkRow[] | null>(null)
  const [ready, setReady] = useState(true)
  const [adding, setAdding] = useState(false)
  const [role, setRole] = useState(roles[0])
  const [error, setError] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    api
      .get<{ data: LinkRow[]; ready: boolean }>(`/api/contact-links?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      .then((r) => {
        setRows(hideAgents ? r.data.filter((x) => !x.contact?.roles?.includes('Agent') && !AGENT_ROLES.includes(x.role)) : r.data)
        setReady(r.ready)
      })
      .catch(() => setRows([]))
  }, [entityType, entityId, hideAgents])
  useEffect(load, [load])

  async function add(c: Contact) {
    setError(null)
    try {
      await api.post('/api/contact-links', { contact_id: c.id, entity_type: entityType, entity_id: entityId, entity_label: entityLabel, role })
      setAdding(false)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  async function unlink(r: LinkRow) {
    setRows((p) => p?.filter((x) => x.id !== r.id) ?? null)
    await api.del(`/api/contact-links?id=${r.id}`).catch((e) => setError(e.message))
  }

  if (!ready) return <p className="erpEmpty">Contacts arrive with migration 015 — see Setup.</p>
  return (
    <div ref={box}>
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 && !adding ? (
        <Empty>{emptyText}</Empty>
      ) : (
        rows.map((r) =>
          r.contact ? (
            <div key={r.id} className="erpRow" style={{ alignItems: 'center' }}>
              <span className="erpRow__icon">
                <UserRound size={16} />
              </span>
              <div className="erpRow__body">
                <Link href={`/admin/deals/contacts/${r.contact.id}`} className="erpRow__title" style={{ display: 'block' }}>
                  {r.contact.name}
                </Link>
                <div className="erpRow__sub">{[r.role, r.contact.phone, r.contact.company].filter(Boolean).join(' · ')}</div>
              </div>
              {r.contact.phone ? (
                <a className="erpBtn ghost sm" href={telHref(r.contact.phone)} title="Call">
                  <Phone size={13} />
                </a>
              ) : null}
              <button type="button" className="erpBtn ghost sm" onClick={() => unlink(r)} title="Untag">
                <X size={13} />
              </button>
            </div>
          ) : null
        )
      )}
      {error ? <Banner tone="error">{error}</Banner> : null}
      {adding ? (
        <div style={{ marginTop: 10 }}>
          <div className="erpChips" style={{ marginBottom: 8 }}>
            {roles.map((r) => (
              <button type="button" key={r} className={`erpChip ${role === r ? 'is-gold' : ''}`} onClick={() => setRole(r)}>
                {r}
              </button>
            ))}
          </div>
          <ContactPicker onPick={add} defaultRole={role} exclude={(rows ?? []).map((r) => r.contact?.id ?? '')} autoFocus />
          <button type="button" className="erpBtn ghost sm" style={{ marginTop: 8 }} onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="erpBtn ghost block" style={{ borderStyle: 'dashed', marginTop: 6 }} onClick={() => setAdding(true)}>
          <Plus size={15} /> Tag a contact
        </button>
      )}
    </div>
  )
}
