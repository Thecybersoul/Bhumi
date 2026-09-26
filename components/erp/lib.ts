'use client'

/* ═══════════════════════════════════════════════════════════
   Client helpers for the admin ERP workspace.

   The web admin runs on exactly the same API as the mobile app,
   with the session cookie in place of the app's bearer token. So
   both surfaces show the same data, apply the same rules and write
   the same activity trail.
   ═══════════════════════════════════════════════════════════ */

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { ...(isForm || !init?.body ? {} : { 'Content-Type': 'application/json' }), ...init?.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/admin/login'
  }
  if (!res.ok) throw new ApiError((body as { error?: string }).error ?? `Request failed (${res.status})`)
  return body as T
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  put: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T,>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
}

/* ─── Shapes the pages share ─────────────────────────────── */

export interface Audited {
  created_by?: string | null
  updated_by?: string | null
  updated_at?: string | null
}

export interface Activity {
  id: string
  actor_id: string | null
  actor_name: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_label: string
  summary: string
  created_at: string
}

export type MeetingKind = 'In person' | 'Site visit' | 'Call' | 'Video call' | 'Discussion'
export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled'
export interface Meeting extends Audited {
  id: string
  title: string
  kind: MeetingKind
  scheduled_at: string
  duration_min: number
  location?: string
  attendees?: string
  status: MeetingStatus
  agenda?: string
  outcome?: string
  entity_type: string
  entity_id?: string | null
  entity_label?: string
  google_event_id?: string | null
  google_meet_url?: string | null
  created_at: string
}

export type DocEntity = 'property' | 'note' | 'transaction' | 'lead' | 'verification' | 'meeting' | 'task' | 'general'
export interface Doc {
  id: string
  entity_type: DocEntity
  entity_id: string | null
  entity_label: string
  name: string
  category: string
  mime: string
  bytes: number | null
  storage: 'supabase' | 'drive'
  path: string | null
  url: string | null
  created_by?: string | null
  created_at: string
}

export interface GoogleStatus {
  configured: boolean
  connected: boolean
  drive?: boolean
  services?: Record<'drive' | 'calendar' | 'meet' | 'gmail' | 'sheets', boolean>
  missing?: string[]
  account?: string
  email?: string | null
  connected_by?: string | null
  connected_at?: string | null
}

/* ─── Formatting ─────────────────────────────────────────── */

export function timeAgo(iso?: string | null) {
  if (!iso) return ''
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'

export function dayLabel(iso: string) {
  const d = new Date(iso)
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(d) - start(new Date())) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return ''
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** ISO ⇄ the value a <input type="datetime-local"> wants, in local time. */
export function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : '')

export const needsOutcome = (m: Meeting) =>
  m.status === 'Scheduled' && new Date(m.scheduled_at).getTime() + m.duration_min * 60_000 < Date.now()

/* What a Karnataka land deal runs on, in the order a buyer's lawyer
   asks for it. Kept identical to the app's list. */
export const DOC_CATEGORIES: Record<DocEntity, string[]> = {
  property: ['Title deed', 'EC', 'RTC / Pahani', 'Khata', 'Conversion order', 'Survey sketch', 'Mutation', 'Tax receipt', 'Layout plan', 'Photos', 'Other'],
  transaction: ['Agreement', 'Sale deed', 'Token receipt', 'KYC', 'Invoice', 'Other'],
  verification: ['Title deed', 'EC', 'RTC / Pahani', 'Survey sketch', 'Legal opinion', 'Report', 'Other'],
  lead: ['KYC', 'Requirement', 'Other'],
  note: ['Attachment'],
  meeting: ['Minutes', 'Photos', 'Other'],
  task: ['Attachment'],
  general: ['Other'],
}

export const MEETING_KINDS: MeetingKind[] = ['In person', 'Site visit', 'Call', 'Video call', 'Discussion']
export const KIND_TINT: Record<MeetingKind, string> = {
  'In person': '#0E3B2E',
  'Site visit': '#9E7833',
  Call: '#1B6FA8',
  'Video call': '#6B4FA8',
  Discussion: '#2F8462',
}

export const assetUrl = (u?: string | null) => (u ? u : '')
