import { NextRequest, NextResponse } from 'next/server'
import { dealValueCr, getLead, getLeadProperties, getLeads, getProperties } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { buyersForListing, counterpartsForLead, listingsForLead } from '@/lib/matching'

export const dynamic = 'force-dynamic'

/* GET /api/matches?lead_id=     → listings for the lead, and the other
                                   side (sellers for a buyer, buyers
                                   for a seller) among open leads
   GET /api/matches?property_id= → open buyer leads for a listing

   Each match carries its score and the reasons for it. Listings
   already on the lead's shortlist, and leads already shown a listing,
   are flagged `shown` rather than dropped. Only live records count:
   the in-code sample data is never matched against. */
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const p = req.nextUrl.searchParams
  const [leads, props] = await Promise.all([getLeads(), getProperties({ admin: true })])
  const liveLeads = leads.source === 'live' ? leads.data : []
  const liveProps = props.source === 'live' ? props.data : []

  const leadId = p.get('lead_id')
  if (leadId) {
    const lead = liveLeads.find((l) => l.id === leadId) ?? (await getLead(leadId))
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    const shown = new Set((await getLeadProperties({ lead_id: leadId })).data.map((x) => x.property_id))
    return NextResponse.json({
      listings: listingsForLead(lead, liveProps).map((m) => ({
        ...m,
        item: { id: m.item.id, code: m.item.code, title: m.item.title, location: m.item.location, status: m.item.status, property_type: m.item.property_type, value_cr: dealValueCr(m.item) ?? null, img_url: m.item.img_url },
        shown: shown.has(m.item.id),
      })),
      leads: counterpartsForLead(lead, liveLeads).map((m) => ({ ...m, item: slim(m.item) })),
    })
  }

  const propertyId = p.get('property_id')
  if (propertyId) {
    const listing = liveProps.find((x) => x.id === propertyId)
    if (!listing) return NextResponse.json({ leads: [] })
    const shown = new Set((await getLeadProperties({ property_id: propertyId })).data.map((x) => x.lead_id))
    return NextResponse.json({ leads: buyersForListing(listing, liveLeads).map((m) => ({ ...m, item: slim(m.item), shown: shown.has(m.item.id) })) })
  }

  return NextResponse.json({ error: 'Pass lead_id or property_id' }, { status: 400 })
}

function slim(l: Awaited<ReturnType<typeof getLeads>>['data'][number]) {
  return {
    id: l.id,
    name: l.name,
    phone: l.phone,
    intent: l.intent ?? 'Buy',
    stage: l.stage,
    priority: l.priority,
    property_type: l.property_type,
    locations: l.locations || l.corridor || '',
    budget_min_cr: l.budget_min_cr ?? null,
    budget_max_cr: l.budget_max_cr ?? null,
    contact_id: l.contact_id ?? null,
  }
}
