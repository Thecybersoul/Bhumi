import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect /admin/dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    const auth = req.cookies.get('bhumi_admin')
    if (!auth || auth.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
