import { NextRequest, NextResponse } from 'next/server'
import { remove } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/* Notes are a log, not a record to edit — deleting one is the only
   write this route needs; correcting a mistake means adding a new
   note, the same way you'd cross something out rather than erase
   it. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const result = await remove('notes', id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
