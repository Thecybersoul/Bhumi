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

export type DocEntity = 'property' | 'note' | 'transaction' | 'lead' | 'verification' | 'meeting' | 'task' | 'contact' | 'general'
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
  lead: ['KYC', 'Requirement', 'Brochure', 'Other'],
  contact: ['KYC', 'PAN', 'Aadhaar', 'Agreement', 'RERA certificate', 'Invoice', 'GST certificate', 'Other'],
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

/* ─── Leads, contacts, listings shown (migration 015) ────── */

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Visit' | 'Negotiation' | 'Converted' | 'Lost' | 'Nurture' | 'Closed'
/** The working pipeline, in order. Converted, Lost and Nurture sit to one side. */
export const LEAD_PIPELINE: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Visit', 'Negotiation']
export const LEAD_OUTCOMES: LeadStage[] = ['Converted', 'Lost', 'Nurture']
export const stageLabel = (s: string) => (s === 'Visit' ? 'Site visit' : s)
export const leadIsOpen = (s: string) => !['Converted', 'Lost', 'Closed'].includes(s)
export const LEAD_INTENTS = ['Buy', 'Sell', 'Lease', 'Rent out', 'Invest', 'Other'] as const
export const LEAD_PRIORITIES = ['Hot', 'Warm', 'Cold'] as const
export const LEAD_CHANNELS = ['Call', 'WhatsApp', 'Walk-in', 'Referral', 'Broker', 'Portal', 'Social media', 'Email', 'Form', 'Landing page', 'Other'] as const
export const LEAD_TIMELINES = ['Immediate', '1–3 months', '3–6 months', '6+ months', 'Just exploring'] as const
export const PROPERTY_TYPES = ['land-parcels', 'residential', 'villas', 'commercial', 'warehouses', 'large-land-parcels'] as const
export const TYPE_LABEL: Record<string, string> = {
  'land-parcels': 'Land',
  residential: 'Residential',
  villas: 'Villa',
  commercial: 'Commercial',
  warehouses: 'Warehouse',
  'large-land-parcels': 'Large land',
}
export const isSelling = (intent?: string | null) => intent === 'Sell' || intent === 'Rent out'

export interface Lead extends Audited {
  id: string
  name: string
  kind: string
  channel: string
  stage: LeadStage
  company?: string
  phone?: string
  email?: string
  notes?: string
  source?: string
  property_id?: string | null
  property_code?: string
  property_type?: string
  corridor?: string
  created_at: string
  contact_id?: string | null
  intent?: string
  budget_min_cr?: number | null
  budget_max_cr?: number | null
  size_requirement?: string
  locations?: string
  timeline?: string
  priority?: string
  assigned_to?: string
  next_follow_up_at?: string | null
  last_contacted_at?: string | null
  lost_reason?: string
  transaction_id?: string | null
  converted_at?: string | null
}

export const CONTACT_ROLES = ['Buyer', 'Seller', 'Landowner', 'Investor', 'Developer', 'Tenant', 'Agent', 'Lawyer', 'Surveyor', 'Other'] as const
export interface Contact extends Audited {
  id: string
  name: string
  phone: string
  alt_phone?: string
  email: string
  company?: string
  roles: string[]
  city?: string
  address?: string
  source?: string
  notes?: string
  created_at: string
  lead_count?: number
  open_leads?: number
  deal_count?: number
  /* Agent profile (migration 016). */
  agency?: string
  rera_number?: string
  operating_areas?: string
  specialties?: string[]
  default_share_pct?: number | null
  agent_status?: AgentStatus
  rating?: number | null
  gstin?: string
  pan?: string
  /* From /api/agents. */
  listings?: number
  leads?: number
  open_deals?: number
  closed_deals?: number
  owed_lakh?: number
  paid_lakh?: number
}

/* ─── Agents (migration 016) ─────────────────────────────── */

export const isAgent = (c?: { roles?: string[] | null } | null) => Boolean(c?.roles?.includes('Agent'))
export const AGENT_STATUSES = ['Preferred', 'Active', 'Inactive', 'Do not engage'] as const
export type AgentStatus = (typeof AGENT_STATUSES)[number]
export const AGENT_LINK_ROLES = ['Listing agent', 'Buyer’s agent', 'Seller’s agent', 'Co-broker', 'Referral', 'Mandate holder'] as const
export const SHARE_TYPES = ['Percent of our commission', 'Percent of deal value', 'Flat', 'Paid by their client'] as const
export const PAYOUT_STATUSES = ['Not due', 'Due', 'Invoiced', 'Paid', 'Waived'] as const
export type ShareType = (typeof SHARE_TYPES)[number] | ''
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number] | ''

