/* Decision-support tools — Plan §8.
   "A premium real estate site doesn't just display information —
   it helps a visitor reach a decision. Each tool doubles as a
   lead-qualification step." */

export interface ToolDef {
  slug: string
  name: string
  short: string
  description: string
  /** What the visitor learns, stated as an outcome not a feature. */
  outcome: string
  audience: string
  minutes: number
  qualifies: string
  icon: 'balance' | 'fork' | 'calculator' | 'checklist' | 'compare' | 'map' | 'gauge'
  featured?: boolean
}

export const tools: ToolDef[] = [
  {
    slug: 'jda-comparator',
    name: 'JDA Structure Comparator',
    short: 'Area share vs revenue share vs plotted development',
    description:
      'Enter your land value, extent and corridor. See an illustrative side-by-side of what area share, revenue share and plotted development produce for you on the same parcel — including where the tax timing differs.',
    outcome: 'Which structure suits your parcel and your horizon, before a developer frames the choice for you.',
    audience: 'Landowners weighing a development proposal',
    minutes: 3,
    qualifies: 'Extent, corridor, indicative land value, preferred horizon',
    icon: 'balance',
    featured: true,
  },
  {
    slug: 'jda-readiness',
    name: 'Is Your Land JDA-Ready?',
    short: 'A short qualifying check across the six readiness tests',
    description:
      'Eight questions covering ownership, access, zoning, conversion, litigation and encumbrance. You get a readiness score and, more usefully, a specific list of what would need to be fixed first.',
    outcome: 'A named list of the blockers on your parcel — not a yes or a no.',
    audience: 'Landowners considering a joint development',
    minutes: 2,
    qualifies: 'Ownership structure, access, zoning, conversion status',
    icon: 'gauge',
    featured: true,
  },
  {
    slug: 'buy-vs-jda',
    name: 'Buy vs JDA Decision Guide',
    short: 'Which path fits your situation',
    description:
      'A short interactive guide for a landowner deciding between selling outright and entering a development agreement. It weighs your capital needs, horizon, risk appetite and appetite for becoming a seller of built product.',
    outcome: 'A reasoned recommendation with the trade-off stated plainly, before you speak to anyone.',
    audience: 'Landowners at the decision point',
    minutes: 3,
    qualifies: 'Horizon, capital need, risk posture',
    icon: 'fork',
  },
  {
    slug: 'construction-estimator',
    name: 'Construction Cost & Timeline Estimator',
    short: 'Illustrative ranges by property type and finish level',
    description:
      'Rough, clearly-labelled-as-illustrative construction cost and timeline ranges by property type, built-up area and finish level, using current Bengaluru market rates. Built to set realistic expectations early rather than to quote a job.',
    outcome: 'A defensible budget range and timeline before you commission a detailed estimate.',
    audience: 'Owners planning a build, and JDA landowners sense-checking a developer\'s numbers',
    minutes: 2,
    qualifies: 'Property type, area, finish level, timeline',
    icon: 'calculator',
    featured: true,
  },
  {
    slug: 'warehouse-checklist',
    name: 'Warehouse Suitability Checklist',
    short: 'Clear height, dock count, floor load and power thresholds',
    description:
      'The specification thresholds a buyer or occupier should confirm before shortlisting an industrial property — checked against your actual operating requirement rather than a generic Grade A definition.',
    outcome: 'A pass or fail against your own operating requirement, with the failing specifications named.',
    audience: 'Occupiers, 3PL operators and industrial investors',
    minutes: 3,
    qualifies: 'Storage type, racking height, equipment load, power requirement',
    icon: 'checklist',
  },
  {
    slug: 'corridor-comparison',
    name: 'Corridor Price Comparison',
    short: 'Indicative land bands side by side across our corridors',
    description:
      'A simple side-by-side of indicative price bands, year-on-year movement and infrastructure status across the growth corridors we operate in. Filterable by what you intend to build.',
    outcome: 'Where your budget actually reaches, and what the trade-off is in each corridor.',
    audience: 'Buyers and investors choosing between corridors',
    minutes: 2,
    qualifies: 'Budget band, intended use, horizon',
    icon: 'compare',
  },
  {
    slug: 'zoning-checker',
    name: 'Commercial vs Residential Zoning Checker',
    short: 'A corridor-level read on what is typically permitted',
    description:
      'A quick corridor-based lookup that pre-empts the most common early-stage question: can I build what I want to build here? Corridor-level guidance, with the parcel-level caveat stated honestly.',
    outcome: 'A corridor-level answer in a minute, and a clear statement of what still needs parcel-level checking.',
    audience: 'Anyone at the "is this even possible here" stage',
    minutes: 1,
    qualifies: 'Corridor, intended use, property type',
    icon: 'map',
  },
]

export function getTool(slug: string) {
  return tools.find((t) => t.slug === slug)
}

export const toolsDisclaimer =
  'Every tool on this site produces illustrative ranges for planning purposes. They use current market rates and published corridor data, and they are deliberately conservative. None of them is a valuation, a tax opinion, a zoning certificate or a substitute for parcel-level diligence — and any output that suggests otherwise should be treated as a bug.'

/* ─── Calculator reference data ──────────────────────────── */

/** Bengaluru construction cost bands, ₹ per sq ft, August 2026.
    Excludes land, statutory approvals and GST. */
export const constructionRates: Record<
  string,
  { label: string; basic: [number, number]; standard: [number, number]; premium: [number, number]; monthsPer1000sqft: number }
> = {
  residential: {
    label: 'Residential building / apartment',
    basic: [1700, 2000],
    standard: [2100, 2600],
    premium: [2900, 3600],
    monthsPer1000sqft: 0.75,
  },
  villas: {
    label: 'Villa / independent house',
    basic: [1800, 2200],
    standard: [2200, 2800],
    premium: [3200, 4500],
    monthsPer1000sqft: 0.9,
  },
  commercial: {
    label: 'Commercial building',
    basic: [1900, 2400],
    standard: [2500, 3200],
    premium: [3400, 4600],
    monthsPer1000sqft: 0.7,
  },
  warehouses: {
    label: 'Warehouse / industrial shed',
    basic: [1100, 1500],
    standard: [1600, 2100],
    premium: [2200, 2900],
    monthsPer1000sqft: 0.35,
  },
}

/** Karnataka statutory transaction cost, 2026. */
export const statutoryCosts = {
  stampDutySlabs: [
    { upTo: 2000000, pct: 2, label: 'Up to ₹20 lakh' },
    { upTo: 4500000, pct: 3, label: '₹20 lakh – ₹45 lakh' },
    { upTo: Infinity, pct: 5, label: 'Above ₹45 lakh' },
  ],
  registrationPct: 2,
  bbmpCessPct: 0.5,
  note:
    'Karnataka doubled the registration fee from 1% to 2% in 2025. Within BBMP limits an additional cess applies, taking total statutory outlay above the ₹45 lakh threshold to roughly 7.5% of value. Duty is computed on consideration or guidance value, whichever is higher.',
}

/** Grade A warehouse thresholds, used by the suitability checklist. */
export const warehouseThresholds = {
  clearHeightM: { gradeA: 9, typical: [10, 12] as [number, number] },
  floorLoadTSqm: { gradeA: 5, vna: 7 },
  dockPerSqft: 10000,
  dockHeightM: 1.2,
  apronM: 25.5,
  flatness: 'FM2',
}
