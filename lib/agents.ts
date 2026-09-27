import { createServiceClient, hasSupabase } from './supabase'
import type { PropertyTransaction } from './types'

/* ═══════════════════════════════════════════════════════════
   Agents (migration 016) — outside brokers who work alongside
   Bhumi Estates on a listing, a deal or a lead.

   An agent is a contact whose roles include 'Agent', plus an agent
   profile on the same row. What they did on a particular record —
   brought the listing, represent the buyer, referred the lead — and
   what they are owed for it, is a contact_links row. This file holds
   the vocabulary and the commission arithmetic, which the web admin
   (components/erp/lib.ts) and the app (mobile/src/lib/agents.ts)
   repeat for display; the server's numbers are the ones stored.
   ═══════════════════════════════════════════════════════════ */

export const AGENT_STATUSES = ['Preferred', 'Active', 'Inactive', 'Do not engage'] as const
/** The part an agent plays on a record. */
export const AGENT_LINK_ROLES = ['Listing agent', 'Buyer’s agent', 'Seller’s agent', 'Co-broker', 'Referral', 'Mandate holder'] as const
export const SHARE_TYPES = ['Percent of our commission', 'Percent of deal value', 'Flat', 'Paid by their client'] as const
export const PAYOUT_STATUSES = ['Not due', 'Due', 'Invoiced', 'Paid', 'Waived'] as const

export type ShareType = (typeof SHARE_TYPES)[number]
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number]

let ready = false
/** Migration 016 applied? Probed once per process until it is. */
export async function agentsReady(): Promise<boolean> {
  if (ready) return true
  if (!hasSupabase()) return false
  try {
    const { error } = await createServiceClient().from('contacts').select('agency').limit(1)
    ready = !error
  } catch {
    ready = false
  }
  return ready
}

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const num = (v: unknown) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v))

/** Agent-profile fields from a request body (only keys present). */
export function agentProfileFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if ('agency' in body) out.agency = str(body.agency, 160)
  if ('rera_number' in body) out.rera_number = str(body.rera_number, 80).toUpperCase()
  if ('operating_areas' in body) out.operating_areas = str(body.operating_areas, 400)
  if (Array.isArray(body.specialties)) out.specialties = (body.specialties as unknown[]).map((x) => str(x, 40)).filter(Boolean).slice(0, 10)
  if ('default_share_pct' in body) out.default_share_pct = num(body.default_share_pct)
  if ('agent_status' in body && (AGENT_STATUSES as readonly string[]).includes(String(body.agent_status))) out.agent_status = body.agent_status
  if ('rating' in body) {
    const r = num(body.rating)
    out.rating = r != null && r >= 1 && r <= 5 ? Math.round(r) : null
  }
  if ('gstin' in body) out.gstin = str(body.gstin, 20).toUpperCase()
  if ('pan' in body) out.pan = str(body.pan, 12).toUpperCase()
  return out
}

/** Involvement fields for a contact_links row (only keys present). */
export function involvementFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if ('share_type' in body) out.share_type = (SHARE_TYPES as readonly string[]).includes(String(body.share_type)) ? body.share_type : ''
  if ('share_value' in body) out.share_value = num(body.share_value)
  if ('payout_status' in body) out.payout_status = (PAYOUT_STATUSES as readonly string[]).includes(String(body.payout_status)) ? body.payout_status : ''
  if ('payout_amount_lakh' in body) out.payout_amount_lakh = num(body.payout_amount_lakh)
  if ('payout_ref' in body) out.payout_ref = str(body.payout_ref, 120)
  if ('notes' in body) out.notes = str(body.notes, 1000)
  if (out.payout_status === 'Paid' && !('paid_at' in body)) out.paid_at = new Date().toISOString()
  if (out.payout_status && out.payout_status !== 'Paid') out.paid_at = null
  return out
}

/* ─── Commission arithmetic, in ₹ lakh ──────────────────── */

type DealMoney = Pick<PropertyTransaction, 'deal_value_cr' | 'commission_type' | 'commission_value'>

/** Bhumi Estates' own commission on a deal. 1 crore = 100 lakh. */
export function ourCommissionLakh(d: DealMoney): number | null {
  if (d.commission_value == null) return null
  if (d.commission_type === 'Flat') return d.commission_value
  if (d.deal_value_cr == null) return null
  return (d.deal_value_cr * 100 * d.commission_value) / 100
}

/** What one agent is due on a deal, from their share terms. */
export function agentShareLakh(link: { share_type?: string | null; share_value?: number | null }, d: DealMoney): number | null {
  const v = link.share_value
  switch (link.share_type) {
    case 'Paid by their client':
      return 0
    case 'Flat':
      return v ?? null
    case 'Percent of deal value':
      return v != null && d.deal_value_cr != null ? (d.deal_value_cr * 100 * v) / 100 : null
    case 'Percent of our commission': {
      const ours = ourCommissionLakh(d)
      return v != null && ours != null ? (ours * v) / 100 : null
    }
    default:
      return null
  }
}

/* ─── Which agents work where ───────────────────────────── */

const STOP = new Set(['near', 'road', 'main', 'bengaluru', 'bangalore', 'karnataka', 'india', 'layout', 'nagar', 'city', 'area', 'and'])
export function placeWords(...t: (string | null | undefined)[]) {
  const out = new Set<string>()
  for (const s of t) for (const w of String(s ?? '').toLowerCase().split(/[^a-z0-9]+/)) if (w.length >= 4 && !STOP.has(w)) out.add(w)
  return out
}

export interface AgentLike {
  id: string
  name: string
  agency?: string | null
  operating_areas?: string | null
  specialties?: string[] | null
  agent_status?: string | null
  rating?: number | null
}

/** Agents who work a place and a property type, best first. Agents
    marked "Do not engage" are never suggested. */
export function agentsFor<T extends AgentLike>(agents: T[], where: { location?: string | null; corridor?: string | null; type?: string | null }, exclude: Set<string>, limit = 5) {
  const want = placeWords(where.location, where.corridor)
  return agents
    .filter((a) => !exclude.has(a.id) && a.agent_status !== 'Do not engage' && a.agent_status !== 'Inactive')
    .map((a) => {
      const reasons: string[] = []
      let score = 0
      const areas = placeWords(a.operating_areas)
      for (const w of want) {
        if (areas.has(w)) {
          score += 40
          reasons.push(w[0].toUpperCase() + w.slice(1))
          break
        }
      }
      if (where.type && a.specialties?.includes(where.type)) {
        score += 25
        reasons.push('Handles this type')
      }
      if (a.agent_status === 'Preferred') {
        score += 15
        reasons.push('Preferred')
      }
      if (a.rating) score += a.rating * 3
      return { item: a, score, reasons }
    })
    .filter((m) => m.score >= 40)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
}
