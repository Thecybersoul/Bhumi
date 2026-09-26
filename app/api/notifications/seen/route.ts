import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST /api/notifications/seen — mark everything up to now as read.
export async function POST() {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  if (hasSupabase() && me.id !== 'env') {
    await createServiceClient().from('admin_users').update({ notifications_seen_at: new Date().toISOString() }).eq('id', me.id)
  }
  return NextResponse.json({ ok: true })
}
