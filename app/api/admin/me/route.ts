import { NextResponse } from 'next/server'
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

  return NextResponse.json({
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
