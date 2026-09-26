import { google } from 'googleapis'
import { getClient } from './google'

/* ═══════════════════════════════════════════════════════════
   Google Meet (Meet REST API v2).

   Scheduled video calls already get a Meet link through their
   Calendar event (lib/meetings.ts). This adds two things Calendar
   can't do:
     - an instant meeting room, for a call that starts right now;
     - what happened on a call afterwards: who joined, for how long,
       and links to the recording and transcript when Workspace made
       them (recording and transcripts need a Workspace plan that
       includes them; attendance is always there).
   ═══════════════════════════════════════════════════════════ */

export function meetingCode(url?: string | null): string | null {
  return url?.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i)?.[1]?.toLowerCase() ?? null
}

export async function createInstantSpace(): Promise<{ url: string; code: string } | null> {
  const auth = await getClient()
  if (!auth) return null
  const { data } = await google.meet({ version: 'v2', auth }).spaces.create({ requestBody: {} })
  if (!data.meetingUri) return null
  return { url: data.meetingUri, code: data.meetingCode ?? meetingCode(data.meetingUri) ?? '' }
}

export interface Attendance {
  started_at: string | null
  ended_at: string | null
  participants: { name: string; kind: 'signed in' | 'guest' | 'phone'; joined_at: string | null; left_at: string | null; minutes: number | null }[]
  recordings: { url: string }[]
  transcripts: { url: string }[]
}

/** Every session held in the room with this Meet code, newest first. */
export async function attendanceFor(code: string): Promise<Attendance[]> {
  const auth = await getClient()
  if (!auth) return []
  const meet = google.meet({ version: 'v2', auth })
  const { data } = await meet.conferenceRecords.list({ filter: `space.meeting_code = "${code}"`, pageSize: 10 })
  const records = data.conferenceRecords ?? []

  return Promise.all(
    records.map(async (r) => {
      const [p, rec, tr] = await Promise.all([
        meet.conferenceRecords.participants.list({ parent: r.name!, pageSize: 100 }).catch(() => null),
        meet.conferenceRecords.recordings.list({ parent: r.name! }).catch(() => null),
        meet.conferenceRecords.transcripts.list({ parent: r.name! }).catch(() => null),
      ])
      return {
        started_at: r.startTime ?? null,
        ended_at: r.endTime ?? null,
        participants: (p?.data.participants ?? []).map((x) => {
          const joined = x.earliestStartTime ?? null
          const left = x.latestEndTime ?? null
          return {
            name: x.signedinUser?.displayName || x.anonymousUser?.displayName || x.phoneUser?.displayName || 'Participant',
            kind: x.signedinUser ? ('signed in' as const) : x.phoneUser ? ('phone' as const) : ('guest' as const),
            joined_at: joined,
            left_at: left,
            minutes: joined && left ? Math.max(1, Math.round((new Date(left).getTime() - new Date(joined).getTime()) / 60000)) : null,
          }
        }),
        recordings: (rec?.data.recordings ?? []).map((x) => ({ url: x.driveDestination?.exportUri ?? '' })).filter((x) => x.url),
        transcripts: (tr?.data.transcripts ?? []).map((x) => ({ url: x.docsDestination?.exportUri ?? '' })).filter((x) => x.url),
      }
    })
  )
}
