import { createServiceClient, hasSupabase } from './supabase'

/* ═══════════════════════════════════════════════════════════
   Notifications — the activity trail seen from one person's side.

   A notification is something someone else did that this person
   should know about: a website enquiry, a document request, a deal
   moving stage, a meeting booked, a task added, a file uploaded, the
   Google connection changing. Your own actions never notify you. The
   same feed drives the bell in the app and on the web, and the app's
   background check turns new items into phone notifications.

   Reminders about time (a meeting in 30 minutes, a task due now,
   the morning digest) are scheduled on the phone from
   upcomingSchedule(). They need no server running at that moment.
   ═══════════════════════════════════════════════════════════ */

export interface NotificationItem {
  id: string
  kind: 'lead' | 'document_request' | 'deal' | 'meeting' | 'task' | 'listing' | 'document' | 'google' | 'app'
  title: string
  body: string
  actor: string
  created_at: string
  /** Route inside the app (expo-router path) and on the web admin. */
  app_path: string | null
  web_path: string | null
}

interface Row {
  id: string
  actor_id: string | null
  actor_name: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_label: string | null
  summary: string | null
  created_at: string
}

const paths = (type: string, id: string | null): [string | null, string | null] => {
  if (!id) return [null, null]
  switch (type) {
    case 'property':
      return [`/property/${id}`, `/admin/properties/${id}`]
    case 'transaction':
      return [`/transaction/${id}`, `/admin/deals/${id}`]
    case 'meeting':
      return [`/meeting/${id}`, `/admin/meetings/${id}`]
    case 'task':
    case 'note':
      return ['/notes-tasks', '/admin/notes-tasks']
    // The app path stays the Deals tab: builds installed before the lead
    // page existed can still open it.
    case 'lead':
      return ['/deals', id ? `/admin/deals/leads/${id}` : '/admin/deals?tab=leads']
    case 'contact':
      return ['/deals', id ? `/admin/deals/contacts/${id}` : '/admin/deals?tab=contacts']
    case 'data_room':
      return ['/deals', '/admin/deals?tab=leads']
    default:
      return [null, null]
  }
}

/** Turn one activity row into a notification, or null if it isn't worth one. */
function toNotification(r: Row): NotificationItem | null {
  const label = r.entity_label || ''
  const who = r.actor_name || 'Someone'
  const [app_path, web_path] = paths(r.entity_type, r.entity_id)
  const base = { id: r.id, actor: who, created_at: r.created_at, app_path, web_path }
  const summary = r.summary || ''

  if (r.entity_type === 'lead' && r.action === 'create')
    return { ...base, kind: 'lead', title: `New lead: ${label || 'website enquiry'}`, body: who === 'Website' ? 'Came in through the website. Reach out while it’s warm.' : `Added by ${who}` }
  if (r.entity_type === 'lead' && r.action === 'update' && /Converted to a deal/.test(summary))
    return { ...base, kind: 'deal', title: `${who} converted a lead`, body: `${label} is now a deal` }
  if (r.entity_type === 'data_room' && r.action === 'create')
    return { ...base, kind: 'document_request', title: 'Document request', body: `${label} is asking for the data room. Approve or decline in Deals.` }
  if (r.entity_type === 'transaction') {
    if (r.action === 'create') return { ...base, kind: 'deal', title: `${who} opened a deal`, body: label }
    if (r.action === 'update' && /stage|Marked lost|outcome|commission collected/i.test(summary)) return { ...base, kind: 'deal', title: `${who} updated ${label}`, body: summary }
    if (r.action === 'upload') return { ...base, kind: 'document', title: `${who} added a document`, body: `${summary} · ${label}` }
    return null
  }
  if (r.entity_type === 'meeting') {
    if (r.action === 'create') return { ...base, kind: 'meeting', title: `${who} scheduled a meeting`, body: label }
    if (r.action === 'update' && /status|time/i.test(summary)) return { ...base, kind: 'meeting', title: `${who} updated a meeting`, body: `${label} · ${summary}` }
    return null
  }
  if (r.entity_type === 'task' && r.action === 'create') return { ...base, kind: 'task', title: `${who} added a task`, body: label }
  if (r.entity_type === 'property') {
    if (r.action === 'create') return { ...base, kind: 'listing', title: `${who} added a listing`, body: label }
    if (r.action === 'update' && /status|price/i.test(summary)) return { ...base, kind: 'listing', title: `${who} updated ${label}`, body: summary }
    if (r.action === 'upload' || r.action === 'link') return { ...base, kind: 'document', title: `${who} added a document`, body: `${summary} · ${label}` }
    return null
  }
  // An app release announcement: logged with no actor, so it reaches everyone.
  if (r.entity_type === 'app' && r.action === 'update')
    return { ...base, kind: 'app', title: label || 'The Bhumi app was updated', body: summary }
  if (r.entity_type === 'google' && (r.action === 'connect' || r.action === 'disconnect'))
    return { ...base, kind: 'google', title: r.action === 'connect' ? 'Google Workspace connected' : 'Google Workspace disconnected', body: `By ${who}` }
  return null
}

export async function notificationsFor(userId: string, opts: { since?: string | null; limit?: number } = {}): Promise<NotificationItem[]> {
  if (!hasSupabase()) return []
  let q = createServiceClient()
    .from('activity_log')
    .select('id,actor_id,actor_name,action,entity_type,entity_id,entity_label,summary,created_at')
    .or(`actor_id.is.null,actor_id.neq.${userId}`)
    .in('action', ['create', 'update', 'upload', 'link', 'connect', 'disconnect'])
    .order('created_at', { ascending: false })
    .limit(Math.min(200, (opts.limit ?? 40) * 3))
  if (opts.since) q = q.gt('created_at', opts.since)
  const { data } = await q
  return ((data ?? []) as Row[])
    .map(toNotification)
    .filter((n): n is NotificationItem => n !== null)
    .slice(0, opts.limit ?? 40)
}

/* ─── What the phone schedules reminders from ─────────────── */

export async function upcomingSchedule(days = 14) {
  if (!hasSupabase()) return { meetings: [], tasks: [], counts: { newLeads: 0, pendingDocuments: 0 } }
  const sb = createServiceClient()
  const now = new Date()
  const until = new Date(now.getTime() + days * 86_400_000).toISOString()
  const since = new Date(now.getTime() - 3 * 3_600_000).toISOString()
  const [m, t, l, d] = await Promise.all([
    sb.from('meetings').select('id,title,kind,scheduled_at,duration_min,status,location,attendees,entity_label,google_meet_url').gte('scheduled_at', since).lte('scheduled_at', until).neq('status', 'Cancelled').order('scheduled_at'),
    sb.from('tasks').select('id,title,due_at,priority,entity_label,status').eq('status', 'Open').not('due_at', 'is', null).lte('due_at', until).order('due_at'),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('stage', 'New'),
    sb.from('data_room_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
  ])
  return {
    meetings: m.data ?? [],
    tasks: t.data ?? [],
    counts: { newLeads: l.count ?? 0, pendingDocuments: d.count ?? 0 },
  }
}
