import { NextRequest, NextResponse } from 'next/server'
import { update, remove } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import type { TransactionStage } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']

/* One general-purpose patch endpoint rather than one per field —
   meetings and documents are whole arrays the client already holds
   (added to, or had a status cycled) and sends back complete, the
   same way verification stages are patched as a whole array.

   Deliberately does not fetch the current record first: with no
   database attached, `insert` never persists, so a transaction
   created earlier in the same session has no server-side row to
   find — a "not found" guard here would 404 every edit to it and
   make it vanish from the admin's own view. `update()` already
   degrades to a no-op with persisted:false in that case, which is
   the behaviour every other admin write in this app relies on. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { ...body }
  delete patch.id
  delete patch.reference
  delete patch.opened_at

  if (typeof body.stage === 'string') {
    if (!STAGES.includes(body.stage as TransactionStage)) {
      return NextResponse.json({ error: 'Unknown stage' }, { status: 400 })
    }
    patch.stage = body.stage
    if (body.stage === 'Closed') {
      patch.outcome = 'Closed'
      patch.closed_at = new Date().toISOString()
    } else {
      // Moving off "Closed" reopens the deal; the client only sends
      // a bare stage change when it isn't already handling this via
      // the explicit reopen action.
      patch.outcome = 'In progress'
      patch.closed_at = null
    }
  }

  if (body.mark_lost) {
    patch.outcome = 'Lost'
    patch.closed_at = new Date().toISOString()
    patch.lost_reason = String(body.lost_reason ?? '').slice(0, 400)
    delete patch.mark_lost
  }

  if (body.reopen) {
    patch.outcome = 'In progress'
    patch.closed_at = null
    patch.lost_reason = ''
    delete patch.reopen
  }

  const result = await update('transactions', id, patch)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const result = await remove('transactions', id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
