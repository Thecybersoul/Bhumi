import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { createTransaction } from '@/lib/transactions'

export const dynamic = 'force-dynamic'

// GET /api/transactions — admin only, the whole pipeline is internal
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const { data, source } = await getTransactions()
  return NextResponse.json({ data, source })
}

// POST /api/transactions — open a new transaction, listed or off-market
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const r = await createTransaction(body)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ok: true, persisted: r.persisted, reference: r.reference, id: r.id }, { status: 201 })
}