/** A contact tagged on a record, with an agent's terms (contact_links). */
export interface Involvement {
  id: string
  contact_id: string
  entity_type: string
  entity_id: string
  entity_label: string
  role: string
  share_type?: ShareType
  share_value?: number | null
  payout_status?: PayoutStatus
  payout_amount_lakh?: number | null
  paid_at?: string | null
  payout_ref?: string
  notes?: string
  created_at: string
  contact: (Pick<Contact, 'id' | 'name' | 'phone' | 'email' | 'roles' | 'company'> & Partial<Pick<Contact, 'agency' | 'rera_number' | 'default_share_pct' | 'agent_status' | 'rating'>>) | null
}

export interface DealMoney {
  deal_value_cr?: number | null
  commission_type?: 'Percentage' | 'Flat' | string
  commission_value?: number | null
}

/** Our commission on a deal in ₹ lakh (1 crore = 100 lakh). Same maths as lib/agents.ts. */
export function ourCommissionLakh(d: DealMoney): number | null {
  if (d.commission_value == null) return null
  if (d.commission_type === 'Flat') return d.commission_value
  if (d.deal_value_cr == null) return null
  return d.deal_value_cr * d.commission_value
}
export function agentShareLakh(x: { share_type?: string | null; share_value?: number | null }, d: DealMoney): number | null {
  const v = x.share_value
  if (x.share_type === 'Paid by their client') return 0
  if (x.share_type === 'Flat') return v ?? null
  if (x.share_type === 'Percent of deal value') return v != null && d.deal_value_cr != null ? d.deal_value_cr * v : null
  if (x.share_type === 'Percent of our commission') {
    const ours = ourCommissionLakh(d)
    return v != null && ours != null ? (ours * v) / 100 : null
  }
  return null
}
/** ₹ lakh, or crore once it's that big. */
export function lakh(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n >= 100) return `₹${Number((n / 100).toFixed(2))} Cr`
  return `₹${Number(n.toFixed(2))} L`
}
export function shareLabel(x: { share_type?: string | null; share_value?: number | null }) {
  if (!x.share_type) return 'Terms not set'
  if (x.share_type === 'Paid by their client') return 'Paid by their client'
  if (x.share_type === 'Flat') return `${lakh(x.share_value)} flat`
  return `${x.share_value ?? '?'}% of ${x.share_type === 'Percent of deal value' ? 'deal value' : 'our commission'}`
}

export const SHOWN_STATUSES = ['Shortlisted', 'Shared', 'Visit planned', 'Visited', 'Interested', 'Not interested', 'Offer made'] as const
export interface Shown extends Audited {
  id: string
  lead_id: string
  property_id: string
  property_label: string
  status: (typeof SHOWN_STATUSES)[number]
  feedback?: string
  shared_at?: string | null
  visited_at?: string | null
  created_at: string
}

export interface MatchItem<T> {
  item: T
  score: number
  reasons: string[]
  concerns: string[]
  shown?: boolean
}

/** ₹ crore, the way people say it: 85 L, 2.4 Cr, 18 Cr. */
export function cr(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return ''
  if (n < 1) return `₹${Math.round(n * 100)} L`
  return n >= 10 ? `₹${Math.round(n)} Cr` : `₹${Number(n.toFixed(2))} Cr`
}
export function budget(min?: number | null, max?: number | null) {
  if (min != null && max != null) return min === max ? cr(min) : `${cr(min)} – ${cr(max).replace('₹', '')}`
  if (max != null) return `up to ${cr(max)}`
  if (min != null) return `from ${cr(min)}`
  return ''
}

/* Phone links. Numbers are stored as typed; these add +91 to a bare
   ten-digit Indian mobile so tel: and WhatsApp both work. */
export function phoneE164(p?: string | null) {
  const d = String(p ?? '').replace(/\D/g, '')
  if (d.length === 10) return `91${d}`
  if (d.length === 11 && d.startsWith('0')) return `91${d.slice(1)}`
  return d
}
export const telHref = (p?: string | null) => `tel:+${phoneE164(p)}`
export const waHref = (p?: string | null, text?: string) => `https://wa.me/${phoneE164(p)}${text ? `?text=${encodeURIComponent(text)}` : ''}`

/** A follow-up that is due today or already late. */
export const followUpDue = (l: Pick<Lead, 'next_follow_up_at' | 'stage'>) =>
  !!l.next_follow_up_at && leadIsOpen(l.stage) && new Date(l.next_follow_up_at).getTime() < new Date().setHours(23, 59, 59, 999)

/** The ERP assistant's entry points: sidebar, top bar and ⌘K. */
export const ASSISTANT = true
