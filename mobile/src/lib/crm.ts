/* Copied from the web repo's lib/crm.ts (pure: no server or web imports) so the
   app and the admin agree on stages, forecast weights, scoring, the playbook
   and parcel matching. Change both together. */

/* ═══════════════════════════════════════════════════════════
   Sales CRM (/admin/crm, migration 021): shared rules and playbook.

   Pure data and functions with no server imports, so the API routes
   (validation) and the page (display, messages) agree on the stages,
   the forecast weights. Commission is never a fixed rate: it is agreed
   per property and entered on the deal.
   ═══════════════════════════════════════════════════════════ */

export const STAGES = ['New', 'Contacted', 'Interested', 'Proposal', 'Won', 'Lost'] as const
/** Forecast weight by stage: Interested 30%, Proposal 60%, Won 100%. */
export const STAGE_WEIGHT: Record<number, number> = { 2: 0.3, 3: 0.6, 4: 1 }

export const LISTS = {
  P: { label: 'Partners', one: 'Partner', hint: 'Channel partners, referrers, agents' },
  D: { label: 'Developers', one: 'Developer', hint: 'Large builder groups, land acquisition teams' },
  B: { label: 'Builders', one: 'Builder', hint: 'Small and mid-size builders: the main target' },
  I: { label: 'Investors', one: 'Investor', hint: 'Individual investors and plot buyers' },
} as const
export type ListKey = keyof typeof LISTS
export const LIST_KEYS = Object.keys(LISTS) as ListKey[]

export interface Prospect {
  id: string
  list: ListKey
  name: string
  kind: string
  sector: string
  prio: 'A' | 'B' | 'C' | null
  email: string
  alt_emails: string
  phone: string
  area: string
  requirement: string
  trigger_why: string
  history: string
  stage: number
  next_date: string | null
  value: number | null
  owner: string
  note: string
  contact_person: string
  website: string
  source: string
  source_url: string
  deal_band: string
  score: number | null
  last_contacted: string | null
  updated_at: string
  updated_by?: string | null
}

export interface CrmDeal {
  id: string
  name: string
  value: number
  commission: number
  stage: number
  parcel: string
  property_code: string
  deal_type: '' | 'Outright' | 'JD' | 'JV' | 'Mandate'
  prospect_id: string | null
  expected_close: string | null
  note: string
  next_date: string | null
  updated_at: string
  updated_by?: string | null
}

export const today = () => new Date().toISOString().slice(0, 10)
export const isOverdue = (r: { next_date: string | null; stage: number }) => !!r.next_date && r.next_date <= today() && r.stage < 4

/** ₹ in the form the team reads: ₹1.2 Cr, ₹45 L, ₹80,000. */
export function rupees(n: number | null | undefined) {
  const v = Number(n) || 0
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(v >= 1e8 ? 0 : 2).replace(/\.?0+$/, '')} Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`
  return `₹${v.toLocaleString('en-IN')}`
}

/* ─── Messages ─────────────────────────────────────────────── */

const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] || `{${k}}`)

const OPENERS: Record<ListKey, string> = {
  P: 'Hi {Name}, this is {You} from Bhumi Estates. We have a verified land parcel in {Area}: {Size} acres, clear title, ready for development. If you have a developer looking for land in Bengaluru, I\'d like to loop you in. Our commission structure is clean and straightforward.',
  D: 'Hi {Name}, this is {You} from Bhumi Estates. We specialise in legally verified land parcels for development near Bengaluru, and {Requirement} is exactly what we work with. Our legal team has already done the title due diligence, so you can close within 2 months. Can I share the details of a parcel that matches your requirement?',
  B: 'Hi {Name}, this is {You} from Bhumi Estates. We specialise in legally verified land parcels for development near Bengaluru, and {Requirement} is exactly what we work with. Our legal team has already done the title due diligence, so you can close within 2 months. Can I share the details of a parcel that matches your requirement?',
  I: 'Hi {Name}, this is {You} from Bhumi Estates. We source pre-verified land and development-ready plots near Bengaluru. No title ambiguity, no delays: our in-house legal team clears that before we bring it to you. Can I share what we have available right now?',
}

export function openingMessage(p: Pick<Prospect, 'list' | 'name' | 'area' | 'requirement'>, you: string) {
  return fill(OPENERS[p.list], {
    Name: p.name.split(/\s+/)[0] || p.name,
    You: you || 'the Bhumi team',
    Area: p.area || 'Bengaluru',
    Size: '__',
    Requirement: p.requirement || 'your land requirement',
  })
}

/* ─── The playbook ─────────────────────────────────────────── */

export const PLAYBOOK = {
  stages: [
    ['New', 'On the list, not contacted', 'First email sent or call connected'],
    ['Contacted', 'Email sent or call made', 'They reply or ask for details'],
    ['Interested', 'They engaged and shared a need or requirement', 'You send a parcel brief or site brief'],
    ['Proposal', 'Parcel brief or site brief sent', 'Written confirmation or LOI'],
    ['Won', 'Deal confirmed', 'Deliver; ask for the next deal'],
    ['Lost', 'Declined or not now', 'Set a re-contact date for the next trigger'],
  ],
  contacts: [
    ['Channel partner', 'Partner decides to refer; developer approves', 'Call + WhatsApp deck', 'Day 2 follow-up call · monthly parcel updates'],
    ['Developer (enterprise)', 'Land acquisition team or MD', 'Email brief + call', 'Day 3 call · Day 7 email · Day 14 ask for a site visit'],
    ['Builder (small/mid)', 'Owner decides directly', 'Call + WhatsApp the same day', 'Day 2 WhatsApp · Day 5 call · Day 10 site visit offer'],
    ['Individual investor', 'Owner decides on the call', 'Call', 'Same-day WhatsApp · Day 3 call'],
  ],
  ladder: [
    ['Parcel brief', '1-page summary: location, size, price per acre, title status', 'First conversation'],
    ['Site visit', 'Accompanied visit with the Bhumi legal team', 'They ask for details'],
    ['Legal pack', 'Title documents, survey report, encumbrance certificate', 'They are Interested'],
    ['JD / JV option', 'Joint development or joint venture structure', 'They want to develop but limit upfront cash'],
    ['Full mandate', 'Bhumi sources specifically to their requirement', 'Large developer with a known requirement'],
  ],
  callScript: `Open:  "Hi {Name}, this is {Your name} from Bhumi Estates. We source legally verified land parcels near Bengaluru for developers. Do you have two minutes?"

