import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
  sessionsEnabled,
} from '@/lib/session'

export const dynamic = 'force-dynamic'

/* Admin sign-in.

   Credentials come only from the environment. There is no
   hardcoded fallback: a public repository with a default password
   in it is the same as no password at all, so in production this
   route refuses to authenticate until ADMIN_EMAIL and
   ADMIN_PASSWORD are set. */

const isProduction = process.env.NODE_ENV === 'production'

/** Modest in-memory throttle. Per-instance and therefore not a
    complete defence, but it turns an online brute force from
    minutes into something impractical. */
const attempts = new Map<string, { count: number; first: number }>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 8

function throttled(ip: string): boolean {
  const now = Date.now()
  const record = attempts.get(ip)
  if (!record || now - record.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now })
    return false
  }
  record.count += 1
  return record.count > MAX_ATTEMPTS
}

export async function POST(req: NextRequest) {
  const expectedEmail = process.env.ADMIN_EMAIL
  const expectedPassword = process.env.ADMIN_PASSWORD

  if (isProduction && (!expectedEmail || !expectedPassword)) {
    console.error('[bhumi] admin login attempted with no ADMIN_EMAIL / ADMIN_PASSWORD configured')
    return NextResponse.json(
      { error: 'Admin access is not configured on this deployment.' },
      { status: 503 }
    )
  }

  if (!sessionsEnabled()) {
    return NextResponse.json(
      { error: 'Admin sessions are not configured. Set AUTH_SECRET or ADMIN_PASSWORD.' },
      { status: 503 }
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (throttled(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = String(body.email ?? '')
  const password = String(body.password ?? '')

  // Development convenience only, and never when NODE_ENV is production.
  const emailOk = expectedEmail ? safeEqual(email.toLowerCase(), expectedEmail.toLowerCase()) : !isProduction
  const passwordOk = expectedPassword ? safeEqual(password, expectedPassword) : !isProduction

  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await createSessionToken()
  if (!token) {
    return NextResponse.json({ error: 'Could not establish a session' }, { status: 503 })
  }

  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })

  attempts.delete(ip)
  return NextResponse.json({ ok: true })
}
