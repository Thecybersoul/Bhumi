/* ═══════════════════════════════════════════════════════════
   Outdoor inventory currently bookable through Bhumi Estates.

   These are partner-operated DOOH panels, not sites Bhumi owns.
   The distinction matters and is stated on the page: we plan and
   buy the media, the panel is operated by the media owner. Every
   figure below — dimensions, direction of travel, catchment,
   coordinates — comes from the operator's own site inventory, and
   should be re-confirmed at the time of booking, since outdoor
   availability changes month to month.
   ═══════════════════════════════════════════════════════════ */

export type BengaluruZone = 'South' | 'Central' | 'East' | 'North' | 'West'

export interface Billboard {
  id: string
  /** Display order, matching the operator's inventory numbering. */
  number: string
  name: string
  zone: BengaluruZone
  /** Where the panel physically sits, when it differs from the name. */
  location?: string
  size: string
  /** Approximate display area, as quoted by the operator. */
  area: string
  /** Traffic approaches the panel from here. */
  trafficFrom: string[]
  /** And is heading towards here — the catchment the panel serves. */
  goingTowards: string[]
  coordinates: string
  /** Panels not yet live carry an availability note instead. */
  availableFrom?: string
}

export const billboards: Billboard[] = [
  {
    id: 'btm-jayanagar',
    number: '01',
    name: 'BTM Junction → Jayanagar',
    zone: 'South',
    size: '22 ft × 22 ft',
    area: '~500 sq ft',
    trafficFrom: ['HSR Layout', 'Silk Board', 'Electronic City (Ragigudda Flyover)'],
    goingTowards: ['Jayanagar', 'JP Nagar', 'Banashankari'],
    coordinates: '12°54\'58.0"N 77°36\'56.1"E',
  },
  {
    id: 'kr-market-townhall',
    number: '02',
    name: 'KR Market Junction → Town Hall',
    zone: 'Central',
    size: '22 ft × 22 ft',
    area: '~500 sq ft',
    trafficFrom: ['Mysore Road Flyover', 'Krishna Rajendra Road'],
    goingTowards: ['City Town Hall', 'CBD area', 'Kalasipalyam bus station'],
    coordinates: '12°57\'49.8"N 77°34\'39.0"E',
  },
  {
    id: 'townhall-mysore-road',
    number: '03',
    name: 'Town Hall → Mysore Road',
    zone: 'Central',
    size: '22 ft × 22 ft',
    area: '~500 sq ft',
    trafficFrom: ['CBD area', 'City Town Hall', 'Corporation Circle'],
    goingTowards: ['Mysore Road', 'Gopalan Sirsi Mall'],
    coordinates: '12°57\'49.7"N 77°34\'39.2"E',
  },
  {
    id: 'sjp-road-townhall',
    number: '04',
    name: 'SJP Road → Town Hall',
    zone: 'Central',
    size: '30 ft × 20 ft',
    area: '~600 sq ft',
    trafficFrom: ['KR Market bus stop', 'NR Road', 'Metro station'],
    goingTowards: ['SJP Road', 'Avenue Road', 'Chickpet', 'CBD area'],
    coordinates: '12°57\'51.6"N 77°34\'40.2"E',
  },
  {
    id: 'bellandur-marathahalli',
    number: '05',
    name: 'Bellandur Junction → Marathahalli',
    zone: 'East',
    size: '13 ft × 10 ft',
    area: '~130 sq ft',
    trafficFrom: ['Iblur', 'Sarjapur Road', 'HSR Layout'],
    goingTowards: ['Ecospace and Ecoworld tech parks', 'Marathahalli Outer Ring Road'],
    coordinates: '12°54\'58.0"N 77°36\'56.1"E',
  },
  {
    id: 'ejipura-koramangala',
    number: '06',
    name: 'Ejipura Junction → Koramangala',
    zone: 'South',
    location: '100 ft Intermediate Ring Road, Ejipura',
    size: '22 ft × 22 ft',
    area: '~500 sq ft',
    trafficFrom: ['Indiranagar', 'Domlur', 'Old Airport Road'],
    goingTowards: ['Koramangala', 'HSR Layout', "St John's"],
    coordinates: '12°57\'20.0"N 77°37\'40.0"E',
    availableFrom: 'Panel secured — site photography to follow',
  },
]

export const billboardIntro = {
  eyebrow: 'Bookable inventory',
  title: { before: 'Panels on the corridors', italic: 'that carry the city.' },
  body: 'Digital out-of-home sites across South, Central and East Bengaluru, available to book through us. These are operated by our media partners rather than owned by Bhumi — we plan the campaign, negotiate the rate and verify the mounting. Rates and availability change month to month, so both are confirmed at the time of booking.',
  suited:
    'Suited to jewellery, retail, BFSI, real estate, healthcare, FMCG and D2C brands.',
  note: 'Dimensions and catchments are as stated by the site operator. Availability is confirmed at booking.',
}

/** Zone counts for the summary line above the list. */
export const billboardSummary = {
  total: billboards.length,
  zones: Array.from(new Set(billboards.map((b) => b.zone))),
  largest: billboards.reduce((a, b) =>
    parseInt(b.area.replace(/\D/g, ''), 10) > parseInt(a.area.replace(/\D/g, ''), 10) ? b : a
  ),
}
