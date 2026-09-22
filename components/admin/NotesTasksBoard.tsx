'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Note, Task, TaskPriority } from '@/lib/types'

const PRIORITIES: TaskPriority[] = ['Low', 'Normal', 'High']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function isOverdue(t: Task) {
  return t.status === 'Open' && !!t.due_at && new Date(t.due_at).getTime() < Date.now()
}

export default function NotesTasksBoard({
  tasks: initialTasks,
  notes: initialNotes,
  source,
  googleConnected,
}: {
  tasks: Task[]
  notes: Note[]
  source: 'live' | 'fallback'
  googleConnected: boolean
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [notes, setNotes] = useState(initialNotes)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const [taskForm, setTaskForm] = useState({ title: '', due_at: '', priority: 'Normal' as TaskPriority, assignee: '', entity_label: '' })
  const [noteForm, setNoteForm] = useState({ body: '', entity_label: '', author: '' })

  function say(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const open = useMemo(
    () => tasks.filter((t) => t.status === 'Open').sort((a, b) => {
      if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1
      if (!a.due_at && !b.due_at) return 0
      if (!a.due_at) return 1
      if (!b.due_at) return -1
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    }),
    [tasks]
  )
  const done = useMemo(() => tasks.filter((t) => t.status === 'Done'), [tasks])
  const overdueCount = open.filter(isOverdue).length
  const doneThisWeek = done.filter((t) => t.completed_at && Date.now() - new Date(t.completed_at).getTime() < 7 * 86_400_000).length

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskForm.title.trim()) return
    setBusy('add-task')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not add task')
      setTasks((prev) => [
        {
          id: crypto.randomUUID(),
          title: taskForm.title.trim(),
          entity_type: 'general',
          entity_label: taskForm.entity_label,
          due_at: taskForm.due_at ? new Date(taskForm.due_at).toISOString() : null,
          status: 'Open',
          priority: taskForm.priority,
          assignee: taskForm.assignee,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setTaskForm({ title: '', due_at: '', priority: 'Normal', assignee: '', entity_label: '' })
      say(body.persisted ? 'Task added' : 'Task added (not persisted — no database)')
      if (body.persisted) router.refresh()
    } catch (e) {
      say((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function toggleTask(t: Task) {
    const next = t.status === 'Open' ? 'Done' : 'Open'
    setBusy(t.id)
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next, completed_at: next === 'Done' ? new Date().toISOString() : null } : x)))
    try {
      const res = await fetch(`/api/tasks/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      if (body.persisted) router.refresh()
    } catch (e) {
      say((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function deleteTask(id: string) {
    setBusy(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function syncCalendar(t: Task) {
    setBusy(`cal-${t.id}`)
    try {
      const res = await fetch(`/api/tasks/${t.id}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t.title, due_at: t.due_at, entity_label: t.entity_label }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not sync')
      setTasks((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, google_event_id: body.google_event_id, google_meet_url: body.google_meet_url } : x))
      )
      say('Synced to Google Calendar')
    } catch (e) {
      say((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function unsyncCalendar(t: Task) {
    setBusy(`cal-${t.id}`)
    try {
      await fetch(`/api/tasks/${t.id}/calendar?event_id=${encodeURIComponent(t.google_event_id ?? '')}`, { method: 'DELETE' })
      setTasks((prev) => (prev.map((x) => (x.id === t.id ? { ...x, google_event_id: null, google_meet_url: null } : x))))
      say('Removed from calendar')
    } finally {
      setBusy(null)
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteForm.body.trim()) return
    setBusy('add-note')
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not add note')
      setNotes((prev) => [
        {
          id: crypto.randomUUID(),
          entity_type: 'general',
          entity_label: noteForm.entity_label,
          body: noteForm.body.trim(),
          author: noteForm.author,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setNoteForm({ body: '', entity_label: '', author: '' })
      say(body.persisted ? 'Note added' : 'Note added (not persisted — no database)')
      if (body.persisted) router.refresh()
    } catch (e) {
      say((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function deleteNote(id: string) {
    setBusy(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Notes & Tasks</h1>
          <p>Follow-ups and the running log of what was said — the working memory a website never needed.</p>
        </div>
        <span className={`sourcePill ${source === 'live' ? 'is-live' : 'is-fallback'}`}>
          {source === 'live' ? 'Live database' : 'Seeded data'}
        </span>
      </div>

      <div className="statRow">
        <div className="statTile">
          <span className="statTile__value">{open.length}</span>
          <span className="statTile__label">Open tasks</span>
          <span className="statTile__note">{done.length} done all-time</span>
        </div>
        <div className="statTile is-flagged">
          <span className="statTile__value">{overdueCount}</span>
          <span className="statTile__label">Overdue</span>
          <span className="statTile__note">Past their due date, still open</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{doneThisWeek}</span>
          <span className="statTile__label">Closed this week</span>
          <span className="statTile__note">Completed in the last 7 days</span>
        </div>
        <div className="statTile is-gold">
          <span className="statTile__value">{notes.length}</span>
          <span className="statTile__label">Notes on record</span>
          <span className="statTile__note">Every call, every context</span>
        </div>
      </div>

      <div className="adminGrid two">
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Tasks</span>
          </div>

          <form onSubmit={addTask} className="stack" style={{ gap: 8, marginBottom: 18 }}>
            <input
              className="input"
              placeholder="Add a task — e.g. Call back the Devanahalli enquiry"
              value={taskForm.title}
              onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
            />
            <div className="row-wrap" style={{ gap: 8 }}>
              <input
                className="input"
                type="datetime-local"
                style={{ flex: '1 1 160px' }}
                value={taskForm.due_at}
                onChange={(e) => setTaskForm((f) => ({ ...f, due_at: e.target.value }))}
              />
              <select
                className="input"
                style={{ flex: '0 0 110px' }}
                value={taskForm.priority}
                onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Related to (optional)"
                style={{ flex: '1 1 140px' }}
                value={taskForm.entity_label}
                onChange={(e) => setTaskForm((f) => ({ ...f, entity_label: e.target.value }))}
              />
              <button className="btn btn-sm btn-primary" disabled={busy === 'add-task' || !taskForm.title.trim()}>
                Add
              </button>
            </div>
          </form>

          {open.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Nothing open. Clear desk.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {open.map((t) => (
                <div key={t.id} className="row-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div className="row-wrap" style={{ alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleTask(t)}
                      disabled={busy === t.id}
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '.87rem' }}>{t.title}</div>
                      <div style={{ fontSize: '.76rem', color: isOverdue(t) ? 'var(--flagged)' : 'var(--muted)' }}>
                        {t.due_at ? fmtDateTime(t.due_at) : 'No due date'}
                        {t.entity_label && ` · ${t.entity_label}`}
                        {t.assignee && ` · ${t.assignee}`}
                      </div>
                      {t.google_meet_url && (
                        <a
                          href={t.google_meet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-arrow"
                          style={{ fontSize: '.74rem', marginTop: 2, display: 'inline-flex' }}
                        >
                          Join Google Meet
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="row-wrap" style={{ gap: 6, flexShrink: 0 }}>
                    {t.priority === 'High' && <span className="badge badge-flagged">High</span>}
                    {googleConnected && t.due_at && (
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => (t.google_event_id ? unsyncCalendar(t) : syncCalendar(t))}
                        disabled={busy === `cal-${t.id}`}
                        title={t.google_event_id ? 'Remove from Google Calendar' : 'Add to Google Calendar with a Meet link'}
                      >
                        {t.google_event_id ? 'Synced ✓' : 'Sync to Calendar'}
                      </button>
                    )}
                    <button className="btn btn-xs btn-ghost" onClick={() => deleteTask(t.id)} disabled={busy === t.id}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <button type="button" className="link-arrow" onClick={() => setShowDone((v) => !v)} style={{ fontSize: '.8rem' }}>
                {showDone ? 'Hide' : 'Show'} {done.length} done
              </button>
              {showDone && (
                <div className="stack" style={{ gap: 8, marginTop: 12 }}>
                  {done.map((t) => (
                    <div key={t.id} className="row-wrap" style={{ justifyContent: 'space-between', gap: 10 }}>
                      <div className="row-wrap" style={{ gap: 10 }}>
                        <input type="checkbox" checked readOnly onChange={() => toggleTask(t)} disabled={busy === t.id} />
                        <span style={{ fontSize: '.85rem', color: 'var(--muted)', textDecoration: 'line-through' }}>{t.title}</span>
                      </div>
                      <button className="btn btn-xs btn-ghost" onClick={() => deleteTask(t.id)} disabled={busy === t.id}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Notes</span>
          </div>

          <form onSubmit={addNote} className="stack" style={{ gap: 8, marginBottom: 18 }}>
            <textarea
              className="input"
              placeholder="What was said, what to remember…"
              style={{ minHeight: 64, resize: 'vertical' }}
              value={noteForm.body}
              onChange={(e) => setNoteForm((f) => ({ ...f, body: e.target.value }))}
            />
            <div className="row-wrap" style={{ gap: 8 }}>
              <input
                className="input"
                placeholder="Related to (optional)"
                style={{ flex: '1 1 140px' }}
                value={noteForm.entity_label}
                onChange={(e) => setNoteForm((f) => ({ ...f, entity_label: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Your name"
                style={{ flex: '1 1 120px' }}
                value={noteForm.author}
                onChange={(e) => setNoteForm((f) => ({ ...f, author: e.target.value }))}
              />
              <button className="btn btn-sm btn-primary" disabled={busy === 'add-note' || !noteForm.body.trim()}>
                Add note
              </button>
            </div>
          </form>

          {notes.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Nothing logged yet.</p>
          ) : (
            <div className="stack" style={{ gap: 14 }}>
              {notes.map((n) => (
                <div key={n.id} style={{ borderLeft: '2px solid var(--line)', paddingLeft: 12 }}>
                  <p style={{ fontSize: '.85rem', color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</p>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '.74rem', color: 'var(--muted)' }}>
                      {fmtDate(n.created_at)}
                      {n.entity_label && ` · ${n.entity_label}`}
                      {n.author && ` · ${n.author}`}
                    </span>
                    <button className="btn btn-xs btn-ghost" onClick={() => deleteNote(n.id)} disabled={busy === n.id}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
