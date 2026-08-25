/* Server-only: this module reads the service-role key. Importing
   it from a client component is a build error via next/headers in
   the auth layer, and a review error here. */
import { createServiceClient, hasSupabase } from './supabase'
import { blocks, getBlockDef } from './content/schema'

/* ═══════════════════════════════════════════════════════════
   Reading and writing editable content.

   The rule that makes this safe: the value compiled into the
   codebase is the floor. A block that has never been edited, a
   table that does not exist yet, an unreachable database — all
   three render the same correct page. Editing only ever layers
   over that floor, field by field, so a partial or bad write
   cannot blank a section.
   ═══════════════════════════════════════════════════════════ */

export type ContentSource = 'live' | 'default'

/** Deep-merge a stored value over its default, so a block that
    gained a field in code still resolves that field from the
    default rather than coming back undefined. */
function merge<T>(base: T, over: unknown): T {
  if (over === null || over === undefined) return base
  if (Array.isArray(base) || Array.isArray(over)) return (over as T) ?? base
  if (typeof base === 'object' && typeof over === 'object') {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
    for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
      if (v === undefined) continue
      // An empty string is a deliberate clear; undefined is "not set".
      out[k] = k in out ? merge(out[k], v) : v
    }
    return out as T
  }
  return (over as T) ?? base
}

let cache: { at: number; rows: Record<string, unknown> } | null = null
const TTL = 15_000

async function allRows(): Promise<Record<string, unknown>> {
  if (cache && Date.now() - cache.at < TTL) return cache.rows
  if (!hasSupabase()) return {}
  try {
    const sb = createServiceClient()
    const { data, error } = await sb.from('site_content').select('key, value')
    if (error || !data) return cache?.rows ?? {}
    const rows: Record<string, unknown> = {}
    for (const r of data as { key: string; value: unknown }[]) rows[r.key] = r.value
    cache = { at: Date.now(), rows }
    return rows
  } catch {
    return cache?.rows ?? {}
  }
}

/** Resolve one block: stored value layered over the compiled default. */
export async function getContent<T = Record<string, unknown>>(key: string): Promise<T> {
  const def = getBlockDef(key)
  const base = (def?.default ?? {}) as T
  const rows = await allRows()
  return merge(base, rows[key])
}

/** Resolve every block at once — one round trip for a whole page. */
export async function getAllContent(): Promise<Record<string, unknown>> {
  const rows = await allRows()
  const out: Record<string, unknown> = {}
  for (const b of blocks) out[b.key] = merge(b.default, rows[b.key])
  return out
}

export async function setContent(key: string, value: unknown, by?: string) {
  if (!hasSupabase()) throw new Error('No database configured')
  const sb = createServiceClient()
  const { error } = await sb
    .from('site_content')
    .upsert({ key, value, updated_by: by ?? null }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
  cache = null
}

export async function resetContent(key: string) {
  if (!hasSupabase()) throw new Error('No database configured')
  const sb = createServiceClient()
  const { error } = await sb.from('site_content').delete().eq('key', key)
  if (error) throw new Error(error.message)
  cache = null
}

/** Which blocks have actually been edited, for the admin listing. */
export async function editedKeys(): Promise<Set<string>> {
  const rows = await allRows()
  return new Set(Object.keys(rows))
}

/* ═══════════════════════════════════════════════════════════
   Connection diagnosis

   The old admin banner said "No Supabase credentials are
   attached" whenever a read fell back. That conflates four very
   different situations, and sent you looking for a missing key
   when the credentials were fine and the tables simply had not
   been created. Each state now names itself and its fix.
   ═══════════════════════════════════════════════════════════ */

export type HealthState = 'unconfigured' | 'unreachable' | 'no-tables' | 'empty' | 'live'

export interface Health {
  state: HealthState
  headline: string
  detail: string
  /** What to do about it, when there is something to do. */
  action?: string
  tables: { name: string; exists: boolean; rows: number | null }[]
  buckets: string[]
  bucketReady: boolean
}

const EXPECTED = [
  'site_content',
  'media',
  'properties',
  'billboards',
  'designs',
  'insights',
  'leads',
]

export const MEDIA_BUCKET = 'media'

export async function checkHealth(): Promise<Health> {
  const empty = { tables: [], buckets: [], bucketReady: false }

  if (!hasSupabase()) {
    return {
      ...empty,
      state: 'unconfigured',
      headline: 'No database attached',
      detail:
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not both set, so the site is serving the content compiled into the codebase. Everything renders, but nothing can be edited or saved.',
      action: 'Add both variables to your environment and redeploy.',
    }
  }

  let sb: ReturnType<typeof createServiceClient>
  try {
    sb = createServiceClient()
  } catch (e) {
    return {
      ...empty,
      state: 'unreachable',
      headline: 'Database credentials rejected',
      detail: (e as Error).message,
    }
  }

  const tables: Health['tables'] = []
  for (const name of EXPECTED) {
    try {
      /* Probe with a real select, not a head-only count. A count
         query against a table PostgREST has never heard of can come
         back with no error and a null count, which reads as "exists,
         empty" — the exact false positive this page exists to stop
         reporting. A select surfaces the missing-table error. */
      const { error } = await sb.from(name).select('*').limit(1)
      if (error) {
        tables.push({ name, exists: false, rows: null })
        continue
      }
      const { count } = await sb.from(name).select('*', { count: 'exact', head: true })
      tables.push({ name, exists: true, rows: count ?? 0 })
    } catch {
      tables.push({ name, exists: false, rows: null })
    }
  }

  let buckets: string[] = []
  try {
    const { data } = await sb.storage.listBuckets()
    buckets = (data ?? []).map((b) => b.name)
  } catch {
    /* storage unavailable is reported through bucketReady */
  }
  const bucketReady = buckets.includes(MEDIA_BUCKET)

  const missing = tables.filter((t) => !t.exists)
  if (missing.length === tables.length) {
    return {
      state: 'unreachable',
      headline: 'Database not responding',
      detail:
        'The credentials are set but no table could be read. The project may be paused, or the service key may belong to a different project.',
      action: 'Check the project is running in the Supabase dashboard.',
      tables,
      buckets,
      bucketReady,
    }
  }
  if (missing.length) {
    return {
      state: 'no-tables',
      headline: `Connected — ${missing.length} table${missing.length > 1 ? 's' : ''} missing`,
      detail: `The database is reachable and the credentials work. These tables do not exist yet: ${missing
        .map((t) => t.name)
        .join(', ')}. Anything backed by them falls back to the content compiled into the codebase.`,
      action: 'Run the migrations in supabase/migrations, oldest first.',
      tables,
      buckets,
      bucketReady,
    }
  }

  const total = tables.reduce((a, t) => a + (t.rows ?? 0), 0)
  if (total === 0) {
    return {
      state: 'empty',
      headline: 'Connected — no content saved yet',
      detail:
        'Every table exists and is empty. The site is serving the content compiled into the codebase, which is the intended starting point. Saving anything here begins overriding it, field by field.',
      tables,
      buckets,
      bucketReady,
    }
  }

  return {
    state: 'live',
    headline: 'Live',
    detail: `Serving edited content from the database. ${total} row${total === 1 ? '' : 's'} across ${
      tables.length
    } tables.`,
    tables,
    buckets,
    bucketReady,
  }
}
