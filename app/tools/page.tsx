import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { tools, toolsDisclaimer } from '@/lib/content/tools'

export const metadata: Metadata = {
  title: 'Decision tools — cost estimator, warehouse and zoning checks',
  description:
    'Free decision-support tools: estimate construction cost and timeline, check warehouse suitability against Grade A thresholds, compare corridor prices, and check what a corridor typically permits.',
  alternates: { canonical: '/tools' },
}

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Decision support"
          title="A premium site helps you"
          italic="decide,"
          after=" not just browse."
          lede="Free tools, each answering a question people ask us before they are ready to engage. They produce illustrative ranges in a couple of minutes, and each one tells you honestly what still needs checking at parcel level."
          crumbs={[{ label: 'Tools' }]}
          stats={[
            { value: String(tools.length), label: 'Tools' },
            { value: '1–3', label: 'Minutes each' },
            { value: 'Free', label: 'No signup wall' },
            { value: '2026', label: 'Rates and rules current to' },
          ]}
        />

        <section className="section">
          <div className="wrap">
            <div className="grid g2">
              {tools.map((t, i) => (
                <Reveal key={t.slug} delay={i * 50}>
                  <Link href={`/tools/${t.slug}`} className="listCard">
                    <div className="row" style={{ marginBottom: 4 }}>
                      <span className="typeCard__icon" style={{ width: 46, height: 46 }}>
                        <Icon name={t.icon} size={22} />
                      </span>
                      <div>
                        <h3>{t.name}</h3>
                        <span style={{ fontSize: '.8rem', color: 'var(--gold-deep)' }}>{t.short}</span>
                      </div>
                    </div>

                    <p>{t.description}</p>

                    <div
                      style={{
                        marginTop: 4,
                        padding: '12px 14px',
                        background: 'var(--navy-tint)',
                        borderRadius: 'var(--r-sm)',
                        fontSize: '.83rem',
                        color: 'var(--navy-700)',
                        lineHeight: 1.6,
                      }}
                    >
                      <strong>You get:</strong> {t.outcome}
                    </div>

                    <div className="listCard__foot row-wrap" style={{ justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>
                        {t.audience} · {t.minutes} min
                      </span>
                      <span className="link-arrow">Open →</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>

            <div className="toolDisclaimer" style={{ marginTop: 32 }}>
              <strong>How to read every output on these pages.</strong> {toolsDisclaimer}
            </div>
          </div>
        </section>

        <section className="ctaBand">
          <div className="wrap ctaBand__inner">
            <div>
              <span className="eyebrow eyebrow-light">After the tool</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                A number is a starting point, not a <em>decision.</em>
              </h2>
              <p>
                Every tool ends with the option to send us the inputs. We come back with what the illustrative
                answer misses on your specific parcel — which is usually the part that matters.
              </p>
            </div>
            <div className="ctaBand__actions">
              <Link href="/verification#review" className="btn btn-gold btn-lg">
                Get a free verification review
              </Link>
              <Link href="/contact" className="btn btn-outline-light btn-lg">
                Talk to an advisor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
