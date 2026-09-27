import type { LeadChannel, LeadIntent, LeadKind, LeadPriority, LeadStage, PropertyTypeSlug } from './types'

/* The vocabulary a lead is written in, shared by every leads route.
   The web admin (components/erp/lib.ts) and the app (mobile/src/lib)
   carry the same lists for their pickers. */

export const LEAD_KINDS: LeadKind[] = ['Enquiry', 'Site visit', 'Verification review', 'Data room', 'Checklist download', 'Tool result', 'Listing request', 'Advisor call']
export const LEAD_STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Visit', 'Negotiation', 'Converted', 'Lost', 'Nurture']
/** Stages accepted from clients built before migration 015. */
const LEGACY_STAGES: LeadStage[] = ['Closed']
export const LEAD_INTENTS: LeadIntent[] = ['Buy', 'Sell', 'Lease', 'Rent out', 'Invest', 'Other']
export const LEAD_PRIORITIES: LeadPriority[] = ['Hot', 'Warm', 'Cold']
export const LEAD_CHANNELS: LeadChannel[] = ['WhatsApp', 'Form', 'Call', 'Landing page', 'Walk-in', 'Referral', 'Broker', 'Portal', 'Social media', 'Email', 'Other']
export const PROPERTY_TYPES: PropertyTypeSlug[] = ['commercial', 'residential', 'villas', 'land-parcels', 'warehouses', 'large-land-parcels']

export const isStage = (v: unknown): v is LeadStage => LEAD_STAGES.includes(v as LeadStage) || LEGACY_STAGES.includes(v as LeadStage)

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const num = (v: unknown) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v))
const when = (v: unknown) => (v ? new Date(String(v)).toISOString() : null)

/** The fields an advisor can set on a lead (migration 015), from a
    request body. Only keys actually present are returned, so a PUT
    that sends one field changes one field. */
export function leadFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const has = (k: string) => k in body
  if (has('name') && str(body.name, 160)) out.name = str(body.name, 160)
  if (has('company')) out.company = str(body.company, 160)
  if (has('phone')) out.phone = str(body.phone, 40)
  if (has('email')) out.email = str(body.email, 160).toLowerCase()
  if (has('kind') && LEAD_KINDS.includes(body.kind as LeadKind)) out.kind = body.kind
  if (has('channel') && LEAD_CHANNELS.includes(body.channel as LeadChannel)) out.channel = body.channel
  if (has('source')) out.source = str(body.source, 120)
  if (has('stage') && isStage(body.stage)) out.stage = body.stage
  if (has('intent') && LEAD_INTENTS.includes(body.intent as LeadIntent)) out.intent = body.intent
  if (has('priority') && LEAD_PRIORITIES.includes(body.priority as LeadPriority)) out.priority = body.priority
  if (has('property_type')) out.property_type = PROPERTY_TYPES.includes(body.property_type as PropertyTypeSlug) ? body.property_type : ''
  if (has('property_id')) out.property_id = body.property_id ? String(body.property_id) : null
  if (has('property_code')) out.property_code = str(body.property_code, 40)
  if (has('corridor')) out.corridor = str(body.corridor, 60)
  if (has('locations')) out.locations = str(body.locations, 300)
  if (has('size_requirement')) out.size_requirement = str(body.size_requirement, 120)
  if (has('timeline')) out.timeline = str(body.timeline, 60)
  if (has('budget_min_cr')) out.budget_min_cr = num(body.budget_min_cr)
  if (has('budget_max_cr')) out.budget_max_cr = num(body.budget_max_cr)
  if (has('assigned_to')) out.assigned_to = str(body.assigned_to, 80)
  if (has('next_follow_up_at')) out.next_follow_up_at = when(body.next_follow_up_at)
  if (has('last_contacted_at')) out.last_contacted_at = when(body.last_contacted_at)
  if (has('lost_reason')) out.lost_reason = str(body.lost_reason, 400)
  if (has('notes')) out.notes = str(body.notes, 4000)
  if (has('contact_id')) out.contact_id = body.contact_id ? String(body.contact_id) : null
  return out
}

/** Side effects of a stage change that the client shouldn't have to
    remember: the first move out of New is the first contact. */
export function stageEffects(stage: LeadStage, before?: { stage?: string; last_contacted_at?: string | null }): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (stage !== 'New' && before?.stage === 'New' && !before.last_contacted_at) out.last_contacted_at = new Date().toISOString()
  if (stage === 'Converted' || stage === 'Lost') out.next_follow_up_at = null
  return out
}
