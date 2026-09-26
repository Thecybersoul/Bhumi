import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { findWithHash, passwordProblem, setPassword, verifyPassword } from '@/lib/users'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

// POST /api/admin/password { current, next } — change your own password.
export async function POST(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  if (me.id === 'env') {
    return NextResponse.json({ error: 'The shared login is set in the environment, not here.' }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as { current?: string; next?: string }
  const found = await findWithHash(me.email)
  if (!found || !(await verifyPassword(String(body.current ?? ''), found.password_hash))) {
    return NextResponse.json({ error: 'Your current password is not right.' }, { status: 400 })
  }
  const next = String(body.next ?? '')
  const problem = passwordProblem(next)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })
  if (next === body.current) return NextResponse.json({ error: 'Choose a different password.' }, { status: 400 })

  await setPassword(me.id, next)
  await logActivity({ action: 'update', entity_type: 'account', entity_id: me.id, entity_label: me.name, summary: 'Changed password' }, me)
  return NextResponse.json({ ok: true })
}
