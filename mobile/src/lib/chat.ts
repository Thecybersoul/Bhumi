/* Shapes and helpers for team messages (/api/messages), shared by the
   conversation list and the thread. */

export interface ChatAttachment {
  id: string
  name: string
  mime: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  author_id: string | null
  author_name: string
  body: string
  attachments: ChatAttachment[]
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  created_at: string
  deleted_at: string | null
  /** Set on messages still being sent from this phone. */
  pending?: boolean
  failed?: boolean
}

export interface ConversationSummary {
  id: string | null
  ref: string
  kind: 'team' | 'direct'
  title: string
  with: { id: string; name: string } | null
  last: { body: string; author_name: string; created_at: string; attachments: ChatAttachment[] } | null
  unread: number
}

export function when(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  if (days === 0) return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const days = Math.floor((new Date(new Date().toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function lastLine(c: ConversationSummary, meName?: string): string {
  if (!c.last) return c.kind === 'team' ? 'Everyone on the team' : 'No messages yet'
  const who = c.last.author_name === meName ? 'You' : c.kind === 'team' ? c.last.author_name.split(' ')[0] : ''
  const what = c.last.body || (c.last.attachments?.length ? (c.last.attachments.every((a) => a.mime?.startsWith('image/')) ? '📷 Photo' : `📎 ${c.last.attachments[0].name}`) : '')
  return who ? `${who}: ${what}` : what
}

/** The app route for a record a message links to. */
export function recordPath(type: string | null, id: string | null): { pathname: string; params?: Record<string, string> } | null {
  if (!type || !id) return null
  const map: Record<string, string> = { property: '/property/[id]', transaction: '/transaction/[id]', lead: '/lead/[id]', contact: '/contact/[id]', meeting: '/meeting/[id]' }
  if (map[type]) return { pathname: map[type], params: { id } }
  if (type === 'task' || type === 'note') return { pathname: '/notes-tasks' }
  return null
}
