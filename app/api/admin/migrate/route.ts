import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { configuredUrls, migrate } from '@/lib/migrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/* The database updates in supabase/, applied from inside the app over
   the Postgres connection string (lib/migrator.js). Production builds
   already do this on every deploy; this is the same thing on demand,
   for Setup's button. Needs SUPABASE_DB_URL or a POSTGRES_* variable. */

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!configuredUrls().length) return NextResponse.json({ runner: false, pending: null })
  try {
    const r = await migrate({ base: process.cwd(), log: () => {}, checkOnly: true })
    return NextResponse.json({ runner: true, via: r.via, pending: r.pending })
  } catch (e) {
    return NextResponse.json({ runner: true, pending: null, error: (e as Error).message })
  }
}

export async function POST() {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!configuredUrls().length) {
    return NextResponse.json({ error: 'No database connection string is configured on the server.' }, { status: 409 })
  }
  try {
    const r = await migrate({ base: process.cwd(), log: () => {} })
    if (r.applied.length) {
      await logActivity({ action: 'update', entity_type: 'settings', entity_label: `Database updated: ${r.applied.join(', ')}` })
    }
    return NextResponse.json(r, { status: r.failed ? 500 : 200 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
