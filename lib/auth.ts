import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'bhumi_admin'

/** True when the caller holds a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return store.get(ADMIN_COOKIE)?.value === 'authenticated'
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
