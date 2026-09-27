import type { Contact } from './types'

/* Outside agents — the same vocabulary and commission maths as the web
   admin's components/erp/lib.ts and the server's lib/agents.ts.
   Money: deal values in ₹ crore, commissions in ₹ lakh (1 Cr = 100 L). */

export const AGENT_STATUSES = ['Preferred', 'Active', 'Inactive', 'Do not engage'] as const
export const AGENT_LINK_ROLES = ['Listing agent', 'Buyer’s agent', 'Seller’s agent', 'Co-broker', 'Referral', 'Mandate holder'] as const
export const SHARE_TYPES = ['Percent of our commission', 'Percent of deal value', 'Flat', 'Paid by their client'] as const
export const PAYOUT_STATUSES = ['Not due', 'Due', 'Invoiced', 'Paid', 'Waived'] as const
export const AGENT_SPECIALTIES = ['land-parcels', 'large-land-parcels', 'residential', 'villas', 'commercial', 'warehouses'] as const

export const isAgent = (c?: { roles?: string[] } | null) => !!c?.roles?.includes('Agent')

/** A contact tagged on a record, with an agent's terms (contact_links). */
export interface Involvement {
  id: string
  contact_id: string
  entity_type: string
  entity_id: string
  entity_label: string
  role: string
  share_type?: string
  share_value?: number | null
  payout_status?: string
  payout_amount_lakh?: number | null
  paid_at?: string | null
  payout_ref?: string
  notes?: string
  created_at?: string
  contact: (Pick<Contact, 'id' | 'name' | 'phone' | 'roles'> & { agency?: string; agent_status?: string; company?: string }) | null
}

export interface DealMoney {
  deal_value_cr?: number | null
  commission_type?: string
  commission_value?: number | null
}

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

export const payoutTone = (s?: string) => (s === 'Paid' ? 'verified' : s === 'Due' || s === 'Invoiced' ? 'pending' : s === 'Waived' ? 'cancelled' : 'new')
