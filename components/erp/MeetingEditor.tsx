'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CalendarDays, CircleCheck, FolderOpen, History, Mail, SquareCheck, Tag, Trash2, Users, Video } from 'lucide-react'
import { api, fromLocalInput, fmtDateTime, toLocalInput, MEETING_KINDS, KIND_TINT, type GoogleStatus, type Meeting, type MeetingKind, type MeetingStatus } from './lib'
import { Banner, ByLine, Card, Chips, Field, KIND_ICON, Loading } from './ui'
import { ActivityFeed, EntityPicker, type LinkValue } from './records'
import { DocumentsPanel } from './documents'
import { PeoplePanel } from './contacts'
import { EmailButton, EmailLog, MeetAttendance } from './google'

const DURATIONS = [15, 30, 45, 60, 90, 120]
const STATUSES: MeetingStatus[] = ['Scheduled', 'Completed', 'Cancelled']

function meetingEmail(m: Meeting) {
  const when = new Date(m.scheduled_at).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
  if (m.status === 'Completed') {
    return {
      subject: `Minutes: ${m.title}`,
      body: ['Dear all,', `Thank you for your time on ${when}. A summary of what we discussed and agreed:`, m.outcome || '• ', 'Please reply if anything needs correcting.', 'Warm regards,'].join('\n\n'),
    }
  }
  const lines = [
    `When: ${when} (${m.duration_min} min)`,
    m.google_meet_url ? `Join on Google Meet: ${m.google_meet_url}` : m.location ? `Where: ${m.location}` : '',
    m.entity_label ? `Regarding: ${m.entity_label}` : '',
  ].filter(Boolean)
  return {
    subject: `${m.kind === 'Site visit' ? 'Site visit' : 'Meeting'} confirmed: ${m.title}`,
    body: ['Dear Sir / Madam,', `This is to confirm our ${m.kind.toLowerCase()}.`, lines.join('\n'), m.agenda ? `Agenda:\n${m.agenda}` : '', 'Looking forward to it.', 'Warm regards,'].filter(Boolean).join('\n\n'),
  }
}

