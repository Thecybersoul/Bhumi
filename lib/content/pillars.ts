/* The six-pillar value chain — Plan §6 (homepage) and the
   Services section. Land, Construction Oversight and Marketing
   & Advertising are the three named commercial pillars; the
   other three are the diligence and structuring work that makes
   the value chain end-to-end. */

export interface Pillar {
  slug: string
  number: string
  name: string
  short: string
  promise: string
  /** Sell the judgment, not just the inventory (Plan §2, Zell). */
  judgment: string
  deliverables: string[]
  proofPoints: { label: string; value: string }[]
  worksWellWith: string[]
  cta: { label: string; href: string }
  audience: string
  icon: 'land' | 'shield' | 'structure' | 'crane' | 'megaphone' | 'handshake'
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
      'Most parcels that reach us fail on something structural before price is ever discussed — no recorded access, an unresolved family interest, a buffer that no design can work around. Sourcing is mostly the discipline of saying no early, in writing, with the reason recorded.',
    deliverables: [
      'A written sourcing mandate: use, corridor, extent band, budget and hard constraints',
      'Off-market parcel origination through corridor-level landowner relationships',
      'A shortlist with a stated reason for inclusion, and a rejection log with reasons',
      'Preliminary title and zoning read before you spend on full diligence',
    ],
    proofPoints: [
      { label: 'Parcels screened per mandate', value: '30–60' },
      { label: 'Typically reach full diligence', value: '4–6' },
      { label: 'Reach an offer', value: '1–2' },
    ],
    worksWellWith: ['verification', 'jda-structuring'],
    cta: { label: 'Brief us on a sourcing mandate', href: '/contact?intent=sourcing' },
    audience: 'Developers, investors and family offices with a defined acquisition brief',
    icon: 'land',
  },
  {
    slug: 'verification',
    number: '02',
    name: 'Verification & Diligence',
    short: 'The six-stage protocol, published in full',
    promise:
      'A dated, shareable certificate with a clear pass or flag decision — not a verbal assurance.',
    judgment:
      'Diligence is only worth what its independence is worth. We pull the encumbrance certificate and the RTC ourselves rather than accepting the seller\'s copies, because the single cheapest fraud in this market is a well-photoshopped printout.',
    deliverables: [
      'The full six-stage protocol — intake, title chain, revenue and zoning, litigation, physical survey, report',
      'Independent EC from Kaveri 2.0 and digitally signed i-RTC from Bhoomi',
      'Licensed survey with geo-tagged boundary walk',
      'A shareable verification certificate with stated scope limitations',
    ],
    proofPoints: [
      { label: 'Stages, each separately tracked', value: '6' },
      { label: 'Title chain verified back', value: '30 years' },
      { label: 'Typical turnaround', value: '20–38 days' },
    ],
    worksWellWith: ['land-sourcing', 'jda-structuring'],
    cta: { label: 'Get a free land verification review', href: '/verification#review' },
    audience: 'Anyone about to pay for land they have not independently checked',
    icon: 'shield',
  },
  {
    slug: 'jda-structuring',
    number: '03',
    name: 'JDA & Deal Structuring',
    short: 'Area share, revenue share, or outright — decided on numbers',
    promise:
      'The structure that fits your position, modelled side by side before you commit to one.',
    judgment:
      'Landowners are routinely offered whichever structure suits the developer\'s cash position, presented as the only option. Area share, revenue share and outright sale produce very different outcomes for the same parcel — and the tax treatment diverges sharply, particularly the capital gains timing an individual landowner gets under Section 45(5A).',
    deliverables: [
      'Side-by-side modelling of area share, revenue share and outright sale',
      'Developer counterparty diligence — delivery record, litigation, balance sheet',
      'Term sheet support: share ratio, refundable deposit, timelines, penalty clauses',
      'Coordination with your tax counsel on GST and capital gains treatment',
    ],
    proofPoints: [
      { label: 'Structures modelled per mandate', value: '3' },
      { label: 'Capital gains timing (individual / HUF)', value: 'Sec 45(5A)' },
      { label: 'Counterparty checks per developer', value: '11' },
    ],
    worksWellWith: ['verification', 'construction-oversight'],
    cta: { label: 'Compare JDA structures', href: '/tools/jda-comparator' },
    audience: 'Landowners weighing a developer proposal, and developers assembling land',
    icon: 'structure',
  },
  {
    slug: 'construction-oversight',
    number: '04',
    name: 'Construction Oversight',
    short: 'Your representative on site, not the builder\'s',
    promise:
      'Independent stage-gate verification of quality, quantity and timeline — reported to you, monthly.',
    judgment:
      'The landowner in a joint development has the most at stake and the least visibility. Oversight is not a second project manager; it is an independent record of what was actually built, so that a dispute three years from now is settled by documentation instead of memory.',
    deliverables: [
      'Stage-gate inspections tied to the payment and delivery schedule',
      'Independent material and workmanship verification against specification',
      'Monthly progress report with dated photographic evidence',
      'Approval and compliance tracking through to occupancy certificate',
    ],
    proofPoints: [
      { label: 'Stage gates per project', value: '9' },
      { label: 'Reporting cadence', value: 'Monthly' },
      { label: 'Reports to', value: 'You, not the builder' },
    ],
    worksWellWith: ['jda-structuring', 'marketing-advertising'],
    cta: { label: 'Discuss construction oversight', href: '/services/construction-oversight' },
    audience: 'JDA landowners and owners running a project through a contractor',
    icon: 'crane',
  },
  {
    slug: 'marketing-advertising',
    number: '05',
    name: 'Marketing & Advertising',
    short: 'Campaigns reported as scans and leads, not impressions',
    promise:
      'A rate card is not a result. Every campaign is reported on what it actually produced.',
    judgment:
      'Price is what you pay; value is what you get. Most agencies in this market report impressions because impressions are unfalsifiable. We report the numbers a seller can act on — qualified enquiries, site visits booked, cost per qualified lead — and we publish the method alongside them.',
    deliverables: [
      'Site branding, boundary treatment and entrance identity',
      'Drone and walkthrough film, plan visualisation and collateral',
      'Digital campaigns with dedicated landing pages per offer and property type',
      'Weekly reporting: qualified enquiries, visits booked, cost per qualified lead',
    ],
    proofPoints: [
      { label: 'Landing page per offer', value: 'Always' },
      { label: 'Reported metric', value: 'Qualified leads' },
      { label: 'Reporting cadence', value: 'Weekly' },
    ],
    worksWellWith: ['construction-oversight', 'sales-handover'],
    cta: { label: 'See campaign numbers', href: '/portfolio' },
    audience: 'Developers and landowners taking a finished or launching project to market',
    icon: 'megaphone',
  },
  {
    slug: 'sales-handover',
    number: '06',
    name: 'Sales & Handover',
    short: 'From qualified buyer to registered document',
    promise:
      'The deal closes at the Sub-Registrar, not at the agreement. We stay until it does.',
    judgment:
      'A large number of transactions in this market stall between agreement and registration — e-Khata not in place, a release deed never recorded, a bank waiting on a document nobody owns. Closing is an operational discipline, and treating it as an afterthought is how six months of work evaporates.',
    deliverables: [
      'Buyer qualification and negotiation support',
      'Documentation runway: e-Khata, EC, release deeds, no-dues and approvals',
      'Stamp duty and registration computation, and Sub-Registrar coordination',
      'Post-registration handover: mutation, khata transfer and record closure',
    ],
    proofPoints: [
      { label: 'Statutory outlay modelled upfront', value: '~7.5%' },
      { label: 'Registration blockers pre-cleared', value: 'Before agreement' },
      { label: 'Closed at', value: 'Sub-Registrar' },
    ],
    worksWellWith: ['marketing-advertising', 'verification'],
    cta: { label: 'Talk about a live transaction', href: '/contact?intent=transaction' },
    audience: 'Sellers and buyers with a deal in motion',
    icon: 'handshake',
  },
]

export function getPillar(slug: string) {
  return pillars.find((p) => p.slug === slug)
}
