import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from './session'

export { ADMIN_COOKIE }

/** True when the caller holds a valid, unexpired, correctly
 *  signed admin session — via the browser cookie (the web admin)
 *  or an `Authorization: Bearer <token>` header (the mobile app,
 *  which has no cookie jar). Same token format, same check either
 *  way; a caller can use whichever it has. */
export async function isAdmin(): Promise<boolean> {
  const bearer = (await headers()).get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (bearer && (await verifySessionToken(bearer))) return true

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
