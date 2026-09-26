import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  APP_SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
  sessionsEnabled,
} from '@/lib/session'
import { envUser, findWithHash, namedAccountsEnabled, touchLogin, verifyPassword, type AdminUser } from '@/lib/users'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

/* Admin sign-in.

   Named accounts (admin_users, migration 012) once any exist;
   before that, only the environment's ADMIN_EMAIL/PASSWORD. There is no
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

  let body: { email?: unknown; password?: unknown; client?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim()
  const password = String(body.password ?? '')

  let user: AdminUser | null = null
  if (await namedAccountsEnabled()) {
    // Named accounts: each person signs in as themselves.
    const found = await findWithHash(email)
    if (found?.active && (await verifyPassword(password, found.password_hash))) {
      const { password_hash: _h, ...rest } = found
      void _h
      user = rest
    }
  } else {
    // No accounts yet: the single env login, as before migration 012.
    const expectedEmail = process.env.ADMIN_EMAIL
    const expectedPassword = process.env.ADMIN_PASSWORD
    if (isProduction && (!expectedEmail || !expectedPassword)) {
      console.error('[bhumi] admin login attempted with no accounts and no ADMIN_EMAIL / ADMIN_PASSWORD')
      return NextResponse.json({ error: 'Admin access is not configured on this deployment.' }, { status: 503 })
    }
    // Development convenience only, and never when NODE_ENV is production.
    const emailOk = expectedEmail ? safeEqual(email.toLowerCase(), expectedEmail.toLowerCase()) : !isProduction
    const passwordOk = expectedPassword ? safeEqual(password, expectedPassword) : !isProduction
    if (emailOk && passwordOk) user = envUser()
  }

  if (!user) return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })

  attempts.delete(ip)
  await touchLogin(user.id)
  await logActivity(
    { action: 'login', entity_type: 'account', entity_id: user.id, entity_label: user.name, summary: body.client === 'app' ? 'Signed in on the app' : 'Signed in on the web' },
    user
  )
  const profile = { id: user.id, name: user.name, email: user.email, role: user.role }

  // A phone is signed into for weeks, not a working day: the app gets
  // a 30-day token (kept in the OS keystore and sent back as
  // `Authorization: Bearer`), while the web cookie keeps 8 hours.
  if (body.client === 'app') {
    const appToken = await createSessionToken(user.id, APP_SESSION_TTL_SECONDS)
    if (!appToken) return NextResponse.json({ error: 'Could not establish a session' }, { status: 503 })
    return NextResponse.json({ ok: true, token: appToken, user: profile })
  }

  const token = await createSessionToken(user.id)
  if (!token) return NextResponse.json({ error: 'Could not establish a session' }, { status: 503 })
  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
  return NextResponse.json({ ok: true, token, user: profile })
}
