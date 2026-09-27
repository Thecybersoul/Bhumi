'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bell, CircleCheck, Search, Send } from 'lucide-react'
import { api, formatBytes, timeAgo, type Activity, type Doc, type GoogleStatus } from './lib'
import { Avatar, Banner, Empty, Loading } from './ui'
import { ActivityRow } from './records'
import { DocRow, docIcon } from './documents'

/* ─── Team activity ─────────────────────────────────────── */

export function ActivityView() {
  const [items, setItems] = useState<Activity[] | null>(null)
  const [who, setWho] = useState('all')
  useEffect(() => {
    api
      .get<{ data: Activity[] }>('/api/activity?limit=200')
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
  }, [])
  const people = useMemo(() => [...new Set((items ?? []).map((a) => a.actor_name))].filter((n) => n !== 'Website'), [items])
  const list = (items ?? []).filter((a) => who === 'all' || a.actor_name === who)
  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Team activity</h1>
          <p>Every change anyone made, with who made it and, for edits, exactly what changed.</p>
        </div>
      </div>
      <div className="erpChips" style={{ marginBottom: 16 }}>
        <button className={`erpChip ${who === 'all' ? 'is-on' : ''}`} onClick={() => setWho('all')}>
          Everyone
        </button>
        {people.map((p) => (
          <button key={p} className={`erpChip ${who === p ? 'is-on' : ''}`} onClick={() => setWho(p)}>
            <Avatar name={p} size={18} /> {p}
          </button>
        ))}
      </div>
      <div className="erpCard" style={{ maxWidth: 860 }}>
        {items === null ? <Loading /> : list.length === 0 ? <Empty>No activity yet.</Empty> : list.map((a) => <ActivityRow key={a.id} a={a} />)}
      </div>
    </div>
  )
}

/* ─── Documents hub ─────────────────────────────────────── */

const SECTION: Record<string, string> = { property: 'Listings', transaction: 'Deals', verification: 'Verification', lead: 'Leads', contact: 'Contacts', note: 'Notes', meeting: 'Meetings', task: 'Tasks', general: 'General' }
const HREF: Record<string, (id: string) => string> = {
  property: (id) => `/admin/properties/${id}`,
  transaction: (id) => `/admin/deals/${id}`,
  meeting: (id) => `/admin/meetings/${id}`,
  note: () => '/admin/notes-tasks?view=notes',
  task: () => '/admin/notes-tasks',
  lead: (id) => `/admin/deals/leads/${id}`,
  contact: (id) => `/admin/deals/contacts/${id}`,
}

