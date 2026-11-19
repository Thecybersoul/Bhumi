import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import {
  NOT_READY, addRule, backlog, captureReady, claimBatch, finishBatch, ingest, listRules, parseExport, removeRule, setThreadStatus, threadMessages, titleFromFilename,
  type FinishItem, type MatchType, type RuleKind,
} from '@/lib/capture'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/* WhatsApp capture (migration 025, lib/capture.ts).

   GET                      backlog, chats and the Personal list (the Inbox page)
   GET  ?thread=<id>        one business chat's messages
   POST {action:'import'}   an uploaded "Export chat" text
   POST {action:'share'}    messages shared from the app (or, later, its notification reader)
   POST {action:'rule'}     add to the Personal / Business list; {remove:id} to take one off
   POST {action:'thread'}   mark a chat Business, or Personal (which erases it)
   POST {action:'claim'}    Claude takes a batch to file (the connector's capture_next_batch)
   POST {action:'finish'}   Claude reports what it filed (capture_finish_batch) */

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await captureReady())) return NextResponse.json({ ready: false, error: NOT_READY })
  const thread = req.nextUrl.searchParams.get('thread')
  if (thread) {
    const b = await backlog()
    const t = b.threads.find((x) => x.id === thread)
    if (!t) return bad('No such chat', 404)
    // Held chats are not read by anyone until someone marks them Business.
    if (t.status !== 'business') return bad('This chat is held: mark it Business to read it.', 403)
    return NextResponse.json({ thread: t, messages: await threadMessages(thread) })
  }
  const [b, rules] = await Promise.all([backlog(), listRules()])
  return NextResponse.json({ ready: true, ...b, rules })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await captureReady())) return bad(NOT_READY, 503)
  const user = await currentUser()
  const by = user?.name ?? 'ERP'
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return bad('Invalid request body')

  try {
    switch (body.action) {
      case 'import': {
        const text = String(body.text ?? '')
        if (text.length < 20) return bad('That file has no chat in it.')
        if (text.length > 15_000_000) return bad('That export is over 15 MB of text. Export a shorter range.')
        const title = String(body.title ?? '').trim() || titleFromFilename(String(body.filename ?? '')) || 'Imported chat'
        const parsed = parseExport(text, String(body.me ?? ''))
        if (!parsed.messages.length) return bad('No messages were recognised. Upload the .txt (or .zip) that WhatsApp’s “Export chat” makes.')
        const r = await ingest({ title, is_group: body.is_group === undefined ? parsed.is_group : Boolean(body.is_group), source: 'export', intent_business: true, phone: String(body.phone ?? '') }, parsed.messages, by)
        if (r.status !== 'personal') {
          await logActivity({ action: 'create', entity_type: 'capture', entity_id: r.thread_id, entity_label: title, summary: `Imported ${r.stored} WhatsApp messages from “${title}” for filing` })
        }
        return NextResponse.json({ ok: true, title, ...r, recognised: parsed.messages.length, senders: parsed.senders.length })
      }

      case 'share': {
        const msgs = Array.isArray(body.messages) ? (body.messages as Record<string, unknown>[]) : []
        if (!msgs.length || msgs.length > 500) return bad('Send 1–500 messages.')
        const source = body.source === 'notification' ? 'notification' : 'share'
        const r = await ingest(
          { title: String(body.chat ?? 'Shared'), is_group: Boolean(body.is_group), phone: String(body.phone ?? ''), source, intent_business: source === 'share' },
          msgs.map((m) => ({
            sent_at: m.at && !Number.isNaN(Date.parse(String(m.at))) ? new Date(String(m.at)).toISOString() : new Date().toISOString(),
            sender_name: String(m.sender ?? ''),
            sender_phone: String(m.sender_phone ?? ''),
            body: String(m.text ?? ''),
            kind: 'text',
            external_id: m.id ? `n:${String(m.id).slice(0, 120)}` : undefined,
          })),
          by
        )
        return NextResponse.json({ ok: true, ...r })
      }

      case 'rule': {
        if (body.remove) {
          await removeRule(String(body.remove))
          return NextResponse.json({ ok: true })
        }
        const kind = body.kind === 'business' ? 'business' : 'personal'
        const match = (['phone', 'name', 'group'].includes(String(body.match)) ? body.match : 'phone') as MatchType
        await addRule(kind as RuleKind, match, String(body.value ?? ''), String(body.note ?? ''), by)
        return NextResponse.json({ ok: true })
      }

      case 'thread': {
        const status = body.status === 'business' ? 'business' : body.status === 'personal' ? 'personal' : body.status === 'unknown' ? 'unknown' : null
        if (!status || !body.id) return bad('id and status are required')
        await setThreadStatus(String(body.id), status, by)
        return NextResponse.json({ ok: true })
      }

      case 'claim': {
        const r = await claimBatch(Number(body.limit) || 40, by)
        return NextResponse.json(r)
      }

      case 'finish': {
        if (!body.batch_id) return bad('batch_id is required')
        const items = Array.isArray(body.items) ? (body.items as FinishItem[]) : []
        const r = await finishBatch(String(body.batch_id), items, String(body.summary ?? ''))
        if (r.records) await logActivity({ action: 'update', entity_type: 'capture', entity_id: String(body.batch_id), entity_label: 'WhatsApp capture', summary: `Claude filed ${r.filed} WhatsApp messages into ${r.records} records` })
        return NextResponse.json({ ok: true, ...r })
      }

      default:
        return bad('Unknown action')
    }
  } catch (e) {
    return bad((e as Error).message, 500)
  }
}
