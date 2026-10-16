import type { Property } from './types'

/* How a listing states itself.
 *
 * Shared by the marketplace grid and the listing page so the two
 * cannot disagree about what a property costs or how big it is —
 * they were duplicated inside the browser component before there was
 * a second place that needed them.
 *
 * Every one of these returns null rather than a placeholder when the
 * record does not carry the figure. Listings are transcribed from
 * whatever document we were sent and are uneven by design: the
 * Doddasanne layout has a conversion order and no total price, the
 * JP Nagar flat has a price and no survey number. An empty row reads
 * worse than a shorter list.
 */

export function money(cr: number): string {
  return cr >= 1 ? `₹${cr.toFixed(cr < 10 ? 1 : 0)} Cr` : `₹${Math.round(cr * 100)} L`
}

export type ListingKindKey =
  | 'plot' | 'layout' | 'large-plot' | 'farm-plot' | 'land-parcel'
  | 'commercial-plot' | 'commercial-building' | 'villa' | 'apartment' | 'warehouse'

const KIND_LABEL: Record<ListingKindKey, string> = {
  plot: 'Residential plot',
  layout: 'Plotted layout',
  'large-plot': 'Large plot',
  'farm-plot': 'Farm plot',
  'land-parcel': 'Land parcel',
  'commercial-plot': 'Commercial plot',
  'commercial-building': 'Commercial building',
  villa: 'Villa',
  apartment: 'Apartment',
  warehouse: 'Warehouse',
}

/** Agricultural land is sold in guntas, whatever the survey says. A
 *  listing whose conversion is already done is no longer farmland. */
export function isFarmland(p: Property): boolean {
  const converted = /^converted|conversion completed/i.test(p.conversion ?? '')
  return !converted && /agricultur|farm/i.test(`${p.land_use ?? ''} ${p.zoning ?? ''}`)
}

/** What a listing actually is, derived from its own data — the
 *  stored property_type is too coarse ("land-parcels" covers a 1,200
 *  sq ft site and a 30-acre block). Feeds the label, the thumbnail
 *  theme and the marketplace filter, so they cannot disagree. */
export function listingKind(p: Property): { key: ListingKindKey; label: string } {
  const pick = (key: ListingKindKey) => ({ key, label: KIND_LABEL[key] })
  if (p.property_type === 'warehouses') return pick('warehouse')
  if (p.property_type === 'villas') return pick('villa')
  if (p.property_type === 'residential' && (p.unit_mix || p.built_up_sqft || p.carpet_sqft)) return pick('apartment')
  if (p.property_type === 'commercial') {
    return p.built_up_sqft || /floor|building/i.test(`${p.dimensions ?? ''} ${p.title}`) ? pick('commercial-building') : pick('commercial-plot')
  }
  if ((p.plots_total ?? 0) > 1) return pick('layout')
  if (p.extent_acres >= 10) return pick('land-parcel')
  if (isFarmland(p) && (p.extent_acres < 1 || /farm/i.test((p.use_cases ?? []).join(' ')))) return pick('farm-plot')
  if (p.extent_acres >= 1) return pick('large-plot')
  return pick('plot')
}

/** The size line, in whichever unit the asset is actually sold by.
 *  Below an acre a fraction ("0.25 acres") reads oddly: farmland is
 *  quoted in guntas (1 acre = 40 guntas), everything else in sq ft. */
export function size(p: Property): string | null {
  if (p.extent_acres > 0) {
    if (p.extent_acres >= 1) return `${p.extent_acres} acres`
    if (isFarmland(p)) {
      const guntas = Math.round(p.extent_acres * 40 * 100) / 100
      return `${guntas} ${guntas === 1 ? 'gunta' : 'guntas'}`
    }
    return `${(p.plot_area_sqft ?? Math.round(p.extent_acres * 43_560)).toLocaleString('en-IN')} sq ft`
  }
  if (p.built_up_sqft) return `${p.built_up_sqft.toLocaleString('en-IN')} sq ft`
  if (p.carpet_sqft) return `${p.carpet_sqft.toLocaleString('en-IN')} sq ft carpet`
  if (p.plot_area_sqft) return `${p.plot_area_sqft.toLocaleString('en-IN')} sq ft`
  return null
}

export function price(p: Property): string | null {
  if (p.price_type === 'On Request') return 'On request'
  /* A flat is quoted whole and a plotted release by the square foot.
     Lead with whichever the seller actually named, not with a
     per-acre figure derived from it. */
  if (p.price_total_cr) return money(p.price_total_cr)
  if (p.price_per_sqft) return `₹${p.price_per_sqft.toLocaleString('en-IN')} / sq ft`
  if (p.extent_acres > 0 && p.price_per_acre_cr > 0) return `${money(p.price_per_acre_cr)} / acre`
  return null
}

/** Only what this listing states, most useful first. */
export function facts(p: Property, limit = 6): [string, string][] {
  const rows: ([string, string] | null)[] = [
    p.plots_total
      ? [
          'Plots',
          p.plots_available !== undefined
            ? `${p.plots_available} of ${p.plots_total} available`
            : `${p.plots_total} sites`,
        ]
      : null,
    p.plots_available_list ? ['Available', p.plots_available_list] : null,
    size(p) ? [p.built_up_sqft ? 'Built-up' : 'Extent', size(p)!] : null,
    price(p) ? ['Price', price(p)!] : null,
    p.unit_mix ? ['Configuration', p.unit_mix] : null,
    p.dimensions ? ['Dimensions', p.dimensions] : null,
    p.khata ? ['Khata', p.authority ? `${p.khata} · ${p.authority}` : p.khata] : null,
    p.facing ? ['Orientation', p.facing] : null,
    p.plot_size ? ['Plot size', p.plot_size] : null,
    p.conversion_order ? ['Conversion order', p.conversion_order] : null,
    p.survey_number ? ['Survey number', p.survey_number] : null,
    p.conversion ? ['Conversion', p.conversion] : null,
    p.land_use ? ['Land use', p.zoning ?? p.land_use] : null,
    p.road_type ? ['Access', p.road_type] : null,
    p.ownership ? ['Ownership', p.ownership] : null,
  ]
  return rows.filter(Boolean).slice(0, limit) as [string, string][]
}

/** The one route a listing lives at. */
export function listingHref(p: Pick<Property, 'code'>): string {
  return `/marketplace/${encodeURIComponent(p.code)}`
}
