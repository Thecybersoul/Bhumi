import { NextRequest, NextResponse } from 'next/server'
import { getTasks, insert } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import type { LinkedEntityType, TaskPriority } from '@/lib/types'

export const dynamic = 'force-dynamic'

const ENTITY_TYPES: LinkedEntityType[] = ['lead', 'transaction', 'property', 'verification', 'general']
const PRIORITIES: TaskPriority[] = ['Low', 'Normal', 'High']

// GET /api/tasks — admin only, internal follow-ups
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const { data, source } = await getTasks()
  return NextResponse.json({ data, source })
}

// POST /api/tasks — a follow-up, optionally against a lead/transaction/etc.
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const title = String(body.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'A task needs a title' }, { status: 400 })

  const entityType = ENTITY_TYPES.includes(body.entity_type as LinkedEntityType)
    ? (body.entity_type as LinkedEntityType)
    : 'general'
  const priority = PRIORITIES.includes(body.priority as TaskPriority) ? (body.priority as TaskPriority) : 'Normal'

  const result = await insert('tasks', {
    title: title.slice(0, 200),
    entity_type: entityType,
    entity_id: body.entity_id ? String(body.entity_id) : null,
    entity_label: String(body.entity_label ?? '').slice(0, 160),
    due_at: body.due_at ? new Date(String(body.due_at)).toISOString() : null,
    status: 'Open',
    priority,
    assignee: String(body.assignee ?? '').slice(0, 80),
    created_at: new Date().toISOString(),
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted }, { status: 201 })
}
