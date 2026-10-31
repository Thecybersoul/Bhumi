import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { insertReturningId, update, remove } from '@/lib/db'
import { syncFollowUp } from '@/lib/followups'
import { logActivity } from '@/lib/activity'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { parsePhone } from '@/lib/phone'

/* The CRM's tables share one set of routes (GET list, POST one or a
   CSV import, PATCH ?id, DELETE ?id). Each table says which fields it
   takes and how; anything else in a request is dropped, so a caller
   can't write columns the CRM doesn't own. Writes go through lib/db.ts
   so they are stamped and land in the activity trail like every other
   ERP record. */

/* 'phone' holds exactly ONE number (lib/phone.ts) and is stored in its tidy
   display form; 'uuid' is a record id. */
type Kind = 'text' | 'int' | 'num' | 'pct' | 'date' | 'phone' | 'uuid' | readonly string[]
export type Spec = Record<string, Kind>

function clean(spec: Spec, body: Record<string, unknown>, partial: boolean, required: string[] = [], lenient = false): { data?: Record<string, unknown>; error?: string } {
  const out: Record<string, unknown> = {}
  for (const [key, kind] of Object.entries(spec)) {
    if (!(key in body)) continue
    const v = body[key]
    if (Array.isArray(kind)) {
      if (v === '' || v == null) out[key] = kind.includes('') ? '' : null
      else if (kind.includes(String(v))) out[key] = String(v)
      else return { error: `${key} must be one of ${kind.join(', ')}` }
    } else if (kind === 'phone') {
      const raw = String(v ?? '').trim()
      const ph = raw ? parsePhone(raw) : null
      if (raw && !ph) {
        // A CSV import keeps the row and drops the bad number; a form save says why.
        if (!lenient) return { error: `${key}: enter one phone number. Put each extra line on its own contact.` }
        out[key] = ''
      } else out[key] = ph ? ph.display : ''
    } else if (kind === 'uuid') {
      const raw = String(v ?? '').trim()
      if (raw && !/^[0-9a-f-]{36}$/i.test(raw)) return { error: `${key} is not a valid id` }
      out[key] = raw || null
    } else if (kind === 'text') out[key] = String(v ?? '').trim().slice(0, 2000)
    else if (kind === 'int') {
      const n = Math.round(Number(v))
      if (!Number.isFinite(n) || n < 0 || n > 5) return { error: `${key} must be 0–5` }
      out[key] = n
    } else if (kind === 'pct') {
      const n = Math.round(Number(v))
      out[key] = v === '' || v == null || !Number.isFinite(n) ? null : Math.min(100, Math.max(0, n))
    } else if (kind === 'num') out[key] = v === '' || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null
    else out[key] = /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '')) ? String(v) : null
  }
  if (!partial && !String(out.name ?? '').trim()) return { error: 'A name is required' }
  for (const k of required) if (!partial && !out[k]) return { error: `${k} is required` }
  return { data: out }
}

/** After a prospect is saved, keep its follow-up task in step with its next date. */
async function followUpFor(id: string) {
  const { data } = await createServiceClient().from('prospects').select('name, next_date, stage').eq('id', id).maybeSingle()
  if (!data) return
  const r = data as { name: string; next_date: string | null; stage: number }
  // Bhumi Estates owns every prospect: the task goes to whoever just saved it.
  await syncFollowUp({ type: 'prospect', id, label: r.name, date: r.next_date, assignee: (await currentUser())?.name, done: r.stage >= 4 })
}

export function crmRoutes(
  table: string,
  spec: Spec,
  opts: { followUps?: boolean; migration?: string; entity?: string; required?: string[] } = {}
) {
  const { followUps = table === 'prospects', migration = '021 (Sales CRM)', entity = 'prospect', required = [] } = opts
  const prepare = (data: Record<string, unknown>) => data

  async function GET() {
    const denied = await assertAdmin()
    if (denied) return denied
    if (!hasSupabase()) return NextResponse.json({ data: [], error: 'No database attached.' })
    const { data, error } = await createServiceClient().from(table).select('*').order('updated_at', { ascending: false }).limit(3000)
    if (error) {
      const missing = /does not exist|schema cache|could not find/i.test(error.message)
      return NextResponse.json({ data: [], error: missing ? 'The database needs migration ${migration}. Open Setup in the admin sidebar to apply it.' : error.message })
    }
    return NextResponse.json({ data })
  }

  async function POST(req: NextRequest) {
    const denied = await assertAdmin()
    if (denied) return denied
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

    // CSV import: { rows: [...] } in one insert, one line in the trail.
    if (Array.isArray(body.rows)) {
      const me = await currentUser()
      const rows: Record<string, unknown>[] = []
      for (const r of body.rows.slice(0, 1000)) {
        const c = clean(spec, (r ?? {}) as Record<string, unknown>, false, required, true)
        if (c.data) rows.push({ ...prepare(c.data), created_by: me?.name ?? null, updated_by: me?.name ?? null })
      }
      if (!rows.length) return NextResponse.json({ error: 'No usable rows: each needs at least a name.' }, { status: 400 })
      const { error } = await createServiceClient().from(table).insert(rows as never)
      if (error) return NextResponse.json({ error: error.message }, { status: 502 })
      await logActivity({ action: 'create', entity_type: entity, summary: `Imported ${rows.length} ${table.replace('_', ' ')}` })
      return NextResponse.json({ ok: true, imported: rows.length }, { status: 201 })
    }

    const c = clean(spec, body, false, required)
    if (!c.data) return NextResponse.json({ error: c.error }, { status: 400 })
    const r = await insertReturningId(table, prepare(c.data))
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })
    if (followUps && r.id && hasSupabase()) await followUpFor(r.id)
    return NextResponse.json({ ok: true, id: r.id }, { status: 201 })
  }

  async function PATCH(req: NextRequest) {
    const denied = await assertAdmin()
    if (denied) return denied
    const id = req.nextUrl.searchParams.get('id')
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!id || !body) return NextResponse.json({ error: 'id and a body are required' }, { status: 400 })
    const c = clean(spec, body, true)
    if (!c.data) return NextResponse.json({ error: c.error }, { status: 400 })
    const r = await update(table, id, prepare(c.data))
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })
    if (followUps && ('next_date' in c.data || 'stage' in c.data || 'name' in c.data)) await followUpFor(id)
    return NextResponse.json({ ok: true })
  }

  async function DELETE(req: NextRequest) {
    const denied = await assertAdmin()
    if (denied) return denied
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const r = await remove(table, id)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })
    if (followUps) await syncFollowUp({ type: 'prospect', id, label: '', date: null })
    return NextResponse.json({ ok: true })
  }

  return { GET, POST, PATCH, DELETE }
}
