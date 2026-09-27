import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { contactsReady, schemaHint } from '@/lib/contacts'
import { agentsReady, involvementFields } from '@/lib/agents'
import { createServiceClient } from '@/lib/supabase'
import type { ContactLinkEntity } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* People tagged on a record — contacts and agents alike: the
   landowner on a listing, the buyer's lawyer on a deal, the agent
   who brought the buyer and what they're owed, who was at a meeting,
   who a task or note is about. Everyone's own page lists every tag. */

const TYPES: ContactLinkEntity[] = ['lead', 'transaction', 'property', 'task', 'note', 'meeting', 'verification']
const NOUN: Record<string, string> = { lead: 'lead', transaction: 'deal', property: 'listing', task: 'task', note: 'note', meeting: 'meeting', verification: 'verification case' }
const CARD = 'id, name, phone, email, roles, company'
const AGENT_CARD = `${CARD}, agency, rera_number, default_share_pct, agent_status, rating`
const lakh = (n?: number | null) => (n == null ? '' : `₹${Number(n.toFixed(2))} L`)

// GET ?entity_type=&entity_id=   — who is on a record
// GET ?contact_id=                — everything one person is on
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ data: [], ready: false, agents: false })

  const agents = await agentsReady()
  const p = req.nextUrl.searchParams
  let q = createServiceClient()
    .from('contact_links')
    .select(`*, contact:contacts(${agents ? AGENT_CARD : CARD})`)
    .order('created_at', { ascending: true })
  if (p.get('contact_id')) q = q.eq('contact_id', p.get('contact_id')!)
  else q = q.eq('entity_type', p.get('entity_type') ?? '').eq('entity_id', p.get('entity_id') ?? '')
  const { data, error } = await q
  if (error) return NextResponse.json({ data: [], ready: true, agents, error: error.message })
  return NextResponse.json({ data: data ?? [], ready: true, agents })
}

// POST { contact_id, entity_type, entity_id, entity_label, role?, share_type?, share_value?, payout_status? }
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ error: schemaHint('contacts') }, { status: 409 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const type = body.entity_type as ContactLinkEntity
  if (!body.contact_id || !body.entity_id || !TYPES.includes(type)) return NextResponse.json({ error: 'Pick a contact and a record' }, { status: 400 })

  const money = involvementFields(body)
  if (Object.keys(money).length && !(await agentsReady())) return NextResponse.json({ error: schemaHint('agency') }, { status: 409 })

  const me = await currentUser()
  const { data, error } = await createServiceClient()
    .from('contact_links')
    .upsert(
      {
        contact_id: String(body.contact_id),
        entity_type: type,
        entity_id: String(body.entity_id),
        entity_label: String(body.entity_label ?? '').slice(0, 200),
        role: String(body.role ?? '').slice(0, 60),
        created_by: me?.name ?? '',
        ...money,
      },
      { onConflict: 'contact_id,entity_type,entity_id' }
    )
    .select('*, contact:contacts(id, name)')
    .single()
  if (error) return NextResponse.json({ error: schemaHint(error.message) }, { status: 502 })

  const row = data as { contact?: { name: string }; role: string; entity_label: string; share_type?: string; share_value?: number | null }
  const terms = row.share_type && row.share_type !== 'Paid by their client' ? ` · ${row.share_type === 'Flat' ? lakh(row.share_value) : `${row.share_value ?? '?'}% ${row.share_type === 'Percent of deal value' ? 'of deal value' : 'of our commission'}`}` : ''
  await logActivity({
    action: 'tag',
    entity_type: 'contact',
    entity_id: String(body.contact_id),
    entity_label: row.contact?.name ?? '',
    summary: `On ${NOUN[type]} ${row.entity_label}${row.role ? ` as ${row.role}` : ''}${terms}`,
  })
  return NextResponse.json({ ok: true, data }, { status: 201 })
}

// PATCH ?id=  { role?, share_type?, share_value?, payout_status?, payout_amount_lakh?, payout_ref?, notes? }
export async function PATCH(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await agentsReady())) return NextResponse.json({ error: schemaHint('agency') }, { status: 409 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const me = await currentUser()
  const patch: Record<string, unknown> = { ...involvementFields(body), updated_by: me?.name ?? '', updated_at: new Date().toISOString() }
  if (typeof body.role === 'string') patch.role = body.role.slice(0, 60)

  const sb = createServiceClient()
  const { data, error } = await sb.from('contact_links').update(patch).eq('id', id).select('*, contact:contacts(id, name)').single()
  if (error) return NextResponse.json({ error: schemaHint(error.message) }, { status: 502 })

  const row = data as { contact_id: string; contact?: { name: string }; entity_type: string; entity_label: string; payout_status: string; payout_amount_lakh?: number | null; payout_ref?: string }
  const summary =
    'payout_status' in body
      ? `Payout ${row.payout_status.toLowerCase()}${row.payout_amount_lakh != null ? ` ${lakh(row.payout_amount_lakh)}` : ''} on ${NOUN[row.entity_type]} ${row.entity_label}${row.payout_ref ? ` (ref ${row.payout_ref})` : ''}`
      : `Terms updated on ${NOUN[row.entity_type]} ${row.entity_label}`
  await logActivity({ action: 'update', entity_type: 'contact', entity_id: row.contact_id, entity_label: row.contact?.name ?? '', summary })
  return NextResponse.json({ ok: true, data })
}

// DELETE ?id=
export async function DELETE(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ error: schemaHint('contacts') }, { status: 409 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const sb = createServiceClient()
  const { data } = await sb.from('contact_links').select('*, contact:contacts(id, name)').eq('id', id).maybeSingle()
  const { error } = await sb.from('contact_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 502 })
  const row = data as { contact_id: string; contact?: { name: string }; entity_type: string; entity_label: string } | null
  if (row) await logActivity({ action: 'update', entity_type: 'contact', entity_id: row.contact_id, entity_label: row.contact?.name ?? '', summary: `Removed from ${NOUN[row.entity_type]} ${row.entity_label}` })
  return NextResponse.json({ ok: true })
}