export default function MeetingEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const router = useRouter()
  const params = useSearchParams()
  const [m, setM] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [google, setGoogle] = useState<GoogleStatus | null>(null)

  const [kind, setKind] = useState<MeetingKind>((MEETING_KINDS as string[]).includes(params.get('kind') ?? '') ? (params.get('kind') as MeetingKind) : 'In person')
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [duration, setDuration] = useState(30)
  const [location, setLocation] = useState('')
  const [attendees, setAttendees] = useState('')
  const [agenda, setAgenda] = useState('')
  const [outcome, setOutcome] = useState('')
  const [status, setStatus] = useState<MeetingStatus>('Scheduled')
  const [calendar, setCalendar] = useState(true)
  const [link, setLink] = useState<LinkValue>({
    entity_type: (params.get('entity_type') as LinkValue['entity_type']) ?? 'general',
    entity_id: params.get('entity_id'),
    entity_label: params.get('entity_label') ?? '',
  })
  const [followUp, setFollowUp] = useState('')
  const [followDue, setFollowDue] = useState('')
  const [followDone, setFollowDone] = useState<string | null>(null)

  useEffect(() => {
    api.get<GoogleStatus>('/api/admin/google/status').then(setGoogle).catch(() => {})
    if (isNew) return
    api
      .get<{ data: Meeting[] }>('/api/meetings')
      .then((r) => {
        const x = r.data.find((y) => y.id === id)
        if (!x) return setError('Meeting not found')
        setM(x)
        setKind(x.kind)
        setTitle(x.title)
        setWhen(x.scheduled_at)
        setDuration(x.duration_min)
        setLocation(x.location ?? '')
        setAttendees(x.attendees ?? '')
        setAgenda(x.agenda ?? '')
        setOutcome(x.outcome ?? '')
        setStatus(x.status)
        setLink({ entity_type: x.entity_type as LinkValue['entity_type'], entity_id: x.entity_id ?? null, entity_label: x.entity_label ?? '' })
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  async function save() {
    if (!title.trim()) return setError('Give the meeting a title, e.g. "Site visit with Mr. Rao"')
    if (!when) return setError('Pick a date and time')
    setBusy(true)
    setError(null)
    const body = { title: title.trim(), kind, scheduled_at: when, duration_min: duration, location: location.trim(), attendees: attendees.trim(), agenda: agenda.trim(), outcome: outcome.trim(), status, ...link }
    try {
      if (isNew) {
        const r = await api.post<{ id?: string }>('/api/meetings', { ...body, calendar: Boolean(google?.connected && calendar) })
        router.push(r.id ? `/admin/meetings/${r.id}` : '/admin/meetings')
      } else {
        const r = await api.patch<{ data: Meeting }>(`/api/meetings/${id}`, body)
        setM(r.data)
        setError(null)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleCalendar() {
    if (!m) return
    setBusy(true)
    try {
      setM((await api.patch<{ data: Meeting }>(`/api/meetings/${m.id}`, { calendar: !m.google_event_id })).data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function addFollowUp() {
    if (!m || !followUp.trim()) return
    const onRecord = link.entity_type !== 'general' && link.entity_type !== 'task'
    try {
      await api.post('/api/tasks', {
        title: followUp.trim(),
        due_at: followDue || undefined,
        priority: 'Normal',
        entity_type: onRecord ? link.entity_type : 'meeting',
        entity_id: onRecord ? link.entity_id : m.id,
        entity_label: onRecord ? link.entity_label : m.title,
      })
      setFollowDone(followUp.trim())
      setFollowUp('')
      setFollowDue('')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function remove() {
    if (!m || !confirm(`Delete this meeting?${m.google_event_id ? ' It is also removed from Google Calendar.' : ''}`)) return
    await api.del(`/api/meetings/${m.id}`)
    router.push('/admin/meetings')
  }

  if (loading) return <Loading />
  const past = when && new Date(when).getTime() < Date.now()
  const Icon = KIND_ICON[kind]

  return (
    <div className="erpPage">
      <Link href="/admin/meetings" className="erpCard__action" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Meetings
      </Link>
      <div className="erpHead">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="erpRow__icon" style={{ width: 48, height: 48, borderRadius: 14, background: `${KIND_TINT[kind]}18`, color: KIND_TINT[kind] }}>
            <Icon size={22} />
          </span>
          <div>
            <h1>{isNew ? 'Log a meeting' : m?.title}</h1>
            {m ? (
              <>
                <p>
                  {fmtDateTime(m.scheduled_at)} · {m.duration_min} min · {m.status}
                </p>
                <ByLine record={m} createdAt={m.created_at} />
              </>
            ) : null}
          </div>
        </div>
        {m?.google_meet_url ? (
          <a href={m.google_meet_url} target="_blank" rel="noreferrer" className="erpBtn meet">
            <Video size={16} /> Join Google Meet
          </a>
        ) : null}
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="erpGrid main">
        <div className="erpCol">
          <Card title="What kind" icon={Users}>
            <div className="erpKinds" style={{ marginBottom: 14 }}>
              {MEETING_KINDS.map((k) => {
                const KI = KIND_ICON[k]
                const on = kind === k
                return (
                  <button type="button" key={k} className="erpKind" style={on ? { background: KIND_TINT[k], borderColor: KIND_TINT[k], color: '#fff' } : undefined} onClick={() => setKind(k)}>
                    <KI size={18} color={on ? '#fff' : KIND_TINT[k]} />
                    {k}
                  </button>
                )
              })}
            </div>
            <div className="erpForm">
              <Field label="Title">
                <input className="erpInput" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'Site visit' ? 'Site visit — Doddasanne layout' : 'Price discussion with the seller'} />
              </Field>
              <EntityPicker value={link} onChange={setLink} />
            </div>
          </Card>

          <Card title="When & where" icon={CalendarDays}>
            <div className="erpForm two">
              <Field label="Starts">
                <input type="datetime-local" className="erpInput" value={toLocalInput(when)} onChange={(e) => setWhen(fromLocalInput(e.target.value))} />
              </Field>
              <Field label="Duration">
                <div className="erpChips">
                  {DURATIONS.map((d) => (
                    <button type="button" key={d} className={`erpChip ${duration === d ? 'is-on' : ''}`} onClick={() => setDuration(d)}>
                      {d < 60 ? `${d}m` : `${d / 60}h`.replace('.5h', '½h')}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={kind === 'Call' || kind === 'Video call' ? 'Phone / link (optional)' : 'Location'}>
                <input className="erpInput" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={kind === 'Site visit' ? 'Survey no. 42, Doddasanne' : 'Bhumi office, Indiranagar'} />
              </Field>
              <Field label="With">
                <input className="erpInput" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Mr. Rao (buyer), Sanjog" />
              </Field>
              {isNew && google?.connected ? (
                <label className="erpToggle erpField full">
                  {kind === 'Video call' ? 'Add to the shared Google Calendar with a Meet link' : 'Add to the shared Google Calendar'}
                  <input type="checkbox" checked={calendar} onChange={(e) => setCalendar(e.target.checked)} />
                </label>
              ) : null}
            </div>
          </Card>

          <Card title="Notes" icon={CircleCheck}>
            <div className="erpForm">
              <Field label="Agenda">
                <textarea className="erpInput" value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="What needs to come out of this" />
              </Field>
              <Field label="Status">
                <Chips options={STATUSES} value={status} onChange={setStatus} />
              </Field>
              <Field label="Outcome / minutes">
                <textarea
                  className="erpInput"
                  style={{ minHeight: 130 }}
                  value={outcome}
                  onChange={(e) => {
                    setOutcome(e.target.value)
                    if (e.target.value.trim() && status === 'Scheduled' && past) setStatus('Completed')
                  }}
                  placeholder="What was agreed, next steps, who does what"
                />
              </Field>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="erpBtn primary" onClick={save} disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Saving…' : isNew ? 'Save meeting' : 'Save changes'}
            </button>
            {m ? (
              <button className="erpBtn danger" onClick={remove}>
                <Trash2 size={15} /> Delete
              </button>
            ) : null}
          </div>
        </div>

        {m ? (
          <div className="erpCol">
            <Card title={m.status === 'Completed' ? 'Send the minutes' : 'Send a confirmation'} icon={Mail}>
              <EmailButton block label={m.status === 'Completed' ? 'Email the minutes' : 'Email a confirmation'} draft={{ ...meetingEmail(m), entity_type: 'meeting', entity_id: m.id, entity_label: m.title }} />
              <div style={{ marginTop: 10 }}>
                <EmailLog entityType="meeting" entityId={m.id} />
              </div>
            </Card>

            {m.google_meet_url ? (
              <Card title="Who joined the Meet" icon={Video}>
                <MeetAttendance meetingId={m.id} />
              </Card>
            ) : null}

            <Card title="Follow-up task" icon={SquareCheck}>
              {followDone ? <Banner tone="ok">Added “{followDone}” to Tasks</Banner> : null}
              <div className="erpForm">
                <input className="erpInput" value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="Send the revised layout plan" />
                <input type="datetime-local" className="erpInput" value={toLocalInput(followDue)} onChange={(e) => setFollowDue(fromLocalInput(e.target.value))} />
                <button className="erpBtn ghost" onClick={addFollowUp}>
                  Add follow-up
                </button>
              </div>
            </Card>

            {google?.connected ? (
              <Card title="Google Calendar" icon={CalendarDays}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 10 }}>
                  {m.google_event_id ? 'On the shared calendar (info@bhumiestates.in). Changes here update it.' : 'Not on the calendar yet.'}
                </p>
                <button className="erpBtn ghost" onClick={toggleCalendar} disabled={busy}>
                  {m.google_event_id ? 'Remove from calendar' : 'Add to calendar'}
                </button>
              </Card>
            ) : null}

            <Card title="People" icon={Tag}>
              <PeoplePanel entityType="meeting" entityId={m.id} entityLabel={m.title} roles={['Attendee', 'Client', 'Owner', 'Agent', 'Lawyer', 'Other']} emptyText="Tag who was there from your contacts." />
            </Card>
            <Card title="Documents & photos" icon={FolderOpen}>
              <DocumentsPanel compact entityType="meeting" entityId={m.id} entityLabel={m.title} />
            </Card>

            <Card title="History" icon={History}>
              <ActivityFeed entityType="meeting" entityId={m.id} />
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
