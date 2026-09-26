import { createServiceClient, hasSupabase } from './supabase'
import type { AdminUser } from './users'

/* ═══════════════════════════════════════════════════════════
   The activity trail (migration 012).

   Almost nothing calls this directly. lib/db.ts's insert / update /
   remove write an entry for every ERP table on their own: who,
   what, which record, and for an update the fields that actually
   changed, old value → new value. Routes that write outside
   those helpers (documents, meetings' calendar sync, site content,
   media, the Google connection) call logActivity() themselves.

   Logging never fails a request. If the table isn't there yet, or
   the insert errors, the change the user made still stands.
   ═══════════════════════════════════════════════════════════ */

export interface Actor {
  id: string
  name: string
}

export interface ActivityEntry {
  action: string
  entity_type: string
  entity_id?: string | null
  entity_label?: string
  summary?: string
  changes?: Record<string, [unknown, unknown]> | null
}

/** Table → the entity name the trail and the app use for it. */
export const AUDITED: Record<string, string> = {
  properties: 'property',
  transactions: 'transaction',
  leads: 'lead',
  notes: 'note',
  tasks: 'task',
  verification_cases: 'verification',
  data_room_requests: 'data_room',
  meetings: 'meeting',
  documents: 'document',
}

/** A human name for any record, from whichever fields it has. */
export function labelFor(table: string, row: Record<string, unknown> | null | undefined): string {
  if (!row) return ''
  const s = (k: string) => (row[k] == null ? '' : String(row[k]))
  switch (table) {
    case 'properties':
      return [s('code'), s('title')].filter(Boolean).join(' · ')
    case 'transactions':
      return [s('reference'), s('property_label')].filter(Boolean).join(' · ')
    case 'verification_cases':
      return [s('reference'), s('parcel_label')].filter(Boolean).join(' · ')
    case 'data_room_requests':
      return [s('name'), s('parcel_code')].filter(Boolean).join(' · ')
    case 'notes':
      return s('body').slice(0, 80)
    case 'leads':
      return s('name')
    default:
      return s('title') || s('name') || s('label')
  }
}

/* Only one probe per process: once 012 is applied it stays applied. */
let ready: boolean | null = null
export async function auditReady(): Promise<boolean> {
  if (ready !== null) return ready
  if (!hasSupabase()) return (ready = false)
  try {
    const { error } = await createServiceClient().from('activity_log').select('id').limit(1)
    ready = !error
  } catch {
    ready = false
  }
  return ready
}

/** The signed-in person making this request, or null for a public
    caller (a website enquiry has no account behind it). */
export async function currentActor(): Promise<Actor | null> {
  const { currentUser } = await import('./auth')
  const u = await currentUser()
  return u ? { id: u.id, name: u.name } : null
}

export async function logActivity(entry: ActivityEntry, actor?: Actor | AdminUser | null) {
  try {
    if (!(await auditReady())) return
    const who = actor === undefined ? await currentActor() : actor
    await createServiceClient()
      .from('activity_log')
      .insert({
        actor_id: who?.id ?? null,
        actor_name: who?.name ?? 'Website',
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id ?? null,
        entity_label: (entry.entity_label ?? '').slice(0, 200),
        summary: (entry.summary ?? '').slice(0, 500),
        changes: entry.changes ?? null,
      })
  } catch (e) {
    console.error('[bhumi] activity log write failed', e)
  }
}

/* Fields that are bookkeeping, not something a person changed. */
const QUIET = new Set(['updated_at', 'updated_by', 'created_by', 'created_at', 'id'])

const LABELS: Record<string, string> = {
  price_per_acre_cr: 'price per acre',
  price_total_cr: 'headline price',
  price_per_sqft: 'price per sq ft',
  extent_acres: 'extent',
  built_up_sqft: 'built-up area',
  img_url: 'photo',
  deal_value_cr: 'deal value',
  commission_collected: 'commission collected',
  due_at: 'due date',
  scheduled_at: 'time',
  property_label: 'deal label',
}

export const fieldLabel = (k: string) => LABELS[k] ?? k.replace(/_/g, ' ')

function short(v: unknown): string {
  if (v == null || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (typeof v === 'object') return Array.isArray(v) ? `${v.length} item${v.length === 1 ? '' : 's'}` : '…'
  const str = String(v)
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    return new Date(str).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  }
  return str.length > 40 ? `${str.slice(0, 40)}…` : str
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null) || (a != null && b != null && String(a) === String(b))

/** Which fields a patch actually changes on a row, old → new. */
export function diff(before: Record<string, unknown> | null, patch: Record<string, unknown>) {
  const changes: Record<string, [unknown, unknown]> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (QUIET.has(k)) continue
    const old = before?.[k]
    if (!same(old, v)) changes[k] = [old ?? null, v ?? null]
  }
  return changes
}

/** One readable line for an update: "status Live → Reserved, price per acre 2.1 → 2.4". */
export function describe(table: string, changes: Record<string, [unknown, unknown]>): string {
  const keys = Object.keys(changes)
  if (table === 'tasks' && changes.status) return changes.status[1] === 'Done' ? 'Marked done' : 'Reopened'
  if (table === 'transactions' && changes.outcome?.[1] === 'Lost') return 'Marked lost'
  const parts = keys.slice(0, 3).map((k) => {
    const [a, b] = changes[k]
    if (k === 'description' || k === 'notes' || k === 'body' || k === 'outcome' || k === 'agenda') return `edited ${fieldLabel(k)}`
    return `${fieldLabel(k)} ${short(a)} → ${short(b)}`
  })
  if (keys.length > 3) parts.push(`${keys.length - 3} more`)
  return parts.join(', ')
}
