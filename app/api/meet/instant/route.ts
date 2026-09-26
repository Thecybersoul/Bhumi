import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { hasService } from '@/lib/google'
import { createInstantSpace } from '@/lib/meet'
import { insertReturningId } from '@/lib/db'

export const dynamic = 'force-dynamic'

const TYPES = ['property', 'transaction', 'task', 'lead', 'verification', 'general']

/* POST /api/meet/instant — a Meet room for a call starting now.
   It is also logged as a video-call meeting against the record it's
   about, so it shows up in Meetings and on that listing or deal, and
   its attendance can be pulled in afterwards.
   { title?, entity_type?, entity_id?, entity_label? } → { url, meeting_id } */
export async function POST(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  if (!(await hasService('meet'))) {
    return NextResponse.json({ error: 'Google Meet is not connected. Connect Google from Profile first.' }, { status: 409 })
  }
  const body = ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>

  try {
    const space = await createInstantSpace()
    if (!space) return NextResponse.json({ error: 'Google did not create a meeting room' }, { status: 502 })
    const label = String(body.entity_label ?? '').slice(0, 200)
    const created = await insertReturningId('meetings', {
      title: String(body.title ?? '').trim().slice(0, 200) || (label ? `Call · ${label}` : `Call started by ${me.name}`),
      kind: 'Video call',
      scheduled_at: new Date().toISOString(),
      duration_min: 30,
      status: 'Scheduled',
      location: space.url,
      entity_type: TYPES.includes(String(body.entity_type)) ? body.entity_type : 'general',
      entity_id: body.entity_id ? String(body.entity_id) : null,
      entity_label: label,
      google_meet_url: space.url,
    })
    return NextResponse.json({ ok: true, url: space.url, code: space.code, meeting_id: created.id ?? null }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
