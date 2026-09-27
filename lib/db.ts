import { createServiceClient, hasSupabase } from './supabase'
import { AUDITED, auditReady, currentActor, describe, diff, labelFor, logActivity, type Actor } from './activity'
import {
  seedProperties,
  seedVerificationCases,
  seedTransparency,
  seedLeads,
  seedDataRoomRequests,
  seedTransactions,
  seedNotes,
  seedTasks,
} from './data/seed'
import type {
  Property,
  VerificationCase,
  TransparencyStats,
  Lead,
  DataRoomRequest,
  VerificationStageKey,
  PropertyTransaction,
  Note,
  Task,
  Meeting,
  Contact,
  LeadProperty,
} from './types'

/* ═══════════════════════════════════════════════════════════
   Data access with a guaranteed floor.

   Plan §10 treats reliability as a design requirement rather
   than an afterthought. The practical version of that here:
   a page never throws because a database is unreachable. Every
   read falls back to the seeded record and reports which source
   it used, so the admin can see at a glance whether it is
   looking at live data or the fallback.
   ═══════════════════════════════════════════════════════════ */

export type Source = 'live' | 'fallback'
export interface Result<T> {
  data: T
  source: Source
  error?: string
}

async function read<T>(
  table: string,
  fallback: T,
  build: (q: ReturnType<ReturnType<typeof createServiceClient>['from']>) => PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<Result<T>> {
  if (!hasSupabase()) return { data: fallback, source: 'fallback' }
  try {
    const supabase = createServiceClient()
    const { data, error } = await build(supabase.from(table))
    if (error) return { data: fallback, source: 'fallback', error: error.message }
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { data: fallback, source: 'fallback' }
    }
    return { data: data as T, source: 'live' }
  } catch (e) {
    return { data: fallback, source: 'fallback', error: (e as Error).message }
  }
}

/* ─── Properties ─────────────────────────────────────────── */

export async function getProperties(opts: { admin?: boolean } = {}): Promise<Result<Property[]>> {
  const fallback = opts.admin ? seedProperties : seedProperties.filter((p) => p.status === 'Live')
  return read<Property[]>('properties', fallback, (q) => {
    const base = q.select('*').order('created_at', { ascending: false })
    return opts.admin ? base : base.eq('status', 'Live')
  })
}

export async function getFeaturedProperties(limit = 3): Promise<Result<Property[]>> {
  const res = await getProperties()
  const featured = res.data.filter((p) => p.featured)
  return { ...res, data: (featured.length ? featured : res.data).slice(0, limit) }
}

export async function getPropertiesByType(type: string): Promise<Result<Property[]>> {
  const res = await getProperties()
  return { ...res, data: res.data.filter((p) => p.property_type === type) }
}

export async function getProperty(code: string): Promise<Result<Property | null>> {
  const res = await getProperties({ admin: true })
  return { ...res, data: res.data.find((p) => p.code === code || p.id === code) ?? null }
}

/** Best available estimate of a listing's deal value in ₹ crore, from
    whichever price fields the source document actually gave — a
    headline total, an acre rate, or a built-up rate. */
export function dealValueCr(p: Property): number | undefined {
  if (p.price_total_cr) return p.price_total_cr
  if (p.extent_acres && p.price_per_acre_cr) return p.extent_acres * p.price_per_acre_cr
  if (p.built_up_sqft && p.price_per_sqft) return (p.built_up_sqft * p.price_per_sqft) / 1e7
  return undefined
}

/* ─── Verification cases ─────────────────────────────────── */

export async function getVerificationCases(): Promise<Result<VerificationCase[]>> {
  return read<VerificationCase[]>('verification_cases', seedVerificationCases, (q) =>
    q.select('*').order('opened_at', { ascending: false })
  )
}

/* ─── Transparency dashboard (Plan §3A) ──────────────────── */

/** Derive the live slice from the case record so the published
    dashboard and the internal pipeline can never disagree. */
