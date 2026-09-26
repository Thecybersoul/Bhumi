import { google } from 'googleapis'
import { createServiceClient, hasSupabase } from './supabase'

/* ═══════════════════════════════════════════════════════════
   Google Workspace: Calendar, Meet, Drive, Gmail and Sheets, all
   through one company account (info@bhumiestates.in).

   Same degrade-gracefully shape as Supabase in this codebase:
   nothing here throws when it isn't configured — every caller
   checks hasGoogleAuth()/isConnected() first and the feature is
   simply unavailable (a task just doesn't sync) rather than the
   app breaking. One admin, one Google account: `google_auth` is a
   single-row table, not a per-user table — there's one shared
   inbox to schedule against, matching how ADMIN_EMAIL/PASSWORD is
   one shared login rather than per-user accounts.
   ═══════════════════════════════════════════════════════════ */

/* drive.file, not drive: the app can only see and touch files it
   created itself (plus ones the admin explicitly opens with it), so
   connecting Drive never exposes the rest of the account. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

/* What each service needs. Deliberately narrow:
   - gmail.send can send mail as the company account but cannot read
     the mailbox;
   - Sheets needs no scope of its own: drive.file already covers
     spreadsheets this app created;
   - Meet: the app can create meeting spaces, and can read attendance
     for the account's meetings. */
export const SERVICE_SCOPES = {
  calendar: 'https://www.googleapis.com/auth/calendar.events',
  drive: DRIVE_SCOPE,
  sheets: DRIVE_SCOPE,
  gmail: 'https://www.googleapis.com/auth/gmail.send',
  meet: 'https://www.googleapis.com/auth/meetings.space.created',
  meetRead: 'https://www.googleapis.com/auth/meetings.space.readonly',
} as const
export type GoogleService = keyof typeof SERVICE_SCOPES

const SCOPES = ['openid', 'https://www.googleapis.com/auth/userinfo.email', ...new Set(Object.values(SERVICE_SCOPES))]

/** The one Google account the whole ERP runs on. Every admin shares
    it: whoever connects it, it is connected for everyone. */
export const WORKSPACE_EMAIL = (process.env.GOOGLE_WORKSPACE_EMAIL || 'info@bhumiestates.in').toLowerCase()
const ROOT_FOLDER = 'Bhumi Estates ERP'

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
export function getAuthUrl(state?: string): string {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: SCOPES,
    login_hint: WORKSPACE_EMAIL,
    state,
  })
}

/** Exchange the OAuth callback's `code` for tokens and store them.
    Single-row table: whatever was there before this connection is
    replaced, since only one Google account is meant to be linked. */
export async function exchangeCodeAndStore(code: string, connectedBy: string): Promise<{ email: string }> {
  const client = oauthClient()
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  // Only the company account may be connected. Signing in with any
  // other Google account is refused and its grant revoked, so a
  // personal Drive can never end up holding company documents.
  const { data: me } = await google.oauth2({ version: 'v2', auth: client }).userinfo.get()
  const email = (me.email ?? '').toLowerCase()
  if (email !== WORKSPACE_EMAIL) {
    await client.revokeCredentials().catch(() => {})
    throw new Error(`Signed in as ${email || 'an unknown account'}. Connect ${WORKSPACE_EMAIL} instead.`)
  }
  if (!tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Remove "Bhumi Estates" from the Google account third-party access list and connect again.'
    )
  }

  const sb = createServiceClient()
  await sb.from('google_auth').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error } = await sb.from('google_auth').insert({
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    expiry_date: tokens.expiry_date,
    scope: tokens.scope ?? '',
    connected_email: email,
    connected_by: connectedBy,
  })
  if (error) throw new Error(error.message)
  return { email }
}

