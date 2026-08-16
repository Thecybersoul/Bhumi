import type { VerificationStageKey } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════
   The verification protocol — Plan §5.
   Six discrete, visible stages. Deliberately not one black box:
   a stalled or flagged stage is immediately obvious.

   Every procedural detail below reflects how Karnataka land
   diligence actually works in 2026 — Kaveri 2.0 for the EC,
   Bhoomi i-RTC for the revenue record, eCourts for litigation,
   e-Khata for the municipal record.
   ═══════════════════════════════════════════════════════════ */

export interface VerificationStageDef {
  key: VerificationStageKey
  number: number
  title: string
  short: string
  summary: string
  /** Written for a landowner, not a lawyer (Plan §3C). */
  plain: string
  inputs: string[]
  checks: string[]
  output: string
  typicalDays: [number, number]
  killers: string[]
}

export const verificationStages: VerificationStageDef[] = [
  {
    key: 'intake',
    number: 1,
    title: 'Intake & Documents',
    short: 'Intake',
    summary:
      'Mother deed, prior title chain and seller KYC collected and logged against a dated file reference.',
    plain:
      'We start by taking custody of the paperwork — the original mother deed, every sale deed since, and identity proof for whoever claims to own the land. Nothing is verified yet at this stage. What we are establishing is a dated, complete record of exactly what we were handed, so that if a document appears later that was not in the original set, we know it appeared later.',
    inputs: [
      'Mother deed and all subsequent conveyance deeds',
      'Seller KYC — Aadhaar, PAN, or company records and board resolution',
      'Latest tax paid receipt and khata / e-Khata extract',
      'Any existing survey sketch, tippani or akarband',
    ],
    checks: [
      'Every document in the chain is present, or the gap is recorded explicitly',
      'Names on deed, KYC and revenue record are reconciled including spelling variants',
      'Power of attorney, if any, is examined for scope and validity',
    ],
    output: 'A dated document register — the file baseline everything later is measured against.',
    typicalDays: [2, 4],
    killers: [
      'Seller can produce only photocopies of the mother deed',
      'A general power of attorney is being used in place of ownership',
    ],
  },
  {
    key: 'title-chain',
    number: 2,
    title: 'Title Chain & Encumbrance',
    short: 'Title & EC',
    summary:
      'A 30-year chain verified at the Sub-Registrar directly. The EC is pulled independently — never taken from the seller\'s copy.',
    plain:
      'We trace ownership backwards for thirty years, which is the period a buyer is expected to establish under Indian conveyancing practice. Crucially, we pull the encumbrance certificate ourselves from Kaveri 2.0 rather than accepting the copy the seller hands over. A printed EC can be altered in minutes; a certificate we pull ourselves cannot.',
    inputs: [
      'Certified copies from the jurisdictional Sub-Registrar office',
      'Encumbrance certificate pulled independently via Kaveri 2.0',
      'Pre-2004 period searched manually at the SRO where the online record does not reach',
    ],
    checks: [
      'Thirty-year chain reconstructed with no unexplained break in ownership',
      'Every mortgage, lien and charge on the EC traced to a release deed',
      'Extent and boundaries consistent across every deed in the chain',
      'Minor, inheritance and partition interests identified and accounted for',
    ],
    output: 'A title chain map with each link sourced to a registered document number.',
    typicalDays: [4, 8],
    killers: [
      'A subsisting mortgage with no recorded release',
      'A break in the chain bridged only by an unregistered agreement',
    ],
  },
  {
    key: 'revenue-zoning',
    number: 3,
    title: 'Revenue Record & Zoning Match',
    short: 'Revenue & zoning',
    summary:
      'RTC / Pahani matched to title, the governing authority identified, and zoning confirmed against the applicable master plan.',
    plain:
      'The deed says one thing; the revenue record says another surprisingly often. We pull the digitally signed RTC from Bhoomi ourselves and line it up against the title, then confirm which authority actually governs the land and what the master plan permits there. Land that cannot legally be used for what a buyer intends is worth far less than the price being asked for it.',
    inputs: [
      'Digitally signed i-RTC from the Bhoomi portal',
      'Mutation register extract (MR) and mutation history',
      'e-Khata / e-Aasthi extract where the parcel falls in a municipal limit',
      'Applicable master plan or zoning regulation for the governing authority',
    ],
    checks: [
      'RTC owner column reconciles with the registered title holder',
      'Extent in the revenue record matches the deed extent',
      'Conversion status established — converted, deemed converted, or agricultural',
      'Zoning confirmed for the buyer\'s intended use, not just the current use',
      'Buffer zones checked: rajakaluve, lake, high-tension line, railway and highway setbacks',
    ],
    output: 'A zoning and conversion position note, with the governing authority named.',
    typicalDays: [3, 6],
    killers: [
      'Revenue record still shows a predecessor who never executed a release',
      'Parcel sits inside a rajakaluve or lake buffer that no setback can cure',
    ],
  },
  {
    key: 'litigation',
    number: 4,
    title: 'Litigation & Insider-Risk Search',
    short: 'Litigation',
    summary:
      'Court and eCourts records checked. Any unusually recent mutation is flagged for independent cross-verification.',
    plain:
      'Property disputes make up roughly two-thirds of civil litigation in India, and a case can sit in a court for a decade without ever surfacing in the paperwork a seller shows you. We search the courts by party name and by survey number. We also treat a mutation that happened suspiciously recently as a red flag in its own right — a record changed weeks before a sale is a pattern, not a coincidence.',
    inputs: [
      'eCourts district and High Court search by party name and survey number',
      'Revenue court and Tahsildar proceedings',
      'Land acquisition and government notification search',
      'Mutation timeline from the Bhoomi record',
    ],
    checks: [
      'No subsisting suit, injunction, attachment or caveat over the parcel',
      'No acquisition notification, alignment reservation or road-widening claim',
      'Any mutation inside the last 12 months independently cross-verified at source',
      'Family settlement or partition history examined for excluded heirs',
    ],
    output: 'A litigation and insider-risk memo with search coverage stated explicitly.',
    typicalDays: [4, 7],
    killers: [
      'A pending partition suit naming the parcel',
      'An acquisition notification the seller had not disclosed',
    ],
  },
  {
    key: 'physical',
    number: 5,
    title: 'Physical & Infrastructure Verification',
    short: 'Physical',
    summary:
      'Licensed survey, boundary and encroachment check, road access and water / BWSSB connection status confirmed on the ground.',
    plain:
      'Paper diligence tells you what the land is supposed to be. Only a walk of the boundary tells you what it is. We commission a licensed surveyor, physically walk the perimeter against the tippani, and establish whether there is a legal road to the parcel — not a path that exists by neighbourly tolerance and disappears the day the neighbour sells.',
    inputs: [
      'Licensed surveyor measurement against tippani and akarband',
      'Site walk with geo-tagged boundary photographs',
      'Access route traced back to a recorded public road',
      'Water source and utility connection enquiry',
    ],
    checks: [
      'Measured extent matches the recorded extent within survey tolerance',
      'No encroachment inward, and no encroachment by the parcel outward',
      'Legal, recorded access to a public road — width confirmed, not assumed',
      'Water availability: BWSSB / gram panchayat connection or borewell yield',
      'Power availability and sanctioned load where a built use is intended',
      'Topography, soil bearing and flood exposure recorded',
    ],
    output: 'A survey and site report with geo-tagged photographs and an access finding.',
    typicalDays: [5, 10],
    killers: [
      'No recorded access — the parcel is landlocked in law even if reachable in practice',
      'Measured extent materially short of the deed extent',
    ],
  },
  {
    key: 'report',
    number: 6,
    title: 'Verification Report Delivered',
    short: 'Report',
    summary:
      'A clear pass or flag decision, issued as a shareable, dated certificate — never a verbal assurance.',
    plain:
      'You get a document, not an opinion over the phone. It states a decision, the evidence behind it, the specific things we could not verify and why, and the date it was issued. It is written to be forwarded — to a bank, a partner, or a buyer — which is exactly why we will not soften a finding to make a deal easier.',
    inputs: [
      'Findings consolidated from stages 1 through 5',
      'Reviewer sign-off by the advisor who owns the file',
    ],
    checks: [
      'Every finding traced to a source document or a dated site observation',
      'Scope limitations stated plainly rather than buried',
      'A single unambiguous decision: Verified, or Flagged with the reason',
    ],
    output:
      'A dated, shareable verification certificate with a reference number and a defined validity period.',
    typicalDays: [2, 3],
    killers: [],
  },
]

/** Why six visible stages instead of one "under review" status (Plan §5). */
export const whyDiscrete = {
  heading: 'Why it is six stages, not one black box',
  body:
    'Six distinct, visible stages mean a landowner or developer always knows exactly where their parcel stands. A stage that stalls or gets flagged is immediately obvious, rather than buried inside a single "under review" status that tells you nothing about whether the delay is a slow Sub-Registrar office or a problem with your title.',
}

export const totalTurnaround = {
  low: verificationStages.reduce((s, v) => s + v.typicalDays[0], 0),
  high: verificationStages.reduce((s, v) => s + v.typicalDays[1], 0),
}
