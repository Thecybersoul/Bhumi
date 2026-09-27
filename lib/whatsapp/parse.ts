/* ═══════════════════════════════════════════════════════════
   Reading a WhatsApp property post without AI.

   Brokers and owners around Bengaluru write posts in a shared
   shorthand: "2 acre 10 gunta, DC converted, E khata, 40 ft road,
   3.2 cr per acre neg, 📍 Budigere". This turns that into the fields
   of a draft listing (or, for "requirement: 2 acres near airport",
   a lead) plus the person to call, so the team can check it and save
   it in one tap. It is deliberately conservative: it only fills a
   field when the text says so, keeps the original message on the
   record, and reports what it recognised so the review screen can
   show it.

   Pure and dependency-free: it runs on the server (/api/whatsapp)
   and is covered by scripts/test-whatsapp-parser.ts.
   ═══════════════════════════════════════════════════════════ */

export type PropertyType = 'land-parcels' | 'large-land-parcels' | 'commercial' | 'residential' | 'villas' | 'warehouses'
export type Zone = 'North' | 'East' | 'South' | 'West'

export interface ListingDraft {
  kind: 'listing'
  title: string
  property_type: PropertyType
  location: string
  corridor?: string
  zone?: Zone
  extent_acres?: number
  price_per_acre_cr?: number
  price_total_cr?: number
  price_per_sqft?: number
  plot_area_sqft?: number
  built_up_sqft?: number
  dimensions?: string
  conversion?: string
  khata?: string
  authority?: string
  facing?: string
  road_type?: string
  survey_number?: string
  price_type?: 'Fixed' | 'Negotiable' | 'On Request'
  for_lease?: boolean
  bhk?: number
  description: string
  /** Plain-English list of what was recognised, for the review screen. */
  found: string[]
}

export interface LeadDraft {
  kind: 'lead'
  intent: 'Buy' | 'Lease' | 'Invest'
  title: string
  areas?: string
  size?: string
  budget?: string
  property_type?: PropertyType
  notes: string
  found: string[]
}

export type Draft = ListingDraft | LeadDraft

export interface ContactDraft {
  name?: string
  phone?: string
  role: 'Agent' | 'Landowner' | 'Seller' | 'Buyer'
  agency?: string
}

export interface ParseResult {
  drafts: Draft[]
  contact: ContactDraft | null
  /** The message with WhatsApp's copy prefixes ("[27/09/26, 3:59 pm] Ravi:") removed. */
  text: string
  /** Nothing property-like was found: offer to save it as a note instead. */
  empty: boolean
}

/* ─── Places ─────────────────────────────────────────────── */

interface Place {
  name: string
  match: RegExp
  zone: Zone
  corridor?: string
}

const P = (name: string, pattern: string, zone: Zone, corridor?: string): Place => ({ name, match: new RegExp(`\\b(?:${pattern})\\b`, 'i'), zone, corridor })

/* Longest and most specific first: "Devanahalli" must not win over
   "Kurubarakunte, Devanahalli" when both appear, and the first match
   in the text is used as the headline locality. */
