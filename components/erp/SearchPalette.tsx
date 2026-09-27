'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, CircleCheck, FileText, Handshake, Map, NotebookPen, Search, Sparkles, User, UserRound, Users, type LucideIcon } from 'lucide-react'
import { ASSISTANT, api } from './lib'
import { linkHref } from './ui'

interface Hit {
  type: 'lead' | 'contact' | 'agent' | 'property' | 'transaction' | 'meeting' | 'task' | 'note' | 'document'
  id: string
  title: string
  sub: string
  entity_type?: string | null
  entity_id?: string | null
}

const GROUP: Record<Hit['type'], [string, LucideIcon]> = {
  agent: ['Agents', Handshake],
  contact: ['Contacts', UserRound],
  lead: ['Leads', User],
  property: ['Listings', Map],
  transaction: ['Deals', Briefcase],
  meeting: ['Meetings', Users],
  task: ['Tasks', CircleCheck],
  note: ['Notes', NotebookPen],
  document: ['Documents', FileText],
}

function hrefFor(h: Hit): string {
  switch (h.type) {
    case 'agent':
    case 'contact':
      return `/admin/deals/contacts/${h.id}`
    case 'lead':
      return `/admin/deals/leads/${h.id}`
    case 'property':
      return `/admin/properties/${h.id}`
    case 'transaction':
      return `/admin/deals/${h.id}`
    case 'meeting':
      return `/admin/meetings/${h.id}`
    case 'note':
      return linkHref(h.entity_type, h.entity_id) ?? '/admin/notes-tasks?view=notes'
    case 'task':
    case 'document':
      return linkHref(h.entity_type, h.entity_id) ?? (h.type === 'task' ? '/admin/notes-tasks' : '/admin/documents')
  }
}

/** ⌘K / Ctrl+K from anywhere in the admin: one box for every person,
    agent, listing, deal, lead, meeting, task, note and document — and
    a way to hand the question to the assistant instead. */
export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [busy, setBusy] = useState(false)
  const [at, setAt] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQ('')
    setHits([])
    setAt(0)
    setTimeout(() => input.current?.focus(), 10)
  }, [open])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return setHits([])
    setBusy(true)
    const t = setTimeout(() => {
      api
        .get<{ data: Hit[] }>(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => {
          setHits(r.data)
          setAt(0)
        })
        .catch(() => setHits([]))
        .finally(() => setBusy(false))
    }, 180)
    return () => clearTimeout(t)
  }, [q])

  // The rows in display order, plus "ask the assistant" at the end.
  const rows = useMemo(() => {
    const order = Object.keys(GROUP) as Hit['type'][]
    return order.flatMap((t) => hits.filter((h) => h.type === t))
  }, [hits])
  const ask = ASSISTANT && !!q.trim()
  const total = rows.length + (ask ? 1 : 0)

  function go(i: number) {
    if (i === rows.length) {
      router.push(`/admin/assistant?q=${encodeURIComponent(q.trim())}`)
    } else if (rows[i]) {
      router.push(hrefFor(rows[i]))
    }
    onClose()
  }

  if (!open) return null
  let lastType: string | null = null
  return (
    <div className="erpPalette" onMouseDown={onClose}>
      <div className="erpPalette__box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="erpPalette__input">
          <Search size={18} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, agents, listings, deals, leads, documents…"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setAt((a) => Math.min(total - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setAt((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter' && total) go(at)
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="erpPalette__list">
          {q.trim().length < 2 ? (
            <p className="erpEmpty">Type a name, phone number, agency, survey number, deal reference…</p>
          ) : busy && !rows.length ? (
            <p className="erpEmpty">Searching…</p>
          ) : !rows.length ? (
            <p className="erpEmpty">Nothing matches “{q.trim()}”.</p>
          ) : (
            rows.map((h, i) => {
              const [label, Icon] = GROUP[h.type]
              const head = h.type !== lastType ? label : null
              lastType = h.type
              return (
                <div key={`${h.type}${h.id}`}>
                  {head ? <div className="erpPalette__group">{head}</div> : null}
                  <button type="button" className={`erpPalette__row ${at === i ? 'is-on' : ''}`} onMouseEnter={() => setAt(i)} onClick={() => go(i)}>
                    <Icon size={16} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b>{h.title}</b>
                      <small>{h.sub}</small>
                    </span>
                  </button>
                </div>
              )
            })
          )}
          {ask ? (
            <button type="button" className={`erpPalette__row is-ask ${at === rows.length ? 'is-on' : ''}`} onMouseEnter={() => setAt(rows.length)} onClick={() => go(rows.length)}>
              <Sparkles size={16} />
              <span style={{ flex: 1 }}>
                <b>Ask the assistant</b>
                <small>“{q.trim()}”</small>
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
