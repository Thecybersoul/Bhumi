/* The Property Register (25 Sep 2026): the six properties on the books,
 * as the team recorded them from owners, before verification.
 *
 * lib/register.ts turns each one into a listing. They import as
 * 'Draft', so nothing here reaches the public marketplace until
 * someone has checked the particulars and set it Live. Figures are
 * the owners' own ("owner-stated"). The open questions the register
 * raised travel with each record as its risk notes.
 */

export interface RegisterEntry {
  id: string
  name: string
  taluk: string
  hobli: string
  belt: string
  zoning: string
  zone_class: 'agricultural' | 'residential_zone' | 'converted' | 'commercial'
  category: string
  guntas: number
  sqft: number
  rate_sqft: number | null
  total_inr: number | null
  road_now_ft: number | null
  road_future_ft: number | null
  road_name: string | null
  frontage_ft: number | null
  facing?: string
  best_use: string
  legal: 'strong' | 'partial' | 'pending'
  status: 'live-ready' | 'draft' | 'mandate'
  /** Where it is, as the listing should say it. */
  location: string
  /** What the register flagged: what to collect, confirm or fix before quoting. */
  open_points: string[]
  map_url?: string
}

export const REGISTER_UPDATED = '2026-09-25'

export const PROPERTY_REGISTER: RegisterEntry[] = [
  {
    id: 'P001',
    name: 'Sy. 18/2 Anneshwara / Doddasanne',
    taluk: 'Devanahalli',
    hobli: 'Kasaba',
    belt: 'Airport belt',
    zoning: 'Special agricultural (owner-stated)',
    zone_class: 'agricultural',
    category: 'Agricultural land',
    guntas: 12,
    sqft: 13155,
    rate_sqft: 4500,
    total_inr: 59200000,
    road_now_ft: 40,
    road_future_ft: 40,
    road_name: null,
    frontage_ft: 40,
    best_use: 'Farmhouse; farm-stay; farm plots',
    legal: 'partial',
    status: 'live-ready',
    location: 'Anneshwara / Doddasanne, Devanahalli',
    open_points: ['Unconverted land: price sits in the ₹4,500–4,600 / sq ft farm-land tier.'],
  },
  {
    id: 'P002',
    name: 'Sy. 263/5 Devanahalli town',
    taluk: 'Devanahalli',
    hobli: 'Kasaba',
    belt: 'Devanahalli town',
    zoning: 'Yellow - residential (CDP, owner-stated)',
    zone_class: 'residential_zone',
    category: 'Residential-zone land',
    guntas: 18,
    sqft: 19602,
    rate_sqft: 4591,
    total_inr: 90000000,
    road_now_ft: 30,
    road_future_ft: 80,
    road_name: null,
    frontage_ft: 125.55,
    best_use: 'Plotted layout; villas; land bank',
    legal: 'partial',
    status: 'draft',
    location: 'Devanahalli town',
    open_points: ['Confirm the CDP road alignment: up to ~16% of the front could fall in the 80 ft road line.'],
  },
  {
    id: 'P003',
    name: 'Sy. 106/5 Baichapura',
    taluk: 'Devanahalli',
    hobli: 'Kasaba',
    belt: 'Airport belt',
    zoning: 'Converted residential (DC order 2017)',
    zone_class: 'converted',
    category: 'Converted land - villa mandate',
    guntas: 13,
    sqft: 8712,
    rate_sqft: null,
    total_inr: null,
    road_now_ft: null,
    road_future_ft: null,
    road_name: null,
    frontage_ft: null,
    best_use: '3-villa gated cluster',
    legal: 'strong',
    status: 'mandate',
    location: 'Baichapura, Devanahalli',
    open_points: ['A development mandate, not a sale: not priced.'],
  },
  {
    id: 'P004',
    name: 'Sy. 85/3 & 84 Kurubarakunte (STRR)',
    taluk: 'Devanahalli',
    hobli: 'Kasaba',
    belt: 'STRR corridor',
    zoning: 'Commercial converted (owner-stated), 11B khata',
    zone_class: 'commercial',
    category: 'Commercial land',
    guntas: 12.86,
    sqft: 14000,
    rate_sqft: 11000,
    total_inr: 154000000,
    road_now_ft: null,
    road_future_ft: null,
    road_name: 'STRR (NH-948A)',
    frontage_ft: 97,
    best_use: 'Showroom / highway retail; hotel; warehousing',
    legal: 'partial',
    status: 'draft',
    location: 'Kurubarakunte, Devanahalli (STRR)',
    open_points: [
      'The STRR is access-controlled: confirm a service road or approved access point before quoting ₹11,000 / sq ft.',
      'Register ID provisional: first numbered P002, which clashed with Sy. 263/5.',
    ],
  },
  {
    id: 'P005',
    name: '10 guntas on STRR, NE of Devanahalli',
    taluk: 'Devanahalli',
    hobli: 'To confirm',
    belt: 'STRR corridor',
    zoning: 'Commercial converted (owner-stated)',
    zone_class: 'commercial',
    category: 'Commercial land',
    guntas: 10,
    sqft: 10000,
    rate_sqft: 11000,
    total_inr: 110000000,
    road_now_ft: null,
    road_future_ft: null,
    road_name: 'STRR (NH-948A)',
    frontage_ft: null,
    best_use: 'Showroom / highway retail; food & travel plaza; hotel; warehousing',
    legal: 'pending',
    status: 'draft',
    location: 'STRR, north-east of Devanahalli',
    open_points: [
      'Extent mismatch: 10 full guntas is 10,890 sq ft, not 10,000; at ₹11,000 that is ₹11.98 Cr, not ₹11.00 Cr. The RTC and sketch settle which the owner is selling.',
      'The STRR is access-controlled: confirm a service road or approved access point before quoting.',
    ],
  },
  {
    id: 'P006',
    name: 'Chikkajala, near Shettigere (NH-44)',
    taluk: 'To confirm',
    hobli: 'To confirm',
    belt: 'NH-44 airport corridor',
    zoning: 'DC converted + BIAAPA approved (owner-stated)',
    zone_class: 'converted',
    category: 'Converted land - approved',
    guntas: 9.18,
    sqft: 10000,
    rate_sqft: 6800,
    total_inr: 68000000,
    road_now_ft: null,
    road_future_ft: null,
    road_name: null,
    frontage_ft: null,
    facing: 'North & East',
    best_use: 'Premium home / villa; rental; investment hold',
    legal: 'partial',
    status: 'draft',
    location: 'Chikkajala, near Shettigere, off NH-44',
    map_url: 'https://maps.app.goo.gl/YKByPFwW2KkN1JCA8',
    open_points: [
      'Validate ₹6,800 / sq ft against 3–4 recent registered sales nearby; portal quotes for layout plots around Chikkajala are well below it.',
      '"North & East": confirm whether it is a corner plot with roads on both sides, or only the facing. Frontage and road widths unknown.',
      'To collect: RTC and survey no., DC order no. and date, BIAAPA approval ref and approved land use, sketch, khata, EC, site photos.',
    ],
  },
]
