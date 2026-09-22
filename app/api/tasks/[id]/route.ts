import { NextRequest, NextResponse } from 'next/server'
import { update, remove } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'

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

  if (body.status !== 'Open' && body.status !== 'Done') {
    return NextResponse.json({ error: 'status must be Open or Done' }, { status: 400 })
  }

  const result = await update('tasks', id, {
    status: body.status,
    completed_at: body.status === 'Done' ? new Date().toISOString() : null,
  })

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
