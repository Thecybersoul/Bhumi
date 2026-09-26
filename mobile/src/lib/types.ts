/* Mirrors the ERP-relevant subset of lib/types.ts in the web repo,
   by hand — the two don't share a build step. Marketing-site
   content types (Corridor, CaseStudy, Insight, TransparencyStats)
   are deliberately left out; the app doesn't touch that surface. */

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

export type VerificationStageKey = 'documents' | 'title' | 'site' | 'report'
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
  extent_acres: number
  price_per_acre_cr: number
  built_up_sqft?: number
  price_per_sqft?: number
  price_total_cr?: number
  img_url: string
  verified_stage?: VerificationStageKey | null
  created_at: string
}

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
  property_code?: string
  source: string
  channel: 'WhatsApp' | 'Form' | 'Call' | 'Landing page'
  stage: LeadStage
  payload?: Record<string, string | number | boolean>
  notes: string
  created_at: string
}

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

export type TransactionStage = 'Enquiry' | 'Negotiation' | 'Agreement' | 'Registration' | 'Closed'
export type TransactionOutcome = 'In progress' | 'Closed' | 'Lost'
export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled'
export type CommissionType = 'Percentage' | 'Flat'
export type Representing = 'Buyer' | 'Seller' | 'Both'

export interface TransactionMeeting {
  id: string
  title: string
  with: string
  scheduled_at: string
  status: MeetingStatus
  notes?: string
  /* Populated once a meeting is synced to Google Calendar — see
     src/lib/calendar.ts. Absent until then. */
  google_event_id?: string
  google_meet_url?: string
}

export interface PropertyTransaction {
  id: string
  reference: string
  property_id?: string | null
  property_label: string
  off_market: boolean
  stage: TransactionStage
  outcome: TransactionOutcome
  buyer_name: string
  buyer_phone?: string
  seller_name: string
  seller_phone?: string
  representing: Representing
  deal_value_cr?: number | null
  commission_type: CommissionType
  commission_value?: number | null
  commission_collected: boolean
  advisor?: string
  meetings: TransactionMeeting[]
  notes?: string
  opened_at: string
  closed_at?: string | null
  lost_reason?: string
}

export type LinkedEntityType = 'lead' | 'transaction' | 'property' | 'verification' | 'general'

export interface Note {
  id: string
  entity_type: LinkedEntityType
  entity_id?: string | null
  entity_label?: string
  body: string
  author?: string
  created_at: string
}

export type TaskStatus = 'Open' | 'Done'
export type TaskPriority = 'Low' | 'Normal' | 'High'

export interface Task {
  id: string
  title: string
  entity_type: LinkedEntityType
  entity_id?: string | null
  entity_label?: string
  due_at?: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee?: string
  created_at: string
  completed_at?: string | null
  /* Same Google Calendar sync fields as a transaction meeting — a
     task with a due date can optionally become a calendar event. */
  google_event_id?: string
  google_meet_url?: string
}

export interface ApiResult<T> {
  data: T
  source: 'live' | 'fallback'
}
