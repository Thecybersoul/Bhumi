import type { Lead } from './types'

/* The lead vocabulary — the same lists as the web admin's
   components/erp/lib.ts and the server's lib/leads.ts. */

export const LEAD_PIPELINE = ['New', 'Contacted', 'Qualified', 'Visit', 'Negotiation'] as const
export const LEAD_OUTCOMES = ['Converted', 'Lost', 'Nurture'] as const
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
export const CONTACT_ROLES = ['Buyer', 'Seller', 'Landowner', 'Investor', 'Developer', 'Tenant', 'Agent', 'Lawyer', 'Surveyor', 'Other'] as const
export const SHOWN_STATUSES = ['Shortlisted', 'Shared', 'Visit planned', 'Visited', 'Interested', 'Not interested', 'Offer made'] as const
export const isSelling = (intent?: string | null) => intent === 'Sell' || intent === 'Rent out'

/** ₹ crore the way people say it: 85 L, 2.4 Cr, 18 Cr. */
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

/** A bare ten-digit Indian mobile gets +91, so tel: and WhatsApp both work. */
export function phoneE164(p?: string | null) {
  const d = String(p ?? '').replace(/\D/g, '')
  if (d.length === 10) return `91${d}`
  if (d.length === 11 && d.startsWith('0')) return `91${d.slice(1)}`
  return d
}
export const telUrl = (p?: string | null) => `tel:+${phoneE164(p)}`
export const waUrl = (p?: string | null, text?: string) => `https://wa.me/${phoneE164(p)}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const followUpDue = (l: Pick<Lead, 'next_follow_up_at' | 'stage'>) =>
  !!l.next_follow_up_at && leadIsOpen(l.stage) && new Date(l.next_follow_up_at).getTime() < new Date().setHours(23, 59, 59, 999)

/** "Tomorrow at 10:30" and friends, for the follow-up shortcuts. */
export function inDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(10, 30, 0, 0)
  return d.toISOString()
}

export const whenShort = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
