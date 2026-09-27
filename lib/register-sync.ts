import { createHash } from 'node:crypto'
import { createServiceClient, hasSupabase } from './supabase'
import { PROPERTY_REGISTER, registerListing } from './register'
import { logActivity, type Actor } from './activity'

/* ═══════════════════════════════════════════════════════════
   The Property Register, kept in Listings (migration 020).

   Every register entry has a listing with its code (P001, P002, …):
     - missing → added as a Draft, with its Drive folder;
     - present → its particulars follow the register. A field is only
       updated if it still holds what the sync last wrote (the
       register_snapshot); anything the team has edited by hand since
       is kept. A listing imported before 020 has no snapshot and is
       brought fully up to date once.
   Never touched: status (going Live is a person's decision, one tap in
   the app or on the web), the photo, the homepage feature, the code.

   Runs when someone opens Listings (at most every 10 minutes per
   server, and only when the register has changed or a listing is
   missing), from the daily cron, and on demand.
   ═══════════════════════════════════════════════════════════ */

const NEVER = new Set(['status', 'img_url', 'featured', 'code'])
const REGISTER: Actor = { id: null as unknown as string, name: 'Property Register' }

export interface SyncResult {
  ran: boolean
  created: string[]
  updated: { code: string; fields: string[] }[]
  kept: { code: string; fields: string[] }[]
  errors: string[]
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const dataHash = () => createHash('sha256').update(JSON.stringify(PROPERTY_REGISTER)).digest('hex').slice(0, 16)

let lastRun = 0

/** Sync if the register changed since the last run, or a listing is missing. */
export async function syncRegisterIfDue(): Promise<SyncResult | null> {
  if (!hasSupabase() || Date.now() - lastRun < 10 * 60_000) return null
  lastRun = Date.now()
  const sb = createServiceClient()
  const [{ data: mark }, { data: listed }] = await Promise.all([
    sb.from('app_secrets').select('value').eq('key', 'register_synced_hash').maybeSingle(),
    sb.from('properties').select('code').in('code', PROPERTY_REGISTER.map((p) => p.id)),
  ])
  const missing = PROPERTY_REGISTER.some((p) => !(listed ?? []).some((l) => String(l.code).toUpperCase() === p.id))
  if (!missing && mark?.value === dataHash()) return null
  return syncRegister()
}

export async function syncRegister(): Promise<SyncResult> {
  const out: SyncResult = { ran: true, created: [], updated: [], kept: [], errors: [] }
  if (!hasSupabase()) return { ...out, ran: false, errors: ['No database attached.'] }
  const sb = createServiceClient()

  const { data: rows, error } = await sb.from('properties').select('*').in('code', PROPERTY_REGISTER.map((p) => p.id))
  if (error) {
    const needs = /register_snapshot/.test(error.message) ? 'The database needs migration 020 (Setup → Apply pending updates).' : error.message
    return { ...out, errors: [needs] }
  }
  const byCode = new Map((rows ?? []).map((r) => [String(r.code).toUpperCase(), r as Record<string, unknown>]))
  const now = new Date().toISOString()

  for (const p of PROPERTY_REGISTER) {
    const next = registerListing(p)
    const owned = Object.fromEntries(Object.entries(next).filter(([k]) => !NEVER.has(k)))
    const row = byCode.get(p.id)

    if (!row) {
      const { data, error: e } = await sb
        .from('properties')
        .insert({ ...next, status: 'Draft', img_url: '/img/p1.jpg', register_snapshot: owned, register_synced_at: now })
        .select('id')
        .single()
      if (e || !data) {
        out.errors.push(`${p.id}: ${/status_check/.test(e?.message ?? '') ? 'Draft listings need migration 016.' : (e?.message ?? 'not saved')}`)
        continue
      }
      out.created.push(p.id)
      await logActivity({ action: 'create', entity_type: 'property', entity_id: String(data.id), entity_label: `${p.id} · ${p.name}`, summary: 'Added from the Property Register as a Draft' }, REGISTER)
      try {
        const { ensureRecordFolder } = await import('./google')
        await ensureRecordFolder({ section: 'Listings', entityType: 'property', entityId: String(data.id), label: `${p.id} · ${p.name}` })
      } catch {
        /* Drive not connected: the folder is made when it is */
      }
      continue
    }

    const before = (row.register_snapshot ?? null) as Record<string, unknown> | null
    const changes: Record<string, unknown> = {}
    const kept: string[] = []
    for (const [k, v] of Object.entries(owned)) {
      if (same(row[k], v)) continue
      // First sync of an older import: bring it fully up to date.
      // Afterwards: only fields nobody has touched since the last sync.
      if (!before || same(row[k], before[k])) changes[k] = v
      else kept.push(k)
    }
    const { error: e } = await sb
      .from('properties')
      .update({ ...changes, register_snapshot: owned, register_synced_at: now, ...(Object.keys(changes).length ? { updated_at: now } : {}) })
      .eq('id', row.id)
    if (e) {
      out.errors.push(`${p.id}: ${e.message}`)
      continue
    }
    if (Object.keys(changes).length) {
      out.updated.push({ code: p.id, fields: Object.keys(changes) })
      await logActivity(
        {
          action: 'update',
          entity_type: 'property',
          entity_id: String(row.id),
          entity_label: `${p.id} · ${p.name}`,
          summary: `Updated from the Property Register: ${Object.keys(changes).join(', ')}`,
          changes: Object.fromEntries(Object.keys(changes).map((k) => [k, [row[k], changes[k]]])) as Record<string, [unknown, unknown]>,
        },
        REGISTER
      )
    }
    if (kept.length) out.kept.push({ code: p.id, fields: kept })
  }

  if (!out.errors.length) {
    await sb.from('app_secrets').upsert({ key: 'register_synced_hash', value: dataHash(), updated_at: now }, { onConflict: 'key' })
  }
  return out
}
