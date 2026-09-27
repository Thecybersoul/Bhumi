import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from '@/lib/session'
import { syncRegister } from '@/lib/sheets'
import { syncRegister as syncPropertyRegister } from '@/lib/register-sync'
import { upcomingSchedule } from '@/lib/notifications'
import { hasService } from '@/lib/google'
import { sendEmail } from '@/lib/gmail'
import { listUsers } from '@/lib/users'
import { createServiceClient, hasSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* The daily 8:30 AM IST job (vercel.json, 03:00 UTC). Vercel sends
   `Authorization: Bearer $CRON_SECRET`, and without it this route
   refuses everyone. It does two things:
     1. syncs the Google Sheets register;
     2. emails each admin their day: meetings, tasks due or
        overdue, new leads and pending document requests. It goes
        from the company Gmail, only when Gmail is connected, and only
        to people who haven't turned it off (notify_prefs.digest_email). */

const IST = 'Asia/Kolkata'
const t = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: IST })
const istDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: IST })

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!secret || !safeEqual(got, secret)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  const result: Record<string, unknown> = {}

  try {
    const r = await syncPropertyRegister()
    result.property_register = { created: r.created, updated: r.updated.map((u) => u.code), errors: r.errors }
  } catch (e) {
    result.property_register = `skipped: ${(e as Error).message}`
  }

  try {
    result.sheets = (await syncRegister('Daily sync')).last_synced_at
  } catch (e) {
    result.sheets = `skipped: ${(e as Error).message}`
  }

  try {
    if (!hasSupabase() || !(await hasService('gmail'))) throw new Error('Gmail not connected')
    const s = await upcomingSchedule(1)
    const today = istDay(new Date())
    const meetings = (s.meetings as { title: string; kind: string; scheduled_at: string; entity_label?: string; location?: string; status: string }[]).filter(
      (m) => istDay(new Date(m.scheduled_at)) === today && m.status === 'Scheduled'
    )
    const tasks = s.tasks as { title: string; due_at: string; priority: string; entity_label?: string }[]
    const overdue = tasks.filter((x) => istDay(new Date(x.due_at)) < today)
    const dueToday = tasks.filter((x) => istDay(new Date(x.due_at)) === today)

    const lines: string[] = []
    lines.push(meetings.length ? `MEETINGS TODAY (${meetings.length})` : 'No meetings today.')
    for (const m of meetings) lines.push(`• ${t(m.scheduled_at)} — ${m.kind}: ${m.title}${m.entity_label ? ` (${m.entity_label})` : ''}${m.location ? ` · ${m.location}` : ''}`)
    lines.push('')
    lines.push(dueToday.length ? `DUE TODAY (${dueToday.length})` : 'No tasks due today.')
    for (const x of dueToday) lines.push(`• ${t(x.due_at)} — ${x.title}${x.priority === 'High' ? ' [High]' : ''}${x.entity_label ? ` (${x.entity_label})` : ''}`)
    if (overdue.length) {
      lines.push('', `OVERDUE (${overdue.length})`)
      for (const x of overdue.slice(0, 10)) lines.push(`• ${x.title} — was due ${new Date(x.due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: IST })}`)
    }
    if (s.counts.newLeads || s.counts.pendingDocuments) {
      lines.push('', 'WAITING ON THE TEAM')
      if (s.counts.newLeads) lines.push(`• ${s.counts.newLeads} new lead${s.counts.newLeads > 1 ? 's' : ''} not yet contacted`)
      if (s.counts.pendingDocuments) lines.push(`• ${s.counts.pendingDocuments} document request${s.counts.pendingDocuments > 1 ? 's' : ''} to approve`)
    }
    lines.push('', 'Open the Bhumi app or https://www.bhumiestates.in/admin to get going.')

    const { data: prefs } = await createServiceClient().from('admin_users').select('id,notify_prefs')
    const optedOut = new Set((prefs ?? []).filter((p) => p.notify_prefs?.digest_email === false).map((p) => p.id))
    const people = (await listUsers()).filter((u) => u.active && !optedOut.has(u.id))
    const subject = `Your day: ${meetings.length} meeting${meetings.length === 1 ? '' : 's'}, ${dueToday.length + overdue.length} task${dueToday.length + overdue.length === 1 ? '' : 's'}${overdue.length ? ` (${overdue.length} overdue)` : ''}`
    const sent: string[] = []
    for (const u of people) {
      await sendEmail({ to: [u.email], cc: [], subject, text: `Good morning ${u.name},\n\n${lines.join('\n')}`, senderName: 'Bhumi ERP', attachments: [] })
      sent.push(u.email)
    }
    result.digest = sent
  } catch (e) {
    result.digest = `skipped: ${(e as Error).message}`
  }

  return NextResponse.json({ ok: true, ...result })
}
