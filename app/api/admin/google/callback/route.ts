import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { exchangeCodeAndStore } from '@/lib/google'
import { verifyPurposeToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/* Where the admin lands afterwards: the setup page on the web, or
   straight back into the app via its URL scheme, which also closes
   the in-app browser sheet the app opened for the consent screen. */
function destination(req: NextRequest, mode: string, params: Record<string, string>) {
  const url = mode === 'app' ? new URL('bhumiadmin://google') : new URL('/admin/setup', req.url)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return NextResponse.redirect(url)
}

// GET /api/admin/google/callback — Google redirects here with ?code=&state=
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const [mode, token] = (req.nextUrl.searchParams.get('state') ?? '').split('~')

  const trusted =
    ((mode === 'app' || mode === 'web') && (await verifyPurposeToken(`google-oauth-${mode}`, token))) ||
    (await isAdmin())
  if (!trusted) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  if (error) return destination(req, mode, { google: 'denied' })
  if (!code) return destination(req, mode, { google: 'error' })

  try {
    await exchangeCodeAndStore(code)
    return destination(req, mode, { google: 'connected' })
  } catch (e) {
    console.error('[bhumi] google oauth callback failed', e)
    return destination(req, mode, { google: 'error', google_message: (e as Error).message.slice(0, 200) })
  }
}
