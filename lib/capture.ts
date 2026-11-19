import { createHash } from 'node:crypto'
import { createServiceClient, hasSupabase } from './supabase'
import { normPhone } from './contacts'
import { parseWhatsApp } from './whatsapp/parse'

/* ═══════════════════════════════════════════════════════════
   WhatsApp capture, phase 0 (migration 025,
   docs/specs/zero-cost-operating-plan.md).

   Every way a message gets in (an uploaded chat export, a share from the
   app, Meta's webhook) goes through ingest(), which checks the Personal
   list FIRST: a personal chat or sender is dropped before anything is
   stored. Business threads queue for Claude; unknown threads are held,
   never handed to Claude, and deleted after HOLD_DAYS.

   Claude (a Claude Pro scheduled task, or a person's Claude app, through
   the connector) takes a batch with claimBatch(), files what it finds
   with the ERP's normal tools, then reports with finishBatch().
   ═══════════════════════════════════════════════════════════ */

export type Source = 'export' | 'share' | 'notification' | 'webhook'
export type Kind = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'other'
export type ThreadStatus = 'business' | 'unknown'
export type RuleKind = 'personal' | 'business'
export type MatchType = 'phone' | 'name' | 'group'

export interface IncomingMessage {
  external_id?: string
  from_me?: boolean
  sender_name?: string
  sender_phone?: string
  sent_at: string
  kind?: Kind
  body?: string
  media_ref?: string
}

export interface IncomingThread {
  title: string
  is_group?: boolean
  phone?: string
  source: Source
  /** The person chose to send this chat (export, share): it is business unless the Personal list says otherwise. */
  intent_business?: boolean
}

export interface Rule {
  id: string
  kind: RuleKind
  match_type: MatchType
  value: string
  value_norm: string
  note: string
  created_at: string
}

export const HOLD_DAYS = 7
/** Claude Code caps a tool result near 25,000 tokens; stay well under. */
const BATCH_CHAR_BUDGET = 48_000
const BODY_CAP = 1_500
const LEASE_MIN = 30
const MAX_ATTEMPTS = 2

const db = () => createServiceClient()
const normName = (s?: string | null) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
export const normRule = (match: MatchType, value: string) => (match === 'phone' ? normPhone(value) : normName(value))

let ready = false
export async function captureReady(): Promise<boolean> {
  if (ready) return true
  if (!hasSupabase()) return false
  const { error } = await db().from('wa_messages').select('id').limit(1)
  ready = !error
  return ready
}
export const NOT_READY = 'WhatsApp capture needs database migration 025. Open Setup in the admin sidebar and apply pending updates.'

/* ─── The Personal list ───────────────────────────────────── */

export async function listRules(): Promise<Rule[]> {
  const { data } = await db().from('capture_rules').select('*').order('created_at', { ascending: false })
  return (data ?? []) as Rule[]
}

export async function addRule(kind: RuleKind, match: MatchType, value: string, note: string, by: string) {
  const value_norm = normRule(match, value)
  if (!value_norm || (match === 'phone' && value_norm.length < 10)) throw new Error(match === 'phone' ? 'Enter a full phone number.' : 'Enter a name.')
  const { error } = await db()
    .from('capture_rules')
    .upsert({ kind, match_type: match, value: value.trim().slice(0, 120), value_norm, note: note.slice(0, 200), created_by: by }, { onConflict: 'match_type,value_norm' })
  if (error) throw new Error(error.message)
  // A chat newly marked personal leaves no trace.
  if (kind === 'personal') await purgeMatching(match, value_norm)
}

export async function removeRule(id: string) {
  await db().from('capture_rules').delete().eq('id', id)
}

function ruleFor(rules: Rule[], match: MatchType, norm: string): Rule | undefined {
  return norm ? rules.find((r) => r.match_type === match && r.value_norm === norm) : undefined
}