export function deriveFromCases(cases: VerificationCase[]) {
  const closed = cases.filter((c) => c.outcome === 'Verified' || c.outcome === 'Flagged')
  const turnarounds = closed
    .map((c) => c.turnaround_days)
    .filter((d): d is number => typeof d === 'number' && d > 0)
    .sort((a, b) => a - b)

  const median = turnarounds.length
    ? turnarounds.length % 2
      ? turnarounds[(turnarounds.length - 1) / 2]
      : Math.round((turnarounds[turnarounds.length / 2 - 1] + turnarounds[turnarounds.length / 2]) / 2)
    : 0

  const stageFlags = new Map<VerificationStageKey, number>()
  for (const c of cases) {
    for (const s of c.stages) {
      if (s.status === 'Flagged') stageFlags.set(s.key, (stageFlags.get(s.key) ?? 0) + 1)
    }
  }

  return {
    reviewed: cases.length,
    verified: cases.filter((c) => c.outcome === 'Verified').length,
    flagged: cases.filter((c) => c.outcome === 'Flagged').length,
    inProgress: cases.filter((c) => c.outcome === 'In progress').length,
    avgTurnaround: turnarounds.length
      ? Math.round(turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length)
      : 0,
    medianTurnaround: median,
    acreage: Math.round(cases.reduce((s, c) => s + (c.extent_acres ?? 0), 0)),
    stageFlags,
    flagReasons: cases
      .filter((c) => c.flag_reason)
      .reduce<{ reason: string; count: number }[]>((acc, c) => {
        const found = acc.find((r) => r.reason === c.flag_reason)
        if (found) found.count += 1
        else acc.push({ reason: c.flag_reason!, count: 1 })
        return acc
      }, [])
      .sort((a, b) => b.count - a.count),
  }
}

export async function getTransparency(): Promise<
  Result<TransparencyStats> & { recent: ReturnType<typeof deriveFromCases> }
> {
  const [stats, cases] = await Promise.all([
    read<TransparencyStats[]>('transparency_stats', [seedTransparency], (q) =>
      q.select('*').order('updated_at', { ascending: false }).limit(1)
    ),
    getVerificationCases(),
  ])
  return {
    data: stats.data[0] ?? seedTransparency,
    source: stats.source,
    error: stats.error,
    recent: deriveFromCases(cases.data),
  }
}

/* ─── Leads ──────────────────────────────────────────────── */

export async function getLeads(): Promise<Result<Lead[]>> {
  return read<Lead[]>('leads', seedLeads, (q) =>
    q.select('*').order('created_at', { ascending: false })
  )
}

export async function getLead(id: string): Promise<Lead | null> {
  const res = await getLeads()
  return res.data.find((l) => l.id === id) ?? null
}

/* ─── Contacts & listings shown (migration 015) ─────────────── */

export async function getContacts(): Promise<Result<Contact[]>> {
  return read<Contact[]>('contacts', [], (q) => q.select('*').order('name', { ascending: true }).limit(5000))
}

/** Listings shown to leads — for one lead, one listing, or all. */
export async function getLeadProperties(filter: { lead_id?: string; property_id?: string } = {}): Promise<Result<LeadProperty[]>> {
  return read<LeadProperty[]>('lead_properties', [], (q) => {
    let b = q.select('*').order('created_at', { ascending: false })
    if (filter.lead_id) b = b.eq('lead_id', filter.lead_id)
    if (filter.property_id) b = b.eq('property_id', filter.property_id)
    return b
  })
}

export async function getDataRoomRequests(): Promise<Result<DataRoomRequest[]>> {
  return read<DataRoomRequest[]>('data_room_requests', seedDataRoomRequests, (q) =>
    q.select('*').order('created_at', { ascending: false })
  )
}

/* ─── Property transactions (deal pipeline) ─────────────────── */

export async function getTransactions(): Promise<Result<PropertyTransaction[]>> {
  return read<PropertyTransaction[]>('transactions', seedTransactions, (q) =>
    q.select('*').order('opened_at', { ascending: false })
  )
}

/* ─── Notes & tasks ──────────────────────────────────────── */

export async function getNotes(): Promise<Result<Note[]>> {
  return read<Note[]>('notes', seedNotes, (q) => q.select('*').order('created_at', { ascending: false }))
}

export async function getTasks(): Promise<Result<Task[]>> {
  return read<Task[]>('tasks', seedTasks, (q) => q.select('*').order('due_at', { ascending: true, nullsFirst: false }))
}

export async function getMeetings(): Promise<Result<Meeting[]>> {
  return read<Meeting[]>('meetings', [], (q) => q.select('*').order('scheduled_at', { ascending: true }))
}

/* ─── Writes ─────────────────────────────────────────────── */

