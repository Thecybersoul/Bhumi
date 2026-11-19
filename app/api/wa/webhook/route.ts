import { createHmac, timingSafeEqual } from 'node:crypto'
import { after, NextRequest, NextResponse } from 'next/server'
import { captureReady, ingest, type IncomingMessage, type Kind } from '@/lib/capture'
import { accountByPhoneId, storeMedia } from '@/lib/wa'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* Meta's WhatsApp webhook: Cloud API with coexistence, so Sanjog keeps
   using the WhatsApp Business app and every one-to-one chat on the number
   reaches the ERP. Public by necessity; every POST must carry Meta's
   X-Hub-Signature-256 over the raw body, signed with META_APP_SECRET.

   Fields handled: messages (incoming), smb_message_echoes (what he sends
   from the phone), history (past chats after linking). Everything goes
   through lib/capture.ts ingest(), so the Personal list is applied before
   anything is stored and unknown numbers are held. Photos, documents and
   voice notes of business chats are downloaded into Documents.

   Nothing here SENDS a WhatsApp message, so Meta never bills. */

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
const MEDIA = ['image', 'video', 'audio', 'document', 'sticker']
const digits = (s: unknown) => String(s ?? '').replace(/\D/g, '')

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
  } else if (MEDIA.includes(t)) {
    kind = t === 'sticker' ? 'other' : (t as Kind)
    body = String(part.caption ?? part.filename ?? '')
    media_ref = part.id ? `meta:${part.id}` : ''
  } else if (t === 'location') {
    kind = 'location'
    body = [part.name, part.address, `https://maps.google.com/?q=${part.latitude},${part.longitude}`].filter(Boolean).join(' · ')
  } else if (t === 'contacts') {
    kind = 'contact'
    body = JSON.stringify(m.contacts ?? []).slice(0, 2000)
  } else if (t === 'reaction') {
    kind = 'other'
    body = `Reacted ${String(part.emoji ?? '')}`
  } else {
    body = `[${t}]`
  }
  if (m.context && typeof m.context === 'object') body = `${body}${(m.context as Record<string, unknown>).forwarded ? ' [forwarded]' : ''}`
  return { external_id: String(m.id ?? ''), from_me: fromMe, sender_name: fromMe ? '' : name, sender_phone: fromMe ? '' : String(m.from ?? ''), sent_at: at, kind, body, media_ref }
}

/** The name saved for a number in the WhatsApp Business app (smb_app_state_sync, migration 029). */
async function savedName(phone: string): Promise<string> {
  const { data } = await createServiceClient().from('wa_contacts').select('name').eq('phone_norm', digits(phone)).maybeSingle()
  return String(data?.name ?? '')
}

