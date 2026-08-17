import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from './session'

export { ADMIN_COOKIE }

/** True when the caller holds a valid, unexpired, correctly
 *  signed admin session. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value)
}

/** Guard for admin API routes.
 *  Returns a 401 response when the caller is not authenticated,
 *  or null when the request may proceed:
 *
 *    const denied = await assertAdmin()
 *    if (denied) return denied
 */
export async function assertAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null
  return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
}
