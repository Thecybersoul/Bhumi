import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Simple session-based admin auth
// Credentials are set via environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bhumi.in'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bhumi2026'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('bhumi_admin', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
