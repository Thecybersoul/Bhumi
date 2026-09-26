import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* GET /api/activity — the trail, newest first.
   ?entity_type=&entity_id=  one record's history
   ?actor_id=                one person's activity
   ?limit=                   default 50, at most 200
   ?include_logins=1         sign-ins are left out unless asked for */
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasSupabase()) return NextResponse.json({ data: [] })

  const p = req.nextUrl.searchParams
  const limit = Math.min(200, Math.max(1, Number(p.get('limit')) || 50))
  let q = createServiceClient().from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit)
  if (p.get('entity_type')) q = q.eq('entity_type', p.get('entity_type')!)
  if (p.get('entity_id')) q = q.eq('entity_id', p.get('entity_id')!)
  if (p.get('actor_id')) q = q.eq('actor_id', p.get('actor_id')!)
  if (!p.get('include_logins')) q = q.neq('action', 'login')

  const { data, error } = await q
  if (error) return NextResponse.json({ data: [], error: error.message })
  return NextResponse.json({ data: data ?? [] })
}
