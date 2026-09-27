import { NextRequest, NextResponse } from 'next/server'
import { getLeads, getTransactions, remove, update } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { contactFields, contactsReady, findDuplicate, schemaHint } from '@/lib/contacts'
import { createServiceClient } from '@/lib/supabase'
import type { Contact, ContactLink } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* GET /api/contacts/:id — the person and everything they're part of:
   their leads, the deals they're buyer or seller on, and every record
   they've been tagged on (listings, tasks, notes, meetings). Tasks,
   notes and meetings *about* them are fetched by the page from their
   own routes with entity_type=contact. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ error: schemaHint('contacts') }, { status: 409 })

  const { id } = await params
  const sb = createServiceClient()
  const [{ data: contact }, links, leads, deals] = await Promise.all([
    sb.from('contacts').select('*').eq('id', id).maybeSingle(),
    sb.from('contact_links').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    getLeads(),
    getTransactions(),
  ])
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  return NextResponse.json({
    data: contact as Contact,
    leads: leads.source === 'live' ? leads.data.filter((l) => l.contact_id === id) : [],
    deals: (deals.source === 'live' ? deals.data : [])
      .filter((t) => t.buyer_contact_id === id || t.seller_contact_id === id)
      .map((t) => ({ ...t, side: t.buyer_contact_id === id ? (t.seller_contact_id === id ? 'Buyer & seller' : 'Buyer') : 'Seller' })),
    links: (links.data ?? []) as ContactLink[],
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const patch = contactFields(body)
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  if (!body.force && (patch.phone || patch.email)) {
    const dup = await findDuplicate(String(patch.phone ?? ''), String(patch.email ?? ''), id)
    if (dup) return NextResponse.json({ error: `${dup.name} already has this number or email.`, duplicate: dup }, { status: 409 })
  }

  const result = await update('contacts', id, patch)
  if (!result.ok) return NextResponse.json({ error: schemaHint(result.error) }, { status: 502 })

  // Keep the copies of their details on open leads and deals current.
  const sb = createServiceClient()
  const mirror: Record<string, unknown> = {}
  for (const k of ['name', 'phone', 'email'] as const) if (k in patch) mirror[k] = patch[k]
  if (Object.keys(mirror).length) {
    await sb.from('leads').update(mirror).eq('contact_id', id)
    for (const side of ['buyer', 'seller']) {
      const m = Object.fromEntries(Object.entries(mirror).map(([k, v]) => [`${side}_${k}`, v]))
      await sb.from('transactions').update(m).eq(`${side}_contact_id`, id).eq('outcome', 'In progress')
    }
  }
  return NextResponse.json({ ok: true, persisted: result.persisted })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const result = await remove('contacts', id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
