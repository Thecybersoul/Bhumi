import { signPayload, readPayload } from './session'
import { claim } from './webpush'

/* A one-time upload link, so Claude never has to type file bytes as
   base64. get_upload_link (lib/assistant/tools.ts) mints the token;
   app/api/upload/[token]/route.ts verifies and consumes it. Single
   use is enforced with push_sent (migration 017) — a generic
   "key already claimed" store, reused here rather than adding a
   dedicated table. It prunes keys older than 30 days on its own
   (app/api/cron/reminders), which is well past this token's 15. */

export const UPLOAD_LINK_TTL_SECONDS = 15 * 60

export type UploadPurpose = 'listing_photo' | 'document'

export interface UploadTokenPayload {
  jti: string
  uid: string
  purpose: UploadPurpose
  listing_id?: string
  entity_type?: string
  entity_id?: string
  entity_label?: string
  category?: string
  file_name?: string
}

export async function signUploadToken(fields: Omit<UploadTokenPayload, 'jti'>, ttlSeconds = UPLOAD_LINK_TTL_SECONDS): Promise<string | null> {
  return signPayload({ ...fields, jti: crypto.randomUUID() }, ttlSeconds)
}

/** The token's payload, or null if it's invalid, expired, or already
 *  used. Claims the token as a side effect — call only once an upload
 *  is actually about to be accepted, since a failed later step cannot
 *  un-claim it (the link is one-shot by design). */
export async function consumeUploadToken(token: string): Promise<UploadTokenPayload | null> {
  const payload = await readPayload<UploadTokenPayload>(token)
  if (!payload?.jti || !payload.uid || !payload.purpose) return null
  return (await claim(`upload-link:${payload.jti}`)) ? payload : null
}
