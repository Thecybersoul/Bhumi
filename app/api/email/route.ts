import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { hasService } from '@/lib/google'
import { loadAttachments, parseAddresses, sendEmail } from '@/lib/gmail'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ENTITY_TYPES = ['property', 'transaction', 'lead', 'meeting', 'task', 'verification', 'data_room', 'general']

// GET /api/email?entity_type=&entity_id=  — emails sent about a record, newest first
export async function GET(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  if (!hasSupabase()) return NextResponse.json({ data: [] })
  const p = req.nextUrl.searchParams
  let q = createServiceClient().from('emails').select('*').order('created_at', { ascending: false }).limit(100)
  if (p.get('entity_type')) q = q.eq('entity_type', p.get('entity_type')!)
  if (p.get('entity_id')) q = q.eq('entity_id', p.get('entity_id')!)
  const { data, error } = await q
  return NextResponse.json({ data: data ?? [], error: error?.message })
}

/* POST /api/email — send from info@bhumiestates.in as the signed-in
   person, optionally attaching ERP documents, and file it against the
   listing / deal / lead / meeting it's about.
   { to, cc?, subject, body, document_ids?, entity_type?, entity_id?, entity_label? } */
export async function POST(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  if (!(await hasService('gmail'))) {
    return NextResponse.json({ error: 'Gmail is not connected. Connect Google from Profile first.' }, { status: 409 })
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  try {
    const to = parseAddresses(String(body.to ?? ''))
    const cc = body.cc ? parseAddresses(String(body.cc)) : []
    if (!to.length) return NextResponse.json({ error: 'Add at least one recipient' }, { status: 400 })
    if (to.length + cc.length > 20) return NextResponse.json({ error: 'At most 20 recipients per email' }, { status: 400 })
    const subject = String(body.subject ?? '').trim().slice(0, 200)
    let text = String(body.body ?? '').trim().slice(0, 20000)
    if (!subject || !text) return NextResponse.json({ error: 'An email needs a subject and a message' }, { status: 400 })

    const ids = Array.isArray(body.document_ids) ? (body.document_ids as unknown[]).map(String).slice(0, 15) : []
    const { files, links } = await loadAttachments(ids)
    if (links.length) text += `\n\n${links.map((l) => `${l.name}: ${l.url}`).join('\n')}`

    const sent = await sendEmail({ to, cc, subject, text, senderName: me.name, attachments: files })

    const entityType = ENTITY_TYPES.includes(String(body.entity_type)) ? String(body.entity_type) : 'general'
    const row = {
      to_addresses: to.join(', '),
      cc_addresses: cc.join(', '),
      subject,
      body: text,
      attachments: [...files.map((f) => ({ name: f.name, bytes: f.bytes.length })), ...links.map((l) => ({ name: l.name, url: l.url }))],
      entity_type: entityType,
      entity_id: body.entity_id ? String(body.entity_id).slice(0, 80) : null,
      entity_label: String(body.entity_label ?? '').slice(0, 200),
      gmail_message_id: sent.id,
      gmail_thread_id: sent.threadId,
      created_by: me.name,
      updated_by: me.name,
    }
    const { data } = await createServiceClient().from('emails').insert(row).select().single()
    await logActivity(
      {
        action: 'email',
        entity_type: entityType,
        entity_id: row.entity_id,
        entity_label: row.entity_label || to.join(', '),
        summary: `Emailed ${to.join(', ')}: “${subject}”${files.length ? ` with ${files.length} attachment${files.length > 1 ? 's' : ''}` : ''}`,
      },
      me
    )
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (e) {
    const msg = (e as Error).message
    return NextResponse.json({ error: msg }, { status: /not an email|more than/.test(msg) ? 400 : 502 })
  }
}
