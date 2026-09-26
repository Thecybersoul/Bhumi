import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, readSessionToken } from './session'
import { getUser, type AdminUser } from './users'

export { ADMIN_COOKIE }

/** The raw session token, from `Authorization: Bearer <token>` (the
 *  mobile app, which has no cookie jar) or the web admin's cookie.
 *  It is the same token format and gets the same check either way. */
async function sessionToken(): Promise<string | undefined> {
  const bearer = (await headers()).get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (bearer) return bearer
  return (await cookies()).get(ADMIN_COOKIE)?.value
}

/** The signed-in account, or null. A valid signature is not enough:
 *  the account must still exist and be active, so removing someone
 *  locks them out. It is not only a matter of waiting for their
 *  token to expire. */
export async function currentUser(): Promise<(AdminUser & { sessionExpiresAt: number }) | null> {
  try {
    const session = await readSessionToken(await sessionToken())
    if (!session) return null
    const user = await getUser(session.userId)
    return user ? { ...user, sessionExpiresAt: session.expiresAt } : null
  } catch {
    // Outside a request (scripts, build) there are no headers to read.
    return null
  }
}

export async function isAdmin(): Promise<boolean> {
  return (await currentUser()) !== null
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
