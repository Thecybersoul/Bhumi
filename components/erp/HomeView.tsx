'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlarmClock,
  Briefcase,
  CalendarDays,
  CircleAlert,
  Map,
  NotebookPen,
  Pencil,
  Activity as ActivityIcon,
  Plus,
  SquareCheck,
  Sun,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { api, dayLabel, needsOutcome, timeAgo, timeOf, type Activity, type Audited, type Meeting, KIND_TINT } from './lib'
import { Avatar, Banner, Card, Empty, KIND_ICON, Loading } from './ui'
import { ActivityRow } from './records'

type Row = Record<string, unknown> & Audited
interface Task extends Row {
  id: string
  title: string
  status: 'Open' | 'Done'
  priority: string
  due_at?: string | null
  entity_label?: string
}
interface Deal extends Row {
  id: string
  reference: string
  property_label: string
  stage: string
  outcome: string
  buyer_name?: string
  seller_name?: string
  opened_at: string
}
interface Listing extends Row {
  id: string
  code: string
  title: string
  status: string
  img_url?: string
  created_at: string
}
interface Lead extends Row {
  id: string
  name: string
  kind: string
  stage: string
  property_code?: string
  created_at: string
  intent?: string
  next_follow_up_at?: string | null
  locations?: string
  phone?: string
}

const STAGES = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']

type AgendaItem = { kind: 'meeting'; at: string; m: Meeting } | { kind: 'task'; at: string | null; t: Task; overdue: boolean }

const endOfDay = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/* Follows the clock: morning from 5, afternoon from 12, evening
   from 5 pm, night from 10 pm. Late hours get "Working late", not a
   "Good morning" at 2 am. */
function greeting(d = new Date()) {
  const h = d.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return h >= 22 ? 'Good night' : 'Working late'
}

