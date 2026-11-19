import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activity'
import { getUser } from '@/lib/users'
import { canUseSocial, SOCIAL_ONLY_MESSAGE } from '@/lib/social'
import { connect, readState } from '@/lib/instagram'

export const dynamic = 'force-dynamic'

/* Instagram's sign-in sends the person back here with a code. The signed
   `state` says which ERP user started it (it expires in 10 minutes). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const back = (q: string) => NextResponse.redirect(new URL(`/admin/instagram?${q}`, req.nextUrl.origin))
  if (p.get('error')) return back(`error=${encodeURIComponent(p.get('error_description') ?? p.get('error') ?? 'Cancelled')}`)
  const uid = readState(p.get('state') ?? '')
  const user = uid ? await getUser(uid) : null
  if (!user) return back('error=This sign-in link expired. Try Connect Instagram again.')
  if (!canUseSocial(user)) return back(`error=${encodeURIComponent(SOCIAL_ONLY_MESSAGE)}`)
  try {
    const r = await connect(req.nextUrl.origin, String(p.get('code') ?? '').replace(/#_$/, ''), user.name)
    await logActivity({ action: 'create', entity_type: 'instagram', entity_label: `@${r.username}`, summary: `Connected Instagram @${r.username}` }, user)
    return back(`connected=${encodeURIComponent(r.username)}`)
  } catch (e) {
    return back(`error=${encodeURIComponent((e as Error).message)}`)
  }
}