/** Delete every stored message and thread a new Personal rule covers. */
async function purgeMatching(match: MatchType, norm: string) {
  const sb = db()
  if (match === 'phone') {
    await sb.from('wa_threads').delete().eq('phone_norm', norm)
    const { data } = await sb.from('wa_messages').select('id,sender_phone').neq('sender_phone', '')
    const ids = (data ?? []).filter((m) => normPhone(m.sender_phone) === norm).map((m) => m.id)
    for (let i = 0; i < ids.length; i += 200) await sb.from('wa_messages').delete().in('id', ids.slice(i, i + 200))
    return
  }
  if (match === 'group' || match === 'name') {
    const { data: threads } = await sb.from('wa_threads').select('id,title')
    const hit = (threads ?? []).filter((t) => normName(t.title) === norm).map((t) => t.id)
    if (hit.length) await sb.from('wa_threads').delete().in('id', hit)
  }
  if (match === 'name') {
    const { data } = await sb.from('wa_messages').select('id,sender_name')
    const ids = (data ?? []).filter((m) => normName(m.sender_name) === norm).map((m) => m.id)
    for (let i = 0; i < ids.length; i += 200) await sb.from('wa_messages').delete().in('id', ids.slice(i, i + 200))
  }
}

/* ─── Getting messages in ─────────────────────────────────── */

export interface IngestResult {
  stored: number
  duplicates: number
  dropped_personal: number
  thread_id: string | null
  status: ThreadStatus | 'personal'
}

function threadKey(t: IncomingThread): string {
  const phone = normPhone(t.phone)
  if (!t.is_group && phone.length >= 10) return `wa:${phone}`
  return `${t.is_group ? 'group' : 'chat'}:${normName(t.title)}`
}

/** A message the ERP's own parser recognises, summarised for Claude. */
function hintFor(body: string) {
  if (body.length < 40) return null
  try {
    const p = parseWhatsApp(body)
    if (p.empty || !p.drafts.length) return null
    return {
      drafts: p.drafts.slice(0, 3).map((d) => ({ kind: d.kind, title: d.title, found: d.found.slice(0, 8) })),
      contact: p.contact ? { name: p.contact.name, phone: p.contact.phone, role: p.contact.role } : null,
    }
  } catch {
    return null
  }
}

const idFor = (key: string, m: IncomingMessage) =>
  m.external_id || `h:${createHash('sha1').update(`${key}|${m.sent_at}|${m.sender_name ?? ''}|${m.sender_phone ?? ''}|${m.body ?? ''}|${m.media_ref ?? ''}`).digest('hex')}`

/** Store messages for one chat, Personal list first. */
export async function ingest(thread: IncomingThread, messages: IncomingMessage[], by: string): Promise<IngestResult> {
  const sb = db()
  const rules = await listRules()
  const phone = normPhone(thread.phone)
  const titleNorm = normName(thread.title)
  const chatRule = ruleFor(rules, 'phone', phone) ?? ruleFor(rules, thread.is_group ? 'group' : 'name', titleNorm) ?? ruleFor(rules, 'group', titleNorm)
  if (chatRule?.kind === 'personal') return { stored: 0, duplicates: 0, dropped_personal: messages.length, thread_id: null, status: 'personal' }

  // Senders on the Personal list are dropped even inside a business group.
  let dropped = 0
  const kept = messages.filter((m) => {
    if (m.from_me) return true
    const r = ruleFor(rules, 'phone', normPhone(m.sender_phone)) ?? ruleFor(rules, 'name', normName(m.sender_name))
    if (r?.kind === 'personal') {
      dropped++
      return false
    }
    return true
  })

  let status: ThreadStatus = chatRule?.kind === 'business' || thread.intent_business ? 'business' : 'unknown'
  // A number already in the ERP's contacts is someone we do business with.
  if (status === 'unknown' && phone.length >= 10) {
    const { data } = await sb.from('contacts').select('id').eq('phone_norm', phone).limit(1)
    if (data?.length) status = 'business'
  }

  const key = threadKey(thread)
  const last = kept.reduce((a, m) => (m.sent_at > a ? m.sent_at : a), '')
  const { data: existing } = await sb.from('wa_threads').select('id,status,last_message_at,title').eq('key', key).maybeSingle()
  let threadId = existing?.id as string | undefined
  if (!threadId) {
    const { data, error } = await sb
      .from('wa_threads')
      .insert({ key, title: thread.title.slice(0, 160), is_group: !!thread.is_group, phone_norm: phone, status, source: thread.source, last_message_at: last || null, created_by: by })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    threadId = data.id as string
  } else {
    if (existing?.status === 'business') status = 'business'
    await sb
      .from('wa_threads')
      .update({ ...(String(existing?.title ?? '').startsWith('+') && !thread.title.startsWith('+') ? { title: thread.title.slice(0, 160) } : {}), status, last_message_at: last && (!existing?.last_message_at || last > existing.last_message_at) ? last : existing?.last_message_at, updated_at: new Date().toISOString() })
      .eq('id', threadId)
  }

  const rows = kept.map((m) => {
    const body = String(m.body ?? '').slice(0, 20_000)
    return {
      thread_id: threadId,
      external_id: idFor(key, m),
      source: thread.source,
      from_me: !!m.from_me,
      sender_name: String(m.sender_name ?? '').slice(0, 120),
      sender_phone: String(m.sender_phone ?? '').slice(0, 40),
      sent_at: m.sent_at,
      kind: m.kind ?? 'text',
      body,
      media_ref: String(m.media_ref ?? '').slice(0, 300),
      hint: m.kind === 'text' || !m.kind ? hintFor(body) : null,
    }
  })

  let stored = 0
  for (let i = 0; i < rows.length; i += 200) {
    const { data, error } = await sb.from('wa_messages').upsert(rows.slice(i, i + 200), { onConflict: 'external_id', ignoreDuplicates: true }).select('id')
    if (error) throw new Error(error.message)
    stored += data?.length ?? 0
  }
  return { stored, duplicates: rows.length - stored, dropped_personal: dropped, thread_id: threadId, status }
}

