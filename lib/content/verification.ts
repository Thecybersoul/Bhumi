import type { VerificationStageKey } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════
   The verification protocol — four stages.

   Deliberately not one "under review" status: a stage that
   stalls or gets flagged should be obvious from the outside.
   Equally deliberately not a ten-step diagram nobody reads.

   Each stage is written for a landowner, not a lawyer, and
   reflects how Karnataka land diligence actually works —
   Kaveri for the encumbrance certificate, Bhoomi for the
   revenue record, eCourts for litigation, e-Khata for the
   municipal record.
   ═══════════════════════════════════════════════════════════ */

export interface VerificationStageDef {
  key: VerificationStageKey
  number: number
  title: string
  short: string
  /** The question, in the client's words, that this stage answers. */
  question: string
  /** Two or three sentences. No jargon that is not immediately explained. */
  plain: string
  /** What gets checked. Kept to four lines — this is a summary, not a manual. */
  checks: string[]
  output: string
  typicalDays: [number, number]
  /** The findings that end a deal rather than merely complicate it. */
  killers: string[]
}

export const verificationStages: VerificationStageDef[] = [
  {
    key: 'documents',
    number: 1,
    title: 'Documents & Ownership',
    short: 'Documents',
    question: 'Does the person selling this actually own it?',
    plain:
      'We take custody of the paperwork and establish a dated record of exactly what we were handed — the mother deed, every sale deed since, and identity proof for whoever claims to own the land. Nothing is verified yet. The point is that if a document appears later that was not in the original set, we know it appeared later.',
    checks: [
      'Every document in the ownership chain is present, or the gap is recorded explicitly',
      'Names on the deed, the ID and the revenue record are reconciled, spelling variants included',
      'Any power of attorney is examined for scope and validity, not taken at face value',
      'Latest tax receipt and khata extract on file',
    ],
    output: 'A dated document register — the baseline everything later is measured against.',
    typicalDays: [2, 4],
    killers: [
      'Only photocopies of the mother deed exist',
      'A general power of attorney is being used in place of ownership',
    ],
  },
  {
    key: 'title',
    number: 2,
    title: 'Title, Encumbrance & Zoning',
    short: 'Title & zoning',
    question: 'Is the title clean, and can I use the land for what I intend?',
    plain:
      'We trace ownership back thirty years, which is the period a buyer is expected to establish under Indian conveyancing practice, and pull the encumbrance certificate ourselves rather than accepting the seller\'s printed copy. A printed certificate can be altered in minutes; one pulled at source cannot. We then check what the land is actually zoned for, because land that cannot legally be used for your purpose is worth far less than the price being asked.',
    checks: [
      'Thirty-year chain reconstructed with no unexplained break in ownership',
      'Every mortgage, lien and charge traced through to a recorded release',
      'Revenue record and deed reconciled on both owner and extent',
      'Conversion status and zoning confirmed for your intended use, plus buffer zones — drain, lake, high-tension line, highway setback',
    ],
    output: 'A title and zoning position note, with the governing authority named.',
    typicalDays: [5, 10],
    killers: [
      'A subsisting mortgage with no recorded release',
      'The parcel sits inside a buffer zone that no setback can cure',
    ],
  },
  {
    key: 'site',
    number: 3,
    title: 'Disputes & Site Check',
    short: 'Disputes & site',
    question: 'Is there a case pending, and is the land physically what the paper says?',
    plain:
      'A dispute can sit in a court for years without ever surfacing in the paperwork a seller shows you, so we search by party name and by survey number, and treat a suspiciously recent change to the revenue record as a flag in its own right. Then we walk the boundary. Paper tells you what the land is supposed to be; only a site visit tells you what it is — including whether there is a legal road to it, or merely a path the neighbour currently tolerates.',
    checks: [
      'Court, revenue-court and acquisition-notification searches, coverage stated explicitly',
      'Any change to the record inside the last twelve months cross-verified at source',
      'Licensed survey against the sketch, with encroachment checked in both directions',
      'Recorded access to a public road, plus water and power availability',
    ],
    output: 'A dispute search memo and a site report with geo-tagged photographs.',
    typicalDays: [6, 12],
    killers: [
      'A pending partition or title suit naming the parcel',
      'No recorded access — landlocked in law even if reachable in practice',
      'Measured extent materially short of the deed extent',
    ],
  },
  {
    key: 'report',
    number: 4,
    title: 'Written Report',
    short: 'Report',
    question: 'What is the answer, in writing, that I can show my bank?',
    plain:
      'You get a document, not an opinion over the phone. It states a position, the evidence behind it, the specific things we could not verify and why, and the date it was issued. It is written to be forwarded — to a lender, a partner or a buyer — which is exactly why a finding does not get softened to make a deal easier.',
    checks: [
      'Every finding traced to a source document or a dated site observation',
      'Scope limitations stated plainly rather than buried in a footnote',
      'One unambiguous position: clear, or flagged with the reason',
      'Signed off by the advisor who owns the file',
    ],
    output: 'A dated report with a reference number and a defined validity period.',
    typicalDays: [2, 3],
    killers: [],
  },
]

