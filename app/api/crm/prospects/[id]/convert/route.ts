import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { insertReturningId, update } from '@/lib/db'
import { contactsReady, ensureContact, schemaHint } from '@/lib/contacts'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { createTransaction } from '@/lib/transactions'
import { addDays, FOLLOW_UP_DAYS, today, type Prospect } from '@/lib/crm'
import type { ContactRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* POST /api/crm/prospects/:id/convert — a prospect has engaged: carry
   them forward without retyping. The same person keeps one contact card
   (found by phone or email), the lead and the deal point back at the
   prospect, and the prospect points forward at both.

   { to: 'lead' }   open a lead from the prospect (partners become an
                    agent contact instead: they bring deals, they don't buy)
   { to: 'deal', property_id?, property_label?, deal_value_cr?, deal_type?,
     next_date? }   open a deal on the prospect, converting the lead if
                    there is one

   Replaces the CRM's separate deal table: deals are the ERP's own. */

const ROLE: Record<string, ContactRole> = { P: 'Agent', D: 'Developer', B: 'Developer', I: 'Investor' }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasSupabase()) return NextResponse.json({ error: 'No database attached.' }, { status: 503 })

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const to = body.to === 'deal' ? 'deal' : 'lead'

  const sb = createServiceClient()
  const { data } = await sb.from('prospects').select('*').eq('id', id).maybeSingle()
  const p = data as (Prospect & { contact_id?: string | null; lead_id?: string | null }) | null
  if (!p) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })

  const ready = await contactsReady()
  const contactId =
    p.contact_id ??
    (ready
      ? await ensureContact({ name: p.name, phone: p.phone, email: p.email, company: p.name, role: ROLE[p.list], source: 'Sales funnel' }).catch(() => null)
      : null)

  const nextDate = p.next_date && p.next_date > today() ? p.next_date : addDays(FOLLOW_UP_DAYS[2] ?? 3)
  const forward = async (patch: Record<string, unknown>) => {
    const r = await update('prospects', id, { contact_id: contactId, stage: Math.max(2, p.stage < 4 ? p.stage : 2), next_date: nextDate, last_contacted: p.last_contacted ?? today(), ...patch })
    return r.ok
  }

  if (to === 'lead') {
    if (p.lead_id) return NextResponse.json({ error: 'Already a lead', lead_id: p.lead_id, contact_id: contactId }, { status: 409 })
    if (p.list === 'P') {
      // A channel partner is an agent contact, not a buyer.
      if (!contactId) return NextResponse.json({ error: schemaHint('contacts') }, { status: 409 })
      await update('prospects', id, { contact_id: contactId })
      return NextResponse.json({ ok: true, contact_id: contactId, lead_id: null, note: 'Partners are saved as an agent contact, not a lead.' })
    }
    const lead = await insertReturningId('leads', {
      kind: 'Enquiry',
      name: p.name.slice(0, 160),
      company: p.name.slice(0, 160),
      phone: p.phone.slice(0, 40),
      email: p.email.toLowerCase().slice(0, 160),
      source: 'Sales funnel · prospect',
      channel: 'Other',
      stage: 'Contacted',
      intent: 'Buy',
      locations: p.area.slice(0, 300),
      notes: [p.requirement, p.trigger_why, p.note].filter(Boolean).join('\n').slice(0, 2000),
      assigned_to: p.owner,
      last_contacted_at: new Date().toISOString(),
      next_follow_up_at: new Date(`${nextDate}T09:00:00+05:30`).toISOString(),
      payload: {},
      ...(contactId ? { contact_id: contactId } : {}),
    })
    if (!lead.ok) return NextResponse.json({ error: schemaHint(lead.error) }, { status: 502 })
    await forward({ lead_id: lead.id })
    return NextResponse.json({ ok: true, lead_id: lead.id, contact_id: contactId }, { status: 201 })
  }

  // to === 'deal'
  const label = String(body.property_label ?? '').trim() || `${p.name}${p.requirement ? ` · ${p.requirement}` : ''}`.slice(0, 200)
  const deal = await createTransaction({
    property_id: body.property_id,
    property_label: label,
    buyer_name: p.name,
    buyer_phone: p.phone,
    buyer_email: p.email,
    ...(contactId ? { buyer_contact_id: contactId } : {}),
    deal_value_cr: body.deal_value_cr,
    deal_type: body.deal_type,
    next_date: nextDate,
    prospect_id: id,
    lead_id: p.lead_id ?? undefined,
    advisor: p.owner,
    notes: [p.requirement, p.trigger_why].filter(Boolean).join('\n'),
  })
  if (!deal.ok) return NextResponse.json({ error: deal.error }, { status: deal.status })
  if (p.lead_id && deal.id) await update('leads', p.lead_id, { stage: 'Converted', transaction_id: deal.id, next_follow_up_at: null })
  await forward({})
  return NextResponse.json({ ok: true, id: deal.id, reference: deal.reference, contact_id: contactId }, { status: 201 })
}
