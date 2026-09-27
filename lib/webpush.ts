import webpush from 'web-push'
import { createServiceClient, hasSupabase } from './supabase'
import { WORKSPACE_EMAIL } from './google'

/* ═══════════════════════════════════════════════════════════
   Web Push for the iPhone home-screen app (migration 017).

   The Android app polls the feed and schedules its own alarms; a web
   app can do neither, so the server pushes to it instead:
     - team updates, the moment they're logged (lib/activity.ts);
     - meeting reminders, due tasks, outcome nudges and the morning
       digest, from /api/cron/reminders every five minutes.
   Each subscription carries that device's preferences, the same
   NotifyPrefs the phone app keeps locally.

   The VAPID key pair is made on first use and kept in app_secrets, so
   there's no environment variable to set. A subscription the push
   service reports as gone (404/410) is deleted.
   ═══════════════════════════════════════════════════════════ */

export interface PushPrefs {
  digest: boolean
  digestHour: number
  digestMinute: number
  meetingLead: 0 | 15 | 30 | 60
  outcomeNudge: boolean
  taskDue: boolean
  teamUpdates: boolean
  messages: boolean
}

export const DEFAULT_PUSH_PREFS: PushPrefs = {
  digest: true,
  digestHour: 8,
  digestMinute: 30,
  meetingLead: 30,
  outcomeNudge: true,
  taskDue: true,
  teamUpdates: true,
  messages: true,
}

export interface PushPayload {
  title: string
  body: string
  /** Path inside the app, e.g. /meeting/123. */
  path?: string | null
  tag?: string
}

export interface Subscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  prefs: Partial<PushPrefs>
}

export const prefsOf = (s: Pick<Subscription, 'prefs'>): PushPrefs => ({ ...DEFAULT_PUSH_PREFS, ...(s.prefs ?? {}) })

let vapid: { publicKey: string; privateKey: string } | null = null

/** The VAPID pair, created and stored the first time it's needed. */
export async function vapidKeys(): Promise<{ publicKey: string; privateKey: string } | null> {
  if (vapid) return vapid
  if (!hasSupabase()) return null
  const sb = createServiceClient()
  const read = async () => {
    const { data } = await sb.from('app_secrets').select('key,value').in('key', ['vapid_public', 'vapid_private'])
    const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
    return m.vapid_public && m.vapid_private ? { publicKey: m.vapid_public as string, privateKey: m.vapid_private as string } : null
  }
  let keys = await read()
  if (!keys) {
    const fresh = webpush.generateVAPIDKeys()
    // Two cold starts racing: ignoreDuplicates keeps whichever landed first.
    await sb.from('app_secrets').upsert(
      [
        { key: 'vapid_public', value: fresh.publicKey },
        { key: 'vapid_private', value: fresh.privateKey },
      ],
      { onConflict: 'key', ignoreDuplicates: true },
    )
    keys = await read()
  }
  vapid = keys
  return keys
}

async function sendOne(sub: Subscription, payload: PushPayload): Promise<boolean> {
  const keys = await vapidKeys()
  if (!keys) return false
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { vapidDetails: { subject: `mailto:${WORKSPACE_EMAIL}`, ...keys }, TTL: 60 * 60 * 6, urgency: 'high' },
    )
    await createServiceClient().from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).eq('id', sub.id)
    return true
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode
    if (code === 404 || code === 410) await createServiceClient().from('push_subscriptions').delete().eq('id', sub.id)
    return false
  }
}

/** Every device that turned notifications on, or [] before 017. */
export async function subscriptions(): Promise<Subscription[]> {
  if (!hasSupabase()) return []
  const { data, error } = await createServiceClient().from('push_subscriptions').select('id,user_id,endpoint,p256dh,auth,prefs')
  return error ? [] : ((data ?? []) as Subscription[])
}

/** Push to the given subscriptions; returns how many were delivered. */
export async function pushTo(subs: Subscription[], payload: PushPayload): Promise<number> {
  const results = await Promise.all(subs.map((s) => sendOne(s, payload)))
  return results.filter(Boolean).length
}

/** Claim a reminder key; false if it was already sent. */
export async function claim(key: string): Promise<boolean> {
  const { error } = await createServiceClient().from('push_sent').insert({ key })
  return !error
}

/** A team update: everyone who wants them except the person who did it. */
export async function pushTeamUpdate(actorId: string | null, payload: PushPayload) {
  const subs = (await subscriptions()).filter((s) => s.user_id !== actorId && prefsOf(s).teamUpdates)
  if (subs.length) await pushTo(subs, payload)
}

/** A chat message: the people it was sent to, if they want message alerts. */
export async function pushMessage(userIds: string[], payload: PushPayload) {
  const ids = new Set(userIds)
  const subs = (await subscriptions()).filter((s) => ids.has(s.user_id) && prefsOf(s).messages)
  if (subs.length) await pushTo(subs, payload)
}
