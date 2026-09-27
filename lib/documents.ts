import { createServiceClient, hasSupabase } from './supabase'

/* ═══════════════════════════════════════════════════════════
   Documents attached to ERP records — see migration 011.

   Files never pass through this server. An upload is two calls:
   ask for a destination (a Supabase signed upload URL, or a Google
   Drive resumable session), send the bytes straight there from the
   client, then record the result. That keeps large scanned deeds
   clear of the host's request-body limit, and it is also why the
   record step re-checks the file exists before trusting it.
   ═══════════════════════════════════════════════════════════ */

export const DOCUMENTS_BUCKET = 'documents'

export const DOCUMENT_ENTITY_TYPES = ['property', 'note', 'transaction', 'lead', 'verification', 'meeting', 'task', 'contact', 'general'] as const
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number]

/* The folder each record type gets inside the Drive root. */
export const DRIVE_SECTION: Record<DocumentEntityType, string> = {
  property: 'Listings',
  transaction: 'Deals',
  verification: 'Verification',
  meeting: 'Meetings',
  note: 'Notes',
  task: 'Tasks',
  lead: 'Leads',
  contact: 'Contacts',
  general: 'General',
}

export const MAX_DOCUMENT_MB = 100
/* Supabase's free-plan per-file cap; Drive has no practical limit. */
export const MAX_BUCKET_MB = 50

export interface DocumentRow {
  id: string
  entity_type: DocumentEntityType
  entity_id: string | null
  entity_label: string
  name: string
  category: string
  mime: string
  bytes: number | null
  storage: 'supabase' | 'drive'
  path: string | null
  drive_file_id: string | null
  url: string | null
  created_by?: string
  created_at: string
}

export function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function extension(name: string) {
  const m = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/)
  return m ? m[1] : 'bin'
}

/** Create the private bucket on first use rather than making the
    operator do it by hand, as the media library does for its own. */
export async function ensureBucket() {
  const sb = createServiceClient()
  const { data } = await sb.storage.listBuckets()
  if (!data?.some((b) => b.name === DOCUMENTS_BUCKET)) {
    // No per-bucket size limit: the project's global cap (50 MB on
    // Supabase's free plan) applies, and asking for more fails outright.
    const { error } = await sb.storage.createBucket(DOCUMENTS_BUCKET, { public: false })
    if (error && !/already exists/i.test(error.message)) throw new Error(`Could not create the documents bucket: ${error.message}`)
  }
  return sb
}

export { hasSupabase }
