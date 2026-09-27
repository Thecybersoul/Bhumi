import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import * as BackgroundTask from 'expo-background-task'
import { API_URL } from './config'
import { storage, TOKEN_KEY } from './auth'

/* ═══════════════════════════════════════════════════════════
   Reminders and notifications on the phone.

   Two kinds, and they work differently on purpose:

   Reminders about time are scheduled on the phone as local alarms,
   so they fire on the minute even offline:
     - a meeting is coming up (15 / 30 / 60 min before);
     - a meeting has ended: write up the outcome;
     - a task is due now;
     - the morning digest (8:30 AM): today's meetings, tasks due,
       overdue count, new leads.
   They're rebuilt from /api/notifications/schedule whenever the app
   opens and on each background refresh, so an edit made on the web
   or by a colleague reaches the phone's alarms too.

   Team updates (a new lead, a document request, a deal changing
   stage, a meeting booked by someone else) come from
   /api/notifications. The background task checks every ~15 minutes
   (Android decides exactly when) and posts anything new as a phone
   notification. Opening the app shows them in the bell.
   ═══════════════════════════════════════════════════════════ */

export interface NotifyPrefs {
  digest: boolean
  digestHour: number
  digestMinute: number
  meetingLead: 0 | 15 | 30 | 60
  outcomeNudge: boolean
  taskDue: boolean
  teamUpdates: boolean
  messages: boolean
}

export const DEFAULT_PREFS: NotifyPrefs = {
  digest: true,
  digestHour: 8,
  digestMinute: 30,
  meetingLead: 30,
  outcomeNudge: true,
  taskDue: true,
  teamUpdates: true,
  messages: true,
}

const PREFS_KEY = 'bhumi_notify_prefs'
const LAST_CHECK_KEY = 'bhumi_notify_last_check'
const LAST_MSG_KEY = 'bhumi_notify_last_message'
export const REFRESH_TASK = 'bhumi-refresh'

export async function getPrefs(): Promise<NotifyPrefs> {
  try {
    const raw = await storage.get(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export async function setPrefs(p: NotifyPrefs) {
  await storage.set(PREFS_KEY, JSON.stringify(p))
}

/* ─── Setup ─────────────────────────────────────────────── */

export function configureNotifications() {
  if (Platform.OS === 'web') return
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  })
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      description: 'Meetings coming up, tasks due, outcomes to write up',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#C2974A',
    }).catch(() => {})
    Notifications.setNotificationChannelAsync('digest', {
      name: 'Morning digest',
      description: 'Your day at 8:30 AM',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {})
    Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      description: 'Messages from the team',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#C2974A',
    }).catch(() => {})
    Notifications.setNotificationChannelAsync('updates', {
      name: 'Team updates',
      description: 'New leads, document requests, deal and meeting changes by the team',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {})
  }
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  if (!current.canAskAgain) return false
  return (await Notifications.requestPermissionsAsync()).granted
}

/* ─── Fetching with the stored session (works in the background) ─ */

async function tokenIfValid(): Promise<string | null> {
  const t = await storage.get(TOKEN_KEY).catch(() => null)
  return t && t.split('.').length === 3 && Number(t.split('.')[0]) > Date.now() ? t : null
}

async function get<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`${path} ${res.status}`)
  return res.json() as Promise<T>
}

/* ─── Reminders ─────────────────────────────────────────── */

interface Schedule {
  meetings: { id: string; title: string; kind: string; scheduled_at: string; duration_min: number; status: string; location?: string; entity_label?: string; google_meet_url?: string | null }[]
  tasks: { id: string; title: string; due_at: string; priority: string; entity_label?: string }[]
  counts: { newLeads: number; pendingDocuments: number }
}

const at = (d: Date) => ({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: d }) as const
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

async function schedule(id: string, when: Date, title: string, body: string, channelId: string, path: string | null) {
  if (when.getTime() <= Date.now() + 5_000) return
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, data: { path, bhumi: true }, sound: true },
    trigger: { ...at(when), channelId },
  })
}

