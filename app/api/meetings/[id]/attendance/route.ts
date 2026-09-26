import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { hasService } from '@/lib/google'
import { attendanceFor, meetingCode } from '@/lib/meet'

export const dynamic = 'force-dynamic'

// GET /api/meetings/:id/attendance — who joined the meeting's Google Meet,
// for how long, plus recording / transcript links when there are any.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasSupabase()) return NextResponse.json({ data: [] })

  const { id } = await params
  const { data: m } = await createServiceClient().from('meetings').select('google_meet_url,location').eq('id', id).maybeSingle()
  const code = meetingCode(m?.google_meet_url) ?? meetingCode(m?.location)
  if (!code) return NextResponse.json({ data: [], reason: 'This meeting has no Google Meet link.' })
  if (!(await hasService('meet'))) return NextResponse.json({ data: [], reason: 'Reconnect Google from Profile to read Meet attendance.' })

  try {
    return NextResponse.json({ data: await attendanceFor(code) })
  } catch (e) {
    return NextResponse.json({ data: [], reason: (e as Error).message })
  }
}
