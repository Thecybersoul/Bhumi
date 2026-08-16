'use client'

import { useState } from 'react'
import Link from 'next/link'
import { corridors } from '@/lib/content/corridors'

/* Interactive corridor visualisation — Plan §3E.

   A schematic map rather than a tiled basemap: it loads instantly,
   works offline, carries no third-party request (the site ships no
   external calls beyond fonts), and is legible at any size. The
   positions are diagrammatic — the ring, the radials and the
   relative bearing of each corridor from the city are accurate;
   the geometry is not survey data and does not pretend to be. */

export default function CorridorMap() {
  const [active, setActive] = useState<string | null>(null)
  const current = corridors.find((c) => c.slug === active)

  return (
    <div className="corridorMap">
      <div className="corridorMap__canvas">
        <svg viewBox="0 0 100 100" role="img" aria-label="Schematic map of Bengaluru growth corridors">
          <title>Bengaluru growth corridors</title>

          <defs>
            <radialGradient id="cityGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#C2974A" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#C2974A" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* City core and ring roads */}
          <circle cx="50" cy="50" r="26" fill="url(#cityGlow)" />
          <circle cx="50" cy="50" r="30" className="corridorMap__ring" strokeDasharray="1.5 2" />
          <circle cx="50" cy="50" r="19" className="corridorMap__ring" />
          <circle cx="50" cy="50" r="6.5" className="corridorMap__core" />
          <text x="50" y="51.4" className="corridorMap__coreLabel">
            BLR
          </text>

          {/* Radial arterials out to each corridor */}
          {corridors.map((c) => (
            <line
              key={`line-${c.slug}`}
              x1="50"
              y1="50"
              x2={c.map.x}
              y2={c.map.y}
              className={`corridorMap__radial ${active === c.slug ? 'is-active' : ''}`}
            />
          ))}

          {/* Corridor nodes */}
          {corridors.map((c) => (
            <g
              key={c.slug}
              className={`corridorMap__node ${active === c.slug ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(c.slug)}
              onFocus={() => setActive(c.slug)}
              tabIndex={0}
              role="button"
              aria-label={`${c.name}, ${c.zone} zone`}
            >
              <circle cx={c.map.x} cy={c.map.y} r="6" className="corridorMap__hit" />
              <circle cx={c.map.x} cy={c.map.y} r="2.6" className="corridorMap__dot" />
              <text
                x={c.map.x}
                y={c.map.y - 5}
                className="corridorMap__label"
                textAnchor={c.map.x > 60 ? 'end' : c.map.x < 40 ? 'start' : 'middle'}
              >
                {c.name.split(/[&,]/)[0].trim()}
              </text>
            </g>
          ))}
        </svg>

        <p className="corridorMap__caption">
          Schematic. Positions show each corridor&rsquo;s bearing and rough distance from the city core, not
          survey geometry.
        </p>
      </div>

      <div className="corridorMap__panel">
        {current ? (
          <>
            <span className="badge badge-navy">{current.zone} Bengaluru</span>
            <h3 className="h2">{current.name}</h3>
            <p className="corridorMap__headline">{current.headline}</p>
            <div className="corridorMap__stats">
              <div>
                <span className="numeral">
                  {current.price_low}–{current.price_high}
                </span>
                <small>{current.price_unit}</small>
              </div>
              <div>
                <span className="numeral">{current.yoy_pct}%</span>
                <small>Indicative YoY movement</small>
              </div>
            </div>
            <p className="corridorMap__watch">
              <strong>Watch out:</strong> {current.watch_outs[0]}
            </p>
            <Link href={`/corridors/${current.slug}`} className="link-arrow">
              Read the corridor note →
            </Link>
          </>
        ) : (
          <>
            <span className="eyebrow">Six active corridors</span>
            <h3 className="h2">Where we operate — and why.</h3>
            <p>
              We work six corridors rather than the whole city, because a corridor note is only worth reading
              if it comes from someone who has walked parcels there. Hover or focus a node to see the
              position; open a corridor for the infrastructure pipeline and what we would check before buying
              in it.
            </p>
            <ul className="corridorMap__list">
              {corridors.map((c) => (
                <li key={c.slug}>
                  <Link href={`/corridors/${c.slug}`} onMouseEnter={() => setActive(c.slug)}>
                    <span>{c.name.split(/[&,]/)[0].trim()}</span>
                    <small>
                      {c.price_low}–{c.price_high} {c.price_unit}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