/** Rebuild every reminder from the server's schedule. */
export async function syncReminders(token?: string | null) {
  if (Platform.OS === 'web') return
  const t = token ?? (await tokenIfValid())
  if (!t) return
  const [prefs, s] = await Promise.all([getPrefs(), get<Schedule>(t, '/api/notifications/schedule')])

  // Clear only our own reminders, then lay them down again.
  const existing = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(existing.filter((n) => n.identifier.startsWith('bhumi-')).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)))

  const now = Date.now()
  const jobs: Promise<void>[] = []

  for (const m of s.meetings) {
    if (m.status !== 'Scheduled') continue
    const start = new Date(m.scheduled_at)
    const where = m.google_meet_url ? 'Google Meet' : m.location || m.entity_label || ''
    if (prefs.meetingLead > 0) {
      jobs.push(
        schedule(
          `bhumi-m-${m.id}`,
          new Date(start.getTime() - prefs.meetingLead * 60_000),
          `${m.kind === 'Site visit' ? 'Site visit' : m.kind} in ${prefs.meetingLead} min`,
          `${m.title} at ${hhmm(m.scheduled_at)}${where ? ` · ${where}` : ''}`,
          'reminders',
          `/meeting/${m.id}`
        )
      )
    }
    if (prefs.outcomeNudge) {
      jobs.push(
        schedule(
          `bhumi-o-${m.id}`,
          new Date(start.getTime() + (m.duration_min + 15) * 60_000),
          'How did it go?',
          `Add the outcome of “${m.title}” while it’s fresh, and any follow-up task.`,
          'reminders',
          `/meeting/${m.id}`
        )
      )
    }
  }

  if (prefs.taskDue) {
    for (const x of s.tasks) {
      const due = new Date(x.due_at)
      if (due.getTime() <= now) continue
      jobs.push(
        schedule(`bhumi-t-${x.id}`, due, `${x.priority === 'High' ? '⚑ ' : ''}Task due now`, `${x.title}${x.entity_label ? ` · ${x.entity_label}` : ''}`, 'reminders', '/notes-tasks')
      )
    }
  }

  if (prefs.digest) {
    const overdueNow = s.tasks.filter((x) => new Date(x.due_at).getTime() < now).length
    for (let d = 0; d < 7; d++) {
      const when = new Date()
      when.setDate(when.getDate() + d)
      when.setHours(prefs.digestHour, prefs.digestMinute, 0, 0)
      if (when.getTime() <= now) continue
      const meetings = s.meetings.filter((m) => m.status === 'Scheduled' && sameDay(new Date(m.scheduled_at), when))
      const tasks = s.tasks.filter((x) => sameDay(new Date(x.due_at), when))
      const overdue = d === 0 ? overdueNow : s.tasks.filter((x) => new Date(x.due_at).getTime() < when.getTime()).length
      const parts = [plural(meetings.length, 'meeting'), plural(tasks.length, 'task') + ' due']
      if (overdue) parts.push(`${overdue} overdue`)
      if (d === 0 && s.counts.newLeads) parts.push(plural(s.counts.newLeads, 'new lead'))
      const first = meetings[0] ? `First up: ${hhmm(meetings[0].scheduled_at)} ${meetings[0].title}` : tasks[0] ? `First task: ${tasks[0].title}` : 'A clear day. Good time to follow up on leads.'
      jobs.push(schedule(`bhumi-d-${when.toDateString()}`, when, `Your day: ${parts.join(', ')}`, first, 'digest', '/'))
    }
  }

  await Promise.all(jobs.map((j) => j.catch(() => {})))
}

/* ─── Team updates ──────────────────────────────────────── */

interface FeedItem {
  id: string
  title: string
  body: string
  created_at: string
  app_path: string | null
}

/** Post anything new since the last check as phone notifications. The
    first run only sets the starting point, so installing the app
    doesn't replay history. */
