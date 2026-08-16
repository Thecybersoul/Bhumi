import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { pillars } from '@/lib/content/pillars'

export const metadata: Metadata = {
  title: 'Services — the six-pillar value chain',
  description:
    'Land sourcing, verification and diligence, JDA and deal structuring, construction oversight, marketing and advertising, and sales and handover. One accountable party from land to final sale.',
  alternates: { canonical: '/services' },
}

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="The six-pillar value chain"
          title="Most firms broker land or build on it."
          italic="We do the whole chain."
          lede="Which matters for one reason: it makes us answerable at every stage rather than only the one that suits us. A sourcing firm never has to live with its own diligence. We do."
          crumbs={[{ label: 'Services' }]}
          stats={[
            { value: '6', label: 'Pillars, each engageable alone' },
            { value: '1', label: 'Accountable party across all six' },
            { value: 'Monthly', label: 'Oversight reporting to the owner' },
            { value: 'Weekly', label: 'Campaign reporting on qualified leads' },
          ]}
        />

        <section className="section">
          <div className="wrap">
            <div className="grid" style={{ gap: 22 }}>
              {pillars.map((p, i) => (
                <Reveal key={p.slug} delay={i * 40}>
                  <article className="card" style={{ padding: 'clamp(26px, 3.2vw, 38px)' }}>
                    <div className="splitRow" style={{ gap: 'clamp(24px, 4vw, 52px)', alignItems: 'start' }}>
                      <div>
                        <div className="row" style={{ marginBottom: 14 }}>
                          <span className="pillarCard__icon" style={{ marginBottom: 0 }}>
                            <Icon name={p.icon} size={22} />
                          </span>
                          <div>
                            <span className="pillarCard__num">{p.number}</span>
                            <h2 className="h2">{p.name}</h2>
                          </div>
                        </div>

                        <p className="lede" style={{ fontSize: '1rem' }}>
                          {p.promise}
                        </p>

                        <div className="calloutBox" style={{ marginTop: 20 }}>
                          <span className="eyebrow" style={{ marginBottom: 8 }}>
                            The judgment we are selling
                          </span>
                          <p>{p.judgment}</p>
                        </div>

                        <div className="row-wrap" style={{ marginTop: 22 }}>
                          <Link href={`/services/${p.slug}`} className="btn btn-primary">
                            {p.name} in detail
                            <Icon name="arrow" size={15} />
                          </Link>
                          <Link href={p.cta.href} className="btn btn-ghost">
                            {p.cta.label}
                          </Link>
                        </div>
                      </div>

                      <div>
                        <span className="eyebrow" style={{ marginBottom: 12 }}>
                          What you get
                        </span>
                        <ul className="checkList">
                          {p.deliverables.map((d) => (
                            <li key={d}>
                              <Icon name="check" size={16} stroke={2.4} />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="resultsRow" style={{ marginTop: 20 }}>
                          {p.proofPoints.map((pp) => (
                            <div key={pp.label}>
                              <span className="numeral" style={{ fontSize: '1.1rem' }}>
                                {pp.value}
                              </span>
                              <small>{pp.label}</small>
                            </div>
                          ))}
                        </div>
                      </div>
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
              <span className="eyebrow eyebrow-light">Engage one, or all six</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                Most clients start with <em>verification.</em>
              </h2>
              <p>
                It is the cheapest pillar and the one that changes the most decisions. If the parcel does not
                clear, nothing downstream matters — and you have saved the cost of finding that out later.
              </p>
            </div>
            <div className="ctaBand__actions">
              <Link href="/verification#review" className="btn btn-gold btn-lg">
                Get a free verification review
              </Link>
              <Link href="/contact" className="btn btn-outline-light btn-lg">
                Discuss a full mandate
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
