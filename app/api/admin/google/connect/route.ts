import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { hasGoogleAuth, getAuthUrl } from '@/lib/google'
import { createPurposeToken, verifyPurposeToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/* Two ways in:
   - the web admin, which has the session cookie, follows a plain link;
   - the mobile app, which authenticates with a bearer header a phone
     browser cannot send, first POSTs here for a single-use URL carrying
     a five-minute `grant`, then opens that URL in the system browser.
   Either way the round trip through Google carries a signed `state`,
   which is what the callback trusts — the phone browser still has no
   cookie when Google sends it back. */

function notConfigured() {
  return NextResponse.json(
    { error: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI are not all set.' },
    { status: 503 }
  )
}

// GET /api/admin/google/connect — redirects to the Google consent screen
export async function GET(req: NextRequest) {
  const grant = req.nextUrl.searchParams.get('grant')
  const fromApp = Boolean(grant)
  if (fromApp) {
    if (!(await verifyPurposeToken('google-connect', grant))) {
      return NextResponse.json({ error: 'This link has expired. Start again from the app.' }, { status: 401 })
    }
  } else {
    const denied = await assertAdmin()
    if (denied) return denied
  }

  if (!hasGoogleAuth()) return notConfigured()

  const mode = fromApp ? 'app' : 'web'
  const token = await createPurposeToken(`google-oauth-${mode}`, 15 * 60)
  return NextResponse.redirect(getAuthUrl(`${mode}~${token}`))
}

// POST /api/admin/google/connect — { url } for the mobile app to open
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasGoogleAuth()) return notConfigured()

  const grant = await createPurposeToken('google-connect', 5 * 60)
  const url = new URL('/api/admin/google/connect', req.nextUrl.origin)
  url.searchParams.set('grant', grant ?? '')
  return NextResponse.json({ url: url.toString() })
}