const PLACES: Place[] = [
  P('Kempegowda Airport', 'kempegowda\\s+(?:international\\s+)?airport|kial|bial|airport\\s+road|near\\s+airport|airport', 'North', 'Airport belt'),
  P('Devanahalli', 'devanahalli|devanhalli|devnahalli|deva\\s+nahalli', 'North', 'Airport belt'),
  P('Budigere', 'budigere|budigere\\s+cross', 'East', 'Airport belt'),
  P('Bagalur', 'bagalur|bagaluru', 'North', 'Airport belt'),
  P('Kannamangala', 'kannamangala', 'North', 'Airport belt'),
  P('Vijayapura', 'vijayapura|vijaypura', 'North', 'Airport belt'),
  P('Chikkajala', 'chikkajala|chikka\\s+jala', 'North', 'NH-44 corridor'),
  P('Shettigere', 'shettigere', 'North', 'NH-44 corridor'),
  P('Sadahalli', 'sadahalli', 'North', 'NH-44 corridor'),
  P('Bettahalasur', 'bettahalasur|bettahalsoor', 'North', 'NH-44 corridor'),
  P('Kurubarakunte', 'kurubarakunte', 'North', 'STRR corridor'),
  P('Baichapura', 'baichapura', 'North', 'Airport belt'),
  P('Anneshwara', 'anneshwara', 'North', 'Airport belt'),
  P('Doddasanne', 'doddasanne|dodda\\s+sanne', 'North', 'Airport belt'),
  P('Aerospace Park', 'aerospace\\s+park|kiadb\\s+aerospace', 'North', 'Airport belt'),
  P('Nandi Hills', 'nandi\\s+hills|nandi', 'North', 'NH-44 corridor'),
  P('Chikkaballapur', 'chikkaballapur|chikkaballapura|chikballapur', 'North', 'NH-44 corridor'),
  P('Doddaballapur', 'doddaballapur|doddaballapura|dodballapur|doda\\s+ballapur', 'North', 'STRR corridor'),
  P('Rajanukunte', 'rajanukunte', 'North', 'Doddaballapur road'),
  P('Yelahanka', 'yelahanka', 'North'),
  P('Jakkur', 'jakkur', 'North'),
  P('Hebbal', 'hebbal', 'North'),
  P('Thanisandra', 'thanisandra', 'North'),
  P('Hennur', 'hennur', 'North'),
  P('Kogilu', 'kogilu', 'North'),
  P('Hoskote', 'hoskote|hosakote|hose\\s+coat', 'East', 'Hoskote logistics belt'),
  P('Whitefield', 'whitefield', 'East'),
  P('KR Puram', 'k\\.?\\s*r\\.?\\s*puram', 'East'),
  P('Old Madras Road', 'old\\s+madras\\s+road|omr', 'East', 'Hoskote logistics belt'),
  P('Sarjapur', 'sarjapur|sarjapura', 'East', 'Sarjapur IT belt'),
  P('Electronic City', 'electronic\\s+city|e[\\s-]?city', 'South'),
  P('Attibele', 'attibele', 'South'),
  P('Anekal', 'anekal', 'South'),
  P('Chandapura', 'chandapura', 'South'),
  P('Bannerghatta Road', 'bannerghatta|bannerghatta\\s+road', 'South'),
  P('Kanakapura Road', 'kanakapura\\s+road|kanakapura', 'South', 'Kanakapura Road'),
  P('JP Nagar', 'j\\.?\\s*p\\.?\\s*nagar', 'South'),
  P('Mysore Road', 'mysore\\s+road|mysuru\\s+road', 'West'),
  P('Nelamangala', 'nelamangala', 'West', 'Tumakuru Road'),
  P('Dabaspet', 'dabaspet|dobbaspet', 'West', 'Tumakuru Road'),
  P('Tumakuru Road', 'tumkur\\s+road|tumakuru\\s+road|tumkur|tumakuru', 'West', 'Tumakuru Road'),
  P('Magadi Road', 'magadi\\s+road|magadi', 'West'),
]

/* ─── Small helpers ──────────────────────────────────────── */

const NUM = '(\\d+(?:[.,]\\d+)*)'
const num = (s: string) => Number(s.replace(/,/g, ''))
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d
const CR = 'cr|crs|crore|crores|c'
const LAKH = 'l|lac|lacs|lakh|lakhs|lk'

/** "3.2 cr" → 3.2, "95 L" → 0.95, in crore. */
function toCrore(value: string, unit: string): number | undefined {
  const n = num(value)
  if (!isFinite(n)) return undefined
  if (new RegExp(`^(?:${CR})$`, 'i').test(unit)) return n
  if (new RegExp(`^(?:${LAKH})$`, 'i').test(unit)) return n / 100
  return undefined
}

const PHONE = /(?:\+?91[\s-]?|0)?([6-9]\d{2})[\s-]?(\d{3})[\s-]?(\d{4})\b|(?:\+?91[\s-]?|0)?([6-9]\d{4})[\s-]?(\d{5})\b/g

