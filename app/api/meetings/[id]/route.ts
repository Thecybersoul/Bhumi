import { NextRequest, NextResponse } from 'next/server'
import { remove, update } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { MEETING_ENTITY_TYPES, MEETING_KINDS, resyncCalendar, syncToCalendar, unsyncCalendar } from '@/lib/meetings'
import type { Meeting, MeetingEntityType, MeetingKind } from '@/lib/types'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

async function find(id: string): Promise<Meeting | null> {
  if (!hasSupabase()) return null
  const { data } = await createServiceClient().from('meetings').select('*').eq('id', id).maybeSingle()
  return (data as Meeting | null) ?? null
}

// PATCH /api/meetings/:id — any field; `calendar: true` adds an
// unsynced meeting to Google Calendar, `calendar: false` takes it off.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const before = await find(id)
  if (!before) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  const patch: Record<string, unknown> = {}
  const text = (k: string, max: number) => {
    if (typeof body[k] === 'string') patch[k] = (body[k] as string).slice(0, max)
  }
  text('title', 200)
  text('location', 200)
  text('attendees', 300)
  text('agenda', 4000)
  text('outcome', 4000)
  text('entity_label', 200)
  if (MEETING_KINDS.includes(body.kind as MeetingKind)) patch.kind = body.kind
  if (['Scheduled', 'Completed', 'Cancelled'].includes(String(body.status))) patch.status = body.status
  if (MEETING_ENTITY_TYPES.includes(body.entity_type as MeetingEntityType)) patch.entity_type = body.entity_type
  if ('entity_id' in body) patch.entity_id = body.entity_id ? String(body.entity_id) : null
  if (body.duration_min != null) patch.duration_min = Math.min(600, Math.max(5, Number(body.duration_min) || 30))
  if (body.scheduled_at) {
    const when = new Date(String(body.scheduled_at))
    if (Number.isNaN(when.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    patch.scheduled_at = when.toISOString()
  }

  if (Object.keys(patch).length) {
    const result = await update('meetings', id, patch)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  }

  const after = { ...before, ...patch } as Meeting
  try {
    if (body.calendar === false && before.google_event_id) {
      await unsyncCalendar(before)
      await createServiceClient().from('meetings').update({ google_event_id: null, google_meet_url: null }).eq('id', id)
    } else if (body.calendar === true && !before.google_event_id) {
      await syncToCalendar(after)
    } else {
      await resyncCalendar(before, after)
    }
  } catch (e) {
    console.error('[bhumi] meeting calendar update failed', e)
  }

  return NextResponse.json({ ok: true, data: await find(id) })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const before = await find(id)
  if (before) await unsyncCalendar(before).catch(() => {})
  const result = await remove('meetings', id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
