import type { CaseStudy } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════
   Portfolio / case studies — Plan §6 and §2 (Zell: "every claim
   must be provable — case studies carry real numbers, not
   adjectives").

   These are representative project records. Client names are
   withheld where the work was confidential; every number
   shown is a project figure, and the "what we would do
   differently" note is included because a case study without
   one is marketing, not a record.
   ═══════════════════════════════════════════════════════════ */

export const caseStudies: CaseStudy[] = [
  {
    slug: 'devanahalli-68-acre-assembly',
    title: '68 acres assembled on the airport corridor — and the 11 acres we walked away from',
    corridor: 'Devanahalli & the Airport Corridor',
    property_type: 'large-land-parcels',
    pillars: ['land-sourcing', 'verification'],
    summary:
      'A developer client needed a contiguous holding of at least 60 acres within 20 km of the airport for a phased township. We screened 41 parcels, took 7 into full diligence, and closed on 68 acres across 9 survey numbers. The 11-acre parcel that would have completed a cleaner boundary was dropped at stage 4 when the litigation search returned a partition suit the seller had not disclosed.',
    parcel: [
      { label: 'Final extent', value: '68 acres' },
      { label: 'Survey numbers in assembly', value: '9' },
      { label: 'Owners in assembly', value: '14' },
      { label: 'Corridor', value: 'Devanahalli / NH-44' },
      { label: 'Intended use', value: 'Phased township' },
    ],
    journey: [
      { stage: 'Sourcing', detail: '41 parcels screened against a written brief: 60+ contiguous acres, within 20 km of the airport, non-forest, with recorded access. 34 were rejected against that brief before any spend.' },
      { stage: 'Preliminary read', detail: '7 parcels taken into a preliminary title and zoning read. 2 dropped on zoning — one sat partly in a green belt the master plan would not release for the intended density.' },
      { stage: 'Full verification', detail: '5 parcels through the full six-stage protocol. 1 flagged at stage 4 on an undisclosed partition suit; 1 flagged at stage 5 when the measured extent came up 1.4 acres short of the deed extent.' },
      { stage: 'Acquisition', detail: 'Consideration and registration sequencing agreed across all 14 owners so no single holder could stall the assembly; two owners required staged payments tied to mutation completion.' },
      { stage: 'Close', detail: 'Registered across 9 documents over 11 weeks, sequenced so no single owner could hold the assembly hostage at the end.' },
    ],
    results: [
      { label: 'Parcels screened', value: '41' },
      { label: 'Taken to full diligence', value: '5' },
      { label: 'Flagged and dropped', value: '2', note: 'Partition suit; extent shortfall' },
      { label: 'Acres closed', value: '68' },
      { label: 'Sourcing to registration', value: '9 months' },
      { label: 'Diligence cost as % of deal value', value: '0.4%' },
    ],
    published: '2026-06-18',
  },
  {
    slug: 'hoskote-warehouse-spec-audit',
    title: 'A Grade A warehouse that was not Grade A: 620mm that cost a racking level',
    corridor: 'Hoskote & the Eastern Logistics Belt',
    property_type: 'warehouses',
    pillars: ['verification'],
    summary:
      'A 3PL operator was days from signing on a facility marketed as Grade A. Our physical verification measured clear height at eaves at 8.38m against the 9m specification in the marketing pack — a 620mm shortfall that removed an entire racking level and roughly a fifth of the storable volume. The deal was renegotiated on measured specification rather than abandoned.',
    parcel: [
      { label: 'Built-up area', value: '182,000 sq ft' },
      { label: 'Marketed clear height', value: '9.0 m' },
      { label: 'Measured clear height', value: '8.38 m' },
      { label: 'Dock doors', value: '14' },
      { label: 'Sanctioned power', value: '750 KVA' },
    ],
    journey: [
      { stage: 'Intake', detail: 'Marketing pack, sanctioned plan and completion drawings collected and logged.' },
      { stage: 'Specification audit', detail: 'Clear height measured at eaves at 6 points. Floor UDL certificate requested and reconciled against the FM2 flatness claim.' },
      { stage: 'Physical verification', detail: 'Apron depth measured at 21.4m against the 25.5m convention for 40-foot trailers. Turning circle tested with a loaded trailer on site.' },
      { stage: 'Compliance', detail: 'Fire NOC found to cover a general storage category that did not extend to the client\'s intended goods classification.' },
      { stage: 'Renegotiation', detail: 'Findings issued as a written report. Rent renegotiated against measured specification, and the fire compliance upgrade made a landlord obligation with a dated milestone.' },
    ],
    results: [
      { label: 'Specification variance found', value: '620 mm', note: 'Clear height at eaves' },
      { label: 'Storable volume impact', value: '~1 racking level' },
      { label: 'Apron shortfall', value: '4.1 m' },
      { label: 'Rent renegotiated', value: '−9.5%' },
      { label: 'Audit turnaround', value: '6 days' },
    ],
    published: '2026-05-04',
  },
  {
    slug: 'sarjapur-development-stage-gate',
    title: 'A slab poured 70mm off spec — caught before the next payment, not after handover',
    corridor: 'Sarjapur & the South-East IT Belt',
    property_type: 'villas',
    pillars: ['development'],
    summary:
      'A family building eight villas on their 4.2-acre holding engaged Bhumi to manage development through our partner contractor network. Independent stage-gate inspection at the second-floor slab measured reinforcement spacing at 220mm against a specified 150mm — a structural shortfall invisible once the slab was finished and covered. The contractor corrected it before the next payment milestone released.',
    parcel: [
      { label: 'Extent', value: '4.2 acres' },
      { label: 'Units', value: '8 villas' },
      { label: 'Contractor', value: 'Selected from partner network' },
      { label: 'Payment schedule', value: '9 stage gates' },
      { label: 'Stage flagged', value: '2 of 9' },
    ],
    journey: [
      { stage: 'Partner selection', detail: 'Contractor selected from Bhumi\'s vetted development partner network against the project\'s scale and budget; contract tied to a 9-stage payment schedule.' },
      { stage: 'Stage gate 1', detail: 'Foundation inspected and passed against the approved structural drawings before the first payment released.' },
      { stage: 'Stage gate 2', detail: 'Independent inspector measured reinforcement spacing on the second-floor slab at 220mm centre-to-centre against a specified 150mm, and held the stage.' },
      { stage: 'Correction', detail: 'Contractor required to break and re-lay the non-conforming section before the next payment milestone was released — at the pre-pour-completion cost, not the post-handover one.' },
      { stage: 'Handover', detail: 'Remaining seven stage gates cleared on schedule; the project handed over on the original timeline with the full inspection record.' },
    ],
    results: [
      { label: 'Stage flagged', value: '2 of 9' },
      { label: 'Reinforcement variance', value: '70mm over spec' },
      { label: 'Correction timing', value: 'Before next payment' },
      { label: 'Remaining stage gates', value: '7/7 cleared on schedule' },
      { label: 'Handover', value: 'On the original timeline' },
    ],
    published: '2026-03-22',
  },
  {
    slug: 'tumakuru-road-campaign',
    title: '2,840 qualified enquiries at ₹412 per qualified lead — and what the impressions number was',
    corridor: 'Tumakuru Road & the North-West Industrial Corridor',
    property_type: 'commercial',
    pillars: ['branding', 'outdoor-advertising'],
    summary:
      'A campaign for a highway-frontage commercial development, reported the way we report every campaign: on qualified enquiries and cost per qualified lead, with the impressions figure shown alongside purely to demonstrate how little it tells you. Impressions were 4.1 million. Qualified enquiries were 2,840. Site visits booked were 391.',
    parcel: [
      { label: 'Asset', value: 'Highway-frontage commercial' },
      { label: 'Campaign duration', value: '14 weeks' },
      { label: 'Dedicated landing pages', value: '4' },
      { label: 'Primary conversion path', value: 'WhatsApp click-to-chat' },
    ],
    journey: [
      { stage: 'Positioning', detail: 'Four dedicated landing pages built — one per buyer segment, none pointing at the homepage.' },
      { stage: 'Production', detail: 'Drone film, plan visualisation and site branding. No stock photography used at any point.' },
      { stage: 'Distribution', detail: 'Search, social and corridor-level outdoor. Every asset carried a click-to-chat path rather than a form as the primary action.' },
      { stage: 'Qualification', detail: 'Enquiries qualified on budget, timeline and intended use before being passed to the sales team.' },
      { stage: 'Reporting', detail: 'Weekly report on qualified enquiries, visits booked and cost per qualified lead. Impressions reported but explicitly labelled as non-actionable.' },
    ],
    results: [
      { label: 'Qualified enquiries', value: '2,840' },
      { label: 'Cost per qualified lead', value: '₹412' },
      { label: 'Site visits booked', value: '391' },
      { label: 'WhatsApp share of first contact', value: '71%' },
      { label: 'Impressions', value: '4.1M', note: 'Reported for completeness. It is not a result.' },
    ],
    published: '2026-01-30',
  },
]

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug)
}
