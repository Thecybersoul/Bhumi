import { NextResponse } from 'next/server'
import { hasSupabase } from '@/lib/supabase'
import { getProperties } from '@/lib/db'

export const dynamic = 'force-dynamic'

/* Real-user monitoring from day one (Plan §10) needs something
   to monitor. This endpoint reports whether the app is serving,
   whether the database is reachable, and whether reads are
   currently coming from live data or the seeded fallback — so an
   uptime check can distinguish "up" from "up but degraded". */

export async function GET() {
  const started = Date.now()
  const configured = hasSupabase()

  let dbReachable = false
  let source: 'live' | 'fallback' = 'fallback'
  let error: string | undefined

  try {
    const res = await getProperties({ admin: true })
    source = res.source
    dbReachable = res.source === 'live'
    error = res.error
  } catch (e) {
    error = (e as Error).message
  }

  const degraded = configured && !dbReachable

  return NextResponse.json(
    {
      status: degraded ? 'degraded' : 'ok',
      // Serving correctly from seed data is a healthy state, not a
      // failure — the site is designed to render without a database.
      serving: true,
      database: { configured, reachable: dbReachable, source, error },
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  )
}
