import { PROPERTY_REGISTER, type RegisterEntry } from './data/property-register'

/* A Property Register entry as a listing row (properties table).
   Status is always 'Draft': the particulars are the owner's and need
   checking before the listing goes on the marketplace. */

const LAND_USE: Record<RegisterEntry['zone_class'], string> = {
  agricultural: 'Agricultural',
  residential_zone: 'Residential',
  converted: 'Residential',
  commercial: 'Commercial',
}
const RISK: Record<RegisterEntry['legal'], 'Low' | 'Moderate' | 'High'> = { strong: 'Low', partial: 'Moderate', pending: 'High' }
const LEGAL: Record<RegisterEntry['legal'], string> = { strong: 'strong', partial: 'partial', pending: 'pending' }

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d

export function registerListing(p: RegisterEntry): Record<string, unknown> {
  const acres = round(p.guntas / 40, 2)
  const totalCr = p.total_inr ? round(p.total_inr / 1e7, 2) : null
  const road =
    p.road_name ??
    (p.road_now_ft == null
      ? ''
      : `${p.road_now_ft} ft road${p.road_future_ft && p.road_future_ft !== p.road_now_ft ? ` (${p.road_future_ft} ft planned in the CDP)` : ''}`)
  const survey = p.name.match(/Sy\.\s*([\d/ &]+)/)?.[1]?.trim()
  const converted = p.zone_class === 'converted' || p.zone_class === 'commercial'

  const description = [
    `${p.category}, ${p.guntas} guntas (${p.sqft.toLocaleString('en-IN')} sq ft) in the ${p.belt.toLowerCase()}.`,
    p.frontage_ft ? `${p.frontage_ft} ft frontage${road ? ` on the ${road}` : ''}.` : road ? `Access: ${road}.` : null,
    p.facing ? `${p.facing} facing.` : null,
    `Best suited to ${p.best_use.replace(/;\s*/g, ', ').toLowerCase()}.`,
    p.map_url ? `Location pin: ${p.map_url}` : null,
    `Imported from the Property Register (${p.id}). Particulars as per owner, subject to verification.`,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    code: p.id,
    title: p.name,
    property_type: p.zone_class === 'commercial' ? 'commercial' : 'land-parcels',
    location: p.location,
    corridor: p.belt,
    zone: 'North',
    status: 'Draft',
    price_type: totalCr ? 'Negotiable' : 'On Request',
    extent_acres: acres,
    price_per_acre_cr: totalCr ? round(totalCr / (p.guntas / 40), 3) : 0,
    price_total_cr: totalCr,
    price_per_sqft: p.rate_sqft,
    plot_area_sqft: p.sqft,
    land_use: LAND_USE[p.zone_class],
    zoning: p.zoning,
    conversion: p.id === 'P003' ? 'Converted (DC order 2017)' : converted ? 'Converted (owner-stated)' : 'Not converted',
    use_cases: p.best_use.split(';').map((s) => s.trim()).filter(Boolean),
    road_type: road,
    facing: p.facing ?? '',
    survey_number: survey ?? '',
    title_clear: p.legal === 'strong',
    risk: RISK[p.legal],
    risk_notes: [`Legal readiness: ${LEGAL[p.legal]}.`, ...p.open_points].join(' '),
    description,
    engagement: p.status === 'mandate' ? 'Development mandate' : '',
  }
}

export { PROPERTY_REGISTER }
