import { NextRequest, NextResponse } from 'next/server'
import { getMeetings, insertReturningId } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { MEETING_ENTITY_TYPES, MEETING_KINDS, syncToCalendar } from '@/lib/meetings'
import type { Meeting, MeetingEntityType, MeetingKind } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/meetings?entity_type=&entity_id=  — soonest first
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const p = req.nextUrl.searchParams
  const { data, source, error } = await getMeetings()
  const type = p.get('entity_type')
  const id = p.get('entity_id')
  const filtered = data.filter((m) => (!type || m.entity_type === type) && (!id || m.entity_id === id))
  return NextResponse.json({ data: filtered, source, error })
}

// POST /api/meetings — log or schedule one; goes on the shared
// Google Calendar too (with a Meet link for video calls) unless
// `calendar: false`.
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
  const when = body.scheduled_at ? new Date(String(body.scheduled_at)) : null
  if (!title) return NextResponse.json({ error: 'Give the meeting a title' }, { status: 400 })
  if (!when || Number.isNaN(when.getTime())) return NextResponse.json({ error: 'Pick a date and time' }, { status: 400 })

  const row = {
    title: title.slice(0, 200),
    kind: MEETING_KINDS.includes(body.kind as MeetingKind) ? body.kind : 'In person',
    scheduled_at: when.toISOString(),
    duration_min: Math.min(600, Math.max(5, Number(body.duration_min) || 30)),
    location: String(body.location ?? '').slice(0, 200),
    attendees: String(body.attendees ?? '').slice(0, 300),
    status: ['Scheduled', 'Completed', 'Cancelled'].includes(String(body.status)) ? body.status : 'Scheduled',
    agenda: String(body.agenda ?? '').slice(0, 4000),
    outcome: String(body.outcome ?? '').slice(0, 4000),
    entity_type: MEETING_ENTITY_TYPES.includes(body.entity_type as MeetingEntityType) ? body.entity_type : 'general',
    entity_id: body.entity_id ? String(body.entity_id).slice(0, 80) : null,
    entity_label: String(body.entity_label ?? '').slice(0, 200),
  }

  const result = await insertReturningId('meetings', row)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

  let calendar: { google_event_id: string | null; google_meet_url: string | null } | null = null
  if (result.id && body.calendar !== false && when.getTime() > Date.now() - 60 * 60_000) {
    try {
      calendar = await syncToCalendar({ ...(row as unknown as Meeting), id: result.id })
    } catch (e) {
      console.error('[bhumi] meeting calendar sync failed', e)
    }
  }

  const { data } = result.id
    ? await createServiceClient().from('meetings').select('*').eq('id', result.id).maybeSingle()
    : { data: null }
  return NextResponse.json({ ok: true, persisted: result.persisted, id: result.id, data, calendar }, { status: 201 })
}
