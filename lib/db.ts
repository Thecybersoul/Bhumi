import { createServiceClient, hasSupabase } from './supabase'
import {
  seedProperties,
  seedVerificationCases,
  seedTransparency,
  seedLeads,
  seedDataRoomRequests,
} from './data/seed'
import type {
  Property,
  VerificationCase,
  TransparencyStats,
  Lead,
  DataRoomRequest,
  VerificationStageKey,
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

export async function getDataRoomRequests(): Promise<Result<DataRoomRequest[]>> {
  return read<DataRoomRequest[]>('data_room_requests', seedDataRoomRequests, (q) =>
    q.select('*').order('created_at', { ascending: false })
  )
}

/* ─── Writes ─────────────────────────────────────────────── */

/** Writes are best-effort: when no database is attached the
    payload is accepted and logged so a demo deployment still
    behaves correctly from the visitor's side. */
export async function insert<T extends Record<string, unknown>>(
  table: string,
  payload: T
): Promise<{ ok: boolean; persisted: boolean; error?: string }> {
  if (!hasSupabase()) {
    console.info(`[bhumi] no database attached — ${table} payload accepted but not persisted`, payload)
    return { ok: true, persisted: false }
  }
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from(table).insert([payload as Record<string, unknown>] as never)
    if (error) return { ok: false, persisted: false, error: error.message }
    return { ok: true, persisted: true }
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
    const { error } = await supabase.from(table).update(patch).eq('id', id)
    if (error) return { ok: false, persisted: false, error: error.message }
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
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return { ok: false, persisted: false, error: error.message }
    return { ok: true, persisted: true }
  } catch (e) {
    return { ok: false, persisted: false, error: (e as Error).message }
  }
}