Ask:   "What's your current land requirement: size, location, and are you looking for outright purchase or a JD structure?"

Pitch: "We have a {Size}-acre parcel in {Area}. Title is clear, our legal team has already verified it. You can visit the site this week and close within 2 months."

Close: "Shall I WhatsApp the parcel brief now and call you {Day} to set up a visit?"

If office:
       "Who handles land acquisition for {Company}? Could I have their direct number?"`,
  whatsapp: `Hi {Name}, as discussed: Bhumi Estates has a verified {Size}-acre parcel in {Area}, priced at ₹{Price}/acre. Clear title, legal team already done. You can visit this week and close in 2 months.
Parcel brief attached. Shall I set up a site visit? — {Your name}, Bhumi Estates
8123845749`,
  emails: [
    ['Partner intro', 'Verified land parcel — Bengaluru, {Area}, {Size} acres'],
    ['Builder intro', '{Size}-acre verified parcel matching your requirement — {Area}'],
    ['Follow-up', 'Re: Land parcel — {Area}'],
  ],
  objections: [
    ['Title isn\'t clear', 'Our legal team has done the full due diligence before we bring it to you. I can share the title summary today.'],
    ['Price is too high', 'What range works for you? We have parcels across price points. Tell me the budget and I\'ll find the right match.'],
    ['We have our own sourcing', 'Understood. When you can\'t find the right parcel, that\'s exactly when we step in: we specialise in the ones that are hard to find and already legal-clear.'],
    ['Send details on email', 'Will do. Which location and size are you actively looking at right now? (Set the next date before sending.)'],
    ['Not looking right now', 'When is your next project planned? I\'ll reach out two weeks before with what we have.'],
    ['What\'s your commission?', 'It is agreed per property and depends on the deal. It is charged only when the deal closes, with no retainer and no upfront fees. Which parcel are you looking at? I will give you the exact terms for that one.'],
    ['We don\'t work with intermediaries', 'We don\'t act as a typical broker. We hold direct mandates from landowners and do the legal work in-house. You talk to us and you talk to the land.'],
  ],
  readiness: [
    ['Title chain', 'Sale deeds and a 30-year Encumbrance Certificate (Kaveri). The seller’s name runs unbroken to today.'],
    ['Revenue record', 'Current RTC/Pahani and mutation extract (Bhoomi) in the seller’s name, with extent and classification matching the documents.'],
    ['Every owner signs', 'All co-owners and legal heirs identified, and their authority to sell confirmed. Fragmented ownership is the commonest delay.'],
    ['Khata', 'Khata type and number on file. Anything other than a clean khata is explained.'],
    ['Conversion', 'Conversion order on file, or the status stated honestly: not converted, applied, or not needed in the master plan area.'],
    ['Zoning', 'Land-use zone checked against the master plan for that survey number, in writing.'],
    ['Survey and boundary', 'Survey sketch and a measured boundary that matches the documents, with the extent in acres and guntas.'],
    ['Access', 'Approach road, its width and who owns it. Nothing is landlocked.'],
    ['Litigation and liens', 'Court, mortgage and acquisition-notice checks done.'],
    ['Price and structure', 'What the owner wants, and whether they will take outright, JD or JV.'],
  ],
  sixQuestions: [
    ['Who decides?', 'The owner, the land acquisition head, or a committee. Get the name.'],
    ['What exactly do they need?', 'Acres, place, approvals in hand or not, plotted or villas or apartments.'],
    ['What structure suits them?', 'Outright, JD, JV, or an option. Ask how much cash they want to commit upfront.'],
    ['When is their next project?', 'The date that makes this urgent. If there is none, set a date to ask again.'],
    ['How do they decide?', 'Site visit, legal review, board or family sign-off, and how long each takes.'],
    ['Who else are they talking to?', 'Their own sourcing, other brokers, other parcels. Ask plainly.'],
  ],
  siteVisit: [
    ['Before', 'Confirm the date in writing. Send the location pin and who is coming. Have the brief and the legal pack ready, and walk the boundary yourself first.'],
    ['During', 'Show the boundary, the access road and the corners. Let them walk it. Note every question; do not guess answers. Ask what they would need to see to decide.'],
    ['After', 'Within a day: send a thank-you, answers to every question, and the documents they asked for. Log the visit under Meetings, update the stage, set the next date.'],
  ],
  rules: [
    ['Agents', 'If we facilitate sales of plots or units in a RERA-registered project we must be registered as an agent with K-RERA, show the number on cards and ads, and never make false claims.'],
    ['Personal data', 'Contact people in their business role. Note where you found their details. Stop the moment someone asks. Do not buy lists.'],
    ['Calls and WhatsApp', 'One-to-one, human-written messages only. No bulk blasts. Respect Do Not Disturb and stop on request.'],
    ['Honesty', 'Say only what we can prove: title work done, documents on request. Never promise approvals or conversions we do not hold.'],
  ],
  sectors: [
    ['Plotted layouts', 'Kanakapura Road, Mysore Road, Devanahalli, Sarjapura Road'],
    ['Villas and premium residential', 'North Bengaluru (Devanahalli), Sarjapura, ORR corridor'],
    ['Apartments', 'Whitefield, Electronic City, HSR, Koramangala'],
    ['Industrial / logistics', 'Tumkur Road, Bidadi, Hosur Road'],
    ['Agricultural / farmhouse', 'Mandya, Ramanagara, Kolar'],
  ],
} as const

/* ─── Priority, follow-up rhythm, parcel matching ─────────── */

export const SOURCES = ['RERA Karnataka', 'CREDAI', 'LinkedIn', 'Referral', 'News / launch', 'Company website', 'Existing contact', 'Other'] as const
export const DEAL_TYPES = ['Outright', 'JD', 'JV', 'Mandate'] as const

/** Fit 40% · trigger 35% · contactability 25% rolled into one score:
 *  A at 85+, B at 70–84, C below. */
export const prioFromScore = (score: number | null | undefined): 'A' | 'B' | 'C' | null =>
  score == null ? null : score >= 85 ? 'A' : score >= 70 ? 'B' : 'C'

export const addDays = (n: number, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** The gap to the next touch that the playbook asks for once a prospect reaches a stage. */
export const FOLLOW_UP_DAYS: Record<number, number> = { 1: 2, 2: 3, 3: 5 }

export interface Parcel {
  code: string
  title: string
  location: string
  corridor?: string
  zone: string
  extent_acres: number
  property_type: string
  price_total_cr?: number
  price_per_acre_cr?: number
  status: string
}

const STOP = new Set(['road', 'belt', 'corridor', 'the', 'and', 'near', 'bengaluru', 'bangalore', 'north', 'south', 'east', 'west', 'town', 'main'])
const words = (s: string) => (s.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.has(w))

/** Which live listings to pitch a prospect, and why. Deliberately plain:
 *  shared place words, a listing size inside their stated ticket, and the
 *  kind of development they build. Every point carries its reason. */
export function matchParcels(p: Pick<Prospect, 'area' | 'requirement' | 'sector' | 'deal_band' | 'kind'>, listings: Parcel[], limit = 3) {
  const want = new Set(words(`${p.area} ${p.requirement}`))
  const band = (p.deal_band.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/) ?? []).slice(1).map(Number)
  const kinds = `${p.sector} ${p.kind} ${p.requirement}`.toLowerCase()
  return listings
    .filter((l) => l.status === 'Live' && l.extent_acres >= 0.5)
    .map((l) => {
      const reasons: string[] = []
      let score = 0
      const shared = words(`${l.location} ${l.corridor ?? ''} ${l.zone}`).filter((w) => want.has(w))
      if (shared.length) {
        score += 3 * shared.length
        reasons.push(`same area: ${shared[0]}`)
      }
      if (band.length === 2 && l.extent_acres >= band[0] && l.extent_acres <= band[1]) {
        score += 3
        reasons.push(`${l.extent_acres} acres is inside their ${band[0]}–${band[1]} acre range`)
      }
      if (/plot|layout/.test(kinds) && /residential|land/.test(l.property_type)) {
        score += 1
        reasons.push('they build plotted layouts')
      }
      if (/villa/.test(kinds) && /villa|residential|land/.test(l.property_type)) {
        score += 1
        reasons.push('they build villas')
      }
      if (/apartment/.test(kinds) && l.extent_acres >= 2) {
        score += 1
        reasons.push('apartment-scale parcel')
      }
      return { l, score, reasons }
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
