import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { createServiceClient } from '@/lib/supabase'
import { ingest } from '@/lib/capture'
import { GRAPH } from '@/lib/wa'

export const dynamic = 'force-dynamic'

/* Send a WhatsApp reply from the connected business number, when a person
   asks (in the ERP, or in their own Claude app through the connector with
   confirmed: true). Free-form text can only go within 24 hours of the
   other person's last message: Meta's rule. Replies inside that window are
   free; Meta may limit them on an account with no payment method. The
   reply shows on the phone too (coexistence). */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  const user = await currentUser()
  const body = (await req.json().catch(() => null)) as { thread_id?: string; text?: string; confirmed?: boolean } | null
  if (!body?.thread_id || !body.text?.trim()) return NextResponse.json({ error: 'thread_id and text are required' }, { status: 400 })
  if (body.confirmed !== true) return NextResponse.json({ error: 'Sending needs confirmed: true, given only when the person has asked for this exact message to be sent.' }, { status: 400 })
  const sb = createServiceClient()
  const { data: t } = await sb.from('wa_threads').select('id,title,phone_norm,status,is_group').eq('id', body.thread_id).maybeSingle()
  if (!t) return NextResponse.json({ error: 'No such chat' }, { status: 404 })
  if (!t.phone_norm || t.is_group) return NextResponse.json({ error: 'This chat has no WhatsApp number to reply to (it came from an import or Instagram).' }, { status: 400 })
  const { data: acct } = await sb.from('wa_accounts').select('phone_number_id,token').eq('status', 'connected').order('connected_at').limit(1).maybeSingle()
  if (!acct) return NextResponse.json({ error: 'WhatsApp is not connected. Connect it in the WhatsApp Inbox first.' }, { status: 400 })

  // Meta's 24-hour rule, checked here so the reason is clear.
  const { data: last } = await sb.from('wa_messages').select('sent_at').eq('thread_id', t.id).eq('from_me', false).order('sent_at', { ascending: false }).limit(1).maybeSingle()
  if (!last || Date.now() - new Date(last.sent_at).getTime() > 24 * 3_600_000) {
    return NextResponse.json({ error: `${t.title} last wrote more than 24 hours ago. WhatsApp only allows a free-form reply within 24 hours of their last message; reply from the phone instead.` }, { status: 400 })
  }

  const text = body.text.trim().slice(0, 4096)
  const res = await fetch(`${GRAPH()}/${acct.phone_number_id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acct.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: t.phone_norm, type: 'text', text: { body: text, preview_url: true } }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[]; error?: { message?: string } }
  if (!res.ok) return NextResponse.json({ error: `WhatsApp refused: ${json.error?.message ?? res.status}` }, { status: 502 })
  const wamid = json.messages?.[0]?.id ?? ''
  await ingest({ title: t.title, phone: t.phone_norm, source: 'webhook' }, [{ external_id: wamid, from_me: true, sent_at: new Date().toISOString(), kind: 'text', body: text }], user?.name ?? 'ERP')
  await sb.from('wa_messages').update({ state: 'filed', outcome: `Sent by ${user?.name ?? 'ERP'}` }).eq('external_id', wamid)
  await logActivity({ action: 'create', entity_type: 'capture', entity_id: t.id, entity_label: t.title, summary: `Sent a WhatsApp reply to ${t.title}` })
  return NextResponse.json({ ok: true, id: wamid })
}
