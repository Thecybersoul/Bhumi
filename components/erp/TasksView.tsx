'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, Check, ChevronDown, ChevronUp, CircleAlert, Clock, Paperclip, Plus, Trash2, Users, Video, X } from 'lucide-react'
import { api, fromLocalInput, toLocalInput, type Audited, type Doc } from './lib'
import { Avatar, Banner, ByLine, Chips, Empty, Field, Loading, Pill, RecordLink } from './ui'
import { EntityPicker, NO_LINK, type LinkValue } from './records'
import { PeoplePanel } from './contacts'
import { DocRow, DocumentsPanel, uploadDocument } from './documents'

type Priority = 'Low' | 'Normal' | 'High'
const PRIORITIES: Priority[] = ['Low', 'Normal', 'High']

interface Task extends Audited {
  id: string
  title: string
  status: 'Open' | 'Done'
  priority: Priority
  due_at?: string | null
  entity_type: string
  entity_id?: string | null
  entity_label?: string
  created_at: string
  google_event_id?: string | null
  google_meet_url?: string | null
}
interface Note extends Audited {
  id: string
  body: string
  author?: string
  entity_type: string
  entity_id?: string | null
  entity_label?: string
  created_at: string
}

const overdue = (t: Task) => t.status === 'Open' && !!t.due_at && new Date(t.due_at).getTime() < Date.now()
const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
/* A task or note can point at a listing, deal or lead, but not at another task. */
const forTask = (l: LinkValue) => (l.entity_type === 'general' || l.entity_type === 'task' ? { entity_type: 'general', entity_id: null, entity_label: l.entity_label } : l)

