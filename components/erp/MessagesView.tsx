'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, CircleAlert, FileText, ImageIcon, Link2, Loader2, Mic, MicOff, Paperclip, Trash2, Users, X } from 'lucide-react'
import { api, dayLabel, timeOf } from './lib'
import { Avatar, linkHref } from './ui'
import { openDocument, uploadDocument } from './documents'
import Link from 'next/link'

/* Team messages on the web: the same conversations as the app's
   Messages screen, over the same /api/messages. The list refreshes every
   15 seconds and the open thread every 4. */

interface Attachment {
  id: string
  name: string
  mime: string
}
interface Message {
  id: string
  conversation_id: string
  author_id: string | null
  author_name: string
  body: string
  attachments: Attachment[]
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  created_at: string
  deleted_at: string | null
  pending?: boolean
  failed?: boolean
}
interface Summary {
  id: string | null
  ref: string
  kind: 'team' | 'direct'
  title: string
  with: { id: string; name: string } | null
  last: { body: string; author_name: string; created_at: string; attachments: Attachment[] } | null
  unread: number
}
type SpeechRec = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

function shortWhen(iso: string) {
  const d = new Date(iso)
  const today = new Date().toDateString() === d.toDateString()
  return today ? timeOf(iso) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function lastLine(c: Summary, me?: string) {
  if (!c.last) return c.kind === 'team' ? 'Everyone on the team' : 'No messages yet'
  const who = c.last.author_name === me ? 'You' : c.kind === 'team' ? c.last.author_name.split(' ')[0] : ''
  const what = c.last.body || (c.last.attachments?.length ? (c.last.attachments.every((a) => a.mime?.startsWith('image/')) ? 'Photo' : c.last.attachments[0].name) : '')
  return who ? `${who}: ${what}` : what
}

export function MessagesView() {
  const [me, setMe] = useState<{ id: string; name: string } | null>(null)
  const [list, setList] = useState<Summary[] | null>(null)
  const [active, setActive] = useState<string>('team')
  const [error, setError] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    try {
      const r = await api.get<{ conversations: Summary[] }>('/api/messages')
      setList(r.conversations)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setList((l) => l ?? [])
    }
  }, [])

  useEffect(() => {
    api.get<{ user: { id: string; name: string } }>('/api/admin/me').then((r) => setMe(r.user)).catch(() => {})
    const want = new URLSearchParams(window.location.search).get('c')
    if (want) setActive(want)
    loadList()
    const t = setInterval(loadList, 15_000)
    return () => clearInterval(t)
  }, [loadList])

  const current = list?.find((c) => c.ref === active || c.id === active)

  return (
    <div className="erpPage erpMsg">
      <div className="erpHead">
        <div>
          <h1>Messages</h1>
          <p>Talk to the team without leaving the ERP. Share photos and files, and link a listing or deal.</p>
        </div>
      </div>
      {error ? (
        <div className="erpBanner warn" role="status">
          <CircleAlert size={16} /> {error}
        </div>
      ) : null}
      <div className="erpMsg__grid">
        <nav className="erpMsg__list" aria-label="Conversations">
          {list === null ? (
            <div className="erpMsg__muted">
              <Loader2 size={14} className="spin" /> Loading…
            </div>
          ) : (
            list.map((c) => (
              <button
                key={c.ref}
                type="button"
                className={`erpMsg__conv ${current && (current.ref === c.ref) ? 'is-active' : ''}`}
                onClick={() => {
                  setActive(c.ref)
                  window.history.replaceState(null, '', `?c=${encodeURIComponent(c.ref)}`)
                }}
              >
                {c.kind === 'team' ? (
                  <span className="erpMsg__team">
                    <Users size={17} />
                  </span>
                ) : (
                  <Avatar name={c.title} size={38} />
                )}
                <span className="erpMsg__convText">
                  <span className="erpMsg__convTop">
                    <b>{c.title}</b>
                    {c.last ? <small>{shortWhen(c.last.created_at)}</small> : null}
                  </span>
                  <span className="erpMsg__convTop">
                    <span className={`erpMsg__preview ${c.unread ? 'is-unread' : ''}`}>{lastLine(c, me?.name)}</span>
                    {c.unread ? <span className="erpMsg__badge">{c.unread > 99 ? '99+' : c.unread}</span> : null}
                  </span>
                </span>
              </button>
            ))
          )}
        </nav>
        {current ? <Thread key={current.ref} summary={current} me={me} onChange={loadList} onCreated={(id) => setActive(id)} /> : <div className="erpMsg__thread" />}
      </div>
    </div>
  )
}

