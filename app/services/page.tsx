import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { pillars } from '@/lib/content/pillars'

export const metadata: Metadata = {
  title: 'Services — land sourcing, branding and outdoor advertising',
  description:
    'Land sourcing, verification, development, branding and outdoor advertising. One accountable party from land to a finished, visible asset.',
  alternates: { canonical: '/services' },
}

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Five services, one accountable party"
          title="Most firms broker land or build on it."
          italic="We do the whole chain."
          lede="Find the parcel, check it properly, build on it, and make it impossible to miss. Engage one service or all five."
          crumbs={[{ label: 'Services' }]}
          stats={[
            { value: '5', label: 'Services, each engageable alone' },
            { value: '6', label: 'Verification stages' },
            { value: 'Weekly', label: 'Campaign reporting' },
          ]}
        />

        <section className="section">
          <div className="wrap">
            <div className="grid" style={{ gap: 22 }}>
              {pillars.map((p, i) => (
                <Reveal key={p.slug} delay={i * 40}>
                  <article
                    className="card"
                    style={{
                      padding: 'clamp(26px, 3.2vw, 38px)',
                      borderColor: p.featured ? 'rgba(194,151,74,.35)' : 'var(--line)',
                    }}
                  >
                    <div className="splitRow" style={{ gap: 'clamp(24px, 4vw, 52px)', alignItems: 'start' }}>
                      <div>
                        <div className="row" style={{ marginBottom: 14 }}>
                          <span
                            className="pillarCard__icon"
                            style={{
                              marginBottom: 0,
                              background: p.featured ? 'var(--navy)' : undefined,
                              color: p.featured ? 'var(--gold-soft)' : undefined,
                            }}
                          >
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
                            How we think about it
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
              <span className="eyebrow eyebrow-light">Engage one, or all five</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                Most projects start with <em>sourcing.</em>
              </h2>
              <p>
                Find the right parcel and everything downstream gets easier — what gets built on it, how it is
                branded, and how hard it is to sell. Branding and advertising are where a good asset stops
                being a secret.
              </p>
            </div>
            <div className="ctaBand__actions">
              <Link href="/contact" className="btn btn-gold btn-lg">
                Tell us what you need
              </Link>
              <Link href="/services/branding" className="btn btn-outline-light btn-lg">
                See branding &amp; advertising
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
