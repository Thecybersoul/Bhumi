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

/** The size line, in whichever unit the asset is actually sold by. */
export function size(p: Property): string | null {
  if (p.extent_acres > 0) return `${p.extent_acres} acres`
  if (p.built_up_sqft) return `${p.built_up_sqft.toLocaleString('en-IN')} sq ft`
  if (p.carpet_sqft) return `${p.carpet_sqft.toLocaleString('en-IN')} sq ft carpet`
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
