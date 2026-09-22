import { NextRequest, NextResponse } from 'next/server'
import { update } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { createEventWithMeet, deleteEvent, isConnected } from '@/lib/google'

export const dynamic = 'force-dynamic'

// POST /api/tasks/[id]/calendar — create a calendar event + Meet link for this task's due date
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  if (!(await isConnected())) {
    return NextResponse.json({ error: 'Google Calendar is not connected. Connect it from Setup.' }, { status: 409 })
  }

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const title = String(body.title ?? '').trim()
  const dueAt = String(body.due_at ?? '')
  if (!title) return NextResponse.json({ error: 'Missing task title' }, { status: 400 })
  if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
    return NextResponse.json({ error: 'A due date is required to create a calendar event' }, { status: 400 })
  }

  const entityLabel = String(body.entity_label ?? '').trim()

  try {
    const event = await createEventWithMeet({
      summary: title,
      description: entityLabel ? `Related to: ${entityLabel}` : undefined,
      startISO: dueAt,
    })
    if (!event) {
      return NextResponse.json({ error: 'Google Calendar is not connected.' }, { status: 409 })
    }

    const result = await update('tasks', id, {
      google_event_id: event.eventId,
      google_meet_url: event.meetUrl,
    })
    return NextResponse.json({
      ok: true,
      persisted: result.persisted,
      google_event_id: event.eventId,
      google_meet_url: event.meetUrl,
    })
  } catch (e) {
    console.error('[bhumi] calendar sync failed', e)
    return NextResponse.json({ error: 'Could not create the calendar event' }, { status: 502 })
  }
}

// DELETE /api/tasks/[id]/calendar — unsync: remove the calendar event and clear the task's link
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (eventId) await deleteEvent(eventId)

  const result = await update('tasks', id, { google_event_id: null, google_meet_url: null })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
