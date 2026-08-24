import type {
  Property,
  VerificationCase,
  TransparencyStats,
  Lead,
  DataRoomRequest,
} from '@/lib/types'

/* ═══════════════════════════════════════════════════════════
   Seed / fallback content.

   The site must render correctly with no database attached —
   a demo, a preview deployment and a cold start all have to
   work (Plan §10, reliability as a design requirement). When
   Supabase credentials are present these records are replaced
   by live data; when they are absent they are what you see.
   ═══════════════════════════════════════════════════════════ */

const now = '2026-08-01T00:00:00.000Z'

/** Kept for building real listings — fills the fields a
    Property needs so a new entry only states what differs. */
export function base(p: Partial<Property>): Property {
  return {
    id: p.code!,
    code: p.code!,
    title: '',
    property_type: 'land-parcels',
    location: '',
    zone: 'North',
    status: 'Live',
    price_type: 'Negotiable',
    extent_acres: 0,
    price_per_acre_cr: 0,
    land_use: 'Residential',
    use_cases: [],
    road_type: '',
    dist_airport_km: 30,
    dist_city_km: 30,
    topo: 'Flat',
    soil: '',
    water: '',
    conversion: 'Not converted',
    ownership: 'Single owner',
    title_clear: true,
    risk: 'Low',
    risk_notes: '',
    description: '',
    amenities: '',
    img_url: '/img/p1.jpg',
    featured: false,
    conn_score: 70,
    created_at: now,
    ...p,
  } as Property
}

/* No listings yet.

   The marketplace is deliberately empty rather than seeded with
   illustrative parcels: a listing on this site is a representation
   about real land, and a placeholder that looks like inventory is
   worse than an honest empty state. Real parcels are added through
   the admin once they have been through the verification protocol. */
export const seedProperties: Property[] = []

export const seedVerificationCases: VerificationCase[] = []

/* Zeroed until there is a real record to publish. The public
   site does not render a statistics dashboard at all while these
   are zero — an empty chart is not a credibility signal. */
export const seedTransparency: TransparencyStats = {
  period: 'No completed engagements published yet',
  updated_at: now,
  parcels_reviewed: 0,
  parcels_verified: 0,
  parcels_flagged: 0,
  parcels_in_progress: 0,
  avg_turnaround_days: 0,
  median_turnaround_days: 0,
  acreage_reviewed: 0,
  flag_reasons: [],
  by_stage: [
    { stage: 'documents', cleared: 0, flagged: 0 },
    { stage: 'title', cleared: 0, flagged: 0 },
    { stage: 'site', cleared: 0, flagged: 0 },
    { stage: 'report', cleared: 0, flagged: 0 },
  ],
  methodology:
    'Once engagements complete, every parcel that enters stage 1 is counted here, including parcels later withdrawn by the client. A parcel is "flagged" when a stage produces a finding we consider disqualifying for the stated intent, not merely a defect that can be cured. Turnaround is measured from intake to the date the report is issued, excluding time spent waiting on a document only the client can supply. Figures are never restated downward.',
}

export const seedLeads: Lead[] = []

export const seedDataRoomRequests: DataRoomRequest[] = []
