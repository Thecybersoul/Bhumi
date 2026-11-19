import { createServiceClient } from './supabase'
import { DOCUMENTS_BUCKET, ensureBucket } from './documents'

/* ═══════════════════════════════════════════════════════════
   Meta's WhatsApp Business Platform (Cloud API, coexistence with the
   WhatsApp Business app). Migration 026.

   Setup, once, by the firm (see the Inbox page): a Meta app with the
   WhatsApp product, an Embedded Signup configuration, and these env vars
   on Vercel: META_APP_ID, META_APP_SECRET, WA_CONFIG_ID, WA_VERIFY_TOKEN
   (and GRAPH_VERSION to pin a Graph API version).

   This module only RECEIVES. It never sends a WhatsApp message, so Meta
   never bills (zero-cost plan, W3); replies go from the phone.
   ═══════════════════════════════════════════════════════════ */

export const GRAPH = () => `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v24.0'}`

export const waConfigured = () => !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.WA_CONFIG_ID)

export interface WaAccount {
  id: string
  phone_number_id: string
  waba_id: string
  display_phone: string
  verified_name: string
  token: string
  status: string
  history_sync: string
  history_progress: number
  last_inbound_at: string | null
  last_error: string
  connected_by: string | null
  connected_at: string
}

const db = () => createServiceClient()

async function graph<T = Record<string, unknown>>(path: string, token: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${GRAPH()}${path}`, {
    method: init?.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(json.error?.message ?? `Meta answered ${res.status}`)
  return json
}

export async function listAccounts(): Promise<Omit<WaAccount, 'token'>[]> {
  const { data } = await db().from('wa_accounts').select('id,phone_number_id,waba_id,display_phone,verified_name,status,history_sync,history_progress,last_inbound_at,last_error,connected_by,connected_at').order('connected_at')
  return (data ?? []) as Omit<WaAccount, 'token'>[]
}

export async function accountByPhoneId(phoneNumberId: string): Promise<WaAccount | null> {
  const { data } = await db().from('wa_accounts').select('*').eq('phone_number_id', phoneNumberId).eq('status', 'connected').maybeSingle()
  return (data as WaAccount) ?? null
}

/** Finish Embedded Signup: code → business token, subscribe the app to the number's WABA, ask for history. */
export async function connectAccount(code: string, wabaId: string, phoneNumberId: string, by: string) {
  const q = new URLSearchParams({ client_id: process.env.META_APP_ID!, client_secret: process.env.META_APP_SECRET!, code })
  const res = await fetch(`${GRAPH()}/oauth/access_token?${q}`, { cache: 'no-store' })
  const tok = (await res.json().catch(() => ({}))) as { access_token?: string; error?: { message?: string } }
  if (!tok.access_token) throw new Error(tok.error?.message ?? 'Meta did not return a token')
  const token = tok.access_token

  // Deliver this number's messages to our webhook.
  await graph(`/${wabaId}/subscribed_apps`, token, { method: 'POST' })
  const info = await graph<{ display_phone_number?: string; verified_name?: string }>(`/${phoneNumberId}?fields=display_phone_number,verified_name`, token).catch(() => ({}) as { display_phone_number?: string; verified_name?: string })

  const { error } = await db()
    .from('wa_accounts')
    .upsert(
      { phone_number_id: phoneNumberId, waba_id: wabaId, token, status: 'connected', display_phone: info.display_phone_number ?? '', verified_name: info.verified_name ?? '', connected_by: by, last_error: '', updated_at: new Date().toISOString() },
      { onConflict: 'phone_number_id' }
    )
  if (error) throw new Error(error.message)

  // Meta allows each sync once, within 24 hours of linking, in this order: the phone's saved
  // contacts (names for the chats and the Personal list), then past chats (up to 180 days).
  const errors: string[] = []
  try {
    await graph(`/${phoneNumberId}/smb_app_data`, token, { method: 'POST', body: { messaging_product: 'whatsapp', sync_type: 'smb_app_state_sync' } })
  } catch (e) {
    errors.push(`Contacts: ${(e as Error).message}`)
  }
  let history = 'requested'
  try {
    await graph(`/${phoneNumberId}/smb_app_data`, token, { method: 'POST', body: { messaging_product: 'whatsapp', sync_type: 'history' } })
  } catch (e) {
    history = 'failed'
    errors.push(`History: ${(e as Error).message}`)
  }
  if (errors.length) await db().from('wa_accounts').update({ last_error: errors.join(' · ') }).eq('phone_number_id', phoneNumberId)
  await db().from('wa_accounts').update({ history_sync: history }).eq('phone_number_id', phoneNumberId)
  return { display_phone: info.display_phone_number ?? '', history }
}

export async function disconnectAccount(id: string) {
  await db().from('wa_accounts').update({ status: 'disconnected', token: '', updated_at: new Date().toISOString() }).eq('id', id)
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/3gpp': '3gp',
  'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'aac', 'application/pdf': 'pdf',
}
const MAX_BYTES: Record<string, number> = { image: 5e6, audio: 16e6, video: 16e6, document: 50e6 }

/** Download one WhatsApp media item into the private documents bucket and file it as a General
    document, so Claude can open it with read_document and attach it to the right record. */
export async function storeMedia(account: WaAccount, mediaId: string, kind: string, chatTitle: string, caption: string): Promise<string | null> {
  const meta = await graph<{ url?: string; mime_type?: string; file_size?: number }>(`/${mediaId}`, account.token)
  if (!meta.url) return null
  const limit = MAX_BYTES[kind] ?? 16e6
  if ((meta.file_size ?? 0) > limit) return null
  const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${account.token}` }, cache: 'no-store' })
  if (!res.ok) return null
  const bytes = Buffer.from(await res.arrayBuffer())
  if (bytes.length > limit) return null
  const mime = (meta.mime_type ?? 'application/octet-stream').split(';')[0].trim()
  const ext = EXT[mime] ?? (kind === 'document' ? 'bin' : kind)
  const month = new Date().toISOString().slice(0, 7)
  const path = `whatsapp/${month}/${mediaId}.${ext}`
  await ensureBucket()
  const sb = db()
  const up = await sb.storage.from(DOCUMENTS_BUCKET).upload(path, bytes, { contentType: mime, upsert: true })
  if (up.error) throw new Error(up.error.message)
  const name = (caption && kind === 'document' ? caption : `WhatsApp ${kind} from ${chatTitle}`).slice(0, 160)
  const { data, error } = await sb
    .from('documents')
    .insert({ entity_type: 'general', entity_id: null, entity_label: `WhatsApp · ${chatTitle}`.slice(0, 200), name: /\.\w{2,4}$/.test(name) ? name : `${name}.${ext}`, category: 'WhatsApp', mime, bytes: bytes.length, storage: 'supabase', path, created_by: 'WhatsApp', updated_by: 'WhatsApp' })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id as string
}
