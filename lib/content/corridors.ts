import type { Corridor } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════
   Growth corridors — Plan §6 (dual purpose: SEO and credibility)
   and §3E (interactive corridor visualisation).

   Price bands and infrastructure status reflect publicly
   reported Bengaluru market data as of August 2026. They are
   indicative ranges for comparison, not valuations — every
   corridor page says so, and the admin can revise them.
   Map coordinates are positions on the schematic corridor map
   (0–100 on both axes), not geographic coordinates.
   ═══════════════════════════════════════════════════════════ */

export const corridors: Corridor[] = [
  {
    slug: 'devanahalli',
    name: 'Devanahalli & the Airport Corridor',
    zone: 'North',
    headline: 'The corridor with the clearest infrastructure pipeline in the city.',
    summary:
      'North Bengaluru is the one corridor where the infrastructure is not speculative — the international airport is already operating, the aerospace and hardware parks are allotted, and the metro extension plus the Peripheral Ring Road both land here. That combination is why land in this belt has been repricing faster than the city average, and also why the parcels being pushed hardest are frequently the ones with the weakest paperwork.',
    drivers: [
      'Kempegowda International Airport and the aerospace / hardware park cluster',
      'Metro Blue Line extension toward the airport belt',
      'Peripheral Ring Road Phase 1 — the Tumakuru Road to airport stretch',
      'STRR connectivity linking Devanahalli, Doddaballapur and Hoskote',
      'Notified KIADB industrial land in the immediate belt',
    ],
    infrastructure: [
      { label: 'Kempegowda International Airport', detail: 'Operational, second terminal and runway commissioned', status: 'Operating' },
      { label: 'Metro Blue Line extension', detail: 'Airport-bound extension, operations targeted around late 2026', status: 'Under construction' },
      { label: 'Peripheral Ring Road Phase 1', detail: '~19.8 km Tumakuru Road to airport stretch, targeted mid-2027', status: 'Under construction' },
      { label: 'STRR (NH-948A)', detail: 'Satellite town ring road linking the northern satellite towns', status: 'Partly operational' },
    ],
    price_low: 3.5,
    price_high: 12,
    price_unit: '₹ Cr / acre',
    yoy_pct: 13,
    best_for: ['land-parcels', 'large-land-parcels', 'residential', 'warehouses'],
    watch_outs: [
      'Airport-belt premiums are frequently quoted off transactions that were never registered at the stated value',
      'Several large parcels here carry agreement-holder rather than owner positions — check who can actually convey',
      'Alignment reservations for the PRR and feeder roads affect specific survey numbers; confirm yours',
    ],
    map: { x: 52, y: 14 },
    updated: '2026-08-01',
  },
  {
    slug: 'sarjapur',
    name: 'Sarjapur & the South-East IT Belt',
    zone: 'East',
    headline: 'Deepest end-user demand in the city — and the tightest supply of clean title.',
    summary:
      'Sarjapur is demand-led rather than infrastructure-led. The IT employment base to its north and west is already there, which makes absorption reliable and makes the corridor forgiving of a mediocre entry price. What it is not forgiving of is title: this belt has been transacting continuously for two decades, and the chains are correspondingly long and correspondingly messy.',
    drivers: [
      'IT employment concentration across Whitefield, Marathahalli and the ORR belt',
      'Proposed metro connectivity along the Sarjapur alignment',
      'Established international schools and healthcare clusters supporting end-user demand',
      'Continued villa and gated-community absorption',
    ],
    infrastructure: [
      { label: 'Outer Ring Road employment belt', detail: 'Established, and the primary demand driver for this corridor', status: 'Operating' },
      { label: 'Sarjapur metro alignment', detail: 'Planned line serving the corridor', status: 'Planned' },
      { label: 'Road widening programme', detail: 'Sarjapur main road capacity works in phases', status: 'In progress' },
    ],
    price_low: 4,
    price_high: 14,
    price_unit: '₹ Cr / acre',
    yoy_pct: 11,
    best_for: ['villas', 'residential', 'land-parcels'],
    watch_outs: [
      'Long transaction histories mean long title chains — a thirty-year search here is genuinely thirty years of work',
      'Lake and rajakaluve buffers are actively enforced in this belt; setbacks can materially reduce usable extent',
      'Layouts approved by different authorities sit side by side; the approving authority changes what is permitted',
    ],
    map: { x: 76, y: 66 },
    updated: '2026-08-01',
  },
  {
    slug: 'hoskote',
    name: 'Hoskote & the Eastern Logistics Belt',
    zone: 'East',
    headline: 'Where Bengaluru\'s warehousing demand is actually going.',
    summary:
      'Hoskote is an industrial and logistics story rather than a residential one. Highway frontage, STRR access and proximity to the eastern manufacturing base make it the natural location for Grade A warehousing serving the city. The economics work on specification and access, not on views — which makes it one of the more rational corridors to underwrite.',
    drivers: [
      'National highway frontage and STRR access',
      'Grade A warehousing and 3PL demand serving Bengaluru',
      'Established KIADB industrial areas in the belt',
      'Rail siding access for bulk movement',
    ],
    infrastructure: [
      { label: 'NH-75 / Old Madras Road', detail: 'Primary freight corridor east out of the city', status: 'Operating' },
      { label: 'STRR', detail: 'Satellite town ring road connectivity to the northern belt', status: 'Partly operational' },
      { label: 'KIADB industrial areas', detail: 'Notified industrial land in the immediate belt', status: 'Operating' },
    ],
    price_low: 1.8,
    price_high: 6,
    price_unit: '₹ Cr / acre',
    yoy_pct: 9,
    best_for: ['warehouses', 'land-parcels', 'large-land-parcels'],
    watch_outs: [
      'Industrial zoning is not uniform across the belt — adjacent survey numbers can differ',
      'Power sanction is the binding constraint for most industrial uses here, not land price',
      'Highway frontage is often quoted from a point that is not the parcel\'s actual access point',
    ],
    map: { x: 82, y: 40 },
    updated: '2026-08-01',
  },
  {
    slug: 'tumakuru-road',
    name: 'Tumakuru Road & the North-West Industrial Corridor',
    zone: 'West',
    headline: 'The industrial corridor the Peripheral Ring Road connects first.',
    summary:
      'The north-west has been an industrial corridor for far longer than it has been a real estate story, which is exactly why the fundamentals are sound. The PRR\'s first phase connects this corridor directly to the airport belt, and the established industrial base around Dabaspet means demand is not waiting on a residential thesis to materialise.',
    drivers: [
      'NH-48 industrial frontage and the Dabaspet industrial belt',
      'Peripheral Ring Road Phase 1 terminating on this corridor',
      'Rail connectivity for bulk and container movement',
      'Lower entry pricing relative to the northern and eastern corridors',
    ],
    infrastructure: [
      { label: 'NH-48 (Tumakuru Road)', detail: 'Six-lane national highway, primary north-west freight route', status: 'Operating' },
      { label: 'Peripheral Ring Road Phase 1', detail: 'Connects this corridor to the airport belt, targeted mid-2027', status: 'Under construction' },
      { label: 'Dabaspet industrial area', detail: 'Established industrial cluster with allotted land', status: 'Operating' },
    ],
    price_low: 1.2,
    price_high: 7.5,
    price_unit: '₹ Cr / acre',
    yoy_pct: 10,
    best_for: ['warehouses', 'commercial', 'land-parcels', 'large-land-parcels'],
    watch_outs: [
      'Highway-frontage parcels carry access restrictions — a service road is not automatically available',
      'Some parcels in this belt are subject to acquisition for the PRR alignment; confirm the survey number',
      'Groundwater position varies sharply across short distances in this corridor',
    ],
    map: { x: 22, y: 30 },
    updated: '2026-08-01',
  },
  {
    slug: 'kanakapura-road',
    name: 'Kanakapura Road & the Southern Green Belt',
    zone: 'South',
    headline: 'The patient-capital corridor. Cheapest entry, longest horizon.',
    summary:
      'Southern Bengaluru prices at a genuine discount to the rest of the city, and the reason is honest: the infrastructure timeline is longer and the employment base is thinner. For a buyer with a ten-year horizon — land banking, a farm holding, a resort — that discount is the opportunity. For a buyer who needs an exit in three years, it is a trap.',
    drivers: [
      'Metro Green Line extension southward',
      'NICE Road connectivity to the western and southern belts',
      'Farmland, resort and wellness demand supported by the green belt',
      'Lowest entry pricing among the active corridors',
    ],
    infrastructure: [
      { label: 'Metro Green Line', detail: 'Southward extension serving the corridor', status: 'Operating / extending' },
      { label: 'NICE Road', detail: 'Peripheral connectivity west and south', status: 'Operating' },
      { label: 'Kanakapura Road widening', detail: 'Capacity works along the main corridor', status: 'In progress' },
    ],
    price_low: 0.8,
    price_high: 4,
    price_unit: '₹ Cr / acre',
    yoy_pct: 8,
    best_for: ['land-parcels', 'villas', 'large-land-parcels'],
    watch_outs: [
      'Multiple-owner and inherited holdings are common here — consent from every heir is the usual bottleneck',
      'Seasonal streams and tank buffers are frequently undocumented in older records',
      'Conversion for non-agricultural use takes longer in this belt than in the notified corridors',
    ],
    map: { x: 38, y: 84 },
    updated: '2026-08-01',
  },
  {
    slug: 'doddaballapur',
    name: 'Doddaballapur & the STRR Belt',
    zone: 'North',
    headline: 'Industrial land at a fraction of airport-belt pricing, on the same ring road.',
    summary:
      'Doddaballapur sits on the STRR alongside Devanahalli but prices at a substantial discount, largely because it lacks the airport adjacency that drives the northern narrative. For industrial and large-format uses, where highway access matters more than airport proximity, that gap is the whole thesis.',
    drivers: [
      'STRR frontage with direct connectivity to the northern industrial belt',
      'Established apparel and industrial park base',
      'Large contiguous parcels still available at institutional scale',
      'Airport belt within reach without airport belt pricing',
    ],
    infrastructure: [
      { label: 'STRR (NH-948A)', detail: 'Satellite town ring road through the belt', status: 'Partly operational' },
      { label: 'Industrial park cluster', detail: 'Established apparel and light industrial base', status: 'Operating' },
      { label: 'Rail connectivity', detail: 'Doddaballapur station on the northern line', status: 'Operating' },
    ],
    price_low: 1,
    price_high: 4.5,
    price_unit: '₹ Cr / acre',
    yoy_pct: 9,
    best_for: ['large-land-parcels', 'warehouses', 'land-parcels'],
    watch_outs: [
      'Contiguity is the constraint at scale — assemblies here routinely span a dozen survey numbers and as many owners',
      'Agricultural status is the norm; budget conversion time into the acquisition timeline',
      'Water table varies significantly; test before assuming borewell viability',
    ],
    map: { x: 40, y: 8 },
    updated: '2026-08-01',
  },
]

export function getCorridor(slug: string) {
  return corridors.find((c) => c.slug === slug)
}

export const corridorDisclaimer =
  'Price bands are indicative ranges compiled from publicly reported transactions, listing data and our own transaction history in each corridor. They are a comparison aid, not a valuation, and they will not reflect a specific parcel\'s position. Infrastructure timelines are as publicly announced and routinely move.'
