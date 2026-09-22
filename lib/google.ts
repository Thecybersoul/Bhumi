import { google } from 'googleapis'
import { createServiceClient, hasSupabase } from './supabase'

/* ═══════════════════════════════════════════════════════════
   Google Calendar / Meet sync.

   Same degrade-gracefully shape as Supabase in this codebase:
   nothing here throws when it isn't configured — every caller
   checks hasGoogleAuth()/isConnected() first and the feature is
   simply unavailable (a task just doesn't sync) rather than the
   app breaking. One admin, one Google account: `google_auth` is a
   single-row table, not a per-user table — there's one shared
   inbox to schedule against, matching how ADMIN_EMAIL/PASSWORD is
   one shared login rather than per-user accounts.
   ═══════════════════════════════════════════════════════════ */

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

/** True when the three OAuth env vars are set. Doesn't mean the
    admin has actually connected an account yet — see isConnected(). */
export function hasGoogleAuth(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI)
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

/** The URL to send the admin to for the Google consent screen.
    `prompt: 'consent'` forces a refresh_token back even on a
    re-connect — without it, a second authorization can come back
    with no refresh_token at all if one was already issued once. */
export function getAuthUrl(): string {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

/** Exchange the OAuth callback's `code` for tokens and store them.
    Single-row table: whatever was there before this connection is
    replaced, since only one Google account is meant to be linked. */
export async function exchangeCodeAndStore(code: string): Promise<void> {
  const client = oauthClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Disconnect this app in your Google Account permissions and try connecting again.'
    )
  }

  const sb = createServiceClient()
  await sb.from('google_auth').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error } = await sb.from('google_auth').insert({
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    expiry_date: tokens.expiry_date,
  })
  if (error) throw new Error(error.message)
}

export async function isConnected(): Promise<boolean> {
  if (!hasSupabase()) return false
  try {
    const sb = createServiceClient()
    const { count } = await sb.from('google_auth').select('*', { count: 'exact', head: true })
    return (count ?? 0) > 0
  } catch {
    return false
  }
}

export async function disconnect(): Promise<void> {
  const sb = createServiceClient()
  await sb.from('google_auth').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

/** An authorized client, or null if nothing is configured or
    connected yet. googleapis refreshes the access token from the
    refresh token automatically on the first API call that needs
    it — this just needs to hand back fresh tokens afterwards so
    the next call doesn't pay for another refresh. */
async function getClient() {
  if (!hasGoogleAuth() || !hasSupabase()) return null
  const sb = createServiceClient()
  const { data } = await sb.from('google_auth').select('*').limit(1).maybeSingle()
  if (!data) return null

  const client = oauthClient()
  client.setCredentials({
    refresh_token: data.refresh_token,
    access_token: data.access_token,
    expiry_date: data.expiry_date,
  })
  client.on('tokens', (tokens) => {
    if (!tokens.access_token) return
    sb.from('google_auth')
      .update({ access_token: tokens.access_token, expiry_date: tokens.expiry_date })
      .eq('id', data.id)
      .then(() => {})
  })
  return client
}

/** Create a 30-minute calendar event with an auto-generated Google
    Meet link, starting at `startISO`. Returns null when Google
    isn't connected — callers treat that exactly like "not
    persisted" everywhere else in this app: the task still saves,
    it just doesn't get a calendar entry. */
export async function createEventWithMeet(opts: {
  summary: string
  description?: string
  startISO: string
  durationMinutes?: number
}): Promise<{ eventId: string; meetUrl: string | null } | null> {
  const auth = await getClient()
  if (!auth) return null

  const calendar = google.calendar({ version: 'v3', auth })
  const start = new Date(opts.startISO)
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 30) * 60_000)
  const requestId = `bhumi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  return {
    eventId: data.id!,
    meetUrl: data.hangoutLink ?? null,
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const auth = await getClient()
  if (!auth) return
  const calendar = google.calendar({ version: 'v3', auth })
  await calendar.events.delete({ calendarId: 'primary', eventId }).catch(() => {})
}
