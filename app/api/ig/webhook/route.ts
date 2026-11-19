import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { captureReady, ingest } from '@/lib/capture'

export const dynamic = 'force-dynamic'

/* Instagram webhooks: direct messages and comments on the firm's posts
   reach the WhatsApp Inbox's queue as business chats ("Instagram · …"), so
   Claude files enquiries the same way. Signed with IG_APP_SECRET. */

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const expected = process.env.IG_VERIFY_TOKEN || process.env.WA_VERIFY_TOKEN
  if (expected && p.get('hub.mode') === 'subscribe' && p.get('hub.verify_token') === expected) return new NextResponse(p.get('hub.challenge') ?? '', { status: 200 })
  return new NextResponse('Forbidden', { status: 403 })
}

function signed(raw: string, header: string | null): boolean {
  const secret = process.env.IG_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const want = Buffer.from(createHmac('sha256', secret).update(raw).digest('hex'))
  const got = Buffer.from(header.slice(7))
  return want.length === got.length && timingSafeEqual(want, got)
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!signed(raw, req.headers.get('x-hub-signature-256'))) return new NextResponse('Bad signature', { status: 401 })
  if (!(await captureReady())) return new NextResponse('Not ready', { status: 503 })
  type Entry = { id?: string; messaging?: { sender?: { id?: string }; recipient?: { id?: string }; timestamp?: number; message?: { mid?: string; text?: string; is_echo?: boolean; attachments?: { type?: string; payload?: { url?: string } }[] } }[]; changes?: { field?: string; value?: Record<string, unknown> }[] }
  const payload = JSON.parse(raw || '{}') as { entry?: Entry[] }
  try {
    for (const e of payload.entry ?? []) {
      for (const m of e.messaging ?? []) {
        if (!m.message) continue
        const echo = !!m.message.is_echo
        const other = String(echo ? m.recipient?.id : m.sender?.id)
        const att = (m.message.attachments ?? []).map((a) => `[${a.type}] ${a.payload?.url ?? ''}`).join(' ')
        await ingest(
          { title: `Instagram DM · ${other}`, source: 'webhook', intent_business: true },
          [{ external_id: `ig:${m.message.mid}`, from_me: echo, sender_name: echo ? '' : `Instagram ${other}`, sent_at: new Date(m.timestamp ?? Date.now()).toISOString(), kind: 'text', body: [m.message.text, att].filter(Boolean).join(' ') }],
          'Instagram'
        )
      }
      for (const c of e.changes ?? []) {
        if (c.field !== 'comments') continue
        const v = c.value as { id?: string; text?: string; from?: { username?: string; id?: string }; media?: { id?: string } }
        await ingest(
          { title: `Instagram comments`, source: 'webhook', intent_business: true },
          [{ external_id: `igc:${v.id}`, sender_name: `@${v.from?.username ?? v.from?.id ?? 'someone'}`, sent_at: new Date().toISOString(), kind: 'text', body: `${v.text ?? ''} (on post ${v.media?.id ?? ''})` }],
          'Instagram'
        )
      }
    }
  } catch (err) {
    console.error('ig webhook', (err as Error).message)
    return new NextResponse('Retry', { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
