import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { computeDashboard } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

// GET /api/dashboard — the same figures the web dashboard renders,
// pre-computed server-side so the mobile app never re-derives KPI
// logic client-side and the two surfaces can't drift apart.
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const data = await computeDashboard()
  return NextResponse.json(data)
}
