/* Our services — five lines of business, all delivered by Bhumi Estates.

   Land Sourcing, Branding and Outdoor Advertising are where the
   business concentrates its energy and are given visual priority
   across the site. */

export interface Pillar {
  slug: string
  number: string
  name: string
  short: string
  promise: string
  /** Sell the judgment, not just the inventory. */
  judgment: string
  deliverables: string[]
  proofPoints: { label: string; value: string }[]
  worksWellWith: string[]
  cta: { label: string; href: string }
  audience: string
  icon: 'land' | 'shield' | 'crane' | 'billboard' | 'megaphone'
  /** Given visual priority on the homepage and services page. */
  featured: boolean
}

export const pillars: Pillar[] = [
  {
    slug: 'land-sourcing',
    number: '01',
    name: 'Land Sourcing',
    short: 'Finding the parcel worth the diligence',
    promise:
      'We bring you parcels chosen for a reason we will write down, not whatever is currently available.',
    judgment:
      'Most parcels fail on something structural before price is even discussed. We say no early, in writing, with the reason recorded.',
    deliverables: [
      'A written sourcing brief: use, corridor, extent band, budget and hard constraints',
      'Off-market parcel origination through corridor-level landowner relationships',
      'Preliminary title and zoning read before you spend on full diligence',
    ],
    proofPoints: [
      { label: 'Parcels screened per search', value: '30–60' },
      { label: 'Typically reach full diligence', value: '4–6' },
      { label: 'Reach an offer', value: '1–2' },
    ],
    worksWellWith: ['verification', 'development'],
    cta: { label: 'Tell us what you are looking for', href: '/contact?intent=sourcing' },
    audience: 'Developers, investors and family offices with a defined acquisition brief',
    icon: 'land',
    featured: true,
  },
  {
    slug: 'verification',
    number: '02',
    name: 'Verification',
    short: 'The six-stage protocol, published in full',
    promise:
      'A dated, shareable certificate with a clear pass or flag decision — not a verbal assurance.',
    judgment:
      'Diligence is only worth what its independence is worth. Documents are pulled directly from the record, never accepted as a seller\'s copy, and a finding is reported exactly as we find it.',
    deliverables: [
      'The full six-stage protocol — intake, title chain, revenue and zoning, litigation, physical survey, report',
      'Licensed survey with geo-tagged boundary walk',
      'A shareable verification certificate with stated scope limitations',
    ],
    proofPoints: [
      { label: 'Stages, separately tracked', value: '6' },
      { label: 'Title chain verified back', value: '30 years' },
      { label: 'Typical turnaround', value: '20–38 days' },
    ],
    worksWellWith: ['land-sourcing', 'development'],
    cta: { label: 'Talk to us about verification', href: '/contact?intent=verification' },
    audience: 'Anyone about to pay for land they have not independently checked',
    icon: 'shield',
    featured: false,
  },
  {
    slug: 'development',
    number: '03',
    name: 'Development',
    short: 'From concept to completion, one point of accountability',
    promise:
      'One party accountable from the first drawing to handover — feasibility, build and sign-off.',
    judgment:
      'Most projects lose time in the gaps between the architect, the contractor and the approvals desk. We hold those gaps, so there is never a question of whose problem a delay is.',
    deliverables: [
      'Feasibility, scoping and costing before anything is committed',
      'Independent inspection of quality, quantity and timeline at every stage',
      'Monthly progress reporting with dated photographic evidence, through to handover',
    ],
    proofPoints: [
      { label: 'Stage gates per project', value: '9' },
      { label: 'Reporting cadence', value: 'Monthly' },
      { label: 'Reports to', value: 'You, not the contractor' },
    ],
    worksWellWith: ['land-sourcing', 'branding'],
    cta: { label: 'Discuss a project', href: '/contact?intent=development' },
    audience: 'Landowners and investors taking a parcel from land to finished asset',
    icon: 'crane',
    featured: false,
  },
  {
    slug: 'branding',
    number: '04',
    name: 'Branding',
    short: 'Site identity, built to be seen and built to last',
    promise:
      'Boundary walls, entrance pylons, highmasts and wall branding — the physical identity a project is judged by before a single unit is sold.',
    judgment:
      'A visitor decides what a project is worth before they reach the sales office. Most developers treat site branding as a finishing touch — we treat it as the first impression, built to survive weather and time.',
    deliverables: [
      'Boundary and compound wall branding',
      'Entrance pylons and project identity structures',
      'Highmasts and large-format site signage',
      'Hoarding and wall branding across the site and approach roads',
    ],
    proofPoints: [
      { label: 'Engineered for', value: 'Monsoon + site conditions' },
      { label: 'Typical install window', value: '2–4 weeks' },
      { label: 'Built to last', value: 'Full project cycle' },
    ],
    worksWellWith: ['outdoor-advertising', 'development'],
    cta: { label: 'Brief us on site branding', href: '/contact?intent=branding' },
    audience: 'Developers and landowners with a project ready to be seen',
    icon: 'billboard',
    featured: true,
  },
  {
    slug: 'outdoor-advertising',
    number: '05',
    name: 'Outdoor Advertising',
    short: 'Media that earns the spend, reported honestly',
    promise:
      'Site selection, buying and campaign management across billboards, hoardings and highmasts — reported on what it produced, not what it displayed.',
    judgment:
      'Most outdoor media is bought on rate card and reported on impressions — a number nobody can act on. We choose sites on visibility and traffic, and report what actually matters: enquiries generated, cost per qualified lead.',
    deliverables: [
      'Site and media selection across billboards, hoardings and highmasts',
      'Campaign planning, buying and rate negotiation',
      'Installation and maintenance coordination for the campaign duration',
      'Performance reporting built around enquiries generated, not impressions served',
    ],
    proofPoints: [
      { label: 'Reported metric', value: 'Qualified leads' },
      { label: 'Reporting cadence', value: 'Weekly' },
      { label: 'Formats', value: 'Billboards & highmasts' },
    ],
    worksWellWith: ['branding', 'development'],
    cta: { label: 'Plan a campaign', href: '/contact?intent=advertising' },
    audience: 'Developers and brands who need to be seen where it counts',
    icon: 'megaphone',
    featured: true,
  },
]

export function getPillar(slug: string) {
  return pillars.find((p) => p.slug === slug)
}

export const featuredPillars = pillars.filter((p) => p.featured)
export const secondaryPillars = pillars.filter((p) => !p.featured)
