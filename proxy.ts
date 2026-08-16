import { NextRequest, NextResponse } from 'next/server'

/** Guards the whole admin surface except the login page itself.
 *  The admin layout re-checks server-side, so a matcher mistake
 *  cannot leak a page on its own. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const auth = req.cookies.get('bhumi_admin')
    if (!auth || auth.value !== 'authenticated') {
      const url = new URL('/admin/login', req.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
