'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Mail, PlayCircle, RefreshCw, Video } from 'lucide-react'
import { api, timeAgo } from './lib'
import { Avatar, Empty, Loading } from './ui'

/* Gmail and Meet actions any record page can drop in. Sending uses
   the company account (info@bhumiestates.in) with the signed-in
   person's name. */

export interface EmailDraft {
  to?: string
  cc?: string
  subject: string
  body: string
  entity_type: string
  entity_id: string
  entity_label: string
}

export function emailHref(d: EmailDraft) {
  const q = new URLSearchParams(Object.entries(d).filter(([, v]) => v != null && v !== '') as [string, string][])
  return `/admin/email?${q}`
}

export function EmailButton({ draft, label = 'Email', block }: { draft: EmailDraft; label?: string; block?: boolean }) {
  return (
    <Link href={emailHref(draft)} className={`erpBtn soft ${block ? 'block' : ''}`}>
      <Mail size={16} /> {label}
    </Link>
  )
}

interface SentEmail {
  id: string
  to_addresses: string
  subject: string
  attachments: { name: string }[]
  created_by: string
  created_at: string
}

export function EmailLog({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [items, setItems] = useState<SentEmail[] | null>(null)
  useEffect(() => {
    api
      .get<{ data: SentEmail[] }>(`/api/email?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
  }, [entityType, entityId])
  if (items === null) return <Loading />
  if (!items.length) return <Empty>No emails sent yet.</Empty>
  return (
    <div>
      {items.slice(0, 8).map((e) => (
        <div key={e.id} className="erpRow">
          <Avatar name={e.created_by} size={26} />
          <div className="erpRow__body">
            <div className="erpRow__title">{e.subject}</div>
            <div className="erpRow__sub">
              To {e.to_addresses}
              {e.attachments?.length ? ` · ${e.attachments.length} attachment${e.attachments.length > 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted)' }}>{timeAgo(e.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

/** Opens a new Google Meet room right now and logs it as a video call. */
export function MeetNowButton({
  entityType,
  entityId,
  entityLabel,
  title,
  label = 'Start a Google Meet now',
  block,
}: {
  entityType?: string
  entityId?: string
  entityLabel?: string
  title?: string
  label?: string
  block?: boolean
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ services?: { meet?: boolean } }>('/api/admin/google/status')
      .then((g) => setEnabled(Boolean(g.services?.meet)))
      .catch(() => setEnabled(false))
  }, [])

  async function start() {
    setBusy(true)
    setError(null)
    const w = window.open('about:blank', '_blank')
    try {
      const r = await api.post<{ url: string }>('/api/meet/instant', { entity_type: entityType, entity_id: entityId, entity_label: entityLabel, title })
      if (w) w.location.href = r.url
      else window.location.href = r.url
    } catch (e) {
      w?.close()
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!enabled) return null
  return (
    <div style={block ? { width: '100%' } : undefined}>
      <button type="button" className={`erpBtn meet ${block ? 'block' : ''}`} onClick={start} disabled={busy}>
        <Video size={16} /> {busy ? 'Opening…' : label}
      </button>
      {error ? <p style={{ fontSize: 'var(--text-xs)', color: 'var(--flagged)', marginTop: 4 }}>{error}</p> : null}
    </div>
  )
}

interface Session {
  started_at: string | null
  ended_at: string | null
  participants: { name: string; kind: string; joined_at: string | null; minutes: number | null }[]
  recordings: { url: string }[]
  transcripts: { url: string }[]
}

export function MeetAttendance({ meetingId }: { meetingId: string }) {
  const [data, setData] = useState<{ data: Session[]; reason?: string } | null>(null)
  const load = useCallback(() => {
    setData(null)
    api
      .get<{ data: Session[]; reason?: string }>(`/api/meetings/${meetingId}/attendance`)
      .then(setData)
      .catch((e) => setData({ data: [], reason: (e as Error).message }))
  }, [meetingId])
  useEffect(load, [load])

  const t = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '…')
  if (!data) return <Loading />
  if (!data.data.length) {
    return (
      <div>
        <Empty>{data.reason ?? 'Nobody has joined yet. Attendance appears a few minutes after the call ends.'}</Empty>
        <button type="button" className="erpBtn ghost sm" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
    )
  }
  return (
    <div>
      {data.data.map((c, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div className="erpDay" style={{ marginTop: 0 }}>
            {c.started_at ? new Date(c.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} · {t(c.started_at)} – {c.ended_at ? t(c.ended_at) : 'ongoing'}
          </div>
          {c.participants.map((p, j) => (
            <div key={j} className="erpRow">
              <Avatar name={p.name} size={24} />
              <div className="erpRow__body">
                <div className="erpRow__title">{p.name}</div>
                <div className="erpRow__sub">
                  {p.kind} · joined {t(p.joined_at)}
                </div>
              </div>
              <span className="erpRow__right">{p.minutes != null ? `${p.minutes} min` : ''}</span>
            </div>
          ))}
          {c.recordings.map((r, j) => (
            <a key={`r${j}`} href={r.url} target="_blank" rel="noreferrer" className="erpLink">
              <PlayCircle size={14} /> <span>Open recording</span>
            </a>
          ))}
          {c.transcripts.map((r, j) => (
            <a key={`t${j}`} href={r.url} target="_blank" rel="noreferrer" className="erpLink" style={{ marginLeft: 12 }}>
              <FileText size={14} /> <span>Open transcript</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  )
}
