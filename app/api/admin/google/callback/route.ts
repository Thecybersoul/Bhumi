import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { exchangeCodeAndStore } from '@/lib/google'

export const dynamic = 'force-dynamic'

// GET /api/admin/google/callback — Google redirects here with ?code=
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const setupUrl = new URL('/admin/setup', req.url)
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    setupUrl.searchParams.set('google', 'denied')
    return NextResponse.redirect(setupUrl)
  }
  if (!code) {
    setupUrl.searchParams.set('google', 'error')
    return NextResponse.redirect(setupUrl)
  }

  try {
    await exchangeCodeAndStore(code)
    setupUrl.searchParams.set('google', 'connected')
  } catch (e) {
    console.error('[bhumi] google oauth callback failed', e)
    setupUrl.searchParams.set('google', 'error')
    setupUrl.searchParams.set('google_message', (e as Error).message.slice(0, 200))
  }
  return NextResponse.redirect(setupUrl)
}
