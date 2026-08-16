import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import CorridorMap from '@/components/site/CorridorMap'
import { corridors, corridorDisclaimer } from '@/lib/content/corridors'
import { getPropertyType } from '@/lib/content/propertyTypes'

export const metadata: Metadata = {
  title: 'Growth corridors — Bengaluru land, corridor by corridor',
  description:
    'Devanahalli, Sarjapur, Hoskote, Tumakuru Road, Kanakapura Road and Doddaballapur: indicative price bands, infrastructure pipelines, what each corridor suits, and what we would check before buying there.',
  alternates: { canonical: '/corridors' },
}

export default function CorridorsPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Where we operate"
          title="Six corridors, walked."
          italic="Not a city-wide opinion."
          lede="A corridor note is only worth reading if it comes from someone who has walked parcels there and been surprised by a few. Each of these carries its price band, its infrastructure pipeline, what it actually suits — and the specific things that go wrong in it."
          crumbs={[{ label: 'Corridors' }]}
        />

        <section className="section">
          <div className="wrap">
            <CorridorMap />
          </div>
        </section>

        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Side by side</span>
              <h2 className="h1">
                What your budget <em>actually reaches.</em>
              </h2>
              <p>
                Indicative land bands across the six corridors. The trade-off is always the same: the
                corridors with the clearest infrastructure pipeline price it in already.
              </p>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Corridor</th>
                    <th>Zone</th>
                    <th>Indicative band</th>
                    <th>YoY</th>
                    <th>Best suited to</th>
                    <th>Headline driver</th>
                  </tr>
                </thead>
                <tbody>
                  {corridors.map((c) => (
                    <tr key={c.slug}>
                      <td>
                        <Link href={`/corridors/${c.slug}`} style={{ fontWeight: 600, color: 'var(--navy)' }}>
                          {c.name}
                        </Link>
                      </td>
                      <td>{c.zone}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                        ₹{c.price_low}–{c.price_high} Cr/ac
                      </td>
                      <td>
                        <span className="badge badge-gold">{c.yoy_pct}%</span>
                      </td>
                      <td style={{ fontSize: '.8rem' }}>
                        {c.best_for
                          .map((b) => getPropertyType(b)?.shortName ?? b)
                          .slice(0, 3)
                          .join(' · ')}
                      </td>
                      <td style={{ fontSize: '.8rem', color: 'var(--muted)', maxWidth: 280 }}>
                        {c.drivers[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 18, lineHeight: 1.7, maxWidth: '90ch' }}>
              {corridorDisclaimer}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Corridor notes</span>
              <h2 className="h1">
                Read the one you are <em>buying in.</em>
              </h2>
            </div>

            <div className="grid g2">
              {corridors.map((c, i) => (
                <Reveal key={c.slug} delay={i * 50}>
                  <Link href={`/corridors/${c.slug}`} className="listCard">
                    <div className="listCard__meta">
                      <span className="badge badge-navy">{c.zone} Bengaluru</span>
                      <span>
                        Updated{' '}
                        {new Date(c.updated).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3>{c.name}</h3>
                    <p style={{ color: 'var(--gold-deep)', fontWeight: 500, fontSize: '.9rem' }}>
                      {c.headline}
                    </p>
                    <p>{c.summary.slice(0, 210)}…</p>
                    <div className="listCard__foot">
                      <span className="link-arrow">Corridor note →</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
