import { NextRequest, NextResponse } from 'next/server'
import { update, remove } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import type { LinkedEntityType, TaskPriority } from '@/lib/types'

const ENTITY_TYPES: LinkedEntityType[] = ['lead', 'transaction', 'property', 'verification', 'meeting', 'contact', 'general']
const PRIORITIES: TaskPriority[] = ['Low', 'Normal', 'High']

export const dynamic = 'force-dynamic'

/* Toggling done/open is the one write the board actually needs day
   to day. Deliberately does not fetch the current record first —
   same reasoning as the transactions route: with no database
   attached nothing was ever persisted to look up, and `update()`
   already degrades to persisted:false rather than 404ing. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Status toggles day to day; the rest is a full edit of the task.
  const patch: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (body.status !== 'Open' && body.status !== 'Done') {
      return NextResponse.json({ error: 'status must be Open or Done' }, { status: 400 })
    }
    patch.status = body.status
    patch.completed_at = body.status === 'Done' ? new Date().toISOString() : null
  }
  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 200)
  if ('due_at' in body) patch.due_at = body.due_at ? new Date(String(body.due_at)).toISOString() : null
  if (PRIORITIES.includes(body.priority as TaskPriority)) patch.priority = body.priority
  if (ENTITY_TYPES.includes(body.entity_type as LinkedEntityType)) patch.entity_type = body.entity_type
  if ('entity_id' in body) patch.entity_id = body.entity_id ? String(body.entity_id) : null
  if (typeof body.entity_label === 'string') patch.entity_label = body.entity_label.slice(0, 160)
  if (typeof body.assignee === 'string') patch.assignee = body.assignee.slice(0, 80)
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  const result = await update('tasks', id, patch)

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const result = await remove('tasks', id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
