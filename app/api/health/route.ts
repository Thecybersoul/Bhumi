import { NextResponse } from 'next/server'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { configuredUrls } from '@/lib/migrator'
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

  /* Whether each recent migration is in (a probe per migration), and
     whether the server could apply one itself. Booleans and counts only:
     no names, no URLs. `current` is true only when all of them are. */
  let schemaCurrent: boolean | null = null
  const migrations: Record<string, boolean> = {}
  let register: { entries: number; listed: number } | null = null
  if (dbReachable) {
    const sb = createServiceClient()
    const probes: [string, string, string][] = [
      ['016', 'contact_links', 'payout_status'],
      ['017', 'push_subscriptions', 'id'],
      ['018', 'messages', 'id'],
      ['019', 'connector_tokens', 'id'],
      ['020', 'properties', 'register_snapshot'],
    ]
    const results = await Promise.all(probes.map(([, t, c]) => sb.from(t).select(c).limit(1)))
    probes.forEach(([n], i) => (migrations[n] = !results[i].error))
    schemaCurrent = Object.values(migrations).every(Boolean)
    const { PROPERTY_REGISTER } = await import('@/lib/register')
    const { data: listed } = await sb.from('properties').select('code').in('code', PROPERTY_REGISTER.map((p) => p.id))
    register = { entries: PROPERTY_REGISTER.length, listed: (listed ?? []).length }
  }

  const degraded = configured && !dbReachable

  return NextResponse.json(
    {
      status: degraded ? 'degraded' : 'ok',
      // Serving correctly from seed data is a healthy state, not a
      // failure — the site is designed to render without a database.
      serving: true,
      database: { configured, reachable: dbReachable, source, error },
      schema: { current: schemaCurrent, migrations, auto_migrate: configuredUrls().length > 0 },
      // The Property Register kept in Listings (lib/register-sync.ts).
      register,
      // Whether the AI assistant can run (ANTHROPIC_API_KEY is set). Never the key itself.
      assistant: { configured: Boolean(process.env.ANTHROPIC_API_KEY) },
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  )
}
