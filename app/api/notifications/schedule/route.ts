import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { upcomingSchedule } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// GET /api/notifications/schedule — the next two weeks of meetings and due
// tasks, which the phone turns into reminders it fires on its own.
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied
  return NextResponse.json(await upcomingSchedule())
}
