import { createServiceClient, hasSupabase } from './supabase'
import { listUsers, type AdminUser } from './users'

/* ═══════════════════════════════════════════════════════════
   Team messages (migration 018).

   One team room everyone is in, plus a direct conversation for each
   pair of people, created the first time either of them opens it.
   A conversation is addressed as:
     'team'            the team room
     'user:<id>'       the direct conversation with that person
     <conversation id> either, once it exists
   Access is by membership: everyone active is in the team room; a
   direct conversation belongs to the two people in its key.
   ═══════════════════════════════════════════════════════════ */

export interface Attachment {
  id: string
  name: string
  mime: string
}

export interface Message {
  id: string
  conversation_id: string
  author_id: string | null
  author_name: string
  body: string
  attachments: Attachment[]
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  created_at: string
  edited_at: string | null
  deleted_at: string | null
}

export interface Conversation {
  id: string
  kind: 'team' | 'direct'
  key: string
  title: string | null
  last_message_at: string | null
}

export interface ConversationSummary {
  id: string | null
  ref: string
  kind: 'team' | 'direct'
  title: string
  with: { id: string; name: string } | null
  last: Pick<Message, 'body' | 'author_name' | 'created_at' | 'attachments'> | null
  unread: number
}

export class ChatError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

const dmKey = (a: string, b: string) => `dm:${[a, b].sort().join(':')}`
const MESSAGE_COLS = 'id,conversation_id,author_id,author_name,body,attachments,entity_type,entity_id,entity_label,created_at,edited_at,deleted_at'

/** Is messaging usable: a database, migration 018, and a named account. */
export async function chatReady(): Promise<boolean> {
  if (!hasSupabase()) return false
  const { error } = await createServiceClient().from('conversations').select('id').limit(1)
  return !error
}

function members(conv: Conversation, users: AdminUser[]): AdminUser[] {
  const active = users.filter((u) => u.active)
  if (conv.kind === 'team') return active
  const ids = conv.key.split(':').slice(1)
  return active.filter((u) => ids.includes(u.id))
}

async function teamConversation(): Promise<Conversation> {
  const sb = createServiceClient()
  const { data } = await sb.from('conversations').select('*').eq('key', 'team').maybeSingle()
  if (data) return data as Conversation
  const made = await sb.from('conversations').upsert({ kind: 'team', key: 'team', title: 'Bhumi team' }, { onConflict: 'key' }).select('*').single()
  if (made.error) throw new ChatError(made.error.message, 500)
  return made.data as Conversation
}

/** Resolve an address to a conversation this person may use, creating a
    direct conversation on first use. */
export async function resolveConversation(me: AdminUser, ref: string, create = true): Promise<Conversation> {
  const sb = createServiceClient()
  if (ref === 'team') return teamConversation()
  if (ref.startsWith('user:')) {
    const otherId = ref.slice(5)
    if (otherId === me.id) throw new ChatError('You can’t message yourself.')
    const other = (await listUsers()).find((u) => u.id === otherId && u.active)
    if (!other) throw new ChatError('That person isn’t on the team.', 404)
    const key = dmKey(me.id, otherId)
    const { data } = await sb.from('conversations').select('*').eq('key', key).maybeSingle()
    if (data) return data as Conversation
    if (!create) throw new ChatError('No messages yet.', 404)
    const made = await sb.from('conversations').upsert({ kind: 'direct', key }, { onConflict: 'key' }).select('*').single()
    if (made.error) throw new ChatError(made.error.message, 500)
    return made.data as Conversation
  }
  const { data } = await sb.from('conversations').select('*').eq('id', ref).maybeSingle()
  const conv = data as Conversation | null
  if (!conv) throw new ChatError('Conversation not found.', 404)
  if (conv.kind === 'direct' && !conv.key.split(':').includes(me.id)) throw new ChatError('Conversation not found.', 404)
  return conv
}