/** Why four visible stages instead of one "under review" status. */
export const whyDiscrete = {
  heading: 'Why four stages, not one status',
  body:
    'A single "under review" status tells you nothing about whether a delay is a slow Sub-Registrar office or a problem with your title. Four named stages mean you always know which question is currently being answered, and a stage that stalls is visible rather than buried.',
}

export const totalTurnaround = {
  low: verificationStages.reduce((s, v) => s + v.typicalDays[0], 0),
  high: verificationStages.reduce((s, v) => s + v.typicalDays[1], 0),
}

/* ─── The pre-diligence checklist ─────────────────────────── */
/* Deliberately short. This is what a buyer can sanity-check
   themselves in an afternoon, before paying anybody for
   diligence — not a replacement for it. */

export interface ChecklistItem {
  id: string
  ask: string
  why: string
  /** What a straight answer looks like. */
  good: string
  /** What should stop the conversation. */
  bad: string
}

export const checklist: ChecklistItem[] = [
  {
    id: 'mother-deed',
    ask: 'Ask to see the original mother deed, not a photocopy.',
    why: 'The mother deed is the root of the ownership chain. Everything after it depends on it being genuine.',
    good: 'The original is produced, and the seller is relaxed about it being examined.',
    bad: 'Only photocopies exist, or the original is permanently "with the bank" or "with a relative".',
  },
  {
    id: 'ec',
    ask: 'Pull the encumbrance certificate yourself, from the portal.',
    why: 'It lists mortgages and charges registered against the property. A copy handed to you can be edited; one you pull cannot.',
    good: 'Your own copy matches what you were told, and every charge shown has a release.',
    bad: 'You are discouraged from pulling it, or a charge appears that was never mentioned.',
  },
  {
    id: 'revenue-record',
    ask: 'Check the revenue record against the deed — owner name and extent.',
    why: 'The deed and the government record disagree more often than people expect, and the mismatch is the seller\'s problem to fix before sale, not yours after.',
    good: 'Owner and extent match, and any recent change has a clear explanation.',
    bad: 'The record still names a predecessor, or the extent is short of the deed.',
  },
  {
    id: 'zoning',
    ask: 'Confirm the zoning for what you intend to do, not what is being done now.',
    why: 'Land that cannot legally carry your intended use is worth a different price from the one being quoted.',
    good: 'The governing authority is named and the permitted use is confirmed in writing.',
    bad: '"Conversion is a formality" — said verbally, with no application on record.',
  },
  {
    id: 'access',
    ask: 'Establish that the access road is recorded, not merely used.',
    why: 'A parcel reachable only across a neighbour\'s land is landlocked in law, and becomes unusable the day that neighbour sells.',
    good: 'The access traces back to a recorded public road, with width confirmed.',
    bad: 'Access is "through the field" or depends on a verbal understanding.',
  },
  {
    id: 'boundary',
    ask: 'Walk the boundary before you pay anything.',
    why: 'Encroachment runs in both directions, and neither shows up on paper.',
    good: 'The boundary on the ground matches the sketch within survey tolerance.',
    bad: 'Nobody will meet you at the site, or the corners cannot be pointed out.',
  },
]

/* ─── Industry context ────────────────────────────────────── */
/* Generic, checkable ground rules — not a record of work done.
   Used where a credibility bar would otherwise sit. */

export interface ContextStat {
  value: string
  label: string
  note: string
}

export const industryContext: ContextStat[] = [
  {
    value: '30 yrs',
    label: 'Title chain a buyer is expected to establish',
    note: 'Standard Indian conveyancing practice',
  },
  {
    value: '4',
    label: 'Authorities that can govern a Bengaluru parcel',
    note: 'BBMP, BDA, BMRDA or a gram panchayat',
  },
  {
    value: '3',
    label: 'State records a parcel is checked against',
    note: 'Kaveri, Bhoomi and eCourts',
  },
]

export const contextNote =
  'These are the ground rules of buying land in and around Bengaluru, not a record of our own work. Where we publish figures about work we have done, they will be dated and sourced.'
