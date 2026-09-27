import { NextRequest, NextResponse } from 'next/server'
import { getLead, getLeadProperties, remove, update } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { contactsReady, ensureContact, schemaHint } from '@/lib/contacts'
import { isStage, leadFields, stageEffects } from '@/lib/leads'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import type { Contact, Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* GET /api/leads/:id — the lead, its person, and the listings shown
   to it. Everything a lead page needs in one call. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const lead = await getLead(id)
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const ready = await contactsReady()
  const [shown, contact] = await Promise.all([
    ready ? getLeadProperties({ lead_id: id }).then((r) => r.data) : Promise.resolve([]),
    ready && lead.contact_id && hasSupabase()
      ? createServiceClient().from('contacts').select('*').eq('id', lead.contact_id).maybeSingle().then((r) => (r.data as Contact | null) ?? null)
      : Promise.resolve(null),
  ])
  return NextResponse.json({ data: lead, shown, contact, ready })
}

/* PUT /api/leads/:id — edit any advisor field. A stage change brings
   its side effects (first contact stamped, follow-up cleared on close). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const patch = leadFields(body)
  if ('stage' in body && !isStage(body.stage)) return NextResponse.json({ error: 'Unknown stage' }, { status: 400 })
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  const before = await getLead(id)
  // What the client sent explicitly wins over the automatic effects.
  if (patch.stage && before) Object.assign(patch, { ...stageEffects(patch.stage as Lead['stage'], before), ...patch })

  // A lead that gains a phone or email but has no person yet gets one.
  if (!patch.contact_id && !before?.contact_id && (patch.phone || patch.email) && (await contactsReady())) {
    const cid = await ensureContact({
      name: String(patch.name ?? before?.name ?? ''),
      phone: String(patch.phone ?? before?.phone ?? ''),
      email: String(patch.email ?? before?.email ?? ''),
      role: ['Sell', 'Rent out'].includes(String(patch.intent ?? before?.intent)) ? 'Seller' : 'Buyer',
      source: 'Lead',
    }).catch(() => null)
    if (cid) patch.contact_id = cid
  }

  const result = await update('leads', id, patch)
  if (!result.ok) return NextResponse.json({ error: schemaHint(result.error) }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const result = await remove('leads', id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
