import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from '@/lib/session'
import { upcomingSchedule } from '@/lib/notifications'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { claim, prefsOf, pushTo, subscriptions, type PushPayload, type Subscription } from '@/lib/webpush'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* Timed reminders for the iPhone home-screen app, pushed from the
   server because a web app can't schedule its own (lib/webpush.ts).
   pg_cron calls this every five minutes (migration 017) with the
   x-cron-key header; `Authorization: Bearer $CRON_SECRET` works too.

   The same reminders, in the same words, as the Android app's local
   alarms (mobile/src/lib/notify.ts), each following that device's
   preferences. Every reminder is claimed in push_sent before it's
   sent, so a run that overlaps another, or a late run, never sends one
   twice. A run that's missed is caught up by the next one within a
   window, rather than dropped. */

const IST = 'Asia/Kolkata'
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: IST })
const istDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: IST })
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
const MIN = 60_000

async function authorised(req: NextRequest): Promise<boolean> {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (process.env.CRON_SECRET && bearer && safeEqual(bearer, process.env.CRON_SECRET)) return true
  const key = req.headers.get('x-cron-key') ?? ''
  if (!key || !hasSupabase()) return false
  const { data } = await createServiceClient().from('app_secrets').select('value').eq('key', 'reminders_cron_key').maybeSingle()
  return !!data?.value && safeEqual(key, data.value)
}

/** 8:30 in IST on the IST calendar day of `now`, as an instant. */
function istTime(now: Date, hour: number, minute: number): Date {
  return new Date(`${istDay(now)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`)
}

export async function GET(req: NextRequest) {
  if (!(await authorised(req))) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  const sb = createServiceClient()
  const now = new Date()
  const t = now.getTime()

  const subs = await subscriptions()
  let sent = 0
  if (subs.length) {
    const s = await upcomingSchedule(2)
    const send = async (sub: Subscription, key: string, payload: PushPayload) => {
      if (await claim(`${sub.id}:${key}`)) sent += await pushTo([sub], { ...payload, tag: key })
    }

    for (const sub of subs) {
      const prefs = prefsOf(sub)
      const jobs: Promise<void>[] = []

      for (const m of s.meetings) {
        if (m.status !== 'Scheduled') continue
        const start = new Date(m.scheduled_at).getTime()
        const where = m.google_meet_url ? 'Google Meet' : m.location || m.entity_label || ''
        const kind = m.kind === 'Site visit' ? 'Site visit' : m.kind
        if (prefs.meetingLead > 0 && t >= start - prefs.meetingLead * MIN && t < start) {
          const mins = Math.max(1, Math.round((start - t) / MIN))
          jobs.push(
            send(sub, `m:${m.id}:${m.scheduled_at}`, {
              title: `${kind} in ${mins} min`,
              body: `${m.title} at ${hhmm(m.scheduled_at)}${where ? ` · ${where}` : ''}`,
              path: `/meeting/${m.id}`,
            }),
          )
        }
        const nudge = start + ((m.duration_min || 60) + 15) * MIN
        if (prefs.outcomeNudge && t >= nudge && t < nudge + 60 * MIN) {
          jobs.push(
            send(sub, `o:${m.id}:${m.scheduled_at}`, {
              title: 'How did it go?',
              body: `Add the outcome of “${m.title}” while it’s fresh, and any follow-up task.`,
              path: `/meeting/${m.id}`,
            }),
          )
        }
      }

      if (prefs.taskDue) {
        for (const x of s.tasks) {
          const due = new Date(x.due_at).getTime()
          if (t >= due && t < due + 30 * MIN) {
            jobs.push(
              send(sub, `t:${x.id}:${x.due_at}`, {
                title: `${x.priority === 'High' ? '⚑ ' : ''}Task due now`,
                body: `${x.title}${x.entity_label ? ` · ${x.entity_label}` : ''}`,
                path: '/notes-tasks',
              }),
            )
          }
        }
      }

      const digestAt = istTime(now, prefs.digestHour, prefs.digestMinute).getTime()
      if (prefs.digest && t >= digestAt && t < digestAt + 60 * MIN) {
        const today = istDay(now)
        const meetings = s.meetings.filter((m) => m.status === 'Scheduled' && istDay(new Date(m.scheduled_at)) === today)
        const tasks = s.tasks.filter((x) => istDay(new Date(x.due_at)) === today)
        const overdue = s.tasks.filter((x) => new Date(x.due_at).getTime() < t).length
        const parts = [plural(meetings.length, 'meeting'), plural(tasks.length, 'task') + ' due']
        if (overdue) parts.push(`${overdue} overdue`)
        if (s.counts.newLeads) parts.push(plural(s.counts.newLeads, 'new lead'))
        const first = meetings[0]
          ? `First up: ${hhmm(meetings[0].scheduled_at)} ${meetings[0].title}`
          : tasks[0]
            ? `First task: ${tasks[0].title}`
            : 'A clear day. Good time to follow up on leads.'
        jobs.push(send(sub, `d:${today}`, { title: `Your day: ${parts.join(', ')}`, body: first, path: '/' }))
      }

      await Promise.all(jobs.map((j) => j.catch(() => {})))
    }
  }

  // Housekeeping: reminder keys older than a month can't recur.
  await sb.from('push_sent').delete().lt('sent_at', new Date(t - 30 * 86_400_000).toISOString())
  await sb.from('app_secrets').upsert({ key: 'reminders_last_run', value: now.toISOString(), updated_at: now.toISOString() }, { onConflict: 'key' })

  return NextResponse.json({ ok: true, devices: subs.length, sent })
}