function Thread({ summary, me, onChange, onCreated }: { summary: Summary; me: { id: string; name: string } | null; onChange: () => void; onCreated: (id: string) => void }) {
  const [msgs, setMsgs] = useState<Message[] | null>(null)
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const convId = useRef<string | null>(summary.id)
  const latest = useRef<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const rec = useRef<SpeechRec | null>(null)

  const markRead = useCallback(() => {
    if (convId.current) api.post(`/api/messages/${convId.current}`, { read: true }).then(onChange, () => {})
  }, [onChange])

  const merge = useCallback((incoming: Message[]) => {
    if (!incoming.length) return
    setMsgs((cur) => {
      const have = new Map((cur ?? []).filter((m) => !m.pending && !m.failed).map((m) => [m.id, m]))
      for (const m of incoming) have.set(m.id, m)
      const waiting = (cur ?? []).filter((m) => m.pending || m.failed)
      return [...have.values()].sort((a, b) => a.created_at.localeCompare(b.created_at)).concat(waiting)
    })
    const last = incoming[incoming.length - 1].created_at
    if (!latest.current || last > latest.current) latest.current = last
  }, [])

  useEffect(() => {
    let live = true
    api
      .get<{ conversation: { id: string | null }; messages: Message[] }>(`/api/messages/${encodeURIComponent(summary.ref)}`)
      .then((r) => {
        if (!live) return
        convId.current = r.conversation.id
        setMsgs(r.messages)
        latest.current = r.messages.length ? r.messages[r.messages.length - 1].created_at : null
        if (summary.unread) markRead()
      })
      .catch((e) => live && (setError((e as Error).message), setMsgs([])))
    const t = setInterval(async () => {
      if (!convId.current) return
      try {
        const q = latest.current ? `?after=${encodeURIComponent(latest.current)}` : ''
        const r = await api.get<{ messages: Message[] }>(`/api/messages/${convId.current}${q}`)
        if (r.messages.length && live) {
          merge(r.messages)
          markRead()
        }
      } catch {
        /* next tick */
      }
    }, 4000)
    return () => {
      live = false
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.ref])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs?.length])

  async function attach(list: FileList | null) {
    if (!list?.length) return
    const picked = Array.from(list)
    setUploading((n) => n + picked.length)
    for (const f of picked) {
      try {
        const d = await uploadDocument(f, { entity_type: 'general', entity_id: '', entity_label: 'Team chat', category: 'Other' })
        setFiles((all) => [...all, { id: d.id, name: d.name, mime: d.mime }])
      } catch (e) {
        setError(`${f.name}: ${(e as Error).message}`)
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  async function send() {
    const body = input.trim()
    if ((!body && !files.length) || uploading) return
    rec.current?.stop()
    const tempId = `tmp-${Date.now()}`
    const draft: Message = {
      id: tempId,
      conversation_id: convId.current ?? '',
      author_id: me?.id ?? null,
      author_name: me?.name ?? 'You',
      body,
      attachments: files,
      entity_type: null,
      entity_id: null,
      entity_label: null,
      created_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    }
    setMsgs((m) => [...(m ?? []), draft])
    setInput('')
    setFiles([])
    try {
      const r = await api.post<{ conversation_id: string; message: Message }>('/api/messages', { to: convId.current ?? summary.ref, body, attachments: draft.attachments })
      const fresh = !convId.current
      convId.current = r.conversation_id
      setMsgs((m) => (m ?? []).filter((x) => x.id !== tempId))
      merge([r.message])
      onChange()
      if (fresh) onCreated(r.conversation_id)
    } catch (e) {
      setMsgs((m) => (m ?? []).map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)))
      setError((e as Error).message)
    }
  }

  async function remove(m: Message) {
    if (!convId.current || !confirm('Delete this message? It will show as “Message deleted” for everyone.')) return
    try {
      await api.del(`/api/messages/${convId.current}?message_id=${m.id}`)
      setMsgs((all) => (all ?? []).map((x) => (x.id === m.id ? { ...x, body: '', attachments: [], deleted_at: new Date().toISOString() } : x)))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function toggleMic() {
    if (listening) return rec.current?.stop()
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition
    if (!Ctor) return setError('Voice input isn’t supported in this browser. Try Chrome, Edge or Safari.')
    const r = new Ctor()
    r.lang = 'en-IN'
    r.interimResults = true
    r.continuous = true
    const before = input ? input.trimEnd() + ' ' : ''
    r.onresult = (e) => setInput(before + Array.from(e.results).map((x) => x[0].transcript).join(''))
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    setListening(true)
    r.start()
  }

  return (
    <section className="erpMsg__thread" aria-label={summary.title}>
      <header className="erpMsg__threadHead">
        {summary.kind === 'team' ? (
          <span className="erpMsg__team">
            <Users size={17} />
          </span>
        ) : (
          <Avatar name={summary.title} size={34} />
        )}
        <b>{summary.title}</b>
      </header>
      <div className="erpMsg__log">
        {msgs === null ? (
          <div className="erpMsg__muted">
            <Loader2 size={14} className="spin" /> Loading…
          </div>
        ) : msgs.length === 0 ? (
          <div className="erpMsg__muted">{summary.kind === 'team' ? 'Say hello to the team. Everyone signed in to Bhumi sees messages here.' : `Start a conversation with ${summary.title}.`}</div>
        ) : (
          msgs.map((m, i) => {
            const mine = m.author_id === me?.id
            const prev = msgs[i - 1]
            const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
            const showName = summary.kind === 'team' && !mine && (newDay || prev?.author_id !== m.author_id)
            const href = linkHref(m.entity_type, m.entity_id)
            return (
              <div key={m.id}>
                {newDay ? <div className="erpMsg__day">{dayLabel(m.created_at)}</div> : null}
                <div className={`erpMsg__bubble ${mine ? 'is-mine' : ''} ${m.pending ? 'is-pending' : ''}`}>
                  {showName ? <div className="erpMsg__author">{m.author_name}</div> : null}
                  {m.deleted_at ? (
                    <i className="erpMsg__deleted">Message deleted</i>
                  ) : (
                    <>
                      {m.attachments.map((a) => (
                        <button key={a.id} type="button" className="erpMsg__file" onClick={() => openDocument({ id: a.id } as never)}>
                          {a.mime?.startsWith('image/') ? <ImageIcon size={15} /> : <FileText size={15} />} {a.name}
                        </button>
                      ))}
                      {m.body ? <div className="erpMsg__body">{m.body}</div> : null}
                      {href && m.entity_label ? (
                        <Link href={href} className="erpMsg__file">
                          <Link2 size={15} /> {m.entity_label}
                        </Link>
                      ) : null}
                    </>
                  )}
                  <div className="erpMsg__meta">
                    {m.failed ? (
                      <button type="button" onClick={() => (setMsgs((all) => (all ?? []).filter((x) => x.id !== m.id)), setInput(m.body), setFiles(m.attachments))}>
                        Not sent · retry
                      </button>
                    ) : m.pending ? (
                      'Sending…'
                    ) : (
                      timeOf(m.created_at)
                    )}
                    {mine && !m.pending && !m.failed && !m.deleted_at ? (
                      <button type="button" className="erpMsg__del" onClick={() => remove(m)} aria-label="Delete message" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={end} />
      </div>
      <form
        className="erpChat__composer"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          attach(e.dataTransfer.files)
        }}
      >
        {error ? (
          <button type="button" className="erpMsg__error" onClick={() => setError(null)}>
            <CircleAlert size={14} /> {error}
          </button>
        ) : null}
        {(files.length > 0 || uploading > 0) && (
          <div className="erpChat__pending">
            {files.map((f) => (
              <span key={f.id}>
                <FileText size={13} /> {f.name}
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((all) => all.filter((x) => x.id !== f.id))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {uploading > 0 && (
              <span>
                <Loader2 size={13} className="spin" /> Uploading {uploading}…
              </span>
            )}
          </div>
        )}
        <div className="erpChat__row">
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => (attach(e.target.files), (e.target.value = ''))} />
          <button type="button" className="erpChat__icon" onClick={() => fileInput.current?.click()} aria-label="Attach files" title="Attach files">
            <Paperclip size={18} />
          </button>
          <textarea
            rows={1}
            value={input}
            placeholder={listening ? 'Listening…' : `Message ${summary.kind === 'team' ? 'the team' : summary.title}`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button type="button" className={`erpChat__icon ${listening ? 'is-on' : ''}`} onClick={toggleMic} aria-label={listening ? 'Stop dictating' : 'Dictate'} title="Dictate">
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button type="submit" className="erpChat__send" disabled={(!input.trim() && !files.length) || uploading > 0} aria-label="Send">
            <ArrowUp size={18} />
          </button>
        </div>
      </form>
    </section>
  )
}
