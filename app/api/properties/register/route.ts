import { NextRequest, NextResponse, after } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { getProperties, insertReturningId } from '@/lib/db'
import { ensureRecordFolder } from '@/lib/google'
import { PROPERTY_REGISTER, registerListing } from '@/lib/register'
import { REGISTER_UPDATED } from '@/lib/data/property-register'

export const dynamic = 'force-dynamic'

async function existingCodes(): Promise<Map<string, string> | null> {
  const r = await getProperties({ admin: true })
  if (r.source !== 'live') return null
  return new Map(r.data.map((p) => [p.code.toUpperCase(), p.id]))
}

/* GET /api/properties/register: the register's properties, each marked
   with whether a listing with its code already exists. */
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied
  const have = await existingCodes()
  return NextResponse.json({
    updated: REGISTER_UPDATED,
    live: have !== null,
    data: PROPERTY_REGISTER.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      category: p.category,
      guntas: p.guntas,
      sqft: p.sqft,
      rate_sqft: p.rate_sqft,
      total_cr: p.total_inr ? Math.round(p.total_inr / 1e5) / 100 : null,
      legal: p.legal,
      open_points: p.open_points,
      listing_id: have?.get(p.id) ?? null,
    })),
  })
}

/* POST /api/properties/register { ids?: ['P001', …] }: creates a Draft
   listing for each (all when ids is omitted), skipping any whose code
   already exists. Never overwrites a listing. */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  const body = await req.json().catch(() => ({}))
  const want = Array.isArray(body.ids) && body.ids.length ? new Set(body.ids.map((x: unknown) => String(x).toUpperCase())) : null

  const have = await existingCodes()
  if (!have) return NextResponse.json({ error: 'The database is not reachable, so listings cannot be saved.' }, { status: 503 })

  const created: { code: string; id: string; title: string }[] = []
  const skipped: { code: string; id: string; reason: string }[] = []
  const failed: { code: string; error: string }[] = []

  for (const p of PROPERTY_REGISTER) {
    if (want && !want.has(p.id)) continue
    const existing = have.get(p.id)
    if (existing) {
      skipped.push({ code: p.id, id: existing, reason: 'already listed' })
      continue
    }
    const row = registerListing(p)
    const r = await insertReturningId('properties', row)
    if (!r.ok || !r.id) {
      const error = /properties_status_check/.test(r.error ?? '')
        ? 'The database needs migration 016 for Draft listings (Setup → Apply pending updates).'
        : (r.error ?? 'Could not save')
      failed.push({ code: p.id, error })
      continue
    }
    const id = r.id
    created.push({ code: p.id, id, title: p.name })
    after(() => ensureRecordFolder({ section: 'Listings', entityType: 'property', entityId: id, label: `${p.id} · ${p.name}` }).catch(() => null))
  }

  return NextResponse.json({ ok: failed.length === 0, created, skipped, failed }, { status: failed.length && !created.length ? 500 : 200 })
}