/** Which account is connected, by whom, and since when. */
export async function connectionInfo(): Promise<{ email: string; connected_by: string; connected_at: string } | null> {
  if (!hasSupabase()) return null
  try {
    const { data } = await createServiceClient()
      .from('google_auth')
      .select('connected_email,connected_by,connected_at')
      .limit(1)
      .maybeSingle()
    return data ? { email: data.connected_email ?? '', connected_by: data.connected_by ?? '', connected_at: data.connected_at } : null
  } catch {
    return null
  }
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

/** The scopes the stored connection was actually granted. A
    connection made before a service was added lacks that service
    until someone reconnects. */
async function grantedScopes(): Promise<string> {
  if (!hasGoogleAuth() || !hasSupabase()) return ''
  try {
    const { data } = await createServiceClient().from('google_auth').select('scope').limit(1).maybeSingle()
    return String(data?.scope ?? '')
  } catch {
    return ''
  }
}

export async function hasService(service: GoogleService): Promise<boolean> {
  return (await grantedScopes()).includes(SERVICE_SCOPES[service])
}

/** Every service, on or off — for the status screen. */
export async function serviceStatus(): Promise<Record<'calendar' | 'drive' | 'sheets' | 'gmail' | 'meet', boolean>> {
  const g = await grantedScopes()
  const has = (s: GoogleService) => g.includes(SERVICE_SCOPES[s])
  return { calendar: has('calendar'), drive: has('drive'), sheets: has('sheets'), gmail: has('gmail'), meet: has('meet') }
}

export async function hasDrive(): Promise<boolean> {
  return hasService('drive')
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
export async function getClient() {
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

/** Create a calendar event starting at `startISO` on the shared
    account's primary calendar, with an auto-generated Google Meet link
    unless `meet` is false (an in-person meeting has no need of one).
    Returns null when Google isn't connected — callers treat that exactly
    like "not persisted" everywhere else in this app: the record still
    saves, it just doesn't get a calendar entry. */
export async function createEventWithMeet(opts: {
  summary: string
  description?: string
  location?: string
  startISO: string
  durationMinutes?: number
  meet?: boolean
}): Promise<{ eventId: string; meetUrl: string | null } | null> {
  const auth = await getClient()
  if (!auth) return null

  const calendar = google.calendar({ version: 'v3', auth })
  const start = new Date(opts.startISO)
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 30) * 60_000)
  const requestId = `bhumi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const withMeet = opts.meet !== false

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: withMeet ? 1 : 0,
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      location: opts.location || undefined,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      conferenceData: withMeet
        ? { createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } }
        : undefined,
    },
  })

  return {
    eventId: data.id!,
    meetUrl: data.hangoutLink ?? null,
  }
}

/** Move or retitle an existing event (a rescheduled meeting). */
export async function updateEvent(
  eventId: string,
  opts: { summary?: string; description?: string; location?: string; startISO?: string; durationMinutes?: number }
): Promise<void> {
  const auth = await getClient()
  if (!auth) return
  const calendar = google.calendar({ version: 'v3', auth })
  const body: Record<string, unknown> = {}
  if (opts.summary) body.summary = opts.summary
  if (opts.description !== undefined) body.description = opts.description
  if (opts.location !== undefined) body.location = opts.location
  if (opts.startISO) {
    const start = new Date(opts.startISO)
    body.start = { dateTime: start.toISOString() }
    body.end = { dateTime: new Date(start.getTime() + (opts.durationMinutes ?? 30) * 60_000).toISOString() }
  }
  await calendar.events.patch({ calendarId: 'primary', eventId, requestBody: body }).catch(() => {})
}

export async function deleteEvent(eventId: string): Promise<void> {
  const auth = await getClient()
  if (!auth) return
  const calendar = google.calendar({ version: 'v3', auth })
  await calendar.events.delete({ calendarId: 'primary', eventId }).catch(() => {})
}

/* ─── Drive ─────────────────────────────────────────────────
   Layout, all under the one company account:

     Bhumi Estates ERP/
       Listings/      BLR-P-2601 · Sanctioned layout, Doddasanne/
                        Title deed/  EC/  Khata/  Survey sketch/ …
       Deals/         TXN-2026-4821 · 3 BHK, JP Nagar/
                        Agreement/  Sale deed/  KYC/ …
       Meetings/      2026-09 September/
       Notes/         2026-09 September/
       Verification/  Leads/  Tasks/

   Each listing or deal gets its own folder. The folder is found by a
   hidden tag (appProperties bhumiEntity = "property:<id>"), not by
   its name, so renaming a listing renames its folder rather than
   starting a new one. Uploads are resumable sessions: the server
   opens the session with its credentials and hands the session URL
   to the client, which sends the bytes straight to Google. Nothing
   large passes through this server, which matters on a host with a
   small request-body limit. */

type Drive = ReturnType<typeof google.drive>
const FOLDER = 'application/vnd.google-apps.folder'
const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

async function findOrCreateFolder(drive: Drive, name: string, parent?: string): Promise<string> {
  const q = [
    `name = '${esc(name)}'`,
    `mimeType = '${FOLDER}'`,
    'trashed = false',
    parent ? `'${parent}' in parents` : "'root' in parents",
  ].join(' and ')
  const { data } = await drive.files.list({ q, fields: 'files(id)', pageSize: 1 })
  if (data.files?.[0]?.id) return data.files[0].id
  const { data: created } = await drive.files.create({
    requestBody: { name, mimeType: FOLDER, parents: parent ? [parent] : undefined },
    fields: 'id',
  })
  return created.id!
}

/** The record's own folder, created on first use and renamed if the
    record's label has changed since. */
async function recordFolder(drive: Drive, section: string, tag: string, label: string): Promise<{ id: string; url: string }> {
  const root = await findOrCreateFolder(drive, ROOT_FOLDER)
  const parent = await findOrCreateFolder(drive, section, root)
  const name = (label || 'Untitled').replace(/[\\/]/g, '-').slice(0, 120)
  const { data } = await drive.files.list({
    q: `appProperties has { key='bhumiEntity' and value='${esc(tag)}' } and mimeType = '${FOLDER}' and trashed = false`,
    fields: 'files(id,name,webViewLink)',
    pageSize: 1,
  })
  const found = data.files?.[0]
  if (found?.id) {
    if (found.name !== name) await drive.files.update({ fileId: found.id, requestBody: { name } }).catch(() => {})
    return { id: found.id, url: found.webViewLink ?? `https://drive.google.com/drive/folders/${found.id}` }
  }
  const { data: created } = await drive.files.create({
    requestBody: { name, mimeType: FOLDER, parents: [parent], appProperties: { bhumiEntity: tag } },
    fields: 'id,webViewLink',
  })
  return { id: created.id!, url: created.webViewLink ?? `https://drive.google.com/drive/folders/${created.id}` }
}