export default function HomeView({ firstName }: { firstName: string }) {
  const [data, setData] = useState<{ tasks: Task[]; meetings: Meeting[]; deals: Deal[]; listings: Listing[]; leads: Lead[]; activity: Activity[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const soft = <T,>(p: Promise<T>, f: T) => p.catch(() => f)
    const live = <T,>(r: { data: T[]; source?: string }) => (r.source === 'live' ? r.data : [])
    Promise.all([
      api.get<{ data: Task[]; source: string }>('/api/tasks'),
      soft(api.get<{ data: Meeting[] }>('/api/meetings'), { data: [] as Meeting[] }),
      api.get<{ data: Deal[]; source: string }>('/api/transactions'),
      api.get<{ data: Listing[]; source: string }>('/api/properties?admin=1'),
      soft(api.get<{ data: Lead[]; source: string }>('/api/leads'), { data: [] as Lead[], source: 'fallback' }),
      soft(api.get<{ data: Activity[] }>('/api/activity?limit=8'), { data: [] as Activity[] }),
    ])
      .then(([t, m, d, l, le, a]) =>
        setData({ tasks: live(t), meetings: m.data, deals: live(d), listings: l.data, leads: live(le), activity: a.data })
      )
      .catch((e) => setError((e as Error).message))
  }, [])

  const v = useMemo(() => {
    if (!data) return null
    const now = Date.now()
    const today = endOfDay()
    const week = endOfDay(7)
    const open = data.tasks.filter((t) => t.status === 'Open')
    const overdue = open.filter((t) => t.due_at && new Date(t.due_at).getTime() < now)
    const dueToday = open.filter((t) => t.due_at && new Date(t.due_at).getTime() >= now && new Date(t.due_at).getTime() <= today)
    const live = data.meetings.filter((m) => m.status !== 'Cancelled')
    const startToday = new Date().setHours(0, 0, 0, 0)
    const meetingsToday = live.filter((m) => {
      const t = new Date(m.scheduled_at).getTime()
      return t >= startToday && t <= today
    })
    const agenda: AgendaItem[] = [
      ...overdue.map((t) => ({ kind: 'task' as const, at: t.due_at ?? null, t, overdue: true })),
      ...[
        ...meetingsToday.map((m) => ({ kind: 'meeting' as const, at: m.scheduled_at, m })),
        ...dueToday.map((t) => ({ kind: 'task' as const, at: t.due_at ?? null, t, overdue: false })),
      ].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')),
    ]
    const upcoming: AgendaItem[] = [
      ...live.filter((m) => new Date(m.scheduled_at).getTime() > today && new Date(m.scheduled_at).getTime() <= week).map((m) => ({ kind: 'meeting' as const, at: m.scheduled_at, m })),
      ...open.filter((t) => t.due_at && new Date(t.due_at).getTime() > today && new Date(t.due_at).getTime() <= week).map((t) => ({ kind: 'task' as const, at: t.due_at ?? null, t, overdue: false })),
    ]
      .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''))
      .slice(0, 8)
    const activeDeals = data.deals
      .filter((d) => d.outcome === 'In progress')
      .sort((a, b) => String(b.updated_at ?? b.opened_at).localeCompare(String(a.updated_at ?? a.opened_at)))
    const nextMeetingFor = (id: string) =>
      live.filter((m) => m.entity_type === 'transaction' && m.entity_id === id && new Date(m.scheduled_at).getTime() > now).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0]
    const byStatus = (s: string) => data.listings.filter((l) => l.status === s).length
    const recentListings = [...data.listings].sort((a, b) => String(b.updated_at ?? b.created_at).localeCompare(String(a.updated_at ?? a.created_at))).slice(0, 4)
    return {
      open,
      overdue,
      dueToday,
      meetingsToday,
      agenda,
      upcoming,
      activeDeals,
      nextMeetingFor,
      byStatus,
      recentListings,
      newLeads: data.leads.filter((l) => l.stage === 'New'),
      // Leads whose follow-up is today or overdue, soonest first.
      followUps: data.leads
        .filter((l) => l.next_follow_up_at && !['Converted', 'Lost', 'Closed'].includes(l.stage) && new Date(l.next_follow_up_at).getTime() < new Date().setHours(23, 59, 59, 999))
        .sort((a, b) => (a.next_follow_up_at ?? '').localeCompare(b.next_follow_up_at ?? '')),
      owed: live.filter(needsOutcome),
    }
  }, [data])

  return (
    <div className="erpPage">
      <div className="erpHero">
        <h1 suppressHydrationWarning>
          {greeting(now)}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <div className="erpHero__date" suppressHydrationWarning>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div className="erpHero__stats">
          <HeroStat href="/admin/notes-tasks" icon={SquareCheck} value={v ? v.dueToday.length + v.overdue.length : '–'} label="Tasks due" alert={v?.overdue.length ? `${v.overdue.length} overdue` : undefined} />
          <HeroStat href="/admin/meetings" icon={Users} value={v ? v.meetingsToday.length : '–'} label="Meetings today" />
          <HeroStat href="/admin/deals" icon={Briefcase} value={v ? v.activeDeals.length : '–'} label="Open deals" />
          <HeroStat href="/admin/properties" icon={Map} value={v ? v.byStatus('Live') : '–'} label="Live listings" />
        </div>
      </div>

      <div className="erpQuick">
        <Quick href="/admin/notes-tasks?new=1" icon={SquareCheck} label="Task" />
        <Quick href="/admin/notes-tasks?view=notes" icon={NotebookPen} label="Note" />
        <Quick href="/admin/meetings/new" icon={Users} label="Meeting" />
        <Quick href="/admin/deals/leads/new" icon={UserPlus} label="Lead" />
        <Quick href="/admin/deals/new" icon={Briefcase} label="Deal" />
        <Quick href="/admin/properties/new" icon={Map} label="Listing" />
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {!v ? (
        <Loading />
      ) : (
        <div className="erpGrid main">
          <div className="erpCol">
            <Card title="Today" icon={Sun} action={v.open.length ? `${v.open.length} open tasks` : undefined} actionHref="/admin/notes-tasks">
              {v.agenda.length === 0 ? <Empty>Nothing due and no meetings today.</Empty> : v.agenda.slice(0, 10).map((a) => <AgendaRow key={a.kind === 'meeting' ? `m${a.m.id}` : `t${a.t.id}`} a={a} />)}
            </Card>

            {v.owed.length ? (
              <Link href="/admin/meetings" className="erpBanner warn" style={{ marginBottom: 0 }}>
                <Pencil size={16} /> {v.owed.length} past meeting{v.owed.length > 1 ? 's' : ''} still need{v.owed.length > 1 ? '' : 's'} an outcome written up ›
              </Link>
            ) : null}

            <Card title="Coming up this week" icon={CalendarDays} action="Meetings" actionHref="/admin/meetings">
              {v.upcoming.length === 0 ? <Empty>Nothing scheduled for the next 7 days.</Empty> : v.upcoming.map((a) => <AgendaRow key={a.kind === 'meeting' ? `m${a.m.id}` : `t${a.t.id}`} a={a} withDay />)}
            </Card>

            <Card title="Deals in motion" icon={Briefcase} action="Pipeline" actionHref="/admin/deals">
              {v.activeDeals.length === 0 ? (
                <Empty>No open deals. Start one from a lead or listing.</Empty>
              ) : (
                v.activeDeals.slice(0, 6).map((d) => {
                  const idx = STAGES.indexOf(d.stage)
                  const next = v.nextMeetingFor(d.id)
                  return (
                    <Link key={d.id} href={`/admin/deals/${d.id}`} className="erpRow">
                      <div className="erpRow__body">
                        <div className="erpRow__title">{d.property_label}</div>
                        <div className="erpRow__sub">
                          {d.reference} · {[d.buyer_name, d.seller_name].filter(Boolean).join(' / ') || 'No parties yet'}
                        </div>
                        <div className="erpStages">
                          {STAGES.slice(0, 4).map((s, i) => (
                            <i key={s} className={i <= idx ? 'on' : ''} />
                          ))}
                          <b>{d.stage}</b>
                        </div>
                        {next ? (
                          <div className="erpLink">
                            <span>
                              {next.kind} · {dayLabel(next.scheduled_at)}, {timeOf(next.scheduled_at)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      {d.updated_by || d.created_by ? <Avatar name={d.updated_by || d.created_by} size={26} /> : null}
                    </Link>
                  )
                })
              )}
            </Card>
          </div>

          <div className="erpCol">
            <Card title="Listings" icon={Map} action="All listings" actionHref="/admin/properties">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                {(
                  [
                    ['Live', 'var(--verified)', 'var(--verified-bg)'],
                    ['Reserved', 'var(--progress)', 'var(--progress-bg)'],
                    ['Sold', 'var(--gold-deep)', 'var(--gold-tint)'],
                  ] as const
                ).map(([s, fg, bg]) => (
                  <div key={s} style={{ background: bg, color: fg, borderRadius: 12, padding: '10px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>{v.byStatus(s)}</div>
                    <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s}</div>
                  </div>
                ))}
              </div>
              {v.recentListings.map((p) => (
                <Link key={p.id} href={`/admin/properties/${p.id}`} className="erpRow">
                  <span className="erpRow__icon" style={{ background: `var(--line-2) url(${p.img_url ?? ''}) center/cover`, width: 44, height: 44 }} />
                  <div className="erpRow__body">
                    <div className="erpRow__title">{p.title}</div>
                    <div className="erpRow__sub">
                      {p.code} · {p.status}
                      {p.updated_by ? ` · edited by ${p.updated_by} ${timeAgo(p.updated_at)}` : p.created_by ? ` · added by ${p.created_by}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </Card>

            {v.followUps.length ? (
              <Card title="Follow-ups due" icon={AlarmClock} action="Leads" actionHref="/admin/deals?tab=leads">
                {v.followUps.slice(0, 6).map((l) => {
                  const late = new Date(l.next_follow_up_at!).getTime() < Date.now()
                  return (
                    <Link key={l.id} href={`/admin/deals/leads/${l.id}`} className="erpRow">
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: late ? 'var(--flagged)' : 'var(--gold)', margin: '0 8px' }} />
                      <div className="erpRow__body">
                        <div className="erpRow__title">{l.name}</div>
                        <div className="erpRow__sub" style={{ color: late ? 'var(--flagged)' : undefined }}>
                          {late ? 'Overdue · ' : ''}
                          {new Date(l.next_follow_up_at!).toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                          {l.locations ? ` · ${l.locations}` : ''}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </Card>
            ) : null}

            {v.newLeads.length ? (
              <Card title="New leads to contact" icon={UserPlus} action="Leads" actionHref="/admin/deals?tab=leads">
                {v.newLeads.slice(0, 5).map((l) => (
                  <Link key={l.id} href={`/admin/deals/leads/${l.id}`} className="erpRow">
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--gold)', margin: '0 8px' }} />
                    <div className="erpRow__body">
                      <div className="erpRow__title">{l.name}</div>
                      <div className="erpRow__sub">
                        {l.kind}
                        {l.property_code ? ` · ${l.property_code}` : ''} · {timeAgo(l.created_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </Card>
            ) : null}

            <Card title="Team activity" icon={ActivityIcon} action="See all" actionHref="/admin/activity">
              {data!.activity.length ? data!.activity.slice(0, 7).map((a) => <ActivityRow key={a.id} a={a} />) : <Empty>Changes by the team will show here.</Empty>}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function HeroStat({ href, icon: Icon, value, label, alert }: { href: string; icon: LucideIcon; value: number | string; label: string; alert?: string }) {
  return (
    <Link href={href} className="erpHeroStat">
      <Icon size={16} />
      <b>{value}</b>
      <span>{label}</span>
      {alert ? <em>{alert}</em> : null}
    </Link>
  )
}

function Quick({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href}>
      <span className="erpQuick__icon">
        <Icon size={21} />
        <span className="erpQuick__plus">
          <Plus size={11} />
        </span>
      </span>
      {label}
    </Link>
  )
}

function AgendaRow({ a, withDay }: { a: AgendaItem; withDay?: boolean }) {
  if (a.kind === 'meeting') {
    const m = a.m
    const Icon = KIND_ICON[m.kind]
    return (
      <Link href={`/admin/meetings/${m.id}`} className="erpRow">
        <span className="erpRow__icon" style={{ background: `${KIND_TINT[m.kind]}18`, color: KIND_TINT[m.kind] }}>
          <Icon size={15} />
        </span>
        <div className="erpRow__body">
          <div className="erpRow__title">{m.title}</div>
          <div className="erpRow__sub">
            {m.kind}
            {m.entity_label ? ` · ${m.entity_label}` : m.attendees ? ` · ${m.attendees}` : ''}
          </div>
        </div>
        <span className="erpRow__right">{withDay ? `${dayLabel(m.scheduled_at)}\n` : ''}{timeOf(m.scheduled_at)}</span>
      </Link>
    )
  }
  const t = a.t
  return (
    <Link href="/admin/notes-tasks" className="erpRow">
      <span className="erpRow__icon" style={{ background: a.overdue ? 'var(--flagged-bg)' : 'var(--navy-tint)', color: a.overdue ? 'var(--flagged)' : 'var(--navy)' }}>
        {a.overdue ? <CircleAlert size={15} /> : <SquareCheck size={15} />}
      </span>
      <div className="erpRow__body">
        <div className="erpRow__title">{t.title}</div>
        <div className="erpRow__sub">
          {a.overdue ? 'Overdue' : 'Task'}
          {t.entity_label ? ` · ${t.entity_label}` : ''}
          {t.priority === 'High' ? ' · High priority' : ''}
          {t.created_by ? ` · ${t.created_by}` : ''}
        </div>
      </div>
      <span className="erpRow__right" style={a.overdue ? { color: 'var(--flagged)' } : undefined}>
        {t.due_at ? (a.overdue || withDay ? `${dayLabel(t.due_at)}\n${timeOf(t.due_at)}` : timeOf(t.due_at)) : ''}
      </span>
    </Link>
  )
}
