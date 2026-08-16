import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import { caseStudies } from '@/lib/content/caseStudies'
import { getPillar } from '@/lib/content/pillars'
import { getPropertyType } from '@/lib/content/propertyTypes'

export const metadata: Metadata = {
  title: 'Portfolio — real mandates, real numbers',
  description:
    'Case studies with mandate figures rather than adjectives: 41 parcels screened to close 68 acres, a 620mm clear-height shortfall that renegotiated a lease, and a campaign reported on cost per qualified lead.',
  alternates: { canonical: '/portfolio' },
}

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Proof, organised by corridor and by pillar"
          title="Case studies with numbers in them."
          italic="Including the bad ones."
          lede="Every case study here carries the mandate figures, and each one names something that went wrong or something we walked away from. A portfolio without a single failure in it is a portfolio that has been edited."
          crumbs={[{ label: 'Portfolio' }]}
          stats={[
            { value: String(caseStudies.length), label: 'Published mandates' },
            { value: '41', label: 'Parcels screened, largest mandate' },
            { value: '620mm', label: 'Shortfall that renegotiated a lease' },
            { value: '₹412', label: 'Cost per qualified lead, best campaign' },
          ]}
        />

        <section className="section">
          <div className="wrap">
            <div className="grid" style={{ gap: 22 }}>
              {caseStudies.map((c, i) => (
                <Reveal key={c.slug} delay={i * 50}>
                  <article className="card" style={{ padding: 'clamp(26px, 3.2vw, 38px)' }}>
                    <div className="row-wrap" style={{ marginBottom: 14 }}>
                      <span className="badge badge-navy">{c.corridor.split(/[&,]/)[0].trim()}</span>
                      <span className="badge badge-gold">
                        {getPropertyType(c.property_type)?.shortName ?? c.property_type}
                      </span>
                      {c.pillars.map((p) => (
                        <span key={p} style={{ fontSize: '.74rem', color: 'var(--muted)' }}>
                          {getPillar(p)?.name}
                        </span>
                      ))}
                    </div>

                    <Link href={`/portfolio/${c.slug}`}>
                      <h2 className="h2" style={{ marginBottom: 12 }}>
                        {c.title}
                      </h2>
                    </Link>
                    <p className="body-text" style={{ fontSize: '.95rem' }}>
                      {c.summary}
                    </p>

                    <div className="resultsRow" style={{ marginTop: 24 }}>
                      {c.results.map((r) => (
                        <div key={r.label}>
                          <span className="numeral">{r.value}</span>
                          <small>{r.label}</small>
                          {r.note && <em>{r.note}</em>}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 22 }}>
                      <Link href={`/portfolio/${c.slug}`} className="btn btn-primary">
                        Read the full mandate
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="ctaBand">
          <div className="wrap ctaBand__inner">
            <div>
              <span className="eyebrow eyebrow-light">Your mandate</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                We will tell you the numbers <em>before</em> we start.
              </h2>
              <p>
                Screening ratios, expected turnaround, and what we think the probability of a clean outcome
                is. If we think a mandate is unlikely to produce one, we will say so at the start rather than
                bill you to find out.
              </p>
            </div>
            <div className="ctaBand__actions">
              <Link href="/contact" className="btn btn-gold btn-lg">
                Brief us on a mandate
              </Link>
              <Link href="/verification#review" className="btn btn-outline-light btn-lg">
                Start with a free review
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
