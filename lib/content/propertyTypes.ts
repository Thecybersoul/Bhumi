import type { PropertyTypeSlug } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════
   Asset classes — Plan §4.
   "A warehouse buyer and a villa buyer are making completely
   different decisions." Each type therefore carries its own
   presentation fields, its own diligence detail, and its own
   iconography treatment (Plan §11).
   ═══════════════════════════════════════════════════════════ */

export interface PropertyTypeDef {
  slug: PropertyTypeSlug
  name: string
  shortName: string
  href: string
  /** Plan §11 — never one generic icon set applied to everything. */
  iconTreatment: 'cutaway' | 'lifestyle' | 'aerial' | 'plan' | 'elevation' | 'topographic'
  icon: PropertyTypeSlug
  tagline: string
  intro: string
  /** "What the Site Shows" column, Plan §4 */
  shows: { label: string; detail: string }[]
  /** "The Diligence/Decision Detail That Matters Most", Plan §4 */
  criticalDetail: { headline: string; body: string }
  /** Buyer-side checks specific to this asset class */
  checklist: string[]
  buyerQuestions: { q: string; a: string }[]
  metricLabels: { extent: string; price: string }
  audience: string
  relatedTools: string[]
  cta: { label: string; href: string }
}

export const propertyTypes: PropertyTypeDef[] = [
  {
    slug: 'commercial',
    name: 'Commercial Buildings',
    shortName: 'Commercial',
    href: '/property-types/commercial',
    iconTreatment: 'cutaway',
    icon: 'commercial',
    tagline: 'Floor plates, connectivity and the certificates that make them lettable.',
    intro:
      'A commercial building is bought on its ability to be occupied, not on its façade. The questions that decide the price are whether the occupancy certificate is in hand, whether the fire NOC covers the current layout, and whether the floor plate suits the tenant you are actually targeting.',
    shows: [
      { label: 'Floor plates', detail: 'Plate size, efficiency ratio, core position and column grid' },
      { label: 'Connectivity & IT infrastructure', detail: 'Fibre providers on site, redundant power, DG backup, UPS provision' },
      { label: 'Parking ratio', detail: 'Bays per 1,000 sq ft, and whether it clears the sanctioned plan' },
      { label: 'Tenant readiness', detail: 'Warm shell vs bare shell, HVAC provision, lift bank and waiting time' },
    ],
    criticalDetail: {
      headline: 'Occupancy certificate, fire NOC and tenant-readiness status',
      body:
        'A building without a valid occupancy certificate cannot be legitimately occupied, and an institutional tenant will not sign against one. We confirm the OC covers the building as it stands today — not as it was sanctioned — and that the fire NOC matches the current internal layout rather than a layout that was changed after approval.',
    },
    checklist: [
      'Occupancy certificate issued, and matching the built configuration',
      'Fire NOC current, and covering the present internal layout',
      'Sanctioned plan compared against as-built — deviations quantified',
      'Parking bays counted on site against the sanctioned count',
      'Lift, HVAC and DG capacity checked against stated tenant load',
      'Common area maintenance liabilities and existing lease encumbrances',
    ],
    buyerQuestions: [
      {
        q: 'Why does the occupancy certificate matter more than the completion certificate?',
        a: 'A completion certificate says the building was finished. An occupancy certificate says it may lawfully be occupied. Institutional tenants, lenders and insurers underwrite against the second one.',
      },
      {
        q: 'How much deviation from the sanctioned plan is normal?',
        a: 'Some is common; the question is whether it is compoundable. We quantify the deviation in area terms and identify whether it can be regularised or whether it is a permanent overhang on the asset.',
      },
    ],
    metricLabels: { extent: 'Built-up area', price: 'Per sq ft' },
    audience: 'Investors and occupiers buying or letting commercial stock',
    relatedTools: ['zoning-checker', 'construction-estimator'],
    cta: { label: 'Request a commercial diligence review', href: '/contact?intent=commercial' },
  },
  {
    slug: 'residential',
    name: 'Residential Buildings & Apartments',
    shortName: 'Residential',
    href: '/property-types/residential',
    iconTreatment: 'plan',
    icon: 'residential',
    tagline: 'Unit mix, carpet area, and the RERA number shown inline — never buried.',
    intro:
      'Apartment buying is where the gap between what is advertised and what is delivered is widest. Two numbers close most of that gap: the carpet area, stated separately from super built-up, and the RERA registration number, shown where you can check it rather than in eight-point type at the bottom of a brochure.',
    shows: [
      { label: 'Unit mix', detail: 'Configuration split, unsold inventory by type, floor availability' },
      { label: 'Carpet vs super built-up', detail: 'Both stated separately, with the loading percentage made explicit' },
      { label: 'Amenities', detail: 'Delivered vs promised, with the maintenance cost per sq ft attached' },
      { label: 'Delivery position', detail: 'Declared RERA completion date and actual construction stage' },
    ],
    criticalDetail: {
      headline: 'RERA registration number shown inline, not buried',
      body:
        'Karnataka RERA requires the registration number and the K-RERA website to appear in project advertising precisely so a buyer can verify claims before visiting a site. We print it in the listing header where you will actually see it, alongside the declared completion date on the RERA filing — which is frequently a different date from the one in the sales pitch.',
    },
    checklist: [
      'K-RERA registration number verified on the K-RERA portal, not just quoted',
      'Declared completion date on the RERA filing compared to the sales claim',
      'Carpet area confirmed against the agreement, loading percentage computed',
      'Approved plan, commencement certificate and OC status established',
      'Land title underlying the project verified independently of the developer',
      'Maintenance corpus, sinking fund and monthly outgo stated in writing',
    ],
    buyerQuestions: [
      {
        q: 'What loading percentage is reasonable?',
        a: 'Typically 25–35% in Bengaluru. Above that, you are paying apartment rates for common area. The number matters less than whether it is disclosed before you sign.',
      },
      {
        q: 'Does a RERA number mean the project is safe?',
        a: 'It means the project is registered and the developer has made filings you can inspect. It is a starting point for diligence, not a substitute for it.',
      },
    ],
    metricLabels: { extent: 'Carpet area', price: 'Per sq ft' },
    audience: 'End users and investors buying into a registered project',
    relatedTools: ['construction-estimator', 'corridor-comparison'],
    cta: { label: 'Have a project checked before you book', href: '/contact?intent=residential' },
  },
  {
    slug: 'villas',
    name: 'Villas',
    shortName: 'Villas',
    href: '/property-types/villas',
    iconTreatment: 'lifestyle',
    icon: 'villas',
    tagline: 'Plot and built-up separated, and the community you are actually buying into.',
    intro:
      'A villa is two purchases in one document: a plot of land, and a structure standing on it. They appreciate at different rates and carry different risks. Presenting them as a single per-square-foot number hides the part of the asset that actually holds value.',
    shows: [
      { label: 'Plot + built-up breakdown', detail: 'Land extent and constructed area priced separately, not blended' },
      { label: 'Community layout', detail: 'Gated layout plan, plot density, road widths, open space share' },
      { label: 'Approvals', detail: 'Layout approval authority, plot-level khata and release status' },
      { label: 'Entrance & boundary identity', detail: 'Where the community\'s identity is built — and maintained' },
    ],
    criticalDetail: {
      headline: 'Layout approval, plot-level khata, and boundary integrity',
      body:
        'The most common villa problem is not the villa — it is the layout. We establish which authority approved the layout, whether the plot has its own khata or sits under a composite one, and whether the released plots and the retained plots have been correctly separated. A boundary wall and entrance treatment then carry that identity, which is a marketing asset for the community and a security position for the owner.',
    },
    checklist: [
      'Layout approval traced to the correct planning authority',
      'Plot-level khata / e-Khata in place and released to the seller',
      'Built structure compared against sanctioned plan for deviation',
      'Common area ownership and association handover status',
      'Boundary walked and measured against the layout plan',
      'Water, sewage and power provisioning at plot level, not just layout level',
    ],
    buyerQuestions: [
      {
        q: 'Should I value the land and the structure separately?',
        a: 'Yes. The structure depreciates and dates; the land does not. In a fast-appreciating corridor, most of your return over a decade comes from the plot, which is why we always separate them.',
      },
      {
        q: 'What if the association has not taken handover?',
        a: 'Then maintenance liability and common area ownership are still with the developer. That is workable, but it needs to be priced, and the handover trigger needs to be in your agreement.',
      },
    ],
    metricLabels: { extent: 'Plot + built-up', price: 'Total' },
    audience: 'End users buying into a gated layout, and investors holding villa stock',
    relatedTools: ['construction-estimator', 'corridor-comparison'],
    cta: { label: 'Get a villa and layout review', href: '/contact?intent=villa' },
  },
  {
    slug: 'land-parcels',
    name: 'Land Parcels',
    shortName: 'Land',
    href: '/property-types/land-parcels',
    iconTreatment: 'aerial',
    icon: 'land-parcels',
    tagline: 'Survey number, zoning, conversion status and ownership position — upfront.',
    intro:
      'Land is the flagship. Everything else on this site is built on top of it. A parcel is worth what it can legally become, and that is decided by four things: the survey number and what it actually contains, the zoning, the conversion position, and whether there is recorded access to it.',
    shows: [
      { label: 'Survey number', detail: 'Survey and hissa numbers, tippani, and the measured extent' },
      { label: 'Zoning', detail: 'Governing authority, master plan zone, permitted use' },
      { label: 'Corridor & infrastructure proximity', detail: 'Distance to highway, ring road, metro, airport and notified industrial zones' },
      { label: 'Conversion status', detail: 'Converted, deemed converted under the 2025 rules, or agricultural' },
    ],
    criticalDetail: {
      headline: 'Conversion status and ownership position flagged upfront',
      body:
        'Karnataka\'s 2025 amendment to the Land Revenue Rules changed the conversion picture materially — deemed approval where the Deputy Commissioner does not act inside the prescribed window, automatic conversion for certain strategic uses, and sharply higher penalties for misuse of a conversion once granted. We state the position plainly on every parcel: converted, deemed, in process, or agricultural — and separately, whether the ownership and access position makes the parcel workable for a joint development.',
    },
    checklist: [
      'Survey and hissa numbers reconciled to the deed and the tippani',
      'Digitally signed RTC pulled from Bhoomi, not accepted as a printout',
      'Conversion position established and dated',
      'Rajakaluve, lake, HT line and highway buffers checked',
      'Recorded access to a public road — width confirmed on site',
      'Ownership fragmentation mapped: single owner, co-owners, or agreement holder',
    ],
    buyerQuestions: [
      {
        q: 'Is unconverted land always a problem?',
        a: 'No — it is often the reason the price is attractive. The question is whether conversion is achievable for your intended use, how long it will take, and what it costs. We give you that position before you commit, not after.',
      },
      {
        q: 'What makes a parcel ready for a joint development?',
        a: 'Clean single-window ownership or a documented consent from every co-owner, recorded road access, a zoning position that permits the intended development, and no subsisting litigation. Our verification protocol checks exactly those points, whatever you decide to do with the land afterward.',
      },
    ],
    metricLabels: { extent: 'Extent', price: 'Per acre' },
    audience: 'Landowners, developers and investors buying or holding raw land',
    relatedTools: ['zoning-checker', 'corridor-comparison'],
    cta: { label: 'Get a free land verification review', href: '/verification#review' },
  },
  {
    slug: 'warehouses',
    name: 'Warehouses & Industrial',
    shortName: 'Warehousing',
    href: '/property-types/warehouses',
    iconTreatment: 'cutaway',
    icon: 'warehouses',
    tagline: 'Clear height, floor load, dock count and sanctioned power — the four numbers that decide it.',
    intro:
      'Industrial property is the one asset class where the specification is the asset. A warehouse that is 500mm short on clear height loses an entire racking level, and no amount of location makes that back. We lead with the technical numbers because that is what a serious occupier shortlists on.',
    shows: [
      { label: 'Clear ceiling height', detail: 'Height at eaves, and the racking levels it actually supports' },
      { label: 'Floor load capacity', detail: 'Uniformly distributed load in tonnes/sqm and floor flatness category' },
      { label: 'Loading docks', detail: 'Dock count, dock height, leveller provision and apron depth' },
      { label: 'Sanctioned power load', detail: 'Sanctioned KVA, DG backup provision and MHE charging capacity' },
    ],
    criticalDetail: {
      headline: 'Highway access and logistics-zone classification',
      body:
        'The specification decides whether a building works; the classification decides whether it can be used. We confirm the parcel\'s industrial zoning or KIADB position, whether trailer access to the highway is real — an apron of around 25 metres and internal roads that a 40-foot trailer can actually turn in — and whether the sanctioned power load matches the occupier\'s equipment rather than the developer\'s brochure.',
    },
    checklist: [
      'Clear height at eaves measured, not quoted — 9m is the Grade A floor, 10–12m is typical',
      'Floor UDL confirmed against specification, commonly 5T/sqm and FM2 flatness for VNA racking',
      'Dock count against area — roughly one per 10,000 sq ft is the Grade A convention',
      'Apron depth and turning radius checked for 40-foot trailer movement',
      'Sanctioned power load in KVA verified with the utility, plus DG backup',
      'Industrial zoning / KIADB allotment position and change-of-use exposure',
      'Fire compliance for the intended storage category, not a generic NOC',
    ],
    buyerQuestions: [
      {
        q: 'What separates Grade A from Grade B here?',
        a: 'Practically: clear height at or above 9m (Grade A stock is typically 10–12m), an FM2-class floor rated around 5–7 tonnes per sqm, dock levellers at roughly one per 10,000 sq ft, and a concrete apron deep enough for trailers. Anything materially below that is Grade B, and should be priced as Grade B.',
      },
      {
        q: 'How much does sanctioned power actually matter?',
        a: 'Enormously, if you are charging material handling equipment or running cold storage. Upgrading sanctioned load after the fact is slow and occasionally impossible at the required scale. Confirm it before you sign, not after.',
      },
    ],
    metricLabels: { extent: 'Built-up area', price: 'Per sq ft' },
    audience: 'Occupiers, 3PL operators and industrial investors',
    relatedTools: ['warehouse-checklist', 'zoning-checker'],
    cta: { label: 'Run the warehouse suitability checklist', href: '/tools/warehouse-checklist' },
  },
  {
    slug: 'large-land-parcels',
    name: 'Large Land Parcels',
    shortName: 'Large parcels',
    href: '/large-land-parcels',
    iconTreatment: 'topographic',
    icon: 'large-land-parcels',
    tagline: 'Institutional scale. Aerial-first presentation, and a gated data room.',
    intro:
      'Institutional and bulk land buyers decide differently from an individual buyer, and folding them into a general land listing serves neither. Large parcels get their own pillar: full-parcel aerial presentation, contiguous-assembly status, corridor growth data, and an information memorandum behind an NDA gate.',
    shows: [
      { label: 'Acreage & assembly', detail: 'Total extent, number of survey numbers, contiguity status' },
      { label: 'Corridor growth data', detail: 'Infrastructure pipeline, notified zones, comparable transactions' },
      { label: 'Construction feasibility', detail: 'Topography, bearing capacity, water position, access load capacity' },
      { label: 'Aerial presentation', detail: 'Full-parcel drone footage rather than ground-level photography' },
    ],
    criticalDetail: {
      headline: 'A dedicated pillar with its own process — see the Large Land Parcels page',
      body:
        'Headline details are public. The full information memorandum — survey documents, the verification report and pricing — sits behind an NDA-style gate, released to verified buyers only. That is how large land actually transacts, and it filters serious buyers from casual browsers without insulting either.',
    },
    checklist: [
      'Contiguity confirmed across every survey number in the assembly',
      'Every owner in the assembly identified, and consent position documented',
      'Aggregate extent reconciled between deeds, revenue records and survey',
      'Corridor-level acquisition, alignment and reservation exposure checked',
      'Bearing capacity and water position assessed for the intended build',
      'Phasing and holding-cost model built before an offer is made',
    ],
    buyerQuestions: [
      {
        q: 'Why gate the information memorandum?',
        a: 'Because it contains the seller\'s survey documents, our verification findings and the pricing position. Publishing that openly would be a disservice to the seller and an invitation to be front-run. Verified buyers get it in full.',
      },
      {
        q: 'Who will I actually be speaking to?',
        a: 'A named advisor, not a shared inbox. Large-parcel enquiries route directly, because the scale of these deals demands it.',
      },
    ],
    metricLabels: { extent: 'Acreage', price: 'Per acre' },
    audience: 'Institutional buyers, developers land-banking, and family offices',
    relatedTools: ['corridor-comparison'],
    cta: { label: 'Request data room access', href: '/large-land-parcels#data-room' },
  },
]

export function getPropertyType(slug: string) {
  return propertyTypes.find((t) => t.slug === slug)
}

/** Types that get a /property-types/[slug] page. Large land parcels
    has its own top-level pillar page instead (Plan §9). */
export const hubTypes = propertyTypes.filter((t) => t.slug !== 'large-land-parcels')