function phones(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(PHONE)) {
    const digits = (m[1] ? m[1] + m[2] + m[3] : m[4] + m[5]).replace(/\D/g, '')
    if (digits.length === 10) out.add(`${digits.slice(0, 5)} ${digits.slice(5)}`)
  }
  return [...out]
}

/* ─── Cleaning WhatsApp's copy format ───────────────────── */

/** WhatsApp copies look like "[27/09/26, 3:59 pm] Ravi Kumar: text" (copy)
    or "27/09/2026, 15:59 - Ravi Kumar: text" (export). Strip the prefixes,
    remember the sender, drop "<Media omitted>" and forwarded markers. */
function unwrap(raw: string): { text: string; sender?: string } {
  let sender: string | undefined
  const lines = raw.replace(/\r/g, '').split('\n').map((line) => {
    const m =
      line.match(/^\[\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?\]\s*([^:]{1,40}):\s?(.*)$/i) ??
      line.match(/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s+\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?\s*-\s*([^:]{1,40}):\s?(.*)$/i)
    if (m) {
      sender ??= m[1].trim()
      return m[2]
    }
    return line
  })
  const text = lines
    .filter((l) => !/^\s*<?(media omitted|image omitted|this message was deleted)>?\s*$/i.test(l))
    .map((l) => l.replace(/^\s*(forwarded( many times)?|↪️?\s*forwarded)\s*$/i, ''))
    .join('\n')
    .replace(/[*_~]/g, '') // WhatsApp bold/italic/strike
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { text, sender: sender && !/^\+?\d[\d\s-]+$/.test(sender) ? sender : undefined }
}

/* ─── Contact ────────────────────────────────────────────── */

const AGENT_WORDS = /\b(broker|brokers|agent|realty|realtor|realtors|properties|estates?|associates|developers?|consultants?|infra|builders?|brokerage|commission|rera)\b/i
const OWNER_WORDS = /\b(direct\s+owner|owner\s+direct|from\s+owner|owner\s+selling|landlord|no\s+brokers?|owner)\b/i

