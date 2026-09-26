import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { notificationsFor } from '@/lib/notifications'
import { createServiceClient, hasSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/notifications?since=&limit= — what everyone else did that you
// should know about, newest first, with your unread count.
export async function GET(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  const p = req.nextUrl.searchParams
  const items = await notificationsFor(me.id, { since: p.get('since'), limit: Number(p.get('limit')) || 40 })

  let seenAt: string | null = null
  if (hasSupabase() && me.id !== 'env') {
    const { data } = await createServiceClient().from('admin_users').select('notifications_seen_at').eq('id', me.id).maybeSingle()
    seenAt = data?.notifications_seen_at ?? null
  }
  const unread = items.filter((n) => !seenAt || n.created_at > seenAt).length
  return NextResponse.json({ items, unread, seen_at: seenAt })
}
