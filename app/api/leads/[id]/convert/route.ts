import { NextRequest, NextResponse } from 'next/server'
import { dealValueCr, getLead, getProperties, update } from '@/lib/db'
import { assertAdmin, currentUser } from '@/lib/auth'
import { contactsReady } from '@/lib/contacts'
import { isBuyer, isSeller } from '@/lib/matching'
import { createServiceClient } from '@/lib/supabase'
import { createTransaction } from '@/lib/transactions'
import type { Contact, Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Party {
  name: string
  phone: string
  email: string
  contact_id: string | null
}

async function contact(id: string): Promise<Contact | null> {
  return ((await createServiceClient().from('contacts').select('*').eq('id', id).maybeSingle()).data as Contact | null) ?? null
}

async function personOf(lead: Lead): Promise<Party> {
  const c = lead.contact_id && (await contactsReady()) ? await contact(lead.contact_id) : null
  return {
    name: c?.name || lead.name,
    phone: c?.phone || lead.phone || '',
    email: c?.email || lead.email || '',
    contact_id: c?.id ?? null,
  }
}

/* POST /api/leads/:id/convert — the lead has found its match: open a
   deal with the lead on one side and, optionally, the listing and the
   other party (a contact on file, or another lead — say the seller
   lead whose land this buyer wants). The lead, and the other lead if
   there is one, are marked Converted and point at the new deal.

   { property_id?, property_label?, counterpart_lead_id?,
     counterpart_contact_id?, deal_value_cr?, representing?, advisor? } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const lead = await getLead(id)
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.transaction_id) {
    return NextResponse.json({ error: 'This lead is already a deal', id: lead.transaction_id }, { status: 409 })
  }

  // Anyone who isn't selling or letting out is on the buying side.
  const buying = isBuyer(lead) || !isSeller(lead)
  const me = await currentUser()
  const person = await personOf(lead)

  let other: Party | null = null
  let otherLead: Lead | null = null
  if (body.counterpart_lead_id) {
    otherLead = await getLead(String(body.counterpart_lead_id))
    if (otherLead) other = await personOf(otherLead)
  } else if (body.counterpart_contact_id && (await contactsReady())) {
    const c = await contact(String(body.counterpart_contact_id))
    if (c) other = { name: c.name, phone: c.phone ?? '', email: c.email ?? '', contact_id: c.id }
  }

  const listing = body.property_id
    ? (await getProperties({ admin: true })).data.find((p) => p.id === String(body.property_id)) ?? null
    : null
  const typeWords = lead.property_type ? lead.property_type.replace(/-/g, ' ') : 'property'
  const label =
    String(body.property_label ?? '').trim() ||
    (listing ? `${listing.code} · ${listing.title}` : `${lead.name} — ${typeWords}${lead.locations ? `, ${lead.locations}` : ''}`)

  const buyer = buying ? person : other
  const seller = buying ? other : person
  const r = await createTransaction({
    property_id: listing?.id ?? null,
    property_label: label,
    buyer_name: buyer?.name ?? '',
    buyer_phone: buyer?.phone ?? '',
    buyer_email: buyer?.email ?? '',
    seller_name: seller?.name ?? '',
    seller_phone: seller?.phone ?? '',
    seller_email: seller?.email ?? '',
    ...(buyer?.contact_id ? { buyer_contact_id: buyer.contact_id } : {}),
    ...(seller?.contact_id ? { seller_contact_id: seller.contact_id } : {}),
    representing: body.representing ?? (other ? 'Both' : buying ? 'Buyer' : 'Seller'),
    deal_value_cr: body.deal_value_cr ?? (listing ? dealValueCr(listing) ?? null : lead.budget_max_cr ?? null),
    advisor: String(body.advisor ?? lead.assigned_to ?? me?.name ?? ''),
    notes: `Converted from lead ${lead.name}${otherLead ? ` and ${otherLead.name}` : ''}.`,
    lead_id: lead.id,
  })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })

  const done = { stage: 'Converted', converted_at: new Date().toISOString(), next_follow_up_at: null, ...(r.id ? { transaction_id: r.id } : {}) }
  const ready = await contactsReady()
  await update('leads', lead.id, ready ? done : { stage: 'Closed' })
  if (otherLead && !otherLead.transaction_id) await update('leads', otherLead.id, ready ? done : { stage: 'Closed' })

  // The listing that closed it is marked on the lead's shortlist.
  if (listing && ready) {
    await createServiceClient()
      .from('lead_properties')
      .upsert(
        { lead_id: lead.id, property_id: listing.id, property_label: `${listing.code} · ${listing.title}`, status: 'Offer made', updated_by: me?.name ?? '', updated_at: new Date().toISOString() },
        { onConflict: 'lead_id,property_id' }
      )
  }

  return NextResponse.json({ ok: true, id: r.id, reference: r.reference, persisted: r.persisted }, { status: 201 })
}
