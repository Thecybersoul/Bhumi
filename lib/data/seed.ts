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

/* Reference listings.

   These are illustrative records used to populate the marketplace
   and the homepage carousel while real inventory is onboarded. They
   are replaced wholesale the moment Supabase credentials are
   attached — see read() in lib/db.ts. */
export const seedProperties: Property[] = [
  base({
    code: 'BLR-L-1042',
    title: '68 acres with NH-44 frontage, airport corridor',
    property_type: 'large-land-parcels',
    location: 'Devanahalli',
    corridor: 'devanahalli',
    zone: 'North',
    extent_acres: 68,
    price_per_acre_cr: 9.5,
    price_type: 'Negotiable',
    land_use: 'Residential / Mixed',
    use_cases: ['Township', 'Villa', 'Land-banking'],
    road_type: 'NH-44 frontage, 850m',
    dist_airport_km: 15,
    dist_city_km: 38,
    topo: 'Flat',
    soil: 'Red loam',
    water: 'Borewell, good table',
    conversion: 'Not converted — conversion position assessed',
    ownership: 'Assembly: 9 survey numbers, 14 owners',
    survey_number: 'Sy. 44/2, 44/3, 45/1 (+6)',
    zoning: 'Residential / mixed under the applicable master plan',
    contiguous_status: 'Fully contiguous across 9 survey numbers',
    jda_ready: true,
    data_room_gated: true,
    verified_stage: 'report',
    risk: 'Low',
    risk_notes: 'No rajakaluve or lake buffer intersecting the assembly. PRR alignment confirmed clear of all 9 survey numbers.',
    description:
      'An assembled institutional-scale holding on the airport corridor, verified end to end across all nine survey numbers. Full information memorandum — survey documents, verification report and pricing — available to verified buyers via the data room.',
    amenities: 'International airport 15km · KIADB 8km · Metro Blue Line extension corridor · PRR Phase 1',
    img_url: '/img/p1.jpg',
    featured: true,
    conn_score: 88,
  }),
  base({
    code: 'BLR-L-1037',
    title: '22 acres, lake-adjacent, converted',
    property_type: 'land-parcels',
    location: 'Sarjapur',
    corridor: 'sarjapur',
    zone: 'East',
    extent_acres: 22,
    price_per_acre_cr: 6.2,
    price_type: 'Fixed',
    land_use: 'Residential',
    use_cases: ['Villa', 'Resort'],
    road_type: '60ft approach road, recorded access',
    dist_airport_km: 52,
    dist_city_km: 24,
    topo: 'Gently sloping',
    soil: 'Red loam',
    water: 'Cauvery supply in the vicinity',
    conversion: 'Converted (NA)',
    ownership: 'Single owner',
    survey_number: 'Sy. 118/4',
    zoning: 'Residential',
    jda_ready: true,
    verified_stage: 'report',
    risk: 'Low',
    risk_notes: 'Lake buffer setback of 30m confirmed and respected. Usable extent stated net of setback.',
    description:
      'A converted parcel adjoining a lake, suited to a premium villa community or boutique hospitality use. The 30m buffer is confirmed on survey and the extent quoted is net of it — the gross figure other listings quote for this parcel is not the buildable one.',
    amenities: 'Whitefield 12km · ORR employment belt 6km · International schools 4km',
    img_url: '/img/p2.jpg',
    featured: true,
    conn_score: 81,
  }),
  base({
    code: 'BLR-W-2011',
    title: 'Grade A warehouse, 182,000 sq ft, highway frontage',
    property_type: 'warehouses',
    location: 'Hoskote',
    corridor: 'hoskote',
    zone: 'East',
    extent_acres: 8.4,
    price_per_acre_cr: 0,
    built_up_sqft: 182000,
    price_per_sqft: 34,
    price_type: 'On Request',
    land_use: 'Industrial',
    use_cases: ['Warehousing', '3PL', 'Light manufacturing'],
    road_type: 'NH-75 frontage with service road access',
    dist_airport_km: 45,
    dist_city_km: 28,
    topo: 'Flat',
    soil: 'Load-bearing, rocky base',
    water: 'Borewell x2',
    conversion: 'Converted, industrial',
    ownership: 'Single owner (company)',
    ceiling_height_m: 11.2,
    floor_load_t_sqm: 6,
    dock_count: 18,
    power_load_kva: 750,
    highway_access: 'NH-75 with 26m concrete apron; 40ft trailer turning verified on site',
    logistics_zone: 'Notified industrial; KIADB area 10km',
    zoning: 'Industrial',
    verified_stage: 'report',
    risk: 'Low',
    risk_notes: 'Clear height verified at eaves at 6 points. Fire NOC confirmed for the stated storage category.',
    description:
      'Grade A specification confirmed by measurement rather than by brochure: 11.2m clear height at eaves supporting six racking levels, an FM2 floor rated at 6 T/sqm, 18 docks against a 182,000 sq ft footprint, and 750 KVA sanctioned.',
    amenities: 'NH-75 frontage · STRR 5km · KIADB industrial area 10km · rail siding 18km',
    img_url: '/img/p3.jpg',
    featured: true,
    conn_score: 79,
  }),
  base({
    code: 'BLR-C-3004',
    title: 'Commercial building, 46,000 sq ft, OC in hand',
    property_type: 'commercial',
    location: 'Tumkur Road',
    corridor: 'tumakuru-road',
    zone: 'West',
    extent_acres: 1.1,
    price_per_acre_cr: 0,
    built_up_sqft: 46000,
    price_per_sqft: 9200,
    price_type: 'Negotiable',
    land_use: 'Commercial',
    use_cases: ['Office', 'Showroom', 'Mixed commercial'],
    road_type: 'NH-48 frontage, 400m',
    dist_airport_km: 55,
    dist_city_km: 22,
    topo: 'Flat',
    soil: 'Hard strata',
    water: 'Cauvery connection',
    conversion: 'Converted (NA)',
    ownership: 'Single owner',
    occupancy_certificate: true,
    fire_noc: true,
    parking_ratio: '1.1 bays per 1,000 sq ft, matching sanctioned count',
    floor_plates: '11,500 sq ft plates, central core, 8.4m column grid',
    zoning: 'Commercial',
    verified_stage: 'report',
    risk: 'Low',
    risk_notes: 'OC confirmed against the as-built configuration. Sanctioned-plan deviation measured at under 2% of built area.',
    description:
      'Highway-frontage commercial building with the occupancy certificate covering the building as it stands today, not as it was originally sanctioned. Fire NOC matches the present internal layout. Parking bays counted on site against the sanctioned count.',
    amenities: 'NH-48 frontage · PRR Phase 1 corridor · Dabaspet industrial area 8km',
    img_url: '/img/p4.jpg',
    featured: false,
    conn_score: 76,
  }),
  base({
    code: 'BLR-V-4008',
    title: 'Gated villa community, 3,150 sq ft plot + 2,400 sq ft built',
    property_type: 'villas',
    location: 'Sarjapur',
    corridor: 'sarjapur',
    zone: 'East',
    extent_acres: 0.072,
    price_per_acre_cr: 0,
    plot_area_sqft: 3150,
    built_up_sqft: 2400,
    price_per_sqft: 11800,
    price_type: 'Fixed',
    land_use: 'Residential',
    use_cases: ['End use', 'Rental'],
    road_type: '30ft internal road within approved layout',
    dist_airport_km: 50,
    dist_city_km: 23,
    topo: 'Flat',
    soil: 'Red loam',
    water: 'Layout-level supply plus borewell',
    conversion: 'Converted, layout approved',
    ownership: 'Single owner, plot-level e-Khata in place',
    gated_community: '96-villa gated layout, association handover completed',
    zoning: 'Residential',
    verified_stage: 'report',
    risk: 'Low',
    risk_notes: 'Plot-level khata released. Built structure checked against sanctioned plan; no material deviation.',
    description:
      'Plot and structure priced separately, because they behave differently. The 3,150 sq ft plot is the part of this asset that appreciates; the 2,400 sq ft structure is the part that dates. The layout approval and plot-level e-Khata are both verified.',
    amenities: 'Association handover complete · ORR belt 8km · schools 3km',
    img_url: '/img/p5.jpg',
    featured: false,
    conn_score: 74,
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