function contactFrom(text: string, sender?: string, lead = false): ContactDraft | null {
  const nums = phones(text)
  let name: string | undefined
  let agency: string | undefined
  // Words that sit where a name would but aren't one ("Contact 98450…", "Call owner").
  const NOT_NAME = /^(contact|call|calling|whats\s?app|wa|ph|phone|mob|mobile|cell|no|number|name|me|us|now|today|for|on|at|the|owner|agent|broker|details|more|site|visit|rate|price|sir|madam|regards|thanks|pls|please|interested|direct|only|or|and)$/i
  const clean = (raw: string) => {
    const words = raw.trim().replace(/\s+(?:sir|ji|garu|anna|madam)$/i, '').split(/\s+/).filter((w) => !NOT_NAME.test(w))
    const n = words.join(' ')
    return n.length > 1 && /[a-z]/i.test(n) ? n : undefined
  }
  const labelled = text.match(/(?:contact|call|whats\s?app|ph(?:one)?|mob(?:ile)?|name|regards|thanks(?:\s*&\s*regards)?|by)\s*[:\-–,]?\s*(?:mr\.?|mrs\.?|ms\.?|sri|shri)?\s*([A-Za-z][A-Za-z.]*(?:\s+[A-Za-z][A-Za-z.]*){0,2})/i)
  const beforePhone = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*[:\-–(]?\s*(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/)
  // A name written in the post beats WhatsApp's sender label; a word stuck to the number comes last.
  name = (labelled && clean(labelled[1])) || sender || (beforePhone && clean(beforePhone[1])) || undefined
  const firm = text.match(/([A-Z][A-Za-z&.]*(?:\s+[A-Z][A-Za-z&.]*){0,3}\s+(?:Realty|Realtors|Properties|Estates|Associates|Developers|Consultants|Infra|Builders))\b/)
  if (firm) agency = firm[1].trim()
  if (!nums.length && !name) return null
  const role: ContactDraft['role'] = lead ? 'Buyer' : OWNER_WORDS.test(text) && !/no\s+brokers?/i.test(text) ? 'Landowner' : AGENT_WORDS.test(text) || agency ? 'Agent' : 'Seller'
  return { name, phone: nums[0], role, agency }
}

/* ─── Property type ──────────────────────────────────────── */

function typeOf(t: string, acres?: number): PropertyType | undefined {
  if (/\b(warehouse|godown|go-?down|shed|logistics|industrial\s+shed)\b/i.test(t)) return 'warehouses'
  if (/\b(villa|villas|row\s*house|independent\s+house)\b/i.test(t)) return 'villas'
  if (/\b(commercial|shop|showroom|office\s+space|office|retail|complex|hotel|resort|petrol\s+bunk|hospital|school)\b/i.test(t)) return 'commercial'
  if (/\b(\d\s*bhk|flat|apartment|apt|house|duplex|site|plot|sites|plots|layout|bda\s+site|residential)\b/i.test(t)) return 'residential'
  if (acres !== undefined || /\b(land|acre|acres|gunta|guntas|agri|agricultural|farm|farmland|converted)\b/i.test(t)) return (acres ?? 0) >= 10 ? 'large-land-parcels' : 'land-parcels'
  return undefined
}

const TYPE_LABEL: Record<PropertyType, string> = {
  'land-parcels': 'land',
  'large-land-parcels': 'land parcel',
  residential: 'property',
  villas: 'villa',
  commercial: 'commercial property',
  warehouses: 'warehouse',
}

/* ─── One property ───────────────────────────────────────── */

function place(t: string): Place | undefined {
  let best: { p: Place; at: number } | undefined
  for (const p of PLACES) {
    const m = t.match(p.match)
    if (m && m.index !== undefined && (!best || m.index < best.at)) best = { p, at: m.index }
  }
  return best?.p
}

/** The written location line, if the post has one ("📍 Budigere cross, Hoskote tq"). */
function locationLine(t: string): string | undefined {
  const m = t.match(/(?:📍|📌|location\s*[:\-]|loc\s*[:\-]|place\s*[:\-]|area\s*[:\-]|near\s*[:\-]?)\s*([^\n,;|]+(?:,\s*[^\n,;|]+)?)/i)
  if (!m) return undefined
  return m[1]
    .replace(/\b(tq|taluk|taluka)\b\.?/gi, 'taluk')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[.\-–]+$/, '')
    .slice(0, 80)
}

