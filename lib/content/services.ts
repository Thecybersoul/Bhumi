/* ═══════════════════════════════════════════════════════════
   The business, in two consultancies.

   Everything Bhumi Estates does resolves to one of two
   practices: Property Consultancy (the asset itself — finding
   it, proving it, building on it) and Branding Consultancy
   (how that asset is presented and sold).

   Each practice owns exactly one page. No claim in this file
   describes work Bhumi has completed — the numbers and ranges
   here are industry context, framed as such.
   ═══════════════════════════════════════════════════════════ */

export type PracticeSlug = 'property-consultancy' | 'branding-advertising'

export interface Service {
  slug: string
  number: string
  name: string
  /** One line, on the card. */
  short: string
  /** The paragraph under the heading on the practice page. */
  summary: string
  /** What the client actually receives. */
  deliverables: string[]
  /** The questions this service exists to answer. */
  answers: string[]
  icon: 'land' | 'shield' | 'crane' | 'billboard' | 'megaphone'
}

export interface Practice {
  slug: PracticeSlug
  href: string
  name: string
  /** Nav / card label where the full name is too long. */
  shortName: string
  eyebrow: string
  /** Hero headline, split so the italic clause can be styled. */
  title: { before: string; italic: string; after?: string }
  /** Desktop hero paragraph. */
  lede: string
  /** Mobile hero line — deliberately short so the video stays visible. */
  mobileLede: string
  /** The one-line pitch used on the homepage card. */
  pitch: string
  services: Service[]
  /** Who this practice is built for. */
  audience: string[]
}

