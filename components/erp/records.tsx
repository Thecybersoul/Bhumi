'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, CirclePlus, Link as LinkIcon, Search, Video, X } from 'lucide-react'
import { api, needsOutcome, timeAgo, timeOf, type Activity, type Meeting, KIND_TINT } from './lib'
import { Avatar, Empty, KIND_ICON, LINK_ICON, Loading, RecordLink, linkHref } from './ui'

/* ─── Activity trail ─────────────────────────────────────── */

const NOUN: Record<string, string> = {
  property: 'listing',
  transaction: 'deal',
  lead: 'lead',
  note: 'note',
  task: 'task',
  verification: 'verification case',
  data_room: 'document request',
  meeting: 'meeting',
  document: 'document',
  website: 'website',
  media: 'media',
  google: 'Google Workspace',
  account: 'account',
  sheets: 'Google Sheets register',
}
const VERB: Record<string, string> = {
  create: 'added',
  update: 'updated',
  delete: 'removed',
  upload: 'uploaded to',
  link: 'linked a file to',
  connect: 'connected',
  disconnect: 'disconnected',
  login: 'signed in',
  email: 'emailed about',
  sync: 'synced',
}

export function activityHeadline(a: Activity) {
  if (['google', 'account', 'sheets'].includes(a.entity_type)) return `${VERB[a.action] ?? a.action} ${NOUN[a.entity_type] ?? ''}`.trim()
  return `${VERB[a.action] ?? a.action} ${NOUN[a.entity_type] ?? a.entity_type}`
}

export function ActivityRow({ a, showEntity = true }: { a: Activity; showEntity?: boolean }) {
  const href = a.action !== 'delete' ? linkHref(a.entity_type, a.entity_id) : null
  const body = (
    <>
      <Avatar name={a.actor_name} size={30} />
      <div className="erpRow__body">
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-2)', lineHeight: 1.45 }}>
          <b style={{ color: 'var(--ink)' }}>{a.actor_name}</b> {activityHeadline(a)}
          {showEntity && a.entity_label ? <b style={{ color: 'var(--navy)' }}> {a.entity_label}</b> : null}
        </div>
        {a.summary ? <div className="erpRow__sub" style={{ whiteSpace: 'normal' }}>{a.summary}</div> : null}
      </div>
      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(a.created_at)}</span>
    </>
  )
  return href ? (
    <Link href={href} className="erpRow" style={{ alignItems: 'flex-start' }}>
      {body}
    </Link>
  ) : (
    <div className="erpRow" style={{ alignItems: 'flex-start' }}>
      {body}
    </div>
  )
}

export function ActivityFeed({
  entityType,
  entityId,
  actorId,
  limit = 20,
  emptyText = 'No activity yet.',
}: {
  entityType?: string
  entityId?: string
  actorId?: string
  limit?: number
  emptyText?: string
}) {
  const [items, setItems] = useState<Activity[] | null>(null)
  useEffect(() => {
    const q = new URLSearchParams({ limit: String(limit) })
    if (entityType) q.set('entity_type', entityType)
    if (entityId) q.set('entity_id', entityId)
    if (actorId) q.set('actor_id', actorId)
    api
      .get<{ data: Activity[] }>(`/api/activity?${q}`)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
  }, [entityType, entityId, actorId, limit])
  if (items === null) return <Loading />
  if (!items.length) return <Empty>{emptyText}</Empty>
  return (
    <div>
      {items.map((a) => (
        <ActivityRow key={a.id} a={a} showEntity={!entityId} />
      ))}
    </div>
  )
}

/* ─── Record picker ("Related to") ───────────────────────── */

export type LinkType = 'property' | 'transaction' | 'task' | 'lead'
export interface LinkValue {
  entity_type: LinkType | 'general'
  entity_id: string | null
  entity_label: string
}
export const NO_LINK: LinkValue = { entity_type: 'general', entity_id: null, entity_label: '' }

