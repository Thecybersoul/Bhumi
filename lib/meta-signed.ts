import { createHmac, timingSafeEqual } from 'node:crypto'

/* Meta's signed_request (deauthorize and data-deletion callbacks):
   "<base64url signature>.<base64url JSON payload>", HMAC-SHA256 of the
   payload part with the app secret. The Meta app and its Instagram login
   have different secrets, so either is accepted. */

const b64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

export function readSignedRequest(signed: string): Record<string, unknown> | null {
  const [sig, payload] = String(signed ?? '').split('.', 2)
  if (!sig || !payload) return null
  const got = b64url(sig)
  for (const secret of [process.env.META_APP_SECRET, process.env.IG_APP_SECRET]) {
    if (!secret) continue
    const want = createHmac('sha256', secret).update(payload).digest()
    if (want.length === got.length && timingSafeEqual(want, got)) {
      try {
        return JSON.parse(b64url(payload).toString('utf8')) as Record<string, unknown>
      } catch {
        return null
      }
    }
  }
  return null
}

/** X-Hub-Signature-256 over a webhook body, against any of the given secrets. */
export function hubSigned(raw: string, header: string | null, secrets: (string | undefined)[]): boolean {
  if (!header?.startsWith('sha256=')) return false
  const got = Buffer.from(header.slice(7))
  return secrets.some((secret) => {
    if (!secret) return false
    const want = Buffer.from(createHmac('sha256', secret).update(raw).digest('hex'))
    return want.length === got.length && timingSafeEqual(want, got)
  })
}
