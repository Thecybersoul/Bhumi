import { createServiceClient, hasSupabase } from './supabase'
import { insertReturningId } from './db'
import type { Contact, ContactRole } from './types'

/* ═══════════════════════════════════════════════════════════
   Contacts (migration 015).

   One row per person. Leads, deals and the website all feed it
   through ensureContact(), which finds the person by phone or email
   before creating anyone, so the same buyer enquiring twice, then
   closing a deal, is still one contact with one history.
   ═══════════════════════════════════════════════════════════ */

export const CONTACT_ROLES: ContactRole[] = ['Buyer', 'Seller', 'Landowner', 'Investor', 'Developer', 'Tenant', 'Broker', 'Lawyer', 'Surveyor', 'Other']

/** Digits with the Indian country code — the same rule as the
    bhumi_phone_norm() SQL function the migration backfilled with. */
export function normPhone(p?: string | null): string {
  const d = String(p ?? '').replace(/\D/g, '')
  if (d.length === 10) return `91${d}`
  if (d.length === 11 && d.startsWith('0')) return `91${d.slice(1)}`
  return d
}

/* One probe per process, as with the activity trail: once the table
   exists it stays. A failed probe is retried, so applying the
   migration takes effect without a redeploy. */
let ready = false
export async function contactsReady(): Promise<boolean> {
  if (ready) return true
  if (!hasSupabase()) return false
  try {
    const { error } = await createServiceClient().from('contacts').select('id').limit(1)
    ready = !error
  } catch {
    ready = false
  }
  return ready
}

/** A database error that means migration 015 hasn't been applied,
    turned into something a person can act on. */
export function schemaHint(message?: string | null): string | undefined {
  if (!message) return undefined
  if (/contacts|contact_links|lead_properties|contact_id|budget_m(in|ax)_cr|next_follow_up|leads_(stage|channel|intent|priority)_check|entity_type_check|schema cache/i.test(message)) {
    return 'The database needs migration 015 (contacts & lead pipeline). Open Setup in the admin sidebar to apply it.'
  }
  return message
}

export interface ContactSeed {
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
  role?: ContactRole
  source?: string
}

/** Find a contact by phone or email, or create one. Returns null when
    there is nothing to match on and no name, or before migration 015. */
export async function ensureContact(seed: ContactSeed): Promise<string | null> {
  const name = seed.name.trim()
  const phone = (seed.phone ?? '').trim()
  const email = (seed.email ?? '').trim().toLowerCase()
  if (!name || !(await contactsReady())) return null
  const norm = normPhone(phone)
  const sb = createServiceClient()

  let existing: { id: string; roles: string[] } | null = null
  if (norm.length >= 8) {
    existing = (await sb.from('contacts').select('id, roles').eq('phone_norm', norm).limit(1).maybeSingle()).data
  }
  if (!existing && email) {
    existing = (await sb.from('contacts').select('id, roles').ilike('email', email).limit(1).maybeSingle()).data
  }
  // With neither to go on, only an exact name counts as the same person.
  if (!existing && !norm && !email) {
    existing = (await sb.from('contacts').select('id, roles').ilike('name', name).eq('phone_norm', '').eq('email', '').limit(1).maybeSingle()).data
  }

  if (existing) {
    if (seed.role && !existing.roles?.includes(seed.role)) {
      await sb.from('contacts').update({ roles: [...(existing.roles ?? []), seed.role] }).eq('id', existing.id)
    }
    return existing.id
  }

  const r = await insertReturningId('contacts', {
    name: name.slice(0, 160),
    phone: phone.slice(0, 40),
    phone_norm: norm,
    email: email.slice(0, 160),
    company: (seed.company ?? '').slice(0, 160),
    roles: seed.role ? [seed.role] : [],
    source: (seed.source ?? '').slice(0, 120),
  })
  return r.id ?? null
}

/** The editable fields of a contact, from a request body. Only keys
    present are returned, so a PUT changes what it sends. */
export function contactFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const s = (k: string, max: number) => String(body[k] ?? '').trim().slice(0, max)
  if ('name' in body && s('name', 160)) out.name = s('name', 160)
  if ('phone' in body) {
    out.phone = s('phone', 40)
    out.phone_norm = normPhone(String(out.phone))
  }
  for (const [k, max] of [['alt_phone', 40], ['company', 160], ['city', 80], ['address', 300], ['source', 120], ['notes', 4000]] as const) {
    if (k in body) out[k] = s(k, max)
  }
  if ('email' in body) out.email = s('email', 160).toLowerCase()
  if (Array.isArray(body.roles)) out.roles = (body.roles as unknown[]).filter((r): r is ContactRole => CONTACT_ROLES.includes(r as ContactRole))
  return out
}

/** Someone already on file with this phone or email. */
export async function findDuplicate(phone: string, email: string, exceptId?: string): Promise<Contact | null> {
  const sb = createServiceClient()
  const norm = normPhone(phone)
  const tries = [
    norm.length >= 8 ? sb.from('contacts').select('*').eq('phone_norm', norm) : null,
    email ? sb.from('contacts').select('*').ilike('email', email) : null,
  ]
  for (const q of tries) {
    if (!q) continue
    const { data } = await (exceptId ? q.neq('id', exceptId) : q).limit(1).maybeSingle()
    if (data) return data as Contact
  }
  return null
}