export function DocumentsView() {
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  useEffect(() => {
    api
      .get<{ data: Doc[] }>('/api/documents')
      .then((r) => setDocs(r.data))
      .catch(() => setDocs([]))
  }, [])
  const groups = useMemo(() => {
    const n = q.trim().toLowerCase()
    const list = (docs ?? []).filter((d) => (filter === 'all' || d.entity_type === filter) && (!n || `${d.name} ${d.category} ${d.entity_label} ${d.created_by ?? ''}`.toLowerCase().includes(n)))
    const m = new Map<string, Doc[]>()
    for (const d of list) {
      const k = `${d.entity_type}|${d.entity_id ?? ''}|${d.entity_label || 'Unlabelled'}`
      m.set(k, [...(m.get(k) ?? []), d])
    }
    return [...m.entries()]
  }, [docs, q, filter])
  const total = (docs ?? []).reduce((a, d) => a + (d.bytes ?? 0), 0)

  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Documents</h1>
          <p>Every deed, EC, agreement and photo across listings, deals, meetings and notes. {docs ? `${docs.length} files · ${formatBytes(total) || '0 KB'}` : ''}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: 13, color: 'var(--muted)' }} />
          <input className="erpInput" style={{ paddingLeft: 32 }} placeholder="Search name, category, record, uploader" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="erpChips">
          {['all', 'property', 'transaction', 'lead', 'contact', 'meeting', 'note', 'task', 'verification'].map((f) => (
            <button key={f} className={`erpChip ${filter === f ? 'is-on' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : SECTION[f]}
            </button>
          ))}
        </div>
      </div>
      {docs === null ? (
        <Loading />
      ) : groups.length === 0 ? (
        <div className="erpCard">
          <Empty>{q || filter !== 'all' ? 'Nothing matches.' : 'No documents yet. Attach them from a listing, deal, meeting or note.'}</Empty>
        </div>
      ) : (
        <div className="erpGrid two">
          {groups.map(([k, list]) => {
            const [type, id, label] = k.split('|')
            const href = id && HREF[type] ? HREF[type](id) : null
            return (
              <div key={k} className="erpCard">
                <div className="erpCard__head">
                  <div className="erpCard__title" style={{ fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{SECTION[type] ?? type} ·</span> {label}
                  </div>
                  {href ? (
                    <Link href={href} className="erpCard__action">
                      Open ›
                    </Link>
                  ) : null}
                </div>
                {list.map((d) => (
                  <DocRow key={d.id} d={d} />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Notifications inbox ───────────────────────────────── */

interface Note {
  id: string
  kind: string
  title: string
  body: string
  actor: string
  created_at: string
  web_path: string | null
}

export function NotificationsView() {
  const [items, setItems] = useState<Note[] | null>(null)
  const [seenAt, setSeenAt] = useState<string | null>(null)
  useEffect(() => {
    api
      .get<{ items: Note[]; seen_at: string | null }>('/api/notifications?limit=80')
      .then((r) => {
        setItems(r.items)
        setSeenAt(r.seen_at)
        api.post('/api/notifications/seen').catch(() => {})
      })
      .catch(() => setItems([]))
  }, [])
  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Notifications</h1>
          <p>What the rest of the team did that you should know about, plus website enquiries and document requests.</p>
        </div>
      </div>
      <div style={{ maxWidth: 820 }}>
        {items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <div className="erpCard" style={{ textAlign: 'center', padding: 36 }}>
            <Bell size={30} color="var(--line)" />
            <p className="erpEmpty">All quiet. Team updates and website enquiries will show up here.</p>
          </div>
        ) : (
          items.map((n) => {
            const unread = !seenAt || n.created_at > seenAt
            const inner = (
              <>
                <Avatar name={n.actor} size={34} />
                <div className="erpRow__body">
                  <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{n.title}</div>
                  {n.body ? <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-2)', marginTop: 2 }}>{n.body}</div> : null}
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                </div>
                {unread ? <span style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--gold)', marginTop: 6 }} /> : null}
              </>
            )
            const style: React.CSSProperties = {
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              background: unread ? 'var(--gold-tint)' : '#fff',
              border: `1px solid ${unread ? 'var(--gold)' : 'var(--line)'}`,
              borderRadius: 16,
              padding: 14,
              marginBottom: 8,
              color: 'inherit',
            }
            return n.web_path ? (
              <Link key={n.id} href={n.web_path} style={style}>
                {inner}
              </Link>
            ) : (
              <div key={n.id} style={style}>
                {inner}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ─── Email composer ────────────────────────────────────── */

export function EmailView({ senderName }: { senderName: string }) {
  const p = useSearchParams()
  const router = useRouter()
  const [to, setTo] = useState(p.get('to') ?? '')
  const [cc, setCc] = useState(p.get('cc') ?? '')
  const [subject, setSubject] = useState(p.get('subject') ?? '')
  const [body, setBody] = useState(p.get('body') ?? '')
  const [docs, setDocs] = useState<Doc[]>([])
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const entity = { entity_type: p.get('entity_type') ?? '', entity_id: p.get('entity_id') ?? '', entity_label: p.get('entity_label') ?? '' }

  useEffect(() => {
    api.get<GoogleStatus>('/api/admin/google/status').then(setGoogle).catch(() => {})
    if (entity.entity_type && entity.entity_id) {
      api
        .get<{ data: Doc[] }>(`/api/documents?entity_type=${entity.entity_type}&entity_id=${encodeURIComponent(entity.entity_id)}`)
        .then((r) => setDocs(r.data))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gmail = Boolean(google?.services?.gmail)
  const from = google?.email || google?.account || 'info@bhumiestates.in'
  const total = docs.filter((d) => picked.has(d.id)).reduce((a, d) => a + (d.bytes ?? 0), 0)

  async function send() {
    setError(null)
    if (!to.trim()) return setError('Add a recipient')
    if (!subject.trim() || !body.trim()) return setError('Add a subject and a message')
    setBusy(true)
    try {
      await api.post('/api/email', { to, cc, subject, body, document_ids: [...picked], ...entity })
      setSent(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="erpPage">
        <div className="erpCard" style={{ textAlign: 'center', padding: 44, maxWidth: 560 }}>
          <CircleCheck size={48} color="var(--verified)" />
          <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginTop: 10 }}>Sent</h2>
          <p className="erpEmpty">From {from}. It’s in that account’s Sent folder, and replies come back to it.</p>
          <button className="erpBtn primary" style={{ marginTop: 14 }} onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>New email</h1>
          {entity.entity_label ? <p>About {entity.entity_label}</p> : null}
        </div>
      </div>
      {google && !gmail ? <Banner>Gmail isn’t connected yet. Connect Google from Profile (sign in as {google.account}).</Banner> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="erpGrid main">
        <div className="erpCard">
          <div className="erpForm">
            <Field2 label="From">
              <span style={{ fontWeight: 600 }}>
                {senderName} · Bhumi Estates <span style={{ color: 'var(--muted)' }}>&lt;{from}&gt;</span>
              </span>
            </Field2>
            <Field2 label="To">
              <input className="erpInput" value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@example.com" />
            </Field2>
            <Field2 label="Cc">
              <input className="erpInput" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Separate with commas" />
            </Field2>
            <Field2 label="Subject">
              <input className="erpInput" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ fontWeight: 700 }} />
            </Field2>
            <textarea className="erpInput" value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 300 }} placeholder="Write your message…" />
            <small style={{ color: 'var(--muted)' }}>Your name, Bhumi Estates, the company email and website are added as a signature.</small>
            <button className="erpBtn primary" onClick={send} disabled={busy || (google !== null && !gmail)}>
              <Send size={16} /> {busy ? 'Sending…' : 'Send email'}
            </button>
          </div>
        </div>
        <div className="erpCard">
          <div className="erpCard__title" style={{ marginBottom: 10 }}>Attach documents</div>
          {docs.length === 0 ? (
            <Empty>{entity.entity_id ? 'This record has no documents yet.' : 'Open the composer from a listing, deal or meeting to attach its documents.'}</Empty>
          ) : (
            docs.map((d) => {
              const { Icon, tint } = docIcon(d.mime, d.name)
              const on = picked.has(d.id)
              return (
                <label key={d.id} className="erpDoc" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setPicked((s) => {
                        const n = new Set(s)
                        if (n.has(d.id)) n.delete(d.id)
                        else n.add(d.id)
                        return n
                      })
                    }
                  />
                  <Icon size={18} color={tint} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="erpRow__title" style={{ display: 'block' }}>{d.name}</span>
                    <span className="erpRow__sub" style={{ display: 'block' }}>
                      {[d.category, formatBytes(d.bytes), d.path === 'link' ? 'sent as a link' : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </label>
              )
            })
          )}
          {picked.size ? (
            <p style={{ fontSize: 'var(--text-xs)', marginTop: 8, color: total > 18 * 1024 * 1024 ? 'var(--flagged)' : 'var(--muted)', fontWeight: 700 }}>
              {picked.size} selected · {formatBytes(total) || 'size unknown'} (limit 18 MB)
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--muted)' }}>{label}</span>
      {children}
    </div>
  )
}
