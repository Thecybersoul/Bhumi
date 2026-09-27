import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { getProperties } from '@/lib/db'
import { PROPERTY_REGISTER } from '@/lib/register'
import { syncRegister } from '@/lib/register-sync'
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

/* POST /api/properties/register: bring Listings in line with the
   register now (lib/register-sync.ts): add missing entries as Drafts and
   update the particulars of existing ones, keeping hand edits. */
export async function POST() {
  const denied = await assertAdmin()
  if (denied) return denied
  const r = await syncRegister()
  const bad = r.errors.length > 0 && !r.created.length && !r.updated.length
  return NextResponse.json(
    {
      ok: r.errors.length === 0,
      created: r.created.map((code) => ({ code })),
      updated: r.updated,
      kept: r.kept,
      failed: r.errors.map((error) => ({ error })),
    },
    { status: bad ? 500 : 200 }
  )
}