const MONTH = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'long' })}`
}

/* Listings, deals and verification cases are case files and get a
   folder each; notes, meetings, tasks and leads are filed by month. */
const PER_RECORD = new Set(['property', 'transaction', 'verification'])

async function destinationFolder(
  drive: Drive,
  opts: { section: string; entityType: string; entityId?: string | null; label: string; category?: string }
): Promise<string> {
  let folder: string
  if (PER_RECORD.has(opts.entityType) && opts.entityId) {
    folder = (await recordFolder(drive, opts.section, `${opts.entityType}:${opts.entityId}`, opts.label)).id
  } else {
    const root = await findOrCreateFolder(drive, ROOT_FOLDER)
    folder = await findOrCreateFolder(drive, MONTH(), await findOrCreateFolder(drive, opts.section, root))
  }
  const category = opts.category && !['Other', 'Attachment'].includes(opts.category) ? opts.category : null
  return category && PER_RECORD.has(opts.entityType) ? findOrCreateFolder(drive, category.replace(/[\\/]/g, '-'), folder) : folder
}

/** The id of the "Bhumi Estates ERP" folder at the top of the Drive. */
export async function erpRootFolderId(): Promise<string | null> {
  const auth = await getClient()
  if (!auth) return null
  return findOrCreateFolder(google.drive({ version: 'v3', auth }), ROOT_FOLDER)
}

/** A listing's or deal's Drive folder, created if it doesn't exist.
    Null when Drive isn't connected. */
export async function ensureRecordFolder(opts: {
  section: string
  entityType: string
  entityId: string
  label: string
}): Promise<{ id: string; url: string } | null> {
  if (!(await hasDrive())) return null
  const auth = await getClient()
  if (!auth) return null
  return recordFolder(google.drive({ version: 'v3', auth }), opts.section, `${opts.entityType}:${opts.entityId}`, opts.label)
}

export async function startDriveUpload(opts: {
  section: string
  entityType: string
  entityId?: string | null
  record: string
  category?: string
  name: string
  mime: string
  bytes?: number
  uploadedBy?: string
}): Promise<{ uploadUrl: string } | null> {
  const auth = await getClient()
  if (!auth) return null
  const drive = google.drive({ version: 'v3', auth })
  const folder = await destinationFolder(drive, {
    section: opts.section,
    entityType: opts.entityType,
    entityId: opts.entityId,
    label: opts.record,
    category: opts.category,
  })

  const { token } = await auth.getAccessToken()
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': opts.mime || 'application/octet-stream',
      ...(opts.bytes ? { 'X-Upload-Content-Length': String(opts.bytes) } : {}),
    },
    body: JSON.stringify({
      name: opts.name,
      parents: [folder],
      description: [
        opts.category && opts.category !== 'Attachment' ? opts.category : null,
        opts.record ? `${opts.section.replace(/s$/, '')}: ${opts.record}` : null,
        `Uploaded${opts.uploadedBy ? ` by ${opts.uploadedBy}` : ''} via the Bhumi Estates ERP, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ]
        .filter(Boolean)
        .join('\n'),
      appProperties: {
        bhumiEntity: `${opts.entityType}:${opts.entityId ?? ''}`.slice(0, 120),
        ...(opts.uploadedBy ? { bhumiUploadedBy: opts.uploadedBy.slice(0, 60) } : {}),
      },
    }),
  })
  const uploadUrl = res.headers.get('location')
  if (!res.ok || !uploadUrl) throw new Error(`Drive refused the upload (${res.status})`)
  return { uploadUrl }
}

export async function getDriveFile(
  fileId: string
): Promise<{ id: string; name: string; mime: string; bytes: number | null; url: string } | null> {
  const auth = await getClient()
  if (!auth) return null
  const drive = google.drive({ version: 'v3', auth })
  const { data } = await drive.files.get({ fileId, fields: 'id,name,mimeType,size,webViewLink' })
  return {
    id: data.id!,
    name: data.name ?? 'Untitled',
    mime: data.mimeType ?? '',
    bytes: data.size ? Number(data.size) : null,
    url: data.webViewLink ?? `https://drive.google.com/file/d/${data.id}/view`,
  }
}

/** Moves the file to Drive's trash rather than deleting it outright,
    so removing a document in the ERP is recoverable for 30 days. */
export async function trashDriveFile(fileId: string): Promise<void> {
  const auth = await getClient()
  if (!auth) return
  const drive = google.drive({ version: 'v3', auth })
  await drive.files.update({ fileId, requestBody: { trashed: true } }).catch(() => {})
}
