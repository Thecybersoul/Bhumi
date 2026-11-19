import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { captureReady, ingest, type IncomingMessage, type Kind } from '@/lib/capture'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* Meta's WhatsApp webhook (Cloud API, and coexistence with the WhatsApp
   Business app). Public by necessity; every POST must carry Meta's
   X-Hub-Signature-256 over the raw body, signed with META_APP_SECRET.

   Receiving is free. Nothing here ever SENDS a WhatsApp message: replies
   go from the phone, so Meta never bills (zero-cost plan, W3).

   Messages go through lib/capture.ts ingest(), so the Personal list is
   applied before anything is stored, and unknown numbers are held. Media
   is recorded by its Meta media id; downloading it is a later phase. */

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const expected = process.env.WA_VERIFY_TOKEN
  if (expected && p.get('hub.mode') === 'subscribe' && p.get('hub.verify_token') === expected) {
    return new NextResponse(p.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

function signed(raw: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const want = Buffer.from(createHmac('sha256', secret).update(raw).digest('hex'))
  const got = Buffer.from(header.slice(7))
  return want.length === got.length && timingSafeEqual(want, got)
}

type Msg = Record<string, unknown> & { from?: string; to?: string; id?: string; timestamp?: string; type?: string }

function toIncoming(m: Msg, fromMe: boolean, name: string): IncomingMessage {
  const t = String(m.type ?? 'text')
  const part = (m[t] ?? {}) as Record<string, unknown>
  const at = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString()
  let kind: Kind = 'other'
  let body = ''
  let media_ref = ''
  if (t === 'text') {
    kind = 'text'
    body = String(part.body ?? '')
  } else if (['image', 'video', 'audio', 'document', 'sticker'].includes(t)) {
    kind = t === 'sticker' ? 'other' : (t as Kind)
    body = String(part.caption ?? part.filename ?? '')
    media_ref = String(part.id ?? '')
  } else if (t === 'location') {
    kind = 'location'
    body = [part.name, part.address, `https://maps.google.com/?q=${part.latitude},${part.longitude}`].filter(Boolean).join(' · ')
  } else if (t === 'contacts') {
    kind = 'contact'
    body = JSON.stringify(m.contacts ?? []).slice(0, 2000)
  } else if (t === 'interactive' || t === 'button') {
    kind = 'text'
    body = JSON.stringify(part).slice(0, 1000)
  } else {
    body = `[${t}]`
  }
  return { external_id: String(m.id ?? ''), from_me: fromMe, sender_name: fromMe ? '' : name, sender_phone: fromMe ? '' : String(m.from ?? ''), sent_at: at, kind, body, media_ref }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!signed(raw, req.headers.get('x-hub-signature-256'))) return new NextResponse('Bad signature', { status: 401 })
  if (!(await captureReady())) return new NextResponse('Not ready', { status: 503 }) // Meta retries

  const payload = JSON.parse(raw || '{}') as { entry?: { changes?: { field?: string; value?: Record<string, unknown> }[] }[] }
  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const v = change.value ?? {}
        const names = new Map(((v.contacts as { wa_id?: string; profile?: { name?: string } }[]) ?? []).map((c) => [String(c.wa_id), String(c.profile?.name ?? '')]))
        // Customer → business.
        for (const m of (v.messages as Msg[]) ?? []) {
          const phone = String(m.from ?? '')
          const name = names.get(phone) ?? ''
          await ingest({ title: name || `+${phone}`, phone, source: 'webhook' }, [toIncoming(m, false, name)], 'WhatsApp')
        }
        // Business → customer, sent from the phone app (coexistence echoes).
        for (const m of ((v.message_echoes as Msg[]) ?? [])) {
          const phone = String(m.to ?? '')
          await ingest({ title: `+${phone}`, phone, source: 'webhook' }, [toIncoming(m, true, '')], 'WhatsApp')
        }
      }
    }
  } catch (e) {
    console.error('wa webhook', (e as Error).message)
    return new NextResponse('Retry', { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