export async function checkTeamUpdates(token?: string | null) {
  if (Platform.OS === 'web') return
  const t = token ?? (await tokenIfValid())
  if (!t) return
  const prefs = await getPrefs()
  const last = await storage.get(LAST_CHECK_KEY).catch(() => null)
  const nowIso = new Date().toISOString()
  if (!last) return storage.set(LAST_CHECK_KEY, nowIso)
  const { items } = await get<{ items: FeedItem[] }>(t, `/api/notifications?since=${encodeURIComponent(last)}&limit=20`)
  const newest = items[0]?.created_at ?? last
  await storage.set(LAST_CHECK_KEY, newest > last ? newest : last)
  if (!prefs.teamUpdates || !items.length) return
  const show = items.length > 4 ? items.slice(0, 3) : items
  for (const n of show) {
    await Notifications.scheduleNotificationAsync({
      identifier: `feed-${n.id}`,
      content: { title: n.title, body: n.body, data: { path: n.app_path ?? '/notifications' } },
      trigger: Platform.OS === 'android' ? { channelId: 'updates' } : null,
    })
  }
  if (items.length > 4) {
    await Notifications.scheduleNotificationAsync({
      content: { title: `${items.length - 3} more updates from the team`, body: 'Open Bhumi to see everything.', data: { path: '/notifications' } },
      trigger: Platform.OS === 'android' ? { channelId: 'updates' } : null,
    })
  }
}

interface InboxItem {
  id: string
  author_name: string
  body: string
  attachments: { name: string; mime: string }[]
  created_at: string
  conversation_title: string
  ref: string
}

/** New messages from the team since the last check, as phone
    notifications. Like the feed, the first run only sets the start. */
export async function checkMessages(token?: string | null) {
  if (Platform.OS === 'web') return
  const t = token ?? (await tokenIfValid())
  if (!t) return
  const prefs = await getPrefs()
  const last = await storage.get(LAST_MSG_KEY).catch(() => null)
  if (!last) return storage.set(LAST_MSG_KEY, new Date().toISOString())
  const { messages } = await get<{ messages: InboxItem[] }>(t, `/api/messages?since=${encodeURIComponent(last)}`)
  if (!messages.length) return
  await storage.set(LAST_MSG_KEY, messages[messages.length - 1].created_at)
  if (!prefs.messages) return
  // One notification per conversation, showing its latest message.
  const byConv = new Map<string, InboxItem[]>()
  for (const m of messages) byConv.set(m.ref, [...(byConv.get(m.ref) ?? []), m])
  for (const [ref, list] of byConv) {
    const m = list[list.length - 1]
    const what = m.body || (m.attachments?.length ? (m.attachments.every((a) => a.mime?.startsWith('image/')) ? '📷 Photo' : `📎 ${m.attachments[0].name}`) : 'New message')
    const team = m.conversation_title !== m.author_name
    await Notifications.scheduleNotificationAsync({
      identifier: `chat-${ref}`,
      content: {
        title: team ? `${m.author_name} · ${m.conversation_title}` : m.author_name,
        body: list.length > 1 ? `${what}  (+${list.length - 1} more)` : what,
        data: { path: `/chat/${ref}` },
      },
      trigger: Platform.OS === 'android' ? { channelId: 'messages' } : null,
    })
  }
}

/** Everything a refresh does: messages, team updates, then the reminders. */
export async function refreshAll() {
  const t = await tokenIfValid()
  if (!t) return
  await checkMessages(t).catch(() => {})
  await checkTeamUpdates(t).catch(() => {})
  await syncReminders(t).catch(() => {})
}

/* ─── Background refresh ────────────────────────────────── */

// Defined at module load, as TaskManager requires, before anything registers it.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(REFRESH_TASK, async () => {
    try {
      await refreshAll()
      return BackgroundTask.BackgroundTaskResult.Success
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed
    }
  })
}

export async function registerBackgroundRefresh() {
  if (Platform.OS === 'web') return
  try {
    const status = await BackgroundTask.getStatusAsync()
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return
    if (!(await TaskManager.isTaskRegisteredAsync(REFRESH_TASK))) {
      await BackgroundTask.registerTaskAsync(REFRESH_TASK, { minimumInterval: 15 })
    }
  } catch {
    // Background refresh is best-effort; reminders still work.
  }
}

/** Sign-out: no reminders or updates for someone who isn't signed in. */
export async function clearAll() {
  if (Platform.OS === 'web') return
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {})
  await storage.remove(LAST_CHECK_KEY).catch(() => {})
  await storage.remove(LAST_MSG_KEY).catch(() => {})
}
