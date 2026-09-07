'use client'

import { useMemo, useState } from 'react'
import Icon from './Icon'
import LeadForm from './LeadForm'
import { getPropertyType } from '@/lib/content/propertyTypes'
import { whatsapp } from '@/lib/content/brand'
import type { Property } from '@/lib/types'

/* The marketplace browser.

   Deliberately shallow. An earlier version carried a search box,
   a verified-only toggle, six type chips and six corridor chips
   over a card that changed its headline metrics per asset class,
   opening a drawer with a four-stage verification stepper and a
   twelve-row fact grid. That is a lot of apparatus for an
   inventory you can count on one hand, and most of it needed
   survey-level detail that a new listing does not have yet.

   What is left: two rows of chips, a card with a photograph, and
   a panel that states what is known and offers a conversation.

   Both filter rows are built from the listings themselves rather
   than from the full type and corridor registries. A chip only
   exists if something is behind it, so the filters cannot show a
   category that returns nothing, and nothing has to be pruned by
   hand as inventory changes. */

function money(cr: number) {
  return cr >= 1 ? `₹${cr.toFixed(cr < 10 ? 1 : 0)} Cr` : `₹${Math.round(cr * 100)} L`
}

/** The size line, in whichever unit the asset is actually sold by. */
function size(p: Property): string | null {
  if (p.extent_acres > 0) return `${p.extent_acres} acres`
  if (p.built_up_sqft) return `${p.built_up_sqft.toLocaleString('en-IN')} sq ft`
  if (p.carpet_sqft) return `${p.carpet_sqft.toLocaleString('en-IN')} sq ft carpet`
  return null
}

function price(p: Property): string | null {
  if (p.price_type === 'On Request') return 'On request'
  // A flat is quoted whole; land is quoted by the acre. Lead with
  // whichever the seller actually named.
  if (p.price_total_cr) return money(p.price_total_cr)
  if (p.price_per_sqft) return `₹${p.price_per_sqft.toLocaleString('en-IN')} / sq ft`
  if (p.extent_acres > 0 && p.price_per_acre_cr > 0) return `${money(p.price_per_acre_cr)} / acre`
  return null
}

/* Only what this listing actually states. A lean record leaves most
   of these unset, and an empty row reads worse than a shorter list. */
function facts(p: Property): [string, string][] {
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
    p.conversion_order ? ['Conversion order', p.conversion_order] : null,
    p.survey_number ? ['Survey number', p.survey_number] : null,
    p.land_use ? ['Land use', p.land_use] : null,
  ]
  return rows.filter(Boolean).slice(0, 6) as [string, string][]
}

export default function MarketplaceBrowser({
  properties,
  source,
}: {
  properties: Property[]
  source: 'live' | 'fallback'
}) {
  const [type, setType] = useState('')
  const [place, setPlace] = useState('')
  const [selected, setSelected] = useState<Property | null>(null)

  const types = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of properties) {
      if (seen.has(p.property_type)) continue
      seen.set(p.property_type, getPropertyType(p.property_type)?.shortName ?? p.property_type)
    }
    return [...seen].map(([slug, label]) => ({ slug, label }))
  }, [properties])

  const places = useMemo(
    () => [...new Set(properties.map((p) => p.location).filter(Boolean))].sort(),
    [properties]
  )

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) => (!type || p.property_type === type) && (!place || p.location === place)
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
            const t = getPropertyType(p.property_type)
            const s = size(p)
            const pr = price(p)
            return (
              <button key={p.code} className="mkCard" onClick={() => setSelected(p)}>
                <span className="mkCard__photo">
                  <img src={p.img_url} alt="" loading="lazy" width={800} height={520} />
                </span>
                <span className="mkCard__body">
                  <span className="mkCard__meta">
                    {[t?.shortName, p.location].filter(Boolean).join(' · ')}
                  </span>
                  <span className="mkCard__title">{p.title}</span>
                  {(s || pr) && (
                    <span className="mkCard__figures">{[s, pr].filter(Boolean).join(' · ')}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <>
          <div className="overlay" onClick={() => setSelected(null)} />
          <aside className="drawer open" aria-label={`${selected.title} details`}>
            <div className="drawer-head">
              <div>
                <span className="badge badge-navy">{selected.code}</span>
                <h2 className="h3" style={{ marginTop: 8 }}>
                  {selected.title}
                </h2>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="drawer-body" style={{ padding: 24 }}>
              <img
                src={selected.img_url}
                alt=""
                className="mkDetail__photo"
                width={800}
                height={520}
              />

              <p style={{ fontSize: '.8rem', color: 'var(--muted)', margin: '16px 0' }}>
                {[selected.location, getPropertyType(selected.property_type)?.name]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              {selected.engagement && (
                <p className="mkDetail__engagement">
                  <Icon name="shield" size={14} /> {selected.engagement}
                </p>
              )}

              {selected.description && (
                <p className="body-text" style={{ marginBottom: 20 }}>
                  {selected.description}
                </p>
              )}

              <div className="factGrid" style={{ marginBottom: 22 }}>
                {facts(selected).map(([label, value]) => (
                  <div key={label}>
                    <span className="factGrid__label">{label}</span>
                    <span className="factGrid__value" style={{ fontSize: '.92rem' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href={whatsapp(
                  `Hi Bhumi Estates — I'm interested in ${selected.code} (${selected.title}).`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-block btn-lg"
              >
                <Icon name="whatsapp" size={17} /> Ask about this listing
              </a>

              {/* WhatsApp is the path most people take, but it leaves no
                  record in the lead inbox — so the form stays underneath
                  it rather than being dropped with the rest. */}
              <LeadForm
                kind="Site visit"
                source="/marketplace"
                propertyCode={selected.code}
                corridor={selected.corridor}
                compact
                heading="Or request a site visit"
                blurb="We walk the boundary with you and bring the file."
                whatsappMessage={`Hi Bhumi Estates — I'm interested in ${selected.code} (${selected.title}).`}
                submitLabel="Request a visit"
              />
            </div>
          </aside>
        </>
      )}
    </>
  )
}
