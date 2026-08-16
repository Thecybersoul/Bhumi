'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from './Icon'
import PropertyTypeCard from './PropertyTypeCard'
import LeadForm from './LeadForm'
import { propertyTypes } from '@/lib/content/propertyTypes'
import { corridors } from '@/lib/content/corridors'
import { verificationStages } from '@/lib/content/verification'
import type { Property } from '@/lib/types'

export default function MarketplaceBrowser({
  properties,
  source,
}: {
  properties: Property[]
  source: 'live' | 'fallback'
}) {
  const [type, setType] = useState('')
  const [corridor, setCorridor] = useState('')
  const [search, setSearch] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [selected, setSelected] = useState<Property | null>(null)

  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        if (type && p.property_type !== type) return false
        if (corridor && p.corridor !== corridor) return false
        if (verifiedOnly && p.verified_stage !== 'report') return false
        if (search) {
          const q = search.toLowerCase()
          const hay = `${p.title} ${p.location} ${p.code} ${p.survey_number ?? ''} ${p.land_use}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      }),
    [properties, type, corridor, search, verifiedOnly]
  )

  const activeFilters = [type, corridor, search, verifiedOnly ? '1' : ''].filter(Boolean).length

  return (
    <>
      <div className="mkFilters">
        <div className="mkFilters__row">
          <input
            className="mkFilters__search"
            placeholder="Search by location, code or survey number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search listings"
          />
          <button
            className={`chip ${verifiedOnly ? 'selected' : ''}`}
            onClick={() => setVerifiedOnly((v) => !v)}
            aria-pressed={verifiedOnly}
          >
            <Icon name="check" size={12} stroke={3} /> Verified only
          </button>
          {activeFilters > 0 && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setType('')
                setCorridor('')
                setSearch('')
                setVerifiedOnly(false)
              }}
            >
              Clear {activeFilters}
            </button>
          )}
        </div>

        <div className="mkFilters__row">
          <span className="mkFilters__label">Type</span>
          <div className="chips">
            <button className={`chip ${!type ? 'selected' : ''}`} onClick={() => setType('')}>
              All
            </button>
            {propertyTypes.map((t) => (
              <button
                key={t.slug}
                className={`chip ${type === t.slug ? 'selected' : ''}`}
                onClick={() => setType(type === t.slug ? '' : t.slug)}
              >
                {t.shortName}
              </button>
            ))}
          </div>
        </div>

        <div className="mkFilters__row">
          <span className="mkFilters__label">Corridor</span>
          <div className="chips">
            <button className={`chip ${!corridor ? 'selected' : ''}`} onClick={() => setCorridor('')}>
              All
            </button>
            {corridors.map((c) => (
              <button
                key={c.slug}
                className={`chip ${corridor === c.slug ? 'selected' : ''}`}
                onClick={() => setCorridor(corridor === c.slug ? '' : c.slug)}
              >
                {c.name.split(/[&,]/)[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row-wrap" style={{ justifyContent: 'space-between', margin: '26px 0 20px' }}>
        <span style={{ fontSize: '.88rem', color: 'var(--ink-2)' }}>
          <strong style={{ color: 'var(--navy)' }}>{filtered.length}</strong>{' '}
          {filtered.length === 1 ? 'listing' : 'listings'}
          {type && ` · ${propertyTypes.find((t) => t.slug === type)?.shortName}`}
        </span>
        {source === 'fallback' && (
          <span className="sourcePill is-fallback" title="No database attached — showing seeded reference inventory">
            Reference inventory
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="panel center" style={{ padding: 48 }}>
          <h3 className="h3">Nothing matches those filters.</h3>
          <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>
            Tell us what you are looking for — most of what we transact never reaches a public listing.
          </p>
          <Link href="/contact" className="btn btn-primary" style={{ marginTop: 18 }}>
            Send us a brief
          </Link>
        </div>
      ) : (
        <div className="grid g3">
          {filtered.map((p) => (
            <div key={p.code} onClick={() => setSelected(p)} role="button" tabIndex={-1}>
              <PropertyTypeCard property={p} />
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
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
              <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 16 }}>
                {selected.location} · {selected.zone} Bengaluru ·{' '}
                {propertyTypes.find((t) => t.slug === selected.property_type)?.name}
              </p>

              {/* Verification position, shown before the sales copy */}
              <div className="panel" style={{ marginBottom: 20 }}>
                <span className="eyebrow" style={{ marginBottom: 10 }}>
                  Verification position
                </span>
                <div className="stack" style={{ gap: 6 }}>
                  {verificationStages.map((s) => {
                    const reachedIdx = verificationStages.findIndex((x) => x.key === selected.verified_stage)
                    const done = reachedIdx >= 0 && s.number <= reachedIdx + 1
                    const flagged = !selected.title_clear && s.number === reachedIdx + 1
                    return (
                      <div key={s.key} className="row" style={{ gap: 10, fontSize: '.83rem' }}>
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            flexShrink: 0,
                            display: 'grid',
                            placeItems: 'center',
                            background: flagged ? 'var(--flagged)' : done ? 'var(--verified)' : 'var(--line-2)',
                            color: done || flagged ? '#fff' : 'var(--muted)',
                            fontSize: '.6rem',
                          }}
                        >
                          {flagged ? '!' : done ? '✓' : s.number}
                        </span>
                        <span style={{ color: done ? 'var(--ink)' : 'var(--muted)' }}>{s.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {selected.risk !== 'Low' && (
                <div
                  className="calloutBox"
                  style={{ background: 'var(--flagged-bg)', borderColor: 'rgba(192,57,43,.25)', marginBottom: 20 }}
                >
                  <h3 style={{ color: 'var(--flagged)' }}>{selected.risk} risk — stated openly</h3>
                  <p>{selected.risk_notes}</p>
                </div>
              )}

              <p className="body-text" style={{ marginBottom: 20 }}>
                {selected.description}
              </p>

              <div className="factGrid" style={{ marginBottom: 20 }}>
                {[
                  ['Extent', `${selected.extent_acres} acres`],
                  selected.built_up_sqft ? ['Built-up', `${selected.built_up_sqft.toLocaleString('en-IN')} sq ft`] : null,
                  selected.carpet_sqft ? ['Carpet', `${selected.carpet_sqft.toLocaleString('en-IN')} sq ft`] : null,
                  selected.survey_number ? ['Survey number', selected.survey_number] : null,
                  ['Zoning', selected.zoning ?? selected.land_use],
                  ['Conversion', selected.conversion],
                  ['Ownership', selected.ownership],
                  ['Access', selected.road_type],
                  ['Water', selected.water],
                  selected.ceiling_height_m ? ['Clear height', `${selected.ceiling_height_m} m`] : null,
                  selected.power_load_kva ? ['Sanctioned power', `${selected.power_load_kva} KVA`] : null,
                  selected.rera_number ? ['K-RERA', selected.rera_number] : null,
                  ['Price', selected.price_type === 'On Request' ? 'On request' : `₹${selected.price_per_acre_cr} Cr / acre`],
                ]
                  .filter(Boolean)
                  .map((row) => {
                    const [label, value] = row as [string, string]
                    return (
                      <div key={label}>
                        <span className="factGrid__label">{label}</span>
                        <span className="factGrid__value" style={{ fontSize: '.92rem' }}>
                          {value}
                        </span>
                      </div>
                    )
                  })}
              </div>

              <LeadForm
                kind="Site visit"
                source="/marketplace"
                propertyCode={selected.code}
                corridor={selected.corridor}
                compact
                heading="Request a site visit"
                blurb="We walk the boundary with you and bring the verification file."
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
