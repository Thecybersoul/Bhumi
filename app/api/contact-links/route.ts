import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { contactsReady, schemaHint } from '@/lib/contacts'
import { createServiceClient } from '@/lib/supabase'
import type { ContactLinkEntity } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* People tagged on a record: the landowner on a listing, the buyer's
   lawyer on a deal, who was at a meeting, who a task or note is
   about. The contact's own page lists every tag. */

const TYPES: ContactLinkEntity[] = ['lead', 'transaction', 'property', 'task', 'note', 'meeting', 'verification']
const NOUN: Record<string, string> = { lead: 'lead', transaction: 'deal', property: 'listing', task: 'task', note: 'note', meeting: 'meeting', verification: 'verification case' }

// GET ?entity_type=&entity_id= — with each person's card
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ data: [], ready: false })

  const p = req.nextUrl.searchParams
  const { data, error } = await createServiceClient()
    .from('contact_links')
    .select('*, contact:contacts(id, name, phone, email, roles, company)')
    .eq('entity_type', p.get('entity_type') ?? '')
    .eq('entity_id', p.get('entity_id') ?? '')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ data: [], ready: true, error: error.message })
  return NextResponse.json({ data: data ?? [], ready: true })
}

// POST { contact_id, entity_type, entity_id, entity_label, role? }
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ error: schemaHint('contacts') }, { status: 409 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const type = body.entity_type as ContactLinkEntity
  if (!body.contact_id || !body.entity_id || !TYPES.includes(type)) return NextResponse.json({ error: 'Pick a contact and a record' }, { status: 400 })

  const me = await currentUser()
  const sb = createServiceClient()
  const { data, error } = await sb
    .from('contact_links')
    .upsert(
      {
        contact_id: String(body.contact_id),
        entity_type: type,
        entity_id: String(body.entity_id),
        entity_label: String(body.entity_label ?? '').slice(0, 200),
        role: String(body.role ?? '').slice(0, 60),
        created_by: me?.name ?? '',
      },
      { onConflict: 'contact_id,entity_type,entity_id' }
    )
    .select('*, contact:contacts(id, name)')
    .single()
  if (error) return NextResponse.json({ error: schemaHint(error.message) }, { status: 502 })

  const row = data as { contact?: { id: string; name: string }; role: string; entity_label: string }
  await logActivity({
    action: 'tag',
    entity_type: 'contact',
    entity_id: String(body.contact_id),
    entity_label: row.contact?.name ?? '',
    summary: `On ${NOUN[type]} ${row.entity_label}${row.role ? ` as ${row.role}` : ''}`,
  })
  return NextResponse.json({ ok: true, data }, { status: 201 })
}

// DELETE ?id=
export async function DELETE(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await contactsReady())) return NextResponse.json({ error: schemaHint('contacts') }, { status: 409 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await createServiceClient().from('contact_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 502 })
  return NextResponse.json({ ok: true })
}
