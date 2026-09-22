import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { hasGoogleAuth, getAuthUrl } from '@/lib/google'

export const dynamic = 'force-dynamic'

// GET /api/admin/google/connect — redirects to the Google consent screen
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  if (!hasGoogleAuth()) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI are not all set.' },
      { status: 503 }
    )
  }

  return NextResponse.redirect(getAuthUrl())
}