/* Every write below also records who made it (see lib/activity.ts):
   the row is stamped with created_by / updated_by, and the change
   goes into the activity trail. A public caller, such as a website
   enquiry, is recorded as "Website". Both steps are skipped until
   migration 012 exists, so an older database keeps working. */

async function stamp(table: string, payload: Record<string, unknown>, kind: 'create' | 'update') {
  if (!AUDITED[table] || !(await auditReady())) return { payload, actor: null as Actor | null }
  const actor = await currentActor()
  const name = actor?.name ?? 'Website'
  const stamped =
    kind === 'create'
      ? { ...payload, created_by: payload.created_by ?? name, updated_by: name }
      : { ...payload, updated_by: name, updated_at: new Date().toISOString() }
  return { payload: stamped, actor }
}

async function recordCreate(table: string, row: Record<string, unknown>, id: string | undefined, actor: Actor | null) {
  if (!AUDITED[table]) return
  await logActivity({ action: 'create', entity_type: AUDITED[table], entity_id: id ?? null, entity_label: labelFor(table, row) }, actor)
}

/** Writes are best-effort: when no database is attached the
    payload is accepted and logged so a demo deployment still
    behaves correctly from the visitor's side. */
export async function insert<T extends Record<string, unknown>>(
  table: string,
  payload: T
): Promise<{ ok: boolean; persisted: boolean; error?: string }> {
  const r = await insertReturningId(table, payload)
  return { ok: r.ok, persisted: r.persisted, error: r.error }
}

/** insert(), but hands back the stored row's id — for callers that
    attach something to the new record straight away (a note's files). */
export async function insertReturningId<T extends Record<string, unknown>>(
  table: string,
  payload: T
): Promise<{ ok: boolean; persisted: boolean; id?: string; error?: string }> {
  if (!hasSupabase()) {
    console.info(`[bhumi] no database attached — ${table} payload accepted but not persisted`, payload)
    return { ok: true, persisted: false }
  }
  try {
    const { payload: row, actor } = await stamp(table, payload, 'create')
    const supabase = createServiceClient()
    const { data, error } = await supabase.from(table).insert([row] as never).select('id').single()
    if (error) return { ok: false, persisted: false, error: error.message }
    const id = (data as { id: string } | null)?.id
    await recordCreate(table, row, id, actor)
    return { ok: true, persisted: true, id }
  } catch (e) {
    return { ok: false, persisted: false, error: (e as Error).message }
  }
}

export async function update(
  table: string,
  id: string,
  patch: Record<string, unknown>
): Promise<{ ok: boolean; persisted: boolean; error?: string }> {
  if (!hasSupabase()) return { ok: true, persisted: false }
  try {
    const supabase = createServiceClient()
    const audited = Boolean(AUDITED[table]) && (await auditReady())
    const before = audited
      ? ((await supabase.from(table).select('*').eq('id', id).maybeSingle()).data as Record<string, unknown> | null)
      : null
    const { payload, actor } = await stamp(table, patch, 'update')
    const { error } = await supabase.from(table).update(payload).eq('id', id)
    if (error) return { ok: false, persisted: false, error: error.message }
    if (audited) {
      const changes = diff(before, patch)
      if (Object.keys(changes).length) {
        await logActivity(
          {
            action: 'update',
            entity_type: AUDITED[table],
            entity_id: id,
            entity_label: labelFor(table, { ...(before ?? {}), ...patch }),
            summary: describe(table, changes),
            changes,
          },
          actor
        )
      }
    }
    return { ok: true, persisted: true }
  } catch (e) {
    return { ok: false, persisted: false, error: (e as Error).message }
  }
}

export async function remove(
  table: string,
  id: string
): Promise<{ ok: boolean; persisted: boolean; error?: string }> {
  if (!hasSupabase()) return { ok: true, persisted: false }
  try {
    const supabase = createServiceClient()
    const audited = Boolean(AUDITED[table]) && (await auditReady())
    const before = audited
      ? ((await supabase.from(table).select('*').eq('id', id).maybeSingle()).data as Record<string, unknown> | null)
      : null
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return { ok: false, persisted: false, error: error.message }
    if (audited) {
      await logActivity({ action: 'delete', entity_type: AUDITED[table], entity_id: id, entity_label: labelFor(table, before) })
    }
    return { ok: true, persisted: true }
  } catch (e) {
    return { ok: false, persisted: false, error: (e as Error).message }
  }
}