async function readAt(convIds: string[], userId: string): Promise<Map<string, string>> {
  if (!convIds.length) return new Map()
  const { data } = await createServiceClient().from('message_reads').select('conversation_id,last_read_at').eq('user_id', userId).in('conversation_id', convIds)
  return new Map((data ?? []).map((r) => [r.conversation_id as string, r.last_read_at as string]))
}

async function unreadIn(convId: string, userId: string, since: string | undefined): Promise<number> {
  let q = createServiceClient().from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', convId).is('deleted_at', null).or(`author_id.is.null,author_id.neq.${userId}`)
  if (since) q = q.gt('created_at', since)
  const { count } = await q
  return count ?? 0
}

/** The team room first, then one entry per teammate, most recent first. */
export async function conversationsFor(me: AdminUser): Promise<{ conversations: ConversationSummary[]; unread: number }> {
  const sb = createServiceClient()
  const users = await listUsers()
  const others = users.filter((u) => u.active && u.id !== me.id)
  const team = await teamConversation()
  const keys = others.map((u) => dmKey(me.id, u.id))
  const { data: dms } = keys.length ? await sb.from('conversations').select('*').in('key', keys) : { data: [] }
  const byKey = new Map(((dms ?? []) as Conversation[]).map((c) => [c.key, c]))
  const existing = [team, ...((dms ?? []) as Conversation[])]
  const reads = await readAt(existing.map((c) => c.id), me.id)

  const lastOf = async (id: string) => {
    const { data } = await sb.from('messages').select('body,author_name,created_at,attachments,deleted_at').eq('conversation_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!data) return null
    return data.deleted_at ? { ...data, body: 'Message deleted', attachments: [] } : data
  }

  const summaries: ConversationSummary[] = []
  const teamLast = await lastOf(team.id)
  summaries.push({
    id: team.id,
    ref: 'team',
    kind: 'team',
    title: team.title || 'Bhumi team',
    with: null,
    last: teamLast as ConversationSummary['last'],
    unread: await unreadIn(team.id, me.id, reads.get(team.id)),
  })
  const direct: ConversationSummary[] = []
  for (const u of others) {
    const conv = byKey.get(dmKey(me.id, u.id))
    direct.push({
      id: conv?.id ?? null,
      ref: conv?.id ?? `user:${u.id}`,
      kind: 'direct',
      title: u.name,
      with: { id: u.id, name: u.name },
      last: conv ? ((await lastOf(conv.id)) as ConversationSummary['last']) : null,
      unread: conv ? await unreadIn(conv.id, me.id, reads.get(conv.id)) : 0,
    })
  }
  direct.sort((a, b) => (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? '') || a.title.localeCompare(b.title))
  summaries.push(...direct)
  return { conversations: summaries, unread: summaries.reduce((n, c) => n + c.unread, 0) }
}

/** A page of messages, oldest first. `after` fetches only newer ones (polling);
    `before` pages back through history. */
export async function messagesIn(conv: Conversation, opts: { after?: string | null; before?: string | null; limit?: number } = {}): Promise<Message[]> {
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200)
  let q = createServiceClient().from('messages').select(MESSAGE_COLS).eq('conversation_id', conv.id)
  if (opts.after) q = q.gt('created_at', opts.after).order('created_at', { ascending: true }).limit(limit)
  else {
    if (opts.before) q = q.lt('created_at', opts.before)
    q = q.order('created_at', { ascending: false }).limit(limit)
  }
  const { data, error } = await q
  if (error) throw new ChatError(error.message, 500)
  const rows = (data ?? []) as Message[]
  const ordered = opts.after ? rows : rows.reverse()
  return ordered.map((m) => (m.deleted_at ? { ...m, body: '', attachments: [] } : m))
}

export async function markRead(conv: Conversation, userId: string, at = new Date().toISOString()) {
  await createServiceClient().from('message_reads').upsert({ conversation_id: conv.id, user_id: userId, last_read_at: at }, { onConflict: 'conversation_id,user_id' })
}

