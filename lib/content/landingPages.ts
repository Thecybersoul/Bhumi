import { wa } from './brand'
import type { PropertyTypeSlug } from '@/lib/types'

/* Dedicated campaign landing pages — Plan §7.

   "Campaign and outreach traffic never lands on the homepage;
   each has its own page built around one specific offer, and
   around one property type where relevant."

   Each page here is single-offer, single-audience, and carries
   its own CTA naming the value rather than the action. */

export interface LandingPage {
  slug: string
  campaign: string
  audience: string
  propertyType?: PropertyTypeSlug
  corridor?: string
  eyebrow: string
  headline: string
  headlineItalic: string
  subhead: string
  /** One offer. Not a menu. */
  offer: { label: string; detail: string }
  cta: { label: string; whatsapp: string }
  proof: { value: string; label: string }[]
  bullets: { title: string; body: string }[]
  objections: { q: string; a: string }[]
  formQualifier: { name: string; label: string; placeholder?: string; options?: string[] }
}

export const landingPages: LandingPage[] = [
  {
    slug: 'free-land-verification',
    campaign: 'Verification — landowner outreach',
    audience: 'Landowners in Bengaluru holding agricultural or unconverted land',
    propertyType: 'land-parcels',
    eyebrow: 'For landowners · Free preliminary review',
    headline: 'Find out what is wrong with your land',
    headlineItalic: 'before a buyer does.',
    subhead:
      'Send us a survey number. In two to three days we come back with what the records actually show, what is missing, and whether it would survive a serious buyer\'s diligence. No cost, no obligation.',
    offer: {
      label: 'A free preliminary verification read',
      detail:
        'We pull the encumbrance certificate and the RTC ourselves, check the revenue position against the title, and tell you plainly what a buyer\'s lawyer would find. If we think your parcel is clean, we will say so and you will owe us nothing.',
    },
    cta: {
      label: 'Get my free verification review',
      whatsapp: "Hi Bhumi Estates — I'd like the free land verification review. My survey number is:",
    },
    proof: [
      { value: '412', label: 'Parcels put through diligence' },
      { value: '31%', label: 'Carried a disqualifying red flag' },
      { value: '2–3 days', label: 'For the preliminary read' },
      { value: '₹0', label: 'For the first review' },
    ],
    bullets: [
      {
        title: 'We pull the records ourselves',
        body: 'The EC comes from Kaveri 2.0 and the RTC from Bhoomi, obtained by us. A printout can be altered in minutes — a certificate we pull cannot.',
      },
      {
        title: 'You get it in writing',
        body: 'Not a phone call saying it looks fine. A written summary of what we found, what we could not check, and why.',
      },
      {
        title: 'It is genuinely free',
        body: 'The preliminary read costs you nothing. Full six-stage verification is a paid engagement, quoted before we start, and only if the parcel is worth it.',
      },
    ],
    objections: [
      {
        q: 'What is the catch?',
        a: 'There is not one. Around a third of parcels we look at carry a disqualifying problem, and in those cases we tell the owner to stop rather than sell them a full diligence engagement. The ones that are clean often become clients later. That trade works out for us.',
      },
      {
        q: 'I already have my documents. Why do I need this?',
        a: 'Because the documents you hold are the ones you were given. The records we pull are the ones the state holds. When those two disagree — and they disagree more often than anyone expects — that gap is the finding.',
      },
      {
        q: 'Will you try to list my land?',
        a: 'Only if you ask us to. The review is separate, and the result of it does not depend on whether you engage us for anything else.',
      },
    ],
    formQualifier: {
      name: 'survey_number',
      label: 'Survey number and village',
      placeholder: 'e.g. Sy. 44/2, Devanahalli',
    },
  },
  {
    slug: 'warehouse-specification-audit',
    campaign: 'Industrial — occupier outreach',
    audience: '3PL operators, manufacturers and industrial investors shortlisting a facility',
    propertyType: 'warehouses',
    corridor: 'hoskote',
    eyebrow: 'For occupiers · Specification audit',
    headline: 'The building is marketed as Grade A.',
    headlineItalic: 'Has anyone measured it?',
    subhead:
      'We measure clear height at eaves, verify the floor load rating and flatness class, count docks against area, check apron depth for 40-foot trailers, and confirm sanctioned power with the utility. Findings in writing, in about a week.',
    offer: {
      label: 'An independent specification audit before you sign',
      detail:
        'Six measured checks against your actual operating requirement, not a generic Grade A definition. The report is written to be handed to the landlord — which is what makes it useful in a negotiation.',
    },
    cta: {
      label: 'Book a specification audit',
      whatsapp: 'Hi Bhumi Estates — I need a warehouse specification audit. The building is at:',
    },
    proof: [
      { value: '620mm', label: 'Clear-height shortfall found on a live mandate' },
      { value: '−9.5%', label: 'Rent renegotiated on that finding' },
      { value: '6 days', label: 'Audit turnaround' },
      { value: '6', label: 'Measured checks' },
    ],
    bullets: [
      {
        title: 'Measured, not quoted',
        body: 'Clear height at eaves at six points. Apron depth with a tape. Turning circle tested with a loaded trailer. Marketing packs get things wrong, and not always by accident.',
      },
      {
        title: 'Against your requirement',
        body: 'Grade A is a market convention, not a standard. What matters is whether the building supports your racking height, your equipment load and your power draw.',
      },
      {
        title: 'Findings you can negotiate with',
        body: 'A written report with each variance quantified. That is what moves a rent, not an opinion in a meeting.',
      },
    ],
    objections: [
      {
        q: 'The landlord has given me a specification sheet.',
        a: 'Most are accurate. The ones that are not tend to be wrong on the two numbers that cost you the most: clear height at eaves, and sanctioned power rather than connected load. Both take an afternoon to verify.',
      },
      {
        q: 'We are on a tight timeline.',
        a: 'The audit takes about a week and runs in parallel with your legal review. Discovering a specification gap after you sign costs considerably more time than that.',
      },
    ],
    formQualifier: {
      name: 'requirement',
      label: 'Area and clear height you need',
      placeholder: 'e.g. 120,000 sq ft, 10m clear height, 900 KVA',
    },
  },
  {
    slug: 'outdoor-advertising-campaign',
    campaign: 'Outdoor Advertising — developer and brand outreach',
    audience: 'Developers and brands planning a launch or a sustained presence in a corridor',
    eyebrow: 'For developers and brands · Media planning',
    headline: 'Impressions are not a result.',
    headlineItalic: 'Enquiries are.',
    subhead:
      'We choose outdoor sites on visibility, traffic and audience fit, buy at the rate the market actually supports, and report the number that matters to a launch — qualified enquiries, and what each one cost.',
    offer: {
      label: 'A media plan built around what it needs to produce',
      detail:
        'Site selection across billboards, hoardings and highmasts, matched to your audience and your corridor. Installation and maintenance coordinated for the full campaign window, reported weekly on enquiries generated and cost per qualified lead — not reach or impressions.',
    },
    cta: {
      label: 'Plan my outdoor campaign',
      whatsapp: 'Hi Bhumi Estates — I would like to plan an outdoor advertising campaign. The project is:',
    },
    proof: [
      { value: '2,840', label: 'Qualified enquiries, one campaign' },
      { value: '₹412', label: 'Cost per qualified lead' },
      { value: 'Weekly', label: 'Reporting cadence' },
      { value: '71%', label: 'Of first contact via WhatsApp' },
    ],
    bullets: [
      {
        title: 'Sites chosen on fit, not on rate card',
        body: 'Visibility, traffic density and audience match decide the shortlist. A cheap site nobody in your audience passes is not a discount, it is wasted spend.',
      },
      {
        title: 'Reported on what you can act on',
        body: 'Qualified enquiries and cost per qualified lead, every week. Impressions are shown too, purely to demonstrate how little they tell you.',
      },
      {
        title: 'Branding and media, one accountable party',
        body: 'The physical structure — hoarding, pylon, highmast — and the media plan that puts it to work, delivered together so nothing falls in the gap between two vendors.',
      },
    ],
    objections: [
      {
        q: 'How is this different from booking through a media agency?',
        a: 'Most agencies report impressions because impressions are unfalsifiable. We report qualified enquiries and cost per lead, the numbers a launch is actually judged on, and we show our method alongside them.',
      },
      {
        q: 'Can you also build the hoarding or pylon itself?',
        a: 'Yes — branding and outdoor advertising are run together when a client needs both, so the physical structure and the media plan around it are one accountable engagement, not two vendors pointing at each other.',
      },
    ],
    formQualifier: {
      name: 'campaign',
      label: 'What are you launching, and where?',
      placeholder: 'e.g. Residential launch, Sarjapur corridor',
    },
  },
]

export function getLandingPage(slug: string) {
  return landingPages.find((l) => l.slug === slug)
}
