import { wa } from './brand'

/* Homepage copy — Plan §6: "The one-line pitch, the credibility
   bar (§3B), the six-pillar value chain, one clear next step."
   Every claim here has to be provable (Plan §2, Zell). */

export const hero = {
  eyebrow: 'Land verification · JDA structuring · Construction · Marketing',
  title: { before: 'We publish the', italic: 'proof,', after: ' not the pitch.' },
  subhead:
    'Bhumi Estates verifies land before it is bought, structures the deal that follows, oversees what gets built on it, and takes the finished asset to market. Our diligence protocol is published in full. So are our numbers.',
  primary: { label: 'Get a free land verification review', href: wa.verification },
  secondary: { label: 'See the verification protocol', href: '/verification' },
  tertiary: { label: 'Call an advisor', href: 'tel:+918123845749' },
}

/* Plan §3B — the data-driven credibility bar. Lead with metrics,
   not a tagline. Every figure here is served from the live
   verification record, with these as the published baseline. */
export const credibilityBar = [
  { value: '412', label: 'Parcels put through diligence', note: 'Since inception' },
  { value: '31%', label: 'Carried a disqualifying red flag', note: 'We publish this' },
  { value: '26', label: 'Median days to a decision', note: 'Intake to certificate' },
  { value: '6', label: 'Stages, each separately tracked', note: 'Never one black box' },
]

export const positioning = {
  eyebrow: 'The standard we hold ourselves to',
  title: { before: 'Every claim on this site should be', italic: 'provable.' },
  body: 'Real estate reputations are built on a permanent record. So we made three rules and applied them to every page: every claim is provable, land itself is the hero rather than logos or lifestyle photography, and every page ends in a specific next step. An unconvertible page is illiquid trust.',
  rules: [
    {
      rule: 'Every claim is provable',
      detail:
        'Case studies carry real mandate numbers, including the deals we walked away from. The diligence protocol is published in full rather than described as thorough.',
    },
    {
      rule: 'Land is the flagship, not a sub-page',
      detail:
        'The Land & Verification page gets the best content and placement on this site, because the best investment on earth is earth, and everything else we do is built on top of it.',
    },
    {
      rule: 'No dead ends',
      detail:
        'Every page — insight, case study, service page, tool — ends in a specific next step that names the value rather than asking you to "contact us".',
    },
  ],
}

export const verificationTeaser = {
  eyebrow: 'The flagship',
  title: { before: 'Six stages. Each one', italic: 'visible.' },
  body: 'A single "under review" status tells a landowner nothing. Six tracked stages tell them exactly where their parcel stands, and make a stalled or flagged stage impossible to hide. This is the process competitors are least likely to publish, because most do not have one to show.',
  cta: { label: 'Walk through the protocol', href: '/verification' },
  secondary: { label: 'See our diligence numbers', href: '/verification#transparency' },
}

export const typesTeaser = {
  eyebrow: 'What we cover',
  title: { before: 'A warehouse buyer and a villa buyer are making', italic: 'different decisions.' },
  body: 'So they get different pages. Each asset class carries its own presentation, its own diligence detail, and the specific number that decides it — clear height for a warehouse, the RERA number for an apartment, conversion status for a land parcel.',
}

export const proofTeaser = {
  eyebrow: 'Proof, organised by corridor',
  title: { before: 'Real mandates.', italic: 'Real numbers.' },
  body: 'Including the 620mm clear-height shortfall that renegotiated a warehouse lease, and the 11 acres we dropped at stage four over a partition suit the seller had not mentioned.',
}

export const largeParcelTeaser = {
  eyebrow: 'Institutional scale',
  title: { before: 'Large land parcels get their own', italic: 'pillar.' },
  body: 'Bulk buyers, developers land-banking ahead of a corridor, and family offices decide differently from an individual buyer. Aerial-first presentation, contiguous-assembly status, a named advisor rather than a shared inbox, and an information memorandum behind an NDA gate.',
  points: [
    'Full-parcel aerial presentation, not ground-level photography',
    'Headline details public; the memorandum released to verified buyers',
    'Enquiries route to a named advisor, never a shared inbox',
    'Land through verification, structuring, construction and final sale — one narrative',
  ],
  cta: { label: 'Enter the large-parcel pillar', href: '/large-land-parcels' },
}

export const faq = {
  eyebrow: 'Straight answers',
  title: { before: 'The questions worth asking', italic: 'before you engage.' },
  items: [
    {
      q: 'Is the first verification review really free?',
      a: 'Yes. The first review is a preliminary read — we look at what you have, tell you what is missing, and tell you whether the parcel is worth full diligence. It takes us a couple of days and costs you nothing. Full six-stage verification is a paid engagement, and we will quote it before starting.',
    },
    {
      q: 'What happens if you flag my parcel?',
      a: 'You get the finding in writing, with the source document behind it. Roughly a third of the parcels that reach us carry a disqualifying red flag, and we publish that figure because a verification service that never flags anything is not a verification service.',
    },
    {
      q: 'Do you buy land yourself?',
      a: 'We act on mandates for clients. Where we hold or represent inventory, it is marked as such on the listing, because you should always know which side of a table we are on.',
    },
    {
      q: 'Can I share your verification report with my bank or my partner?',
      a: 'That is the point of it. The report is issued as a dated, shareable certificate with a reference number and stated scope limitations, precisely so it can be forwarded to a lender, a JDA partner or a buyer.',
    },
    {
      q: 'Why is WhatsApp the primary way to contact you?',
      a: 'Because it is how landowners and developers in this market actually make first contact. A form is available on every page as a backup, and large-parcel enquiries route to a named advisor directly.',
    },
    {
      q: 'Are your tools valuations?',
      a: 'No. Every tool produces illustrative planning ranges and says so on the page. They are built to help you reach a decision early, not to replace parcel-level diligence or professional tax advice.',
    },
  ],
}

export const closingCta = {
  eyebrow: 'One next step',
  title: { before: 'Send us a survey number.', italic: 'We will tell you what we find.' },
  body: 'No obligation, no pitch deck. A preliminary read on what you own or what you are about to buy, back to you in a couple of days.',
  primary: { label: 'Get a free land verification review', href: wa.verification },
  secondary: { label: 'Download the verification checklist', href: '/checklist' },
}