export default function TasksView() {
  const params = useSearchParams()
  const router = useRouter()
  const [view, setView] = useState<'open' | 'done' | 'notes'>(params.get('view') === 'notes' ? 'notes' : 'open')
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [noteDocs, setNoteDocs] = useState<Record<string, Doc[]>>({})
  const [taskDocs, setTaskDocs] = useState<Record<string, Doc[]>>({})
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const taskFileInput = useRef<HTMLInputElement>(null)
  const [google, setGoogle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(params.get('new') === '1')
  const [openTask, setOpenTask] = useState<string | null>(null)
  const [openNote, setOpenNote] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState<Priority>('Normal')
  const [related, setRelated] = useState<LinkValue>(NO_LINK)
  const [noteBody, setNoteBody] = useState('')
  const [noteRel, setNoteRel] = useState<LinkValue>(NO_LINK)
  const [noteFiles, setNoteFiles] = useState<File[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const [t, n, g, d, td] = await Promise.all([
        api.get<{ data: Task[]; source: string }>('/api/tasks'),
        api.get<{ data: Note[]; source: string }>('/api/notes'),
        api.get<{ connected: boolean }>('/api/admin/google/status').catch(() => ({ connected: false })),
        api.get<{ data: Doc[] }>('/api/documents?entity_type=note').catch(() => ({ data: [] as Doc[] })),
        api.get<{ data: Doc[] }>('/api/documents?entity_type=task').catch(() => ({ data: [] as Doc[] })),
      ])
      setTasks(t.source === 'live' ? t.data : [])
      setNotes(n.source === 'live' ? n.data : [])
      setGoogle(g.connected)
      const by: Record<string, Doc[]> = {}
      for (const x of d.data) if (x.entity_id) (by[x.entity_id] ??= []).push(x)
      setNoteDocs(by)
      const byTask: Record<string, Doc[]> = {}
      for (const x of td.data) if (x.entity_id) (byTask[x.entity_id] ??= []).push(x)
      setTaskDocs(byTask)
    } catch (e) {
      setError((e as Error).message)
      setTasks([])
    }
  }, [])
  useEffect(() => {
    load()
    if (params.get('new') || params.get('view')) router.replace('/admin/notes-tasks')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key)
    setError(null)
    try {
      await fn()
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const addTask = () =>
    title.trim() &&
    run('add', async () => {
      const out = await api.post<{ id?: string }>('/api/tasks', { title: title.trim(), due_at: due || undefined, priority, ...forTask(related) })
      if (taskFiles.length && out.id) {
        for (const f of taskFiles) await uploadDocument(f, { entity_type: 'task', entity_id: out.id, entity_label: title.trim().slice(0, 60), category: 'Attachment' })
      }
      setTaskFiles([])
      setTitle('')
      setDue('')
      setPriority('Normal')
      setRelated(NO_LINK)
      setAdding(false)
    })

  const toggle = (t: Task) => run(`t${t.id}`, () => api.patch(`/api/tasks/${t.id}`, { status: t.status === 'Open' ? 'Done' : 'Open' }))
  const reschedule = (t: Task, iso: string) => run(`r${t.id}`, () => api.patch(`/api/tasks/${t.id}`, { due_at: iso || null }))
  const setPri = (t: Task, p: Priority) => run(`p${t.id}`, () => api.patch(`/api/tasks/${t.id}`, { priority: p }))
  const removeTask = (t: Task) => confirm(`Delete “${t.title}”?`) && run(`d${t.id}`, () => api.del(`/api/tasks/${t.id}`))
  const sync = (t: Task) =>
    run(`c${t.id}`, () =>
      t.google_event_id
        ? api.del(`/api/tasks/${t.id}/calendar?event_id=${encodeURIComponent(t.google_event_id)}`)
        : api.post(`/api/tasks/${t.id}/calendar`, { title: t.title, due_at: t.due_at, entity_label: t.entity_label })
    )

  const addNote = () =>
    noteBody.trim() &&
    run('note', async () => {
      const body = noteBody.trim()
      const out = await api.post<{ id?: string }>('/api/notes', { body, ...forTask(noteRel) })
      if (noteFiles.length && out.id) {
        for (const f of noteFiles) await uploadDocument(f, { entity_type: 'note', entity_id: out.id, entity_label: (noteRel.entity_label || body).slice(0, 60), category: 'Attachment' })
      }
      setNoteBody('')
      setNoteRel(NO_LINK)
      setNoteFiles([])
    })
  const removeNote = (n: Note) => confirm('Delete this note?') && run(`n${n.id}`, () => api.del(`/api/notes/${n.id}`))

  const open = (tasks ?? []).filter((t) => t.status === 'Open').sort((a, b) => Number(overdue(b)) - Number(overdue(a)) || (a.due_at ?? '9').localeCompare(b.due_at ?? '9'))
  const done = (tasks ?? []).filter((t) => t.status === 'Done')

  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Tasks & notes</h1>
          <p>Follow-ups with due dates, and a running log of what was said — each tied to its listing, deal or lead.</p>
        </div>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="erpSeg">
        <button className={view === 'open' ? 'is-on' : ''} onClick={() => setView('open')}>
          Open · {open.length}
        </button>
        <button className={view === 'done' ? 'is-on' : ''} onClick={() => setView('done')}>
          Done · {done.length}
        </button>
        <button className={view === 'notes' ? 'is-on' : ''} onClick={() => setView('notes')}>
          Notes · {notes.length}
        </button>
      </div>

      {tasks === null ? (
        <Loading />
      ) : view === 'notes' ? (
        <div className="erpGrid main">
          <div className="erpCol">
            {notes.length === 0 ? (
              <div className="erpCard">
                <Empty>Nothing logged yet.</Empty>
              </div>
            ) : (
              notes.map((n) => {
                const docs = noteDocs[n.id] ?? []
                const expanded = openNote === n.id
                return (
                  <div key={n.id} className="erpCard" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Avatar name={n.created_by || n.author || null} size={28} />
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 'var(--text-sm)' }}>{n.created_by || n.author || 'Team'}</b>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{fmt(n.created_at)}</div>
                      </div>
                      <button className="erpBtn ghost sm" onClick={() => removeNote(n)} title="Delete note">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--ink)' }}>{n.body}</p>
                    <RecordLink type={n.entity_type} id={n.entity_id} label={n.entity_label} />
                    {!expanded && docs.length ? docs.slice(0, 3).map((d) => <DocRow key={d.id} d={d} />) : null}
                    <button className="erpCard__action" style={{ marginTop: 8 }} onClick={() => setOpenNote(expanded ? null : n.id)}>
                      <Paperclip size={13} /> {docs.length ? `${docs.length} attachment${docs.length > 1 ? 's' : ''} · people` : 'Attach files · tag people'} {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {expanded ? (
                      <div style={{ marginTop: 10 }}>
                        <DocumentsPanel compact entityType="note" entityId={n.id} entityLabel={(n.entity_label || n.body).slice(0, 60)} onChange={load} />
                        <div className="erpSub">People mentioned</div>
                        <PeoplePanel entityType="note" entityId={n.id} entityLabel={n.body.slice(0, 80)} roles={['Mentioned', 'Client', 'Owner', 'Broker', 'Lawyer']} emptyText="Tag the people this note is about." />
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
          <div className="erpCol">
            <div className="erpCard">
              <div className="erpCard__title" style={{ marginBottom: 12 }}>New note</div>
              <div className="erpForm">
                <textarea className="erpInput" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="What was said, what to remember…" style={{ minHeight: 130 }} />
                <EntityPicker value={noteRel} onChange={setNoteRel} types={['property', 'transaction', 'lead', 'contact']} label="Related to (optional)" />
                {noteFiles.map((f, i) => (
                  <div key={i} className="erpBanner ok" style={{ marginBottom: 0 }}>
                    <Paperclip size={15} /> <span style={{ flex: 1 }}>{f.name}</span>
                    <X size={15} style={{ cursor: 'pointer' }} onClick={() => setNoteFiles((p) => p.filter((_, j) => j !== i))} />
                  </div>
                ))}
                <button className="erpBtn ghost" style={{ borderStyle: 'dashed' }} onClick={() => fileInput.current?.click()}>
                  <Paperclip size={15} /> Attach files
                </button>
                <input ref={fileInput} type="file" multiple hidden onChange={(e) => e.target.files && setNoteFiles((p) => [...p, ...Array.from(e.target.files!)])} />
                <button className="erpBtn primary" onClick={addNote} disabled={busy === 'note'}>
                  {busy === 'note' ? 'Saving…' : noteFiles.length ? `Save note + ${noteFiles.length} file${noteFiles.length > 1 ? 's' : ''}` : 'Save note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 860 }}>
          {view === 'open' ? (
            adding ? (
              <div className="erpCard" style={{ marginBottom: 12 }}>
                <div className="erpForm two">
                  <Field label="Task" full>
                    <input className="erpInput" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call back the Devanahalli enquiry" autoFocus />
                  </Field>
                  <Field label="Due">
                    <input type="datetime-local" className="erpInput" value={toLocalInput(due)} onChange={(e) => setDue(fromLocalInput(e.target.value))} />
                  </Field>
                  <Field label="Priority">
                    <Chips options={PRIORITIES} value={priority} onChange={setPriority} />
                  </Field>
                  <div className="erpField full">
                    <EntityPicker value={related} onChange={setRelated} types={['property', 'transaction', 'lead', 'contact']} label="Related to (optional)" />
                  </div>
                  <div className="erpField full">
                    {taskFiles.map((f, i) => (
                      <div key={i} className="erpBanner ok" style={{ marginBottom: 6 }}>
                        <Paperclip size={15} /> <span style={{ flex: 1 }}>{f.name}</span>
                        <X size={15} style={{ cursor: 'pointer' }} onClick={() => setTaskFiles((p) => p.filter((_, j) => j !== i))} />
                      </div>
                    ))}
                    <button type="button" className="erpBtn ghost" style={{ borderStyle: 'dashed' }} onClick={() => taskFileInput.current?.click()}>
                      <Paperclip size={15} /> Attach files
                    </button>
                    <input ref={taskFileInput} type="file" multiple hidden onChange={(e) => e.target.files && setTaskFiles((p) => [...p, ...Array.from(e.target.files!)])} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="erpBtn primary" onClick={addTask} disabled={busy === 'add'}>
                    {taskFiles.length ? `Add task + ${taskFiles.length} file${taskFiles.length > 1 ? 's' : ''}` : 'Add task'}
                  </button>
                  <button className="erpBtn ghost" onClick={() => setAdding(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="erpBtn primary" style={{ marginBottom: 12 }} onClick={() => setAdding(true)}>
                <Plus size={16} /> New task
              </button>
            )
          ) : null}

          {(view === 'open' ? open : done).length === 0 ? (
            <div className="erpCard">
              <Empty>{view === 'open' ? 'Nothing open. Clear desk.' : 'Nothing completed yet.'}</Empty>
            </div>
          ) : (
            (view === 'open' ? open : done).map((t) => {
              const expanded = openTask === t.id
              const late = overdue(t)
              return (
                <div key={t.id} className="erpCard" style={{ padding: 14, marginBottom: 8, borderColor: late ? '#F0C9C4' : undefined }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <button
                      onClick={() => toggle(t)}
                      title={t.status === 'Open' ? 'Mark done' : 'Reopen'}
                      style={{ width: 24, height: 24, borderRadius: 7, border: '2px solid var(--navy-500)', background: t.status === 'Done' ? 'var(--navy-500)' : '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}
                    >
                      {t.status === 'Done' ? <Check size={15} color="#fff" /> : null}
                    </button>
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setOpenTask(expanded ? null : t.id)}>
                      <div style={{ fontWeight: 700, color: t.status === 'Done' ? 'var(--muted)' : 'var(--navy)', textDecoration: t.status === 'Done' ? 'line-through' : undefined }}>{t.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: late ? 'var(--flagged)' : 'var(--muted)', fontWeight: late ? 700 : 500, marginTop: 3 }}>
                        {late ? <CircleAlert size={13} /> : <Clock size={13} />}
                        {t.due_at ? `${late ? 'Overdue · ' : ''}${fmt(t.due_at)}` : 'No due date'}
                      </div>
                      <RecordLink type={t.entity_type} id={t.entity_id} label={t.entity_label} />
                      <ByLine record={t} createdAt={t.created_at} compact />
                    </div>
                    {taskDocs[t.id]?.length ? (
                      <span className="erpPill" style={{ color: 'var(--gold-deep)', background: 'var(--gold-tint)' }} title="Attachments">
                        <Paperclip size={11} /> {taskDocs[t.id].length}
                      </span>
                    ) : null}
                    {t.priority === 'High' ? <Pill label="High" /> : null}
                    <button className="erpBtn ghost sm" onClick={() => setOpenTask(expanded ? null : t.id)}>
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {t.google_meet_url ? (
                    <a href={t.google_meet_url} target="_blank" rel="noreferrer" className="erpLink" style={{ marginTop: 8 }}>
                      <Video size={13} /> <span>Join Google Meet</span>
                    </a>
                  ) : null}
                  {expanded ? (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
                      {t.status === 'Open' ? (
                        <div className="erpForm two" style={{ marginBottom: 12 }}>
                          <Field label="Due">
                            <input type="datetime-local" className="erpInput" value={toLocalInput(t.due_at)} onChange={(e) => reschedule(t, fromLocalInput(e.target.value))} />
                          </Field>
                          <Field label="Priority">
                            <Chips options={PRIORITIES} value={t.priority} onChange={(p) => setPri(t, p)} />
                          </Field>
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="erpBtn ghost sm" onClick={() => router.push(`/admin/meetings/new?${new URLSearchParams({ entity_type: 'task', entity_id: t.id, entity_label: t.title })}`)}>
                          <Users size={13} /> Log a meeting
                        </button>
                        {google && t.due_at && t.status === 'Open' ? (
                          <button className="erpBtn ghost sm" onClick={() => sync(t)} disabled={busy === `c${t.id}`}>
                            <CalendarDays size={13} /> {t.google_event_id ? 'On calendar ✓ (remove)' : 'Add to calendar'}
                          </button>
                        ) : null}
                        <button className="erpBtn danger sm" onClick={() => removeTask(t)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                      <div className="erpSub">Attachments</div>
                      <DocumentsPanel compact entityType="task" entityId={t.id} entityLabel={t.title.slice(0, 60)} onChange={load} />
                      <div className="erpSub">People</div>
                      <PeoplePanel entityType="task" entityId={t.id} entityLabel={t.title.slice(0, 80)} roles={['Client', 'Owner', 'Broker', 'Lawyer', 'Other']} emptyText="Tag who this is about or who is involved." />
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