/* ─── Chat exports ────────────────────────────────────────── */

// Android: "19/11/2026, 10:15 am - Ravi: text"   iOS: "[19/11/26, 10:15:32 AM] Ravi: text"
const LINE_ANDROID = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s?m\.?)?\s+[-–]\s+([^:]{1,80}?):\s?([\s\S]*)$/i
const LINE_IOS = /^\[(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s?m\.?)?\]\s+([^:]{1,80}?):\s?([\s\S]*)$/i

function toIso(d: string, mo: string, y: string, h: string, mi: string, sec?: string, ampm?: string): string | null {
  let year = Number(y)
  if (year < 100) year += 2000
  let hour = Number(h)
  const ap = (ampm ?? '').toLowerCase().replace(/[.\s]/g, '')
  if (ap === 'pm' && hour < 12) hour += 12
  if (ap === 'am' && hour === 12) hour = 0
  const day = Number(d)
  const month = Number(mo)
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23) return null
  // Exports are in the phone's local time: Bhumi's phones are in IST.
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${mi}:${(sec ?? '00').padStart(2, '0')}+05:30`
  return Number.isNaN(Date.parse(iso)) ? null : new Date(iso).toISOString()
}

function mediaKind(body: string): { kind: Kind; media_ref: string } | null {
  const b = body.trim()
  const attached = b.match(/<attached:\s*([^>]+)>/i) || b.match(/^(\S+\.(jpe?g|png|webp|heic|mp4|mov|3gp|opus|ogg|m4a|aac|mp3|pdf|docx?|xlsx?|vcf))\s*\(file attached\)/i)
  const name = attached ? attached[1].trim() : ''
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (name) {
    const kind: Kind = /jpe?g|png|webp|heic/.test(ext) ? 'image' : /mp4|mov|3gp/.test(ext) ? 'video' : /opus|ogg|m4a|aac|mp3/.test(ext) ? 'audio' : ext === 'vcf' ? 'contact' : 'document'
    return { kind, media_ref: name }
  }
  if (/^<media omitted>$/i.test(b)) return { kind: 'other', media_ref: 'media omitted' }
  const omitted = b.match(/^(image|video|audio|sticker|gif|document|contact card) omitted$/i)
  if (omitted) {
    const w = omitted[1].toLowerCase()
    return { kind: w === 'image' || w === 'video' || w === 'audio' || w === 'document' ? (w as Kind) : w === 'contact card' ? 'contact' : 'other', media_ref: `${w} omitted` }
  }
  if (/^location: https?:\/\/maps\.google/i.test(b)) return { kind: 'location', media_ref: '' }
  return null
}

const SYSTEM_LINE = /(messages and calls are end-to-end encrypted|created group|added you|changed the subject|changed this group|left$|joined using|security code changed|this message was deleted|you deleted this message|missed (voice|video) call|disappearing messages)/i

export interface ParsedExport {
  messages: IncomingMessage[]
  senders: string[]
  is_group: boolean
  lines: number
}

/** WhatsApp's "Export chat" text, Android or iPhone format. */
export function parseExport(text: string, me?: string): ParsedExport {
  const clean = text.replace(/[‎‏‪-‮﻿]/g, '').replace(/\r\n?/g, '\n')
  const out: IncomingMessage[] = []
  const meNorm = normName(me)
  let lines = 0
  for (const line of clean.split('\n')) {
    lines++
    const m = line.match(LINE_IOS) || line.match(LINE_ANDROID)
    if (m) {
      const [, d, mo, y, h, mi, sec, ap, sender, body] = m
      const sent_at = toIso(d, mo, y, h, mi, sec, ap)
      if (!sent_at) continue
      if (SYSTEM_LINE.test(body)) continue
      const name = sender.trim()
      const isPhone = /^\+?[\d\s()-]{8,}$/.test(name)
      const media = mediaKind(body)
      out.push({
        sent_at,
        sender_name: isPhone ? '' : name,
        sender_phone: isPhone ? name : '',
        from_me: !!meNorm && normName(name) === meNorm,
        kind: media?.kind ?? 'text',
        media_ref: media?.media_ref ?? '',
        body: media && media.kind !== 'location' ? body.replace(/<attached:[^>]+>|\(file attached\)/gi, '').trim() : body,
      })
    } else if (out.length && line.trim()) {
      // A message that runs over several lines.
      out[out.length - 1].body = `${out[out.length - 1].body ?? ''}\n${line}`
    }
  }
  const senders = [...new Set(out.map((m) => m.sender_name || m.sender_phone || '').filter(Boolean))]
  return { messages: out, senders, is_group: senders.length > 2, lines }
}

/** "WhatsApp Chat with Ravi Kumar.txt" / "WhatsApp Chat - Plots Group.zip" → the chat's name. */
export function titleFromFilename(name: string): string {
  return name
    .replace(/\.(txt|zip)$/i, '')
    .replace(/^WhatsApp Chat\s*(with|-|–)\s*/i, '')
    .replace(/_chat$/i, '')
    .trim()
}

/* ─── Claude's side: claim a batch, report what was filed ─── */

/** Unknown chats are held, not kept: anything not marked Business within HOLD_DAYS goes. */
export async function purgeExpired() {
  const sb = db()
  const cutoff = new Date(Date.now() - HOLD_DAYS * 86_400_000).toISOString()
  await sb.from('wa_threads').delete().eq('status', 'unknown').lt('created_at', cutoff)
}

export interface BatchMessage {
  id: string
  at: string
  from: string
  kind: Kind
  text: string
  media?: string
  erp_parser_found?: unknown
}
export interface BatchThread {
  thread: string
  is_group: boolean
  phone?: string
  earlier?: { at: string; from: string; text: string; outcome: string }[]
  messages: BatchMessage[]
}

const who = (m: { from_me: boolean; sender_name: string; sender_phone: string }, me: string) => (m.from_me ? me : m.sender_name || m.sender_phone || 'Unknown')

/** Take up to `limit` waiting business messages for one Claude run. */
export async function claimBatch(limit: number, by: string): Promise<{ batch_id: string | null; threads: BatchThread[]; remaining: number }> {
  const sb = db()
  await purgeExpired()
  // A run that died without reporting gives its messages back after the lease.
  const lease = new Date(Date.now() - LEASE_MIN * 60_000).toISOString()
  await sb.from('wa_messages').update({ state: 'queued', batch_id: null, claimed_at: null }).eq('state', 'claimed').lt('claimed_at', lease)

  const { data: biz } = await sb.from('wa_threads').select('id,title,is_group,phone_norm').eq('status', 'business')
  const threads = new Map((biz ?? []).map((t) => [t.id as string, t]))
  if (!threads.size) return { batch_id: null, threads: [], remaining: 0 }

  const { data: queued } = await sb
    .from('wa_messages')
    .select('id,thread_id,from_me,sender_name,sender_phone,sent_at,kind,body,media_ref,hint')
    .eq('state', 'queued')
    .in('thread_id', [...threads.keys()])
    .order('sent_at', { ascending: true })
    .limit(Math.min(80, Math.max(1, limit)))
  const rows = queued ?? []
  if (!rows.length) return { batch_id: null, threads: [], remaining: 0 }

  // Fit the result under the tool-result budget.
  let chars = 0
  const take: typeof rows = []
  for (const r of rows) {
    const size = Math.min(BODY_CAP, String(r.body).length) + 200 + (r.hint ? JSON.stringify(r.hint).length : 0)
    if (take.length && chars + size > BATCH_CHAR_BUDGET) break
    chars += size
    take.push(r)
  }

  const { data: batch, error } = await sb.from('capture_batches').insert({ claimed_by: by, messages: take.length }).select('id').single()
  if (error) throw new Error(error.message)
  const now = new Date().toISOString()
  await sb.from('wa_messages').update({ state: 'claimed', batch_id: batch.id, claimed_at: now }).in('id', take.map((r) => r.id))

  const grouped = new Map<string, typeof take>()
  for (const r of take) grouped.set(r.thread_id, [...(grouped.get(r.thread_id) ?? []), r])
  const out: BatchThread[] = []
  for (const [tid, msgs] of grouped) {
    const t = threads.get(tid)!
    const { data: prior } = await sb
      .from('wa_messages')
      .select('from_me,sender_name,sender_phone,sent_at,body,outcome')
      .eq('thread_id', tid)
      .eq('state', 'filed')
      .lt('sent_at', msgs[0].sent_at)
      .order('sent_at', { ascending: false })
      .limit(4)
    out.push({
      thread: t.title,
      is_group: t.is_group,
      phone: t.phone_norm ? `+${t.phone_norm}` : undefined,
      earlier: (prior ?? []).reverse().map((p) => ({ at: p.sent_at, from: who(p, 'Bhumi'), text: String(p.body).slice(0, 300), outcome: p.outcome })),
      messages: msgs.map((m) => ({
        id: m.id,
        at: m.sent_at,
        from: who(m, 'Bhumi (us)') + (m.sender_phone && m.sender_name ? ` (${m.sender_phone})` : ''),
        kind: m.kind,
        text: String(m.body).slice(0, BODY_CAP),
        media: m.media_ref || undefined,
        erp_parser_found: m.hint ?? undefined,
      })),
    })
  }
  const { count } = await sb.from('wa_messages').select('id', { count: 'exact', head: true }).eq('state', 'queued').in('thread_id', [...threads.keys()])
  return { batch_id: batch.id, threads: out, remaining: count ?? 0 }
}

export interface FinishItem {
  message_ids: string[]
  outcome: 'filed' | 'skipped'
  note?: string
  records?: { type: string; id: string; label?: string }[]
}

/** Claude reports what it did with each message of a batch. */
export async function finishBatch(batchId: string, items: FinishItem[], summary: string) {
  const sb = db()
  const { data: batch } = await sb.from('capture_batches').select('id,done_at').eq('id', batchId).maybeSingle()
  if (!batch) throw new Error('No such batch. Claim a new one with capture_next_batch.')
  const seen = new Set<string>()
  const records: FinishItem['records'] = []
  for (const it of items) {
    const ids = (it.message_ids ?? []).filter((x) => typeof x === 'string')
    if (!ids.length) continue
    ids.forEach((x) => seen.add(x))
    const line = [it.note, (it.records ?? []).map((r) => `${r.type} ${r.label ?? r.id}`).join(', ')].filter(Boolean).join(' · ').slice(0, 500)
    await sb.from('wa_messages').update({ state: it.outcome === 'filed' ? 'filed' : 'skipped', outcome: line, claimed_at: null }).in('id', ids).eq('batch_id', batchId)
    records.push(...(it.records ?? []))
  }
  // Anything the run didn't mention goes back once, then is set aside.
  const { data: left } = await sb.from('wa_messages').select('id,attempts').eq('batch_id', batchId).eq('state', 'claimed')
  for (const m of left ?? []) {
    if (seen.has(m.id)) continue
    const again = (m.attempts ?? 0) + 1 < MAX_ATTEMPTS
    await sb
      .from('wa_messages')
      .update(again ? { state: 'queued', batch_id: null, claimed_at: null, attempts: (m.attempts ?? 0) + 1 } : { state: 'skipped', outcome: 'Not addressed in two runs', claimed_at: null })
      .eq('id', m.id)
  }
  await sb.from('capture_batches').update({ done_at: new Date().toISOString(), summary: summary.slice(0, 2000), records: records.slice(0, 200) }).eq('id', batchId)
  return { filed: items.filter((i) => i.outcome === 'filed').reduce((n, i) => n + i.message_ids.length, 0), records: records.length }
}

/* ─── What the Inbox shows ────────────────────────────────── */

export async function backlog() {
  const sb = db()
  await purgeExpired()
  const [{ data: threads }, { data: msgs }, { data: batches }] = await Promise.all([
    sb.from('wa_threads').select('id,title,is_group,phone_norm,status,source,last_message_at,created_at').order('last_message_at', { ascending: false, nullsFirst: false }).limit(300),
    sb.from('wa_messages').select('thread_id,state,sent_at').limit(20_000),
    sb.from('capture_batches').select('id,claimed_by,claimed_at,done_at,messages,summary,records').order('claimed_at', { ascending: false }).limit(10),
  ])
  const per = new Map<string, Record<string, number>>()
  let oldestQueued: string | null = null
  const statusOf = new Map((threads ?? []).map((t) => [t.id, t.status]))
  for (const m of msgs ?? []) {
    const c = per.get(m.thread_id) ?? { queued: 0, claimed: 0, filed: 0, skipped: 0 }
    c[m.state] = (c[m.state] ?? 0) + 1
    per.set(m.thread_id, c)
    if (m.state === 'queued' && statusOf.get(m.thread_id) === 'business' && (!oldestQueued || m.sent_at < oldestQueued)) oldestQueued = m.sent_at
  }
  const list = (threads ?? []).map((t) => ({ ...t, counts: per.get(t.id) ?? { queued: 0, claimed: 0, filed: 0, skipped: 0 } }))
  const sum = (status: string, state: string) => list.filter((t) => t.status === status).reduce((n, t) => n + (t.counts[state] ?? 0), 0)
  return {
    totals: {
      waiting: sum('business', 'queued'),
      in_progress: sum('business', 'claimed'),
      filed: sum('business', 'filed'),
      held: list.filter((t) => t.status === 'unknown').reduce((n, t) => n + Object.values(t.counts).reduce((a, b) => a + b, 0), 0),
      oldest_waiting: oldestQueued,
    },
    threads: list,
    runs: batches ?? [],
  }
}

export async function setThreadStatus(id: string, status: ThreadStatus | 'personal', by: string) {
  const sb = db()
  const { data: t } = await sb.from('wa_threads').select('id,title,is_group,phone_norm').eq('id', id).maybeSingle()
  if (!t) throw new Error('No such chat')
  if (status === 'personal') {
    // Remember it, so it never comes back, then erase it.
    if (t.phone_norm) await addRule('personal', 'phone', `+${t.phone_norm}`, `From ${t.title}`, by)
    else await addRule('personal', t.is_group ? 'group' : 'name', t.title, '', by)
    await sb.from('wa_threads').delete().eq('id', id)
    return
  }
  await sb.from('wa_threads').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
}

export async function threadMessages(id: string) {
  const { data } = await db()
    .from('wa_messages')
    .select('id,from_me,sender_name,sender_phone,sent_at,kind,body,media_ref,state,outcome')
    .eq('thread_id', id)
    .order('sent_at', { ascending: false })
    .limit(200)
  return (data ?? []).reverse()
}