const TABS: { type: LinkType; label: string }[] = [
  { type: 'property', label: 'Listing' },
  { type: 'transaction', label: 'Deal' },
  { type: 'task', label: 'Task' },
  { type: 'lead', label: 'Lead' },
]

interface Option {
  id: string
  label: string
  sub: string
}

type Row = Record<string, unknown>
const s = (v: unknown) => (v == null ? '' : String(v))

async function loadOptions(type: LinkType): Promise<Option[]> {
  const path = { property: '/api/properties?admin=1', transaction: '/api/transactions', task: '/api/tasks', lead: '/api/leads' }[type]
  const r = await api.get<{ data: Row[]; source: string }>(path)
  if (r.source !== 'live') return []
  if (type === 'property') return r.data.map((p) => ({ id: s(p.id), label: `${s(p.code)} · ${s(p.title)}`, sub: `${s(p.location)} · ${s(p.status)}` }))
  if (type === 'transaction')
    return r.data.map((t) => ({ id: s(t.id), label: `${s(t.reference)} · ${s(t.property_label)}`, sub: `${s(t.stage)} · ${[t.buyer_name, t.seller_name].filter(Boolean).join(' / ')}` }))
  if (type === 'task') return r.data.filter((t) => t.status === 'Open').map((t) => ({ id: s(t.id), label: s(t.title), sub: s(t.entity_label) || s(t.priority) }))
  return r.data.map((l) => ({ id: s(l.id), label: s(l.name), sub: `${s(l.kind)} · ${s(l.stage)}` }))
}

