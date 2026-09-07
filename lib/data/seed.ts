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

/* Listings.

   Real inventory. The six illustrative parcels that used to sit here
   were removed — a listing is a representation about actual land, and
   demonstration records are a poor thing to leave where inventory
   belongs.

   Each entry states only what the source document actually says.
   Where a figure was not given it is left out rather than estimated,
   which is why these records are uneven: the layout has a conversion
   order number and no price, the flat has a price and no survey
   number. facts() in MarketplaceBrowser renders whichever are present.

   Owner names and signatures appear on the documents behind these
   listings and are deliberately not reproduced here. */
export const seedProperties: Property[] = [
  base({
    code: 'BLR-P-2601',
    title: 'Sanctioned residential layout, 23 plots, Doddasanne',
    property_type: 'land-parcels',
    location: 'Devanahalli',
    corridor: 'devanahalli',
    zone: 'North',
    status: 'Live',
    price_type: 'On Request',

    /* 1 acre 15.75 guntas. 40 guntas to the acre, and the layout's own
       area statement gives the metric equivalent as 5,640.23 sqm. */
    extent_acres: 1.39,
    price_per_acre_cr: 0,

    plots_total: 23,
    plot_size: '9.14m × 12.19m (30 × 40 ft) on 11 sites; 12 odd sites from 49.94 to 204.95 sqm',
    land_use: 'Residential (Ground + 1 floor, FAR restricted to 1.0)',
    zoning: 'Residential — final sanctioned layout',
    conversion: 'Converted',
    conversion_order: 'No. 34962 dated 29 March 2025',
    survey_number: 'Sy. No. 1/1, Doddasanne Village, Kasaba Hobli',
    road_type: '9m wide internal roads; existing 12m road on the western boundary widened to 18m',
    ownership: 'Single owner, layout sanctioned',
    engagement: 'Bhumi Estates is appointed for sales and marketing of this development.',
    use_cases: ['Own construction', 'Plot investment'],
    amenities:
      'Three parks totalling 565.79 sqm · civic amenity site 281.86 sqm · Devanahalli taluk, Bangalore Rural',
    description:
      'A finally sanctioned residential layout on Sy. No. 1/1 at Doddasanne, released as 23 individual plots. The parent parcel is 1 acre 15.75 guntas (5,640.23 sqm), of which 2,661.98 sqm is saleable residential, 2,130.60 sqm is road, 565.79 sqm is park and open space across three parks, and 281.86 sqm is the civic amenity site. Eleven plots are the standard 30 × 40 ft; the remaining twelve are odd sites ranging from 49.94 to 204.95 sqm. Construction is permitted to ground plus one floor with FAR restricted to 1.0. Conversion order No. 34962 dated 29 March 2025.',
    img_url: '/img/listings/doddasanne-layout.png',
    featured: true,
    risk: 'Low',
  }),

  base({
    code: 'BLR-R-2602',
    title: '3 BHK flat, 1,460 sq ft, ready to move — JP Nagar',
    property_type: 'residential',
    location: 'JP Nagar',
    zone: 'South',
    status: 'Live',
    price_type: 'Negotiable',

    extent_acres: 0,
    price_per_acre_cr: 0,
    built_up_sqft: 1460,
    price_total_cr: 2.2,
    price_per_sqft: 15068,

    unit_mix: '3 BHK',
    dimensions: '36.5 × 40 ft',
    facing: 'North-facing main doors, planned to Vastu',
    khata: 'A-Khata',
    authority: 'BDA',
    land_use: 'Residential',
    ownership: 'BDA property, A-Khata',
    conversion: 'Not applicable — built residential unit',
    road_type: 'Near East End signal, Jayanagar / JP Nagar',
    engagement: 'Bhumi Estates is handling the sale of this unit.',
    use_cases: ['End use', 'Premium residential investment'],
    amenities:
      'Interior work complete · car parking · lift · power backup · Cauvery water connection · borewell',
    description:
      'A ready-to-move 3 BHK of 1,460 sq ft near the East End signal, between Jayanagar and JP Nagar, on a 36.5 × 40 ft plot. Interior work is complete. The flat is planned to Vastu with north-facing main doors, and carries covered car parking, a lift, power backup, and both a Cauvery connection and borewell water. BDA property with A-Khata. Asking ₹2.20 crore, slightly negotiable.',
    img_url: '/img/listings/jp-nagar-3bhk.jpg',
    featured: true,
    risk: 'Low',
  }),
]

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
