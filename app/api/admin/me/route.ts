import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { listUsers } from '@/lib/users'
import { createServiceClient, hasSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/admin/me — who is signed in, when the session ends, and the
// rest of the team with when each was last active.
export async function GET() {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  const users = await listUsers()
  const lastActive: Record<string, string> = {}
  if (hasSupabase() && users.length) {
    const { data } = await createServiceClient()
      .from('activity_log')
      .select('actor_id,created_at')
      .neq('action', 'login')
      .order('created_at', { ascending: false })
      .limit(300)
    for (const row of data ?? []) if (row.actor_id && !lastActive[row.actor_id]) lastActive[row.actor_id] = row.created_at
  }

  let notifyPrefs: Record<string, unknown> = { digest_email: true }
  if (hasSupabase() && me.id !== 'env') {
    const { data } = await createServiceClient().from('admin_users').select('notify_prefs').eq('id', me.id).maybeSingle()
    if (data?.notify_prefs) notifyPrefs = data.notify_prefs
  }

  return NextResponse.json({
    notify_prefs: notifyPrefs,
    user: {
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      last_login_at: me.last_login_at ?? null,
      password_changed_at: me.password_changed_at ?? null,
      created_at: me.created_at ?? null,
    },
    session: { expires_at: new Date(me.sessionExpiresAt).toISOString() },
    team: users
      .filter((u) => u.active)
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        last_login_at: u.last_login_at ?? null,
        last_active_at: lastActive[u.id] ?? null,
      })),
  })
}

// PATCH /api/admin/me { notify_prefs: { digest_email: boolean } } — your own email preferences.
export async function PATCH(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  if (me.id === 'env' || !hasSupabase()) return NextResponse.json({ error: 'Not available for the shared login' }, { status: 400 })
  const body = (await req.json().catch(() => ({}))) as { notify_prefs?: { digest_email?: unknown } }
  const prefs = { digest_email: body.notify_prefs?.digest_email !== false }
  const { error } = await createServiceClient().from('admin_users').update({ notify_prefs: prefs }).eq('id', me.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, notify_prefs: prefs })
}