function listing(block: string, whole: string): ListingDraft | null {
  // Phone numbers are removed before reading figures, so 98450 12345 is never a price.
  const t = block.replace(PHONE, ' ')
  const found: string[] = []
  const d: Partial<ListingDraft> = {}

  // Extent: "2 acre 10 gunta", "2A 10G", "2.5 acres", "20 guntas", "1 acre 5 guntas"
  const ag = t.match(new RegExp(`${NUM}\\s*(?:acres?|ac|a)\\b\\.?\\s*(?:and|&|,)?\\s*(?:${NUM}\\s*(?:guntas?|gunte|guntha|g)\\b)?`, 'i'))
  const gOnly = t.match(new RegExp(`${NUM}\\s*(?:guntas?|gunte|guntha|gts?)\\b`, 'i'))
  if (ag) {
    d.extent_acres = round(num(ag[1]) + (ag[2] ? num(ag[2]) / 40 : 0))
    found.push(`${d.extent_acres} acres`)
  } else if (gOnly && !/per\s*gunta/i.test(t.slice(Math.max(0, (gOnly.index ?? 0) - 12), (gOnly.index ?? 0) + gOnly[0].length + 2))) {
    d.extent_acres = round(num(gOnly[1]) / 40)
    found.push(`${num(gOnly[1])} guntas (${d.extent_acres} acres)`)
  }

  // Rates: per acre, per gunta (×40), per sq ft
  const perAcre = t.match(new RegExp(`(?:rs\\.?|₹)?\\s*${NUM}\\s*(${CR}|${LAKH})\\.?\\s*(?:\\/|per|p\\.?|each)\\s*(?:acre|ac)\\b`, 'i'))
  const perGunta = t.match(new RegExp(`(?:rs\\.?|₹)?\\s*${NUM}\\s*(${CR}|${LAKH})\\.?\\s*(?:\\/|per|p\\.?)\\s*(?:gunta|guntha|g)\\b`, 'i'))
  if (perAcre) {
    d.price_per_acre_cr = toCrore(perAcre[1], perAcre[2])
    if (d.price_per_acre_cr !== undefined) found.push(`₹${round(d.price_per_acre_cr)} Cr per acre`)
  } else if (perGunta) {
    const g = toCrore(perGunta[1], perGunta[2])
    if (g !== undefined) {
      d.price_per_acre_cr = round(g * 40)
      found.push(`₹${round(g * 100)} L per gunta (₹${d.price_per_acre_cr} Cr per acre)`)
    }
  }
  const perSqft =
    t.match(/(?:rs\.?|₹)?\s*(\d[\d,]{2,})\s*(?:\/-)?\s*(?:\/|per|p\.?)\s*(?:sq\.?\s*ft|sqft|sft|sq)\b/i) ??
    t.match(/(?:sq\.?\s*ft|sqft|sft)\s*(?:rate|price|cost)\s*[:\-@]?\s*(?:rs\.?|₹)?\s*(\d[\d,]{2,})/i) ??
    t.match(/(?:rate|price)\s*[:\-@]?\s*(?:rs\.?|₹)?\s*(\d[\d,]{2,})\s*(?:\/-)?\s*(?:per|\/)\s*(?:sq\.?\s*ft|sqft|sft)/i)
  if (perSqft) {
    d.price_per_sqft = num(perSqft[1])
    found.push(`₹${d.price_per_sqft.toLocaleString('en-IN')} per sq ft`)
  }

  // Whole price: "price 7.5 cr", "asking 95 L", "2.2 Cr" not followed by per …
  const priced = new RegExp(`(?:price|asking|cost|total|value|expected|quoted?|budget|amount|sale\\s+value|all\\s+inclusive|for)\\s*[:\\-–@]?\\s*(?:rs\\.?|₹)?\\s*${NUM}\\s*(${CR}|${LAKH})\\b\\.?(?!\\s*(?:\\/|per|p\\.)\\s*(?:acre|ac|gunta|g|sq))`, 'i')
  const bare = new RegExp(`(?:rs\\.?|₹)?\\s*${NUM}\\s*(${CR})\\b\\.?(?!\\s*(?:\\/|per|p\\.)\\s*(?:acre|ac|gunta|g|sq))`, 'i')
  const total = t.match(priced) ?? (d.price_per_acre_cr === undefined ? t.match(bare) : null)
  if (total) {
    const v = toCrore(total[1], total[2])
    if (v !== undefined && v > 0 && v < 5000) {
      d.price_total_cr = round(v)
      found.push(`₹${d.price_total_cr} Cr total`)
    }
  }
  // Full rupee figures: "Price ₹ 3,20,00,000" or "Rs.95,00,000/-"
  if (d.price_total_cr === undefined) {
    const rupees = t.match(/(?:price|asking|cost|total|value|rs\.?|₹|inr)\s*[:\-–]?\s*(?:rs\.?|₹)?\s*(\d{1,3}(?:,\d{2})*,\d{3}|\d{6,})\s*(?:\/-)?(?!\s*(?:\/|per)\s*(?:acre|ac|gunta|sq))/i)
    if (rupees) {
      const r = num(rupees[1])
      if (r >= 100000) {
        d.price_total_cr = round(r / 1e7, 3)
        found.push(`₹${d.price_total_cr} Cr total`)
      }
    }
  }
  if (d.price_total_cr === undefined && d.price_per_acre_cr !== undefined && d.extent_acres !== undefined) {
    d.price_total_cr = round(d.price_per_acre_cr * d.extent_acres)
  }

  // Areas: plot dimensions, sq ft, BHK
  const dims = t.match(/\b(\d{2,3})\s*(?:ft)?\s*[x×*]\s*(\d{2,3})\s*(?:ft)?\b/i)
  if (dims) {
    d.dimensions = `${dims[1]} × ${dims[2]} ft`
    d.plot_area_sqft = num(dims[1]) * num(dims[2])
    found.push(`${d.dimensions} (${d.plot_area_sqft.toLocaleString('en-IN')} sq ft)`)
  }
  const bhk = t.match(/\b(\d)\s*bhk\b/i)
  if (bhk) {
    d.bhk = num(bhk[1])
    found.push(`${d.bhk} BHK`)
  }
  const sqyd = t.match(/(\d[\d,]*)\s*(?:sq\.?\s*(?:yd|yards?)|sy|sq\s*yds?)\b/i)
  const sqft = [...t.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|sft|square\s*feet|sq\.?\s*feet)(?!\s*(?:rate|price))/gi)].find(
    (m) => !/^\s*(?:\/|per)/.test(t.slice((m.index ?? 0) - 6, m.index))
  )
  const area = sqft ? num(sqft[1]) : sqyd ? num(sqyd[1]) * 9 : undefined
  if (area && (!perSqft || area !== d.price_per_sqft)) {
    if (d.bhk || /\b(built[\s-]?up|super\s+built|carpet|sba|flat|apartment|house|villa)\b/i.test(t)) d.built_up_sqft = area
    else d.plot_area_sqft ??= area
    found.push(`${area.toLocaleString('en-IN')} sq ft${sqyd && !sqft ? ` (${num(sqyd[1])} sq yd)` : ''}`)
  }

  // Legal and access particulars
  const conv = t.match(/\b(dc\s*converted|converted\s*(?:land|to\s+residential|to\s+commercial)?|conversion\s+done|non[\s-]?converted|not\s+converted|agri(?:cultural)?\s+land|agri)\b/i)
  if (conv) {
    d.conversion = /non|not|agri/i.test(conv[1]) ? 'Not converted (agricultural)' : 'Converted (DC conversion, as stated)'
    found.push(d.conversion)
  }
  const khata = t.match(/\b([abe])[\s-]?khata\b|\b(bbmp|panchayat|gram\s*panchayat|bda|bmrda)\s+khata\b|\bkhata\s*[:\-]?\s*([abe])\b/i)
  if (khata) {
    d.khata = khata[1] ? `${khata[1].toUpperCase()} khata` : khata[3] ? `${khata[3].toUpperCase()} khata` : `${khata[2].replace(/\b\w/g, (c) => c.toUpperCase())} khata`
    found.push(d.khata)
  }
  const auth = t.match(/\b(biaapa|bmrda|bda|bbmp|dtcp|kiadb|stranger)\s*(?:approved|sanctioned|layout)?\b/i)
  if (auth && !/stranger/i.test(auth[1])) {
    d.authority = auth[1].toUpperCase()
    found.push(`${d.authority} (as stated)`)
  }
  const facing = t.match(/\b(north[\s-]?east|north[\s-]?west|south[\s-]?east|south[\s-]?west|east|west|north|south)\s*facing\b|\bfacing\s*[:\-]?\s*(north[\s-]?east|north[\s-]?west|south[\s-]?east|south[\s-]?west|east|west|north|south)\b/i)
  if (facing) {
    d.facing = (facing[1] ?? facing[2]).replace(/[\s-]+/, '-').replace(/\b\w/g, (c) => c.toUpperCase())
    found.push(`${d.facing} facing`)
  }
  const road = t.match(/\b(\d{2,3})\s*(?:ft|feet|')\s*(?:wide\s+)?(?:tar\s+|main\s+|approach\s+)?road\b/i)
  const hwy = t.match(/\b(nh[\s-]?\d{2,3}[a-z]?|strr|prr|national\s+highway|state\s+highway|highway)\s*(?:facing|frontage|touch|abutting)?\b/i)
  if (road) d.road_type = `${road[1]} ft road`
  if (hwy) d.road_type = [d.road_type, `${hwy[1].toUpperCase().replace(/\s+/, '-')}${/facing|frontage|touch|abutting/i.test(hwy[0]) ? ' frontage' : ''}`].filter(Boolean).join(', ')
  if (d.road_type) found.push(d.road_type)
  const sy = t.match(/\b(?:sy|sr|survey|s)\.?\s*(?:no|number)?\.?\s*[:#\-]?\s*(\d{1,4}(?:\s*\/\s*[\dA-Za-z]{1,4})*)\b/i)
  if (sy && /\d/.test(sy[1])) {
    d.survey_number = sy[1].replace(/\s+/g, '')
    found.push(`Survey no. ${d.survey_number}`)
  }
  if (/\b(neg|negotiable|nego)\b/i.test(t)) d.price_type = 'Negotiable'
  else if (/\b(price\s+on\s+request|call\s+for\s+price|rate\s+on\s+call|por)\b/i.test(t)) d.price_type = 'On Request'
  else if (/\b(fixed|final(?:\s+price)?|non[\s-]?negotiable|no\s+bargain)\b/i.test(t)) d.price_type = 'Fixed'
  if (/\b(for\s+rent|for\s+lease|on\s+lease|lease|rental|rent)\b/i.test(t)) d.for_lease = true

  const where = place(t) ?? place(whole)
  const written = locationLine(t) ?? locationLine(whole)
  const location = written ?? where?.name ?? ''
  if (where) {
    d.zone = where.zone
    d.corridor = where.corridor
  }
  if (location) found.unshift(`Location: ${location}`)

  const type = typeOf(t, d.extent_acres) ?? (d.extent_acres ? 'land-parcels' : undefined)
  const signals = [d.extent_acres, d.price_per_acre_cr, d.price_total_cr, d.price_per_sqft, d.plot_area_sqft, d.built_up_sqft, d.bhk].filter((x) => x !== undefined).length
  // A property needs a place or a size, and at least one figure.
  if (!signals || (!location && d.extent_acres === undefined && d.plot_area_sqft === undefined && d.built_up_sqft === undefined)) return null

  const property_type = type ?? 'land-parcels'
  // Titles read the way the team talks: "2 acres 10 guntas", "20 guntas", "30×40 site".
  const acresLabel = (a: number) => {
    const whole = Math.floor(a + 1e-9)
    const g = Math.round((a - whole) * 40)
    if (!whole) return `${g} guntas`
    return `${whole} acre${whole === 1 ? '' : 's'}${g ? ` ${g} gunta${g === 1 ? '' : 's'}` : ''}`
  }
  const sqftLabel = (n: number) => `${n.toLocaleString('en-IN')} sq ft`
  const size = d.bhk
    ? `${d.bhk} BHK`
    : d.extent_acres
      ? acresLabel(d.extent_acres)
      : d.dimensions
        ? d.dimensions.replace(/ × /, '×').replace(' ft', '')
        : d.built_up_sqft
          ? sqftLabel(d.built_up_sqft)
          : d.plot_area_sqft
            ? sqftLabel(d.plot_area_sqft)
            : ''
  const kindWord = d.bhk
    ? /\bvilla\b/i.test(t)
      ? 'villa'
      : /\bhouse|independent\b/i.test(t)
        ? 'house'
        : 'flat'
    : /\b(site|plot)s?\b/i.test(t) && !d.extent_acres
      ? 'site'
      : d.conversion?.startsWith('Converted') && property_type.includes('land')
        ? 'converted land'
        : d.conversion && property_type.includes('land')
          ? 'agricultural land'
          : TYPE_LABEL[property_type]
  const title = [size, kindWord, d.for_lease ? 'for lease' : '', location ? `at ${where?.name && !written ? where.name : location.split(',')[0]}` : ''].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

  return {
    kind: 'listing',
    ...d,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    property_type,
    location,
    description: block.trim(),
    found,
  } as ListingDraft
}

/* ─── A requirement (buyer) ──────────────────────────────── */

const WANT = /\b(requirement|required|require|looking\s+for|wanted|want\s+to\s+buy|need|needed|buyer\s+(?:ready|available)|client\s+(?:looking|needs|wants)|any\s+(?:one|body)\s+(?:has|having)|pls\s+share|please\s+share)\b/i

function lead(text: string): LeadDraft {
  const t = text.replace(PHONE, ' ')
  const found: string[] = []
  const intent: LeadDraft['intent'] = /\b(lease|rent)\b/i.test(t) ? 'Lease' : /\b(invest|investment|investor)\b/i.test(t) ? 'Invest' : 'Buy'
  const where = [...new Set(PLACES.filter((p) => p.match.test(t)).map((p) => p.name))]
  const size = t.match(new RegExp(`${NUM}\\s*(?:-|to)?\\s*(?:${NUM})?\\s*(acres?|ac|guntas?|sq\\.?\\s*ft|sqft|bhk)`, 'i'))
  const budget = t.match(new RegExp(`(?:budget|upto|up\\s+to|within|around|range)?\\s*[:\\-]?\\s*(?:rs\\.?|₹)?\\s*${NUM}\\s*(?:-|to)?\\s*(?:${NUM})?\\s*(${CR}|${LAKH})\\b(\\s*(?:\\/|per)\\s*(?:acre|sq\\.?\\s*ft|sqft))?`, 'i'))
  const type = typeOf(t)
  if (where.length) found.push(`Areas: ${where.join(', ')}`)
  if (size) found.push(`Size: ${size[0].trim()}`)
  const budgetText = budget?.[0].replace(/^[\s:,-]*(?:budget|upto|up\s+to|within|around|range)?[\s:,-]*/i, '').trim()
  if (budgetText) found.push(`Budget: ${budgetText}`)
  const what = type ? TYPE_LABEL[type] : 'property'
  return {
    kind: 'lead',
    intent,
    title: `${intent === 'Lease' ? 'Wants to lease' : intent === 'Invest' ? 'Investor looking for' : 'Looking for'} ${size ? size[0].trim() + ' ' : ''}${what}${where.length ? ` near ${where[0]}` : ''}`,
    areas: where.join(', ') || undefined,
    size: size?.[0].trim(),
    budget: budgetText || undefined,
    property_type: type,
    notes: text.trim(),
    found,
  }
}

/* ─── Splitting a post that lists several properties ─────── */

function blocks(text: string): string[] {
  const lines = text.split('\n')
  const out: string[] = []
  let cur: string[] = []
  const starts = /^\s*(?:\d{1,2}\s*[.)]|[•●▪️▫️🔹🔸🔷🔶✅✔️👉➡️⭐🏡🏠🌳]|\*|-\s|property\s*\d+|option\s*\d+)/i
  for (const l of lines) {
    if (starts.test(l) && cur.join('').trim()) {
      out.push(cur.join('\n'))
      cur = []
    }
    cur.push(l)
  }
  if (cur.join('').trim()) out.push(cur.join('\n'))
  return out
}

/* ─── Entry point ────────────────────────────────────────── */

export function parseWhatsApp(raw: string): ParseResult {
  const { text, sender } = unwrap(raw)
  if (!text) return { drafts: [], contact: null, text, empty: true }

  if (WANT.test(text) && !/\b(for\s+sale|available\s+for\s+sale|sale\s+available)\b/i.test(text)) {
    const l = lead(text)
    const contact = contactFrom(text, sender, true)
    return { drafts: [l], contact, text, empty: false }
  }

  // Several properties: parse each block that stands on its own as one.
  const parts = blocks(text)
    .map((b) => listing(b, text))
    .filter((x): x is ListingDraft => x !== null)
  const drafts = parts.length >= 2 ? parts : ([listing(text, text)].filter(Boolean) as ListingDraft[])
  if (drafts.length === 1) drafts[0].description = text
  const contact = contactFrom(text, sender)
  return { drafts, contact, text, empty: drafts.length === 0 }
}
