'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from './Icon'
import { getPropertyType } from '@/lib/content/propertyTypes'
import { whatsapp } from '@/lib/content/brand'
import { size, price, listingHref, placeOf, cardTitle } from '@/lib/listing'
import type { Property } from '@/lib/types'

/* The marketplace browser.

   Deliberately shallow: two rows of chips and a grid of cards. An
   earlier version carried a search box, a verified-only toggle, six
   type chips and six corridor chips over a card that changed its
   headline metrics per asset class — a lot of apparatus for an
   inventory you can count on one hand.

   Both filter rows are built from the listings themselves rather than
   from the full type and corridor registries. A chip only exists if
   something is behind it, so the filters cannot offer a category that
   returns nothing, and nothing needs pruning by hand as inventory
   changes.

   Cards link to /marketplace/[code]. They used to open a drawer,
   which meant a listing had no address of its own — nothing could
   link to one, and a link sent on WhatsApp opened the whole
   marketplace instead. How a listing states its size and price now
   lives in lib/listing.ts, shared with that page. */

export default function MarketplaceBrowser({
  properties,
  source,
}: {
  properties: Property[]
  source: 'live' | 'fallback'
}) {
  const [type, setType] = useState('')
  const [place, setPlace] = useState('')

  const types = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of properties) {
      if (seen.has(p.property_type)) continue
      seen.set(p.property_type, getPropertyType(p.property_type)?.shortName ?? p.property_type)
    }
    return [...seen].map(([slug, label]) => ({ slug, label }))
  }, [properties])

  /* The "Location" chips group by corridor/belt (e.g. "Airport belt",
     "STRR corridor"), not by each listing's full street address — a
     chip per address stops being a filter once there are more than a
     couple of listings, since almost nothing shares one. A listing
     without a corridor set falls back to its zone. */
  const places = useMemo(
    () => [...new Set(properties.map(placeOf))].sort(),
    [properties]
  )

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) => (!type || p.property_type === type) && (!place || placeOf(p) === place)
      ),
    [properties, type, place]
  )

  return (
    <>
      <div className="mkFilters">
        {/* One chip row is pointless when everything shares the value. */}
        {types.length > 1 && (
          <div className="mkFilters__row">
            <span className="mkFilters__label">Type</span>
            <div className="chips">
              <button className={`chip ${!type ? 'selected' : ''}`} onClick={() => setType('')}>
                All
              </button>
              {types.map((t) => (
                <button
                  key={t.slug}
                  className={`chip ${type === t.slug ? 'selected' : ''}`}
                  onClick={() => setType(type === t.slug ? '' : t.slug)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {places.length > 1 && (
          <div className="mkFilters__row">
            <span className="mkFilters__label">Location</span>
            <div className="chips">
              <button className={`chip ${!place ? 'selected' : ''}`} onClick={() => setPlace('')}>
                All
              </button>
              {places.map((l) => (
                <button
                  key={l}
                  className={`chip ${place === l ? 'selected' : ''}`}
                  onClick={() => setPlace(place === l ? '' : l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mkCount">
        <span>
          <strong>{filtered.length}</strong> {filtered.length === 1 ? 'listing' : 'listings'}
        </span>
        {source === 'fallback' && (
          <span className="sourcePill is-fallback" title="No database attached — showing the listings compiled into the site">
            Reference inventory
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="panel center" style={{ padding: 48 }}>
          <h3 className="h3">Nothing under those filters.</h3>
          <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>
            Most of what we transact never reaches a public listing. Tell us what you are looking for.
          </p>
          <a
            href={whatsapp('Hi Bhumi Estates — I am looking for land and would like to talk it through.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ marginTop: 18 }}
          >
            <Icon name="whatsapp" size={16} /> Send us a brief
          </a>
        </div>
      ) : (
        <div className="grid g3">
          {filtered.map((p) => {
            const pr = price(p)
            return (
              <Link key={p.code} href={listingHref(p)} className="mkCard">
                <span className="mkCard__photo">
                  <img src={p.img_url} alt={p.title} loading="lazy" width={800} height={520} />
                </span>
                <span className="mkCard__body">
                  <span className="mkCard__meta">{placeOf(p)}</span>
                  <span className="mkCard__title">{cardTitle(p)}</span>
                  {pr && <span className="mkCard__figures">{pr}</span>}
                </span>
              </Link>
            )
          })}
        </div>
      )}

    </>
  )
}
