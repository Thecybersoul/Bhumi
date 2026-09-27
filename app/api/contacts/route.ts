import { NextRequest, NextResponse } from 'next/server'
import { getContacts, getLeads, getTransactions, insertReturningId } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { contactFields, contactsReady, findDuplicate, normPhone, schemaHint } from '@/lib/contacts'

export const dynamic = 'force-dynamic'

/* GET /api/contacts — everyone, A–Z, each with how many leads and
   deals they are part of so the list can show who is active. */
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const ready = await contactsReady()
  const [c, l, t] = await Promise.all([getContacts(), getLeads(), getTransactions()])
  const leads = l.source === 'live' ? l.data : []
  const deals = t.source === 'live' ? t.data : []
  const data = (c.source === 'live' ? c.data : []).map((x) => ({
    ...x,
    lead_count: leads.filter((y) => y.contact_id === x.id).length,
    open_leads: leads.filter((y) => y.contact_id === x.id && !['Converted', 'Lost', 'Closed'].includes(y.stage)).length,
    deal_count: deals.filter((y) => y.buyer_contact_id === x.id || y.seller_contact_id === x.id).length,
  }))
  return NextResponse.json({ data, source: c.source, ready })
}

/* POST /api/contacts — add someone. If their phone or email is
   already on file the existing card comes back with a 409, unless
   the caller says { force: true } (two people can share a landline). */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ error: schemaHint('contacts') }, { status: 409 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const row = contactFields(body)
  if (!row.name) return NextResponse.json({ error: 'A contact needs a name' }, { status: 400 })

  if (!body.force) {
    const dup = await findDuplicate(String(row.phone ?? ''), String(row.email ?? ''))
    if (dup) return NextResponse.json({ error: `${dup.name} already has this ${normPhone(String(row.phone ?? '')) === dup.phone_norm ? 'phone number' : 'email'}.`, duplicate: dup }, { status: 409 })
  }

  const r = await insertReturningId('contacts', { roles: [], ...row })
  if (!r.ok) return NextResponse.json({ error: schemaHint(r.error) }, { status: 502 })
  return NextResponse.json({ ok: true, id: r.id, persisted: r.persisted }, { status: 201 })
}
