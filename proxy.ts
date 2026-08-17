import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/session'

/** Guards the whole admin surface except the login page itself.
 *  The session cookie is HMAC-signed, so this verifies the
 *  signature rather than merely checking that a cookie exists.
 *  The admin layout re-checks server-side, so a matcher mistake
 *  cannot leak a page on its own. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value
    if (!(await verifySessionToken(token))) {
      const url = new URL('/admin/login', req.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
