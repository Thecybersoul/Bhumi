import { createServiceClient } from './supabase'
import { createEventWithMeet, deleteEvent, isConnected, updateEvent } from './google'
import type { Meeting, MeetingEntityType, MeetingKind } from './types'

export const MEETING_KINDS: MeetingKind[] = ['In person', 'Site visit', 'Call', 'Video call', 'Discussion']
export const MEETING_ENTITY_TYPES: MeetingEntityType[] = ['property', 'transaction', 'task', 'lead', 'verification', 'general']

function describeFor(m: Partial<Meeting>) {
  return [
    m.entity_label ? `Re: ${m.entity_label}` : '',
    m.attendees ? `With: ${m.attendees}` : '',
    m.agenda ? `\n${m.agenda}` : '',
    '\nLogged in the Bhumi Estates ERP.',
  ]
    .filter(Boolean)
    .join('\n')
}

const summaryFor = (m: Partial<Meeting>) => `${m.kind === 'Site visit' ? 'Site visit' : m.title}${m.kind === 'Site visit' && m.title ? ` · ${m.title}` : ''}`

/* Calendar bookkeeping goes straight to the table rather than through
   lib/db's update(): an event id changing is not something a person
   did, and should not show up in the activity trail as an edit. */
async function setEvent(id: string, eventId: string | null, meetUrl: string | null) {
  await createServiceClient().from('meetings').update({ google_event_id: eventId, google_meet_url: meetUrl }).eq('id', id)
}

/** Put a meeting on the shared Google Calendar, with a Meet link when
    it is a video call. A no-op when Google isn't connected. */
export async function syncToCalendar(m: Meeting): Promise<{ google_event_id: string | null; google_meet_url: string | null }> {
  if (m.status === 'Cancelled' || !(await isConnected())) return { google_event_id: null, google_meet_url: null }
  const created = await createEventWithMeet({
    summary: summaryFor(m),
    description: describeFor(m),
    location: m.location,
    startISO: m.scheduled_at,
    durationMinutes: m.duration_min,
    meet: m.kind === 'Video call',
  })
  if (!created) return { google_event_id: null, google_meet_url: null }
  await setEvent(m.id, created.eventId, created.meetUrl)
  return { google_event_id: created.eventId, google_meet_url: created.meetUrl }
}

/** Keep an already-synced event in step with an edited meeting:
    cancelled removes it, anything else moves or retitles it. */
export async function resyncCalendar(before: Meeting, after: Meeting) {
  if (!before.google_event_id) return
  if (after.status === 'Cancelled') {
    await deleteEvent(before.google_event_id)
    await setEvent(after.id, null, null)
    return
  }
  await updateEvent(before.google_event_id, {
    summary: summaryFor(after),
    description: describeFor(after),
    location: after.location,
    startISO: after.scheduled_at,
    durationMinutes: after.duration_min,
  })
}

export async function unsyncCalendar(m: Meeting) {
  if (m.google_event_id) await deleteEvent(m.google_event_id)
}
