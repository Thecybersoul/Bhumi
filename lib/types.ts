/* ═══════════════════════════════════════════════════════════
   Domain types — Bhumi Estates
   Structured around the Website Business Plan: five-service value
   chain, four-stage verification protocol, asset classes.
   ═══════════════════════════════════════════════════════════ */

/* ─── Asset classes (Plan §4) ────────────────────────────── */
export type PropertyTypeSlug =
  | 'commercial'
  | 'residential'
  | 'villas'
  | 'land-parcels'
  | 'warehouses'
  | 'large-land-parcels'

export type PropertyStatus = 'Live' | 'Reserved' | 'Sold'
export type PriceType = 'Fixed' | 'Negotiable' | 'On Request'
export type Zone = 'North' | 'East' | 'South' | 'West'

/* ─── Verification protocol ──────────────────────────────── */
/* Four stages, not six. Each one answers a question a buyer
   would actually ask out loud, which is what makes the status
   readable to somebody who is not a conveyancing lawyer. */
export type VerificationStageKey =
  | 'documents'
  | 'title'
  | 'site'
  | 'report'

export type StageStatus = 'Not started' | 'In progress' | 'Flagged' | 'Verified'

export interface VerificationStage {
  key: VerificationStageKey
  status: StageStatus
  completed_at?: string | null
  reviewer?: string
  note?: string
}

export interface VerificationCase {
  id: string
  reference: string
  property_id?: string | null
  parcel_label: string
  location: string
  survey_number?: string
  extent_acres?: number
  client_name?: string
  advisor?: string
  outcome: 'In progress' | 'Verified' | 'Flagged' | 'Withdrawn'
  stages: VerificationStage[]
  opened_at: string
  closed_at?: string | null
  flag_reason?: string
  turnaround_days?: number | null
}

/* ─── Property (all asset classes share one record) ──────── */
export interface Property {
  id: string
  code: string
  title: string
  property_type: PropertyTypeSlug
  location: string
  corridor?: string
  zone: Zone
  status: PropertyStatus
  price_type: PriceType

  /* Land-style measurement */
  extent_acres: number
  price_per_acre_cr: number

  /* Built-asset measurement (commercial / residential / villas / warehouses) */
  built_up_sqft?: number
  carpet_sqft?: number
  price_per_sqft?: number

  land_use: string
  use_cases: string[]
  road_type: string
  dist_airport_km: number
  dist_city_km: number
  topo: string
  soil: string
  water: string
  conversion: string
  ownership: string
  title_clear: boolean
  risk: 'Low' | 'Moderate' | 'High'
  risk_notes: string
  description: string
  amenities: string
  img_url: string
  featured: boolean
  conn_score: number
  created_at: string

  /* Type-specific diligence fields (Plan §4) */
  rera_number?: string
  occupancy_certificate?: boolean
  fire_noc?: boolean
  parking_ratio?: string
  unit_mix?: string
  floor_plates?: string
  plot_area_sqft?: number
  gated_community?: string
  survey_number?: string
  zoning?: string
  jda_ready?: boolean
  ceiling_height_m?: number
  floor_load_t_sqm?: number
  dock_count?: number
  power_load_kva?: number
  highway_access?: string
  logistics_zone?: string
  contiguous_status?: string
  data_room_gated?: boolean
  verified_stage?: VerificationStageKey | null
}

/* ─── Leads (Plan §7, §13) ───────────────────────────────── */
export type LeadKind =
  | 'Enquiry'
  | 'Site visit'
  | 'Verification review'
  | 'Data room'
  | 'Checklist download'
  | 'Tool result'
  | 'Listing request'
  | 'Advisor call'

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Visit' | 'Closed'

export interface Lead {
  id: string
  kind: LeadKind
  name: string
  company: string
  phone: string
  email: string
  property_id?: string | null
  property_code?: string
  property_type?: PropertyTypeSlug
  corridor?: string
  source: string
  channel: 'WhatsApp' | 'Form' | 'Call' | 'Landing page'
  stage: LeadStage
  payload?: Record<string, string | number | boolean>
  notes: string
  created_at: string
}

/* Legacy alias — older admin code refers to Enquiry */
export type Enquiry = Lead & { intent?: string }

/* ─── Data room (Plan §9) ────────────────────────────────── */
export interface DataRoomRequest {
  id: string
  parcel_code: string
  parcel_label: string
  name: string
  organisation: string
  role: string
  email: string
  phone: string
  buyer_type: 'Developer' | 'Investor' | 'Family office' | 'Institution' | 'Other'
  ticket_size: string
  nda_accepted: boolean
  status: 'Pending' | 'Approved' | 'Declined'
  assigned_advisor?: string
  created_at: string
}

/* ─── Content ────────────────────────────────────────────── */
export interface Corridor {
  slug: string
  name: string
  zone: Zone
  headline: string
  summary: string
  drivers: string[]
  infrastructure: { label: string; detail: string; status: string }[]
  price_low: number
  price_high: number
  price_unit: string
  yoy_pct: number
  best_for: PropertyTypeSlug[]
  watch_outs: string[]
  map: { x: number; y: number }
  updated: string
}

export interface CaseStudy {
  slug: string
  title: string
  corridor: string
  property_type: PropertyTypeSlug
  pillars: string[]
  summary: string
  parcel: { label: string; value: string }[]
  journey: { stage: string; detail: string }[]
  results: { label: string; value: string; note?: string }[]
  published: string
}

export interface Insight {
  slug: string
  title: string
  category: string
  excerpt: string
  body: { heading?: string; text: string }[]
  author: string
  published: string
  read_minutes: number
  corridor?: string
}

/* ─── Transparency dashboard (Plan §3A) ──────────────────── */
export interface TransparencyStats {
  period: string
  updated_at: string
  parcels_reviewed: number
  parcels_verified: number
  parcels_flagged: number
  parcels_in_progress: number
  avg_turnaround_days: number
  median_turnaround_days: number
  flag_reasons: { reason: string; count: number }[]
  by_stage: { stage: VerificationStageKey; cleared: number; flagged: number }[]
  acreage_reviewed: number
  methodology: string
}
