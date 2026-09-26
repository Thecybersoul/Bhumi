import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { getUser } from '@/lib/users'
import { logActivity } from '@/lib/activity'
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
  const [mode, uid, token] = (req.nextUrl.searchParams.get('state') ?? '').split('~')

  // The signed state names who started the connection; a phone
  // browser has no admin cookie, so this is the only proof it has.
  const signed = (mode === 'app' || mode === 'web') && uid && (await verifyPurposeToken(`google-oauth-${mode}:${uid}`, token))
  const who = signed ? await getUser(uid) : await currentUser()
  if (!who) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  if (error) return destination(req, mode, { google: 'denied' })
  if (!code) return destination(req, mode, { google: 'error' })

  try {
    const { email } = await exchangeCodeAndStore(code, who.name)
    await logActivity({ action: 'connect', entity_type: 'google', entity_label: email, summary: 'Connected Google Workspace (Drive, Calendar, Meet)' }, who)
    return destination(req, mode, { google: 'connected' })
  } catch (e) {
    console.error('[bhumi] google oauth callback failed', e)
    return destination(req, mode, { google: 'error', google_message: (e as Error).message.slice(0, 200) })
  }
}
