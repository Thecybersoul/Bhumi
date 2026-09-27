import { dealValueCr } from './db'
import type { Lead, LeadIntent, Property } from './types'

/* ═══════════════════════════════════════════════════════════
   Matching — which listings suit a buyer, and which buyers suit a
   listing or a seller.

   Deliberately a transparent score rather than anything clever: an
   advisor has to be able to see *why* something was suggested, so
   every point comes with a reason ("Villa", "Devanahalli", "within
   budget"). Three things count, in the order a buyer rules things
   out: the kind of property, where it is, and the price.
   ═══════════════════════════════════════════════════════════ */

export interface Match<T> {
  item: T
  score: number
  reasons: string[]
  /** Something that counts against it — shown, not hidden. */
  concerns: string[]
}

const BUYING: LeadIntent[] = ['Buy', 'Invest', 'Lease']
const SELLING: LeadIntent[] = ['Sell', 'Rent out']
const CLOSED = new Set(['Converted', 'Lost', 'Closed'])

export const isBuyer = (l: Pick<Lead, 'intent'>) => BUYING.includes(l.intent ?? 'Buy')
export const isSeller = (l: Pick<Lead, 'intent'>) => SELLING.includes(l.intent ?? 'Buy')
export const isOpen = (l: Pick<Lead, 'stage'>) => !CLOSED.has(l.stage)

const TYPE_LABEL: Record<string, string> = {
  commercial: 'Commercial',
  residential: 'Residential',
  villas: 'Villa',
  'land-parcels': 'Land',
  warehouses: 'Warehouse',
  'large-land-parcels': 'Large land',
}
const LAND = new Set(['land-parcels', 'large-land-parcels'])

/** Place words worth comparing: "North Bengaluru, near Devanahalli"
    → devanahalli, north. Generic words would match everything. */
const STOP = new Set(['near', 'road', 'main', 'bengaluru', 'bangalore', 'karnataka', 'india', 'the', 'and', 'off', 'layout', 'nagar', 'city', 'town', 'area', 'any', 'side'])
function places(...texts: (string | undefined | null)[]): Set<string> {
  const out = new Set<string>()
  for (const t of texts) {
    for (const w of String(t ?? '').toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length >= 4 && !STOP.has(w)) out.add(w)
    }
  }
  return out
}
function overlap(a: Set<string>, b: Set<string>): string | null {
  for (const w of a) if (b.has(w)) return w[0].toUpperCase() + w.slice(1)
  return null
}

const cr = (n: number) => (n >= 10 ? `₹${Math.round(n)} Cr` : n >= 1 ? `₹${n.toFixed(1)} Cr` : `₹${Math.round(n * 100)} L`)

/** What someone wants, however it was recorded — a lead's requirement,
    or a listing standing in for a seller. */
interface Want {
  type?: string
  where: Set<string>
  zone?: string
  min?: number | null
  max?: number | null
}

function wantOf(l: Lead): Want {
  return {
    type: l.property_type || undefined,
    where: places(l.locations, l.corridor),
    min: l.budget_min_cr ?? null,
    max: l.budget_max_cr ?? null,
  }
}

function score(want: Want, have: { type?: string; where: Set<string>; zone?: string; price?: number | null }) {
  let score = 0
  const reasons: string[] = []
  const concerns: string[] = []

  if (want.type && have.type) {
    if (want.type === have.type) {
      score += 40
      reasons.push(TYPE_LABEL[have.type] ?? have.type)
    } else if (LAND.has(want.type) && LAND.has(have.type)) {
      score += 25
      reasons.push('Land')
    } else {
      score -= 25
      concerns.push(`${TYPE_LABEL[have.type] ?? have.type}, not ${TYPE_LABEL[want.type] ?? want.type}`)
    }
  } else score += 5

  const place = overlap(want.where, have.where)
  if (place) {
    score += 30
    reasons.push(place)
  } else if (want.zone && have.zone && want.where.has(have.zone.toLowerCase())) {
    score += 12
    reasons.push(`${have.zone} zone`)
  } else if (want.where.size && have.where.size) {
    concerns.push('Different area')
  }

  const lo = want.min ?? null
  const hi = want.max ?? null
  const price = have.price ?? null
  if (price != null && (lo != null || hi != null)) {
    const floor = lo ?? 0
    const ceil = hi ?? Infinity
    if (price >= floor * 0.9 && price <= ceil * 1.1) {
      score += 30
      reasons.push(`${cr(price)} fits budget`)
    } else if (price >= floor * 0.75 && price <= ceil * 1.25) {
      score += 12
      reasons.push(`${cr(price)} near budget`)
    } else {
      score -= 15
      concerns.push(`${cr(price)} ${price > ceil ? 'over' : 'under'} budget`)
    }
  }

  return { score, reasons, concerns }
}

function propertyHave(p: Property) {
  return { type: p.property_type, where: places(p.location, p.corridor, p.zone), zone: p.zone, price: dealValueCr(p) ?? null }
}

/** Listings for a buyer, best first. Sold listings never appear. */
export function listingsForLead(lead: Lead, properties: Property[], limit = 8): Match<Property>[] {
  const want = wantOf(lead)
  return properties
    .filter((p) => p.status !== 'Sold')
    .map((p) => ({ item: p, ...score(want, propertyHave(p)) }))
    .filter((m) => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Open buyer leads for a listing, best first. */
export function buyersForListing(p: Property, leads: Lead[], limit = 8): Match<Lead>[] {
  const have = propertyHave(p)
  return leads
    .filter((l) => isOpen(l) && isBuyer(l))
    .map((l) => ({ item: l, ...score(wantOf(l), have) }))
    .filter((m) => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** The other side of a lead: sellers for a buyer, buyers for a seller.
    A seller lead's own requirement fields describe what they are
    selling, and its budget is the asking price. */
export function counterpartsForLead(lead: Lead, leads: Lead[], limit = 6): Match<Lead>[] {
  const buying = isBuyer(lead)
  const asHave = (l: Lead) => ({
    type: l.property_type || undefined,
    where: places(l.locations, l.corridor),
    price: l.budget_max_cr ?? l.budget_min_cr ?? null,
  })
  return leads
    .filter((l) => l.id !== lead.id && isOpen(l) && (buying ? isSeller(l) : isBuyer(l)))
    .map((l) => (buying ? { item: l, ...score(wantOf(lead), asHave(l)) } : { item: l, ...score(wantOf(l), asHave(lead)) }))
    .filter((m) => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
