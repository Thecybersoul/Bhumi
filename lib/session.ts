/* ═══════════════════════════════════════════════════════════
   Signed admin session tokens.

   Pure Web Crypto with no Next.js imports, so the identical
   verification runs in the edge proxy and in Node route handlers.

   The previous implementation stored the literal string
   "authenticated" in the cookie, which any caller could set by
   hand — a complete authentication bypass. A session is now an
   expiry plus an HMAC over it, so a cookie the server did not
   sign is rejected.
   ═══════════════════════════════════════════════════════════ */

export const ADMIN_COOKIE = 'bhumi_admin'
export const SESSION_TTL_SECONDS = 60 * 60 * 8

const encoder = new TextEncoder()

/** Signing secret. AUTH_SECRET is preferred; falling back to the
 *  admin password keeps a single-operator deployment working
 *  without a second variable. Rotating either invalidates every
 *  live session, which is the correct behaviour. */
function secret(): string | null {
  const explicit = process.env.AUTH_SECRET
  if (explicit && explicit.length >= 16) return explicit

  const derived = process.env.ADMIN_PASSWORD
  if (derived && derived.length >= 8) return `derived:${derived}`

  // No usable secret. In development, fall back to a fixed value
  // so the admin is still explorable locally; in production the
  // caller refuses to issue or accept a session at all.
  return process.env.NODE_ENV === 'production' ? null : 'development-only-insecure-secret'
}

export function sessionsEnabled(): boolean {
  return secret() !== null
}

/** True when the deployment is relying on a development fallback
 *  rather than configured credentials. Surfaced in the admin. */
export function usingInsecureDefaults(): boolean {
  return !process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL
}

async function key(): Promise<CryptoKey | null> {
  const s = secret()
  if (!s) return null
  return crypto.subtle.importKey('raw', encoder.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

function toBase64Url(bytes: ArrayBuffer): string {
  const b = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** `<expiresAtMs>.<hmac>` */
export async function createSessionToken(ttlSeconds = SESSION_TTL_SECONDS): Promise<string | null> {
  const k = await key()
  if (!k) return null
  const expires = String(Date.now() + ttlSeconds * 1000)
  const sig = await crypto.subtle.sign('HMAC', k, encoder.encode(expires))
  return `${expires}.${toBase64Url(sig)}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false

  const separator = token.lastIndexOf('.')
  if (separator <= 0) return false

  const expires = token.slice(0, separator)
  const provided = token.slice(separator + 1)

  const expiresAt = Number(expires)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false

  const k = await key()
  if (!k) return false

  const expected = toBase64Url(await crypto.subtle.sign('HMAC', k, encoder.encode(expires)))

  // Length-independent comparison that does not short-circuit on
  // the first differing byte.
  if (expected.length !== provided.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i)
  }
  return diff === 0
}

/** Constant-time string equality for credential checks. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
