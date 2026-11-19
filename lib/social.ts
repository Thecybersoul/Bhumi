/* WhatsApp and Instagram belong to one person: Sanjog. The firm's WhatsApp
   Business number and Instagram account are his, so the Inbox, the
   Instagram page, the Claude tools for them, the media saved from chats and
   their activity entries are his alone. Everyone else's ERP is unchanged,
   and records Claude files from the chats (leads, contacts, listings,
   deals) are ordinary shared ERP records.

   SOCIAL_ACCESS_EMAILS (comma separated) overrides the default. Pure
   helpers here; the request guard is assertSocial() in lib/auth.ts. */

export function socialEmails(): string[] {
  return (process.env.SOCIAL_ACCESS_EMAILS || 'sanjog@bhumiestates.in')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function canUseSocial(user: { email?: string | null } | null | undefined): boolean {
  return !!user?.email && socialEmails().includes(user.email.trim().toLowerCase())
}

/** activity_log entity types written by WhatsApp and Instagram work. */
export const SOCIAL_ENTITY_TYPES = ['capture', 'instagram']
export const isSocialEntity = (t: string | null | undefined) => SOCIAL_ENTITY_TYPES.includes(String(t ?? ''))

/** Media saved from a WhatsApp chat and not yet filed on a record. Once Claude or
    Sanjog files it on a listing, deal or lead it is an ordinary shared document. */
export function isPrivateDoc(d: { category?: string | null; entity_type?: string | null }): boolean {
  return d.category === 'WhatsApp' && (d.entity_type ?? 'general') === 'general'
}

/** Claude tools that read or act on WhatsApp and Instagram. */
export const isSocialTool = (name: string) => /^(wa_|ig_|capture_)/.test(name)

export const SOCIAL_ONLY_MESSAGE = 'WhatsApp and Instagram are only available on Sanjog’s login.'
