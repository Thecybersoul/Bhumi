import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { propertyTypes } from '@/lib/content/propertyTypes'
import { getProperties } from '@/lib/db'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Property types — commercial, residential, villas, land, warehousing',
  description:
    'Six asset classes, each with its own presentation and its own diligence detail: occupancy certificates for commercial, RERA numbers for apartments, conversion status for land, clear height and power load for warehousing.',
  alternates: { canonical: '/property-types' },
}

export default async function PropertyTypesPage() {
  const { data: properties } = await getProperties()
  const countFor = (slug: string) => properties.filter((p) => p.property_type === slug).length

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="What we cover"
          title="One template for every asset class signals a"
          italic="generalist."
          lede="A warehouse buyer and a villa buyer are making completely different decisions. So each asset class here carries its own presentation, its own checklist, and the one number or document that actually decides it."
          crumbs={[{ label: 'Property Types' }]}
        />

        <section className="section">
          <div className="wrap">
            <div className="grid" style={{ gap: 22 }}>
              {propertyTypes.map((t, i) => (
                <Reveal key={t.slug} delay={i * 50}>
                  <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="splitRow" style={{ gap: 0, alignItems: 'stretch' }}>
                      <div style={{ padding: 'clamp(26px, 3.4vw, 40px)' }}>
                        <div className="row" style={{ marginBottom: 16 }}>
                          <span className="typeCard__icon">
                            <Icon name={t.icon} size={26} />
                          </span>
                          <div>
                            <h2 className="h2">{t.name}</h2>
                            <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                              {countFor(t.slug) > 0
                                ? `${countFor(t.slug)} live on the marketplace`
                                : 'Advisory mandates'}
                              {' · '}
                              {t.iconTreatment} presentation
                            </span>
                          </div>
                        </div>

                        <p className="lede" style={{ fontSize: '1rem' }}>
                          {t.tagline}
                        </p>
                        <p className="body-text" style={{ marginTop: 14, fontSize: '.92rem' }}>
                          {t.intro}
                        </p>

                        <div className="row-wrap" style={{ marginTop: 24 }}>
                          <Link href={t.href} className="btn btn-primary">
                            {t.shortName} in detail
                            <Icon name="arrow" size={15} />
                          </Link>
                          <Link href={`/marketplace?type=${t.slug}`} className="btn btn-ghost">
                            See inventory
                          </Link>
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'var(--paper)',
                          borderLeft: '1px solid var(--line)',
                          padding: 'clamp(26px, 3.4vw, 40px)',
                        }}
                      >
                        <span className="eyebrow" style={{ marginBottom: 12 }}>
                          The detail that matters most
                        </span>
                        <h3 className="h3" style={{ marginBottom: 10 }}>
                          {t.criticalDetail.headline}
                        </h3>
                        <p style={{ fontSize: '.89rem', color: 'var(--ink-2)', lineHeight: 1.72 }}>
                          {t.criticalDetail.body}
                        </p>

                        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
                          <span className="eyebrow" style={{ marginBottom: 10 }}>
                            What the listing shows
                          </span>
                          <ul className="checkList">
                            {t.shows.slice(0, 4).map((s) => (
                              <li key={s.label}>
                                <Icon name="check" size={15} stroke={2.4} />
                                <span>
                                  <strong style={{ color: 'var(--navy)' }}>{s.label}</strong> — {s.detail}
                                </span>
                              </li>
                            ))}
                          </ul>
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
              <span className="eyebrow eyebrow-light">Not sure which applies</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                Tell us what you are trying to <em>do</em> with it.
              </h2>
              <p>
                The asset class matters less than the intent. Describe what you want to build, hold or sell,
                and we will tell you which checks actually bind in your case.
              </p>
            </div>
            <div className="ctaBand__actions">
              <Link href="/contact" className="btn btn-gold btn-lg">
                Talk to an advisor
              </Link>
              <Link href="/tools" className="btn btn-outline-light btn-lg">
                Or start with a tool
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