/** One chat's messages in, then its business media fetched. */
async function take(phoneNumberId: string, contactPhone: string, contactName: string, msgs: { m: Msg; fromMe: boolean }[]) {
  if (!msgs.length) return
  if (!contactName) contactName = await savedName(contactPhone).catch(() => '')
  const incoming = msgs.map(({ m, fromMe }) => toIncoming(m, fromMe, contactName))
  const r = await ingest({ title: contactName || `+${contactPhone}`, phone: contactPhone, source: 'webhook' }, incoming, 'WhatsApp')
  // Media is downloaded only for business chats: a held chat's photos are not fetched.
  if (r.status !== 'business') return
  const media = incoming.filter((m) => m.media_ref?.startsWith('meta:'))
  if (!media.length) return
  const account = await accountByPhoneId(phoneNumberId)
  if (!account) return
  after(async () => {
    const sb = createServiceClient()
    for (const m of media) {
      try {
        const docId = await storeMedia(account, m.media_ref!.slice(5), m.kind ?? 'document', contactName || `+${contactPhone}`, m.body ?? '')
        if (docId) await sb.from('wa_messages').update({ media_ref: `doc:${docId}` }).eq('external_id', m.external_id!)
      } catch (e) {
        console.error('wa media', (e as Error).message)
      }
    }
  })
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!signed(raw, req.headers.get('x-hub-signature-256'))) return new NextResponse('Bad signature', { status: 401 })
  if (!(await captureReady())) return new NextResponse('Not ready', { status: 503 }) // Meta retries

  const payload = JSON.parse(raw || '{}') as { entry?: { id?: string; changes?: { field?: string; value?: Record<string, unknown> }[] }[] }
  const sb = createServiceClient()
  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const v = change.value ?? {}

        // The business disconnected the API in the WhatsApp Business app, or the number moved
        // phones: the token is dead, so stop using this account until it is connected again.
        if ((change.field === 'account_update' && v.event === 'PARTNER_REMOVED') || change.field === 'account_offboarded') {
          await sb.from('wa_accounts').update({ status: 'disconnected', token: '', last_error: `Disconnected in WhatsApp (${String(v.event ?? change.field)})`, updated_at: new Date().toISOString() }).eq('waba_id', String(entry.id ?? ''))
          continue
        }

        // The phone's saved contacts: once after linking, then every change.
        if (change.field === 'smb_app_state_sync') {
          for (const s of (v.state_sync as { type?: string; action?: string; contact?: { full_name?: string; first_name?: string; phone_number?: string } }[]) ?? []) {
            const phone = digits(s.contact?.phone_number)
            if (s.type !== 'contact' || !phone) continue
            if (s.action === 'remove') {
              await sb.from('wa_contacts').delete().eq('phone_norm', phone)
              continue
            }
            const name = String(s.contact?.full_name || s.contact?.first_name || '').trim().slice(0, 120)
            if (!name) continue
            await sb.from('wa_contacts').upsert({ phone_norm: phone, name, updated_at: new Date().toISOString() }, { onConflict: 'phone_norm' })
            // A chat that so far showed only the number gets the saved name.
            await sb.from('wa_threads').update({ title: name }).eq('phone_norm', phone).like('title', '+%')
          }
          continue
        }

        const meta = (v.metadata ?? {}) as { phone_number_id?: string; display_phone_number?: string }
        const pnid = String(meta.phone_number_id ?? '')
        const business = digits(meta.display_phone_number)
        const names = new Map(((v.contacts as { wa_id?: string; profile?: { name?: string } }[]) ?? []).map((c) => [String(c.wa_id), String(c.profile?.name ?? '')]))

        // Customer → business.
        const byChat = new Map<string, { m: Msg; fromMe: boolean }[]>()
        for (const m of (v.messages as Msg[]) ?? []) byChat.set(String(m.from), [...(byChat.get(String(m.from)) ?? []), { m, fromMe: false }])
        // Business → customer, sent from the phone app.
        for (const m of (v.message_echoes as Msg[]) ?? []) byChat.set(String(m.to), [...(byChat.get(String(m.to)) ?? []), { m, fromMe: true }])
        for (const [phone, list] of byChat) await take(pnid, phone, names.get(phone) ?? '', list)
        if (byChat.size && pnid) await sb.from('wa_accounts').update({ last_inbound_at: new Date().toISOString() }).eq('phone_number_id', pnid)

        // Past chats, sent in chunks after linking.
        for (const h of (v.history as { metadata?: { progress?: number; phase?: number }; threads?: { id?: string; messages?: Msg[] }[]; errors?: { code?: number; title?: string; message?: string }[] }[]) ?? []) {
          // 2593109: history sharing was turned off in the WhatsApp Business app.
          const err = h.errors?.[0]
          if (err && pnid) {
            await sb.from('wa_accounts').update({ history_sync: err.code === 2593109 ? 'declined' : 'failed', last_error: err.code === 2593109 ? 'Past chats were not shared (turned off in the WhatsApp Business app). New chats still arrive.' : `History: ${err.message ?? err.title ?? err.code}` }).eq('phone_number_id', pnid)
            continue
          }
          for (const t of h.threads ?? []) {
            const phone = String(t.id ?? '')
            const list = (t.messages ?? []).map((m) => ({ m, fromMe: !!business && digits(m.from) === business }))
            await take(pnid, phone, '', list)
          }
          if (pnid && typeof h.metadata?.progress === 'number') {
            await sb.from('wa_accounts').update({ history_progress: h.metadata.progress, history_sync: h.metadata.progress >= 100 ? 'done' : 'in_progress' }).eq('phone_number_id', pnid)
          }
        }
      }
    }
  } catch (e) {
    console.error('wa webhook', (e as Error).message)
    return new NextResponse('Retry', { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