export const practices: Practice[] = [
  {
    slug: 'property-consultancy',
    href: '/property-consultancy',
    name: 'Property Consultancy',
    shortName: 'Property',
    eyebrow: 'Land · Title · Build',
    title: { before: 'The land, and everything', italic: 'under it.' },
    lede: 'Sourcing the parcel worth buying, proving it holds up in law, and building what goes on it. One practice across the whole life of the asset, so a finding at diligence is not lost by the time anyone breaks ground.',
    mobileLede: 'Sourcing, verification and development — one practice, whole life of the asset.',
    pitch: 'Find the parcel, prove the title, build the project.',
    audience: [
      'Developers with a defined acquisition brief',
      'Investors and family offices building a land position',
      'Landowners who need their own title examined before they sell',
      'Buyers who want diligence run independently of the seller',
    ],
    services: [
      {
        slug: 'land-sourcing',
        number: '01',
        name: 'Land Sourcing',
        short: 'Finding the parcel worth the diligence',
        summary:
          'Most land that is available is available for a reason. Sourcing starts with a written brief — use, location, extent band, budget and the constraints that are genuinely non-negotiable — and works outward from there, rather than showing you whatever happens to be on the market this month.',
        deliverables: [
          'A written sourcing brief agreed before any parcel is shown',
          'Off-market origination through corridor-level landowner relationships',
          'A preliminary title and zoning read before you spend on full diligence',
          'A written reason for every parcel rejected, not just the ones taken forward',
        ],
        answers: [
          'Does a parcel matching this brief actually exist at this budget?',
          'Is the asking price defensible against comparable transactions?',
          'What is structurally wrong with the parcels already offered to me?',
        ],
        icon: 'land',
      },
      {
        slug: 'verification-legal',
        number: '02',
        name: 'Land Verification & Legal',
        short: 'Proving the title before money moves',
        summary:
          'Diligence is only worth what its independence is worth. Records are pulled directly from the source — the encumbrance certificate from Kaveri, the revenue record from Bhoomi, litigation from eCourts — never accepted as the seller\'s printed copy. The finding is reported exactly as found.',
        deliverables: [
          'A thirty-year title chain, each link sourced to a registered document number',
          'Encumbrance, revenue record and zoning position pulled independently',
          'Litigation and acquisition-notification search by party name and survey number',
          'A licensed survey and physical boundary check against the tippani',
          'A dated report stating a clear position, including what could not be verified',
        ],
        answers: [
          'Does the person selling this actually own it?',
          'Can I legally use this land for what I intend to do with it?',
          'Is there a case, a charge or a notification nobody has mentioned?',
        ],
        icon: 'shield',
      },
      {
        slug: 'construction-development',
        number: '03',
        name: 'Construction & Development',
        short: 'Taking the parcel to a finished asset',
        summary:
          'Approvals, drawings, contractor selection and site supervision, managed against a programme with named responsibilities. The value of running this in the same practice as diligence is continuity: the setback that was flagged at verification is still on the drawing board when the plan is submitted.',
        deliverables: [
          'Approval pathway mapped to the authority that actually governs the parcel',
          'Architect and consultant selection, with drawings reviewed against the brief',
          'Contractor tendering on a like-for-like scope, so bids are comparable',
          'Stage-gated site supervision with dated progress reporting',
        ],
        answers: [
          'What will this actually cost to build, and over what programme?',
          'Which approvals apply here, and in what order?',
          'Is the work on site matching the drawing and the specification?',
        ],
        icon: 'crane',
      },
    ],
  },
  {
    slug: 'branding-advertising',
    href: '/branding-advertising',
    name: 'Branding & Outdoor Advertising',
    shortName: 'Branding',
    eyebrow: 'Identity · Media',
    title: { before: 'Built to be seen,', italic: 'and believed.' },
    lede: 'A project is judged long before a brochure is opened — at the boundary wall, at the entrance, on the drive past. This practice builds that identity and then buys the media that carries it, with the spend reported honestly enough to be argued with.',
    mobileLede: 'Project identity, site branding and outdoor media — built to be seen.',
    pitch: 'Build the identity, then put it where it will be seen.',
    audience: [
      'Developers launching a project into a competitive corridor',
      'Landowners marketing a parcel directly',
      'Brands buying outdoor media across the city and its approaches',
      'Projects whose site presence does not match the price being asked',
    ],
    services: [
      {
        slug: 'project-branding',
        number: '01',
        name: 'Real Estate Project Branding',
        short: 'The identity a project is judged by',
        summary:
          'Naming, identity and the physical expression of it on the ground — boundary walls, entrance pylons, site hoarding, wayfinding and the show-unit environment. Real estate branding lives outdoors at scale, in weather, at speed, and is designed for those conditions rather than for a screen.',
        deliverables: [
          'Project naming, identity system and usage rules that survive a handover',
          'Site branding: boundary treatment, entrance pylon, hoarding and wayfinding',
          'Application across brochure, site office, signage and digital listings',
          'Artwork prepared to the specification each fabricator and media owner requires',
        ],
        answers: [
          'Why does this project look indistinguishable from the three next to it?',
          'Does the site read as credible to somebody driving past at speed?',
          'Will the identity still be intact once ten different vendors have used it?',
        ],
        icon: 'billboard',
      },
      {
        slug: 'outdoor-advertising',
        number: '02',
        name: 'Outdoor Advertising',
        short: 'Media that earns the spend',
        summary:
          'Site selection, negotiation, buying and campaign management across billboards, hoardings, highmasts and transit media. Outdoor is bought on traffic direction, dwell time and sightline as much as on rate — a cheap site facing the wrong way is not cheap.',
        deliverables: [
          'Site selection assessed on traffic direction, sightline, dwell and competition',
          'Rate negotiation and buying, with the rate card and what you paid both shown',
          'Creative adapted per format, so a highmast is not a shrunk billboard',
          'Mounting verification with dated, geo-tagged proof of display',
          'Post-campaign reporting that states what is measured and what is estimated',
        ],
        answers: [
          'Is this site actually seen by the people I am trying to reach?',
          'Did the campaign run where and when it was booked to run?',
          'What did this spend do, stated without inventing a number for it?',
        ],
        icon: 'megaphone',
      },
    ],
  },
]

export const propertyPractice = practices[0]
export const brandingPractice = practices[1]

export function getPractice(slug: PracticeSlug): Practice {
  return practices.find((p) => p.slug === slug)!
}

/** Every service across both practices, for footers and indexes. */
export const allServices = practices.flatMap((p) =>
  p.services.map((s) => ({ ...s, practice: p }))
)