export interface Draft {
  body?: string
  attachments?: Attachment[]
  entity_type?: string | null
  entity_id?: string | null
  entity_label?: string | null
}

export async function sendMessage(me: AdminUser, conv: Conversation, draft: Draft): Promise<Message> {
  const body = String(draft.body ?? '').trim().slice(0, 8000)
  const attachments = (Array.isArray(draft.attachments) ? draft.attachments : [])
    .filter((a) => a && typeof a.id === 'string')
    .slice(0, 10)
    .map((a) => ({ id: a.id, name: String(a.name ?? 'File').slice(0, 200), mime: String(a.mime ?? '') }))
  if (!body && !attachments.length) throw new ChatError('Write a message or attach a file.')
  const sb = createServiceClient()
  const row = {
    conversation_id: conv.id,
    author_id: me.id,
    author_name: me.name,
    body,
    attachments,
    entity_type: draft.entity_type || null,
    entity_id: draft.entity_id ? String(draft.entity_id) : null,
    entity_label: draft.entity_label ? String(draft.entity_label).slice(0, 200) : null,
  }
  const { data, error } = await sb.from('messages').insert(row).select(MESSAGE_COLS).single()
  if (error) throw new ChatError(error.message, 500)
  const msg = data as Message
  await sb.from('conversations').update({ last_message_at: msg.created_at }).eq('id', conv.id)
  await markRead(conv, me.id, msg.created_at)
  return msg
}

/** Delete your own message. It stays in the thread as "Message deleted". */
export async function deleteMessage(me: AdminUser, conv: Conversation, messageId: string) {
  const sb = createServiceClient()
  const { data } = await sb.from('messages').select('author_id').eq('id', messageId).eq('conversation_id', conv.id).maybeSingle()
  if (!data) throw new ChatError('Message not found.', 404)
  if (data.author_id !== me.id) throw new ChatError('You can only delete your own messages.', 403)
  await sb.from('messages').update({ deleted_at: new Date().toISOString(), body: '', attachments: [] }).eq('id', messageId)
}

/** Everyone in the conversation except the sender: who to notify. */
export async function recipients(conv: Conversation, senderId: string): Promise<AdminUser[]> {
  return members(conv, await listUsers()).filter((u) => u.id !== senderId)
}

/** New messages for this person since a time, across their conversations,
    for the Android background check. */
export async function inboxSince(me: AdminUser, since: string): Promise<(Message & { conversation_title: string; ref: string })[]> {
  const sb = createServiceClient()
  const team = await teamConversation()
  const { data: dms } = await sb.from('conversations').select('*').eq('kind', 'direct').like('key', `%${me.id}%`)
  const convs = [team, ...((dms ?? []) as Conversation[])]
  const { data } = await sb
    .from('messages')
    .select(MESSAGE_COLS)
    .in('conversation_id', convs.map((c) => c.id))
    .gt('created_at', since)
    .is('deleted_at', null)
    .or(`author_id.is.null,author_id.neq.${me.id}`)
    .order('created_at', { ascending: true })
    .limit(30)
  const byId = new Map(convs.map((c) => [c.id, c]))
  return ((data ?? []) as Message[]).map((m) => {
    const c = byId.get(m.conversation_id)!
    return { ...m, conversation_title: c.kind === 'team' ? c.title || 'Bhumi team' : m.author_name, ref: c.id }
  })
}

/** One line for a notification or a conversation list. */
export function preview(m: Pick<Message, 'body' | 'attachments' | 'entity_label'>): string {
  if (m.body) return m.body.length > 140 ? `${m.body.slice(0, 137)}…` : m.body
  if (m.attachments?.length) {
    const img = m.attachments.every((a) => a.mime?.startsWith('image/'))
    return m.attachments.length === 1 ? `${img ? '📷 Photo' : '📎'} ${img ? '' : m.attachments[0].name}`.trim() : `${m.attachments.length} ${img ? 'photos' : 'files'}`
  }
  return m.entity_label ? `🔗 ${m.entity_label}` : ''
}
