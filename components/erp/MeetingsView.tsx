'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarX2, Pencil, Plus } from 'lucide-react'
import { api, dayLabel, needsOutcome, MEETING_KINDS, type Meeting, type MeetingKind } from './lib'
import { Banner, KIND_ICON, Loading } from './ui'
import { MeetingCard } from './records'
import { MeetNowButton } from './google'

export default function MeetingsView() {
  const [items, setItems] = useState<Meeting[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming')
  const [kind, setKind] = useState<MeetingKind | 'All'>('All')

  useEffect(() => {
    api
      .get<{ data: Meeting[]; error?: string }>('/api/meetings')
      .then((r) => {
        setItems(r.data)
        if (r.error?.includes('meetings')) setError('Meetings table missing — run migration 012.')
      })
      .catch((e) => {
        setError((e as Error).message)
        setItems([])
      })
  }, [])

  const { sections, owed, counts } = useMemo(() => {
    const all = (items ?? []).filter((m) => kind === 'All' || m.kind === kind)
    const start = new Date().setHours(0, 0, 0, 0)
    const upcoming = all.filter((m) => new Date(m.scheduled_at).getTime() >= start && !needsOutcome(m)).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    const past = all.filter((m) => new Date(m.scheduled_at).getTime() < start || needsOutcome(m)).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
    const list = view === 'upcoming' ? upcoming : past.filter((m) => !needsOutcome(m))
    const groups = new Map<string, Meeting[]>()
    for (const m of list) groups.set(dayLabel(m.scheduled_at), [...(groups.get(dayLabel(m.scheduled_at)) ?? []), m])
    return { sections: [...groups.entries()], owed: past.filter(needsOutcome), counts: { upcoming: upcoming.length, past: past.length } }
  }, [items, view, kind])

  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Meetings</h1>
          <p>Site visits, in-person meetings, calls and discussions, each tied to its listing, deal, task or lead.</p>
        </div>
        <div className="erpHead__actions">
          <MeetNowButton title="Quick call" label="Meet now" />
          <Link href="/admin/meetings/new" className="erpBtn primary">
            <Plus size={16} /> Log meeting
          </Link>
        </div>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="erpSeg">
          <button className={view === 'upcoming' ? 'is-on' : ''} onClick={() => setView('upcoming')}>
            Upcoming · {counts.upcoming}
          </button>
          <button className={view === 'past' ? 'is-on' : ''} onClick={() => setView('past')}>
            Past · {counts.past}
          </button>
        </div>
        <div className="erpChips" style={{ marginBottom: 16 }}>
          {(['All', ...MEETING_KINDS] as const).map((k) => {
            const Icon = k === 'All' ? null : KIND_ICON[k]
            return (
              <button key={k} className={`erpChip ${kind === k ? 'is-on' : ''}`} onClick={() => setKind(k)}>
                {Icon ? <Icon size={12} /> : null} {k}
              </button>
            )
          })}
        </div>
      </div>

      {items === null ? (
        <Loading />
      ) : (
        <div style={{ maxWidth: 820 }}>
          {owed.length ? (
            <div className="erpCard" style={{ background: 'var(--pending-bg)', borderColor: 'transparent', marginBottom: 12 }}>
              <div className="erpCard__title" style={{ color: 'var(--pending)', marginBottom: 10 }}>
                <Pencil size={16} /> {owed.length} meeting{owed.length > 1 ? 's' : ''} need{owed.length > 1 ? '' : 's'} an outcome
              </div>
              {owed.slice(0, 4).map((m) => (
                <MeetingCard key={m.id} m={m} showDay />
              ))}
            </div>
          ) : null}
          {sections.length === 0 ? (
            <div className="erpCard" style={{ textAlign: 'center', padding: 40 }}>
              <CalendarX2 size={34} color="var(--line)" />
              <p style={{ fontWeight: 800, color: 'var(--ink-2)', marginTop: 8 }}>{view === 'upcoming' ? 'Nothing scheduled' : 'No past meetings yet'}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginTop: 4 }}>Log site visits, calls and discussions, and tie each one to its listing, deal or task.</p>
            </div>
          ) : (
            sections.map(([day, list]) => (
              <div key={day}>
                <div className="erpDay">{day}</div>
                {list.map((m) => (
                  <MeetingCard key={m.id} m={m} />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
