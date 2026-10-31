import { hasSupabase, createServiceClient } from './supabase'
import { insertReturningId, update } from './db'

/* A record's "next date" is also an ordinary task, so everything that is
   due shows up in one list (Tasks, Home, reminders) instead of living on
   the prospect or deal alone.

   syncFollowUp keeps exactly one open task per record in step with its
   next date: set or move the date and the task is created or re-dated;
   clear the date, or finish the record, and the task is marked done.
   It never throws: a follow-up that can't be written must not fail the
   save that triggered it. */

export type FollowUpType = 'prospect' | 'transaction'

const PREFIX = 'Follow up: '

export async function syncFollowUp(opts: {
  type: FollowUpType
  id: string
  label: string
  date: string | null | undefined
  owner?: string | null
  /** The record is finished (won, lost, closed): nothing left to chase. */
  done?: boolean
}): Promise<void> {
  if (!hasSupabase()) return
  try {
    const sb = createServiceClient()
    const { data, error } = await sb
      .from('tasks')
      .select('id, due_at')
      .eq('entity_type', opts.type)
      .eq('entity_id', opts.id)
      .eq('status', 'Open')
      .like('title', `${PREFIX}%`)
    if (error) return // tasks table or the prospect link isn't migrated yet
    const open = (data ?? []) as { id: string; due_at: string | null }[]
    const want = opts.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date) && !opts.done ? opts.date : null

    if (!want) {
      for (const t of open) await update('tasks', t.id, { status: 'Done', completed_at: new Date().toISOString() })
      return
    }
    // 9am IST on the day: due when the working day starts.
    const due = new Date(`${want}T09:00:00+05:30`).toISOString()
    const [keep, ...extra] = open
    for (const t of extra) await update('tasks', t.id, { status: 'Done', completed_at: new Date().toISOString() })
    if (keep) {
      if (!keep.due_at || new Date(keep.due_at).getTime() !== new Date(due).getTime()) await update('tasks', keep.id, { due_at: due })
      return
    }
    await insertReturningId('tasks', {
      title: `${PREFIX}${opts.label}`.slice(0, 200),
      entity_type: opts.type,
      entity_id: opts.id,
      entity_label: opts.label.slice(0, 160),
      due_at: due,
      status: 'Open',
      priority: 'Normal',
      assignee: (opts.owner ?? '').slice(0, 80),
      created_at: new Date().toISOString(),
    })
  } catch {
    /* best effort */
  }
}
