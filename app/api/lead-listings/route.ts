import { NextRequest, NextResponse } from 'next/server'
import { getLead, getLeadProperties, getProperties } from '@/lib/db'
import { assertAdmin, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { contactsReady, schemaHint } from '@/lib/contacts'
import { createServiceClient } from '@/lib/supabase'
import type { LeadProperty, ShownStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* Which listings have been shown to which client (migration 015).
   Seen from a lead: "what have we shown them, how did it go". Seen
   from a listing: "who has seen this one". Every change is written to
   the lead's history, so it shows on the lead's page and in the team
   activity feed. */

const SHOWN: ShownStatus[] = ['Shortlisted', 'Shared', 'Visit planned', 'Visited', 'Interested', 'Not interested', 'Offer made']

const notReady = () =>
  NextResponse.json({ error: 'The database needs migration 015 (contacts & lead pipeline). Open Setup in the admin sidebar to apply it.' }, { status: 409 })

async function log(leadId: string, summary: string) {
  const lead = await getLead(leadId)
  await logActivity({ action: 'update', entity_type: 'lead', entity_id: leadId, entity_label: lead?.name ?? '', summary })
}

// GET /api/lead-listings?lead_id= | ?property_id=
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  const p = req.nextUrl.searchParams
  const r = await getLeadProperties({ lead_id: p.get('lead_id') ?? undefined, property_id: p.get('property_id') ?? undefined })
  return NextResponse.json({ data: r.data, source: r.source, ready: await contactsReady() })
}

// POST { lead_id, property_id, status?, feedback? } — add to the shortlist
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return notReady()

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const leadId = String(body.lead_id ?? '')
  const propertyId = String(body.property_id ?? '')
  if (!leadId || !propertyId) return NextResponse.json({ error: 'Pick a lead and a listing' }, { status: 400 })

  const listing = (await getProperties({ admin: true })).data.find((x) => x.id === propertyId)
  const label = listing ? `${listing.code} · ${listing.title}` : String(body.property_label ?? '').slice(0, 200)
  const status = SHOWN.includes(body.status as ShownStatus) ? (body.status as ShownStatus) : 'Shortlisted'
  const me = await currentUser()
  const now = new Date().toISOString()

  const { data, error } = await createServiceClient()
    .from('lead_properties')
    .upsert(
      {
        lead_id: leadId,
        property_id: propertyId,
        property_label: label,
        status,
        feedback: String(body.feedback ?? '').slice(0, 1000),
        ...(status === 'Shared' ? { shared_at: now } : {}),
        ...(status === 'Visited' ? { visited_at: now } : {}),
        created_by: me?.name ?? '',
        updated_by: me?.name ?? '',
        updated_at: now,
      },
      { onConflict: 'lead_id,property_id' }
    )
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: schemaHint(error.message) }, { status: 502 })
  await log(leadId, `${status}: ${label}`)
  return NextResponse.json({ ok: true, data }, { status: 201 })
}

// PATCH ?id=  { status?, feedback? }
export async function PATCH(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return notReady()

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const me = await currentUser()
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { updated_by: me?.name ?? '', updated_at: now }
  if (body.status !== undefined) {
    if (!SHOWN.includes(body.status as ShownStatus)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
    patch.status = body.status
    if (body.status === 'Shared') patch.shared_at = now
    if (body.status === 'Visited') patch.visited_at = now
  }
  if (typeof body.feedback === 'string') patch.feedback = body.feedback.slice(0, 1000)

  const sb = createServiceClient()
  const { data, error } = await sb.from('lead_properties').update(patch).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: schemaHint(error.message) }, { status: 502 })
  const row = data as LeadProperty
  await log(row.lead_id, body.status !== undefined ? `${row.property_label}: ${row.status}` : `Feedback on ${row.property_label}`)
  return NextResponse.json({ ok: true, data })
}

// DELETE ?id=
export async function DELETE(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return notReady()

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const sb = createServiceClient()
  const { data } = await sb.from('lead_properties').select('*').eq('id', id).maybeSingle()
  const { error } = await sb.from('lead_properties').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 502 })
  if (data) await log((data as LeadProperty).lead_id, `Removed ${(data as LeadProperty).property_label} from the shortlist`)
  return NextResponse.json({ ok: true })
}