export function EntityPicker({
  value,
  onChange,
  types = ['property', 'transaction', 'task', 'lead'],
  label = 'Related to',
}: {
  value: LinkValue
  onChange: (v: LinkValue) => void
  types?: LinkType[]
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<LinkType>(types[0])
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<Partial<Record<LinkType, Option[]>>>({})
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || options[tab]) return
    loadOptions(tab)
      .then((o) => setOptions((p) => ({ ...p, [tab]: o })))
      .catch(() => setOptions((p) => ({ ...p, [tab]: [] })))
  }, [open, tab, options])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    return (options[tab] ?? []).filter((o) => !n || `${o.label} ${o.sub}`.toLowerCase().includes(n))
  }, [options, tab, q])

  const linked = value.entity_type !== 'general' && value.entity_label
  const Icon = LINK_ICON[value.entity_type] ?? LinkIcon

  return (
    <div className="erpField">
      <span>{label}</span>
      <div className="erpPicker" ref={ref}>
        <button type="button" className="erpInput" style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
          <Icon size={16} color={linked ? 'var(--navy)' : 'var(--muted)'} />
          <span style={{ flex: 1, color: linked ? 'var(--ink)' : 'var(--muted)', fontWeight: linked ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {linked ? value.entity_label : 'Link a listing, deal, task or lead'}
          </span>
          {linked ? (
            <X
              size={16}
              color="var(--muted)"
              onClick={(e) => {
                e.stopPropagation()
                onChange(NO_LINK)
              }}
            />
          ) : (
            <ChevronDown size={16} color="var(--muted)" />
          )}
        </button>
        {open ? (
          <div className="erpPicker__panel">
            <div className="erpChips">
              {TABS.filter((t) => types.includes(t.type)).map((t) => (
                <button type="button" key={t.type} className={`erpChip ${tab === t.type ? 'is-on' : ''}`} onClick={() => setTab(t.type)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }} />
              <input className="erpInput" style={{ paddingLeft: 32 }} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            </div>
            <div className="erpPicker__list">
              {options[tab] === undefined ? (
                <Loading />
              ) : !list.length ? (
                <Empty>Nothing here yet.</Empty>
              ) : (
                list.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    className="erpPicker__opt"
                    onClick={() => {
                      onChange({ entity_type: tab, entity_id: o.id, entity_label: o.label })
                      setOpen(false)
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="erpRow__title" style={{ display: 'block' }}>{o.label}</span>
                      <span className="erpRow__sub" style={{ display: 'block' }}>{o.sub}</span>
                    </span>
                    {value.entity_id === o.id ? <Check size={16} color="var(--verified)" /> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ─── Meetings ───────────────────────────────────────────── */

export function MeetingCard({ m, showDay }: { m: Meeting; showDay?: boolean }) {
  const tint = KIND_TINT[m.kind] ?? 'var(--navy)'
  const Icon = KIND_ICON[m.kind]
  const owed = needsOutcome(m)
  const cancelled = m.status === 'Cancelled'
  return (
    <Link href={`/admin/meetings/${m.id}`} className="erpMeeting" style={cancelled ? { opacity: 0.55 } : undefined}>
      <div className="erpMeeting__time">
        <b>{timeOf(m.scheduled_at)}</b>
        <span>{showDay ? new Date(m.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : `${m.duration_min} min`}</span>
      </div>
      <div className="erpMeeting__rail" style={{ background: tint }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="erpMeeting__kind" style={{ color: tint }}>
          {Icon ? <Icon size={13} /> : null}
          <span style={{ flex: 1 }}>{m.kind}</span>
          {m.status === 'Completed' ? (
            <span className="erpPill" style={{ color: 'var(--verified)', background: 'var(--verified-bg)' }}>
              <Check size={11} /> Done
            </span>
          ) : owed ? (
            <span className="erpPill" style={{ color: 'var(--pending)', background: 'var(--pending-bg)' }}>
              Add outcome
            </span>
          ) : cancelled ? (
            <span className="erpPill" style={{ color: 'var(--muted)', background: 'var(--line-2)' }}>
              Cancelled
            </span>
          ) : null}
        </div>
        <div className="erpMeeting__title" style={cancelled ? { textDecoration: 'line-through' } : undefined}>
          {m.title}
        </div>
        <RecordLink type={m.entity_type} id={m.entity_id} label={m.entity_label} />
        {m.location || m.attendees ? <div className="erpRow__sub">{[m.attendees, m.location].filter(Boolean).join(' · ')}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          {m.created_by ? (
            <span className="erpBy" style={{ marginTop: 0 }}>
              <span>
                <Avatar name={m.created_by} size={16} /> {m.created_by}
              </span>
            </span>
          ) : (
            <span />
          )}
          {m.google_meet_url ? (
            <span className="erpPill" style={{ color: 'var(--progress)', background: 'var(--progress-bg)' }}>
              <Video size={11} /> Meet
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

/** Meetings logged against one record, plus a button to log the next one pre-linked. */
export function RelatedMeetings({
  entityType,
  entityId,
  entityLabel,
  defaultKind = 'In person',
}: {
  entityType: string
  entityId: string
  entityLabel: string
  defaultKind?: string
}) {
  const [items, setItems] = useState<Meeting[] | null>(null)
  const router = useRouter()
  const load = useCallback(() => {
    api
      .get<{ data: Meeting[] }>(`/api/meetings?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      .then((r) => setItems([...r.data].sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))))
      .catch(() => setItems([]))
  }, [entityType, entityId])
  useEffect(load, [load])

  const q = new URLSearchParams({ entity_type: entityType, entity_id: entityId, entity_label: entityLabel, kind: defaultKind })
  return (
    <div>
      {items === null ? <Loading /> : items.length === 0 ? <Empty>None logged yet.</Empty> : items.slice(0, 6).map((m) => <MeetingCard key={m.id} m={m} showDay />)}
      <button type="button" className="erpBtn ghost block" style={{ borderStyle: 'dashed', marginTop: 6 }} onClick={() => router.push(`/admin/meetings/new?${q}`)}>
        <CirclePlus size={16} /> {defaultKind === 'Site visit' ? 'Log a site visit or meeting' : 'Log a meeting or call'}
      </button>
    </div>
  )
}
