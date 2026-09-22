import { NextRequest, NextResponse } from 'next/server'
import { getNotes, insert } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import type { LinkedEntityType } from '@/lib/types'

export const dynamic = 'force-dynamic'

const ENTITY_TYPES: LinkedEntityType[] = ['lead', 'transaction', 'property', 'verification', 'general']

// GET /api/notes — admin only, internal record-keeping
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const { data, source } = await getNotes()
  return NextResponse.json({ data, source })
}

// POST /api/notes — jot a note, optionally against a lead/transaction/etc.
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const text = String(body.body ?? '').trim()
  if (!text) return NextResponse.json({ error: 'A note needs some text' }, { status: 400 })

  const entityType = ENTITY_TYPES.includes(body.entity_type as LinkedEntityType)
    ? (body.entity_type as LinkedEntityType)
    : 'general'

  const result = await insert('notes', {
    entity_type: entityType,
    entity_id: body.entity_id ? String(body.entity_id) : null,
    entity_label: String(body.entity_label ?? '').slice(0, 160),
    body: text.slice(0, 4000),
    author: String(body.author ?? '').slice(0, 80),
    created_at: new Date().toISOString(),
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted }, { status: 201 })
}
