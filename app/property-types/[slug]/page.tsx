import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import PropertyTypeCard from '@/components/site/PropertyTypeCard'
import { hubTypes, getPropertyType, propertyTypes } from '@/lib/content/propertyTypes'
import { getTool } from '@/lib/content/tools'
import { getPropertiesByType } from '@/lib/db'

export const revalidate = 300

export function generateStaticParams() {
  return hubTypes.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const type = getPropertyType(slug)
  if (!type) return {}
  return {
    title: type.name,
    description: `${type.tagline} ${type.criticalDetail.headline}.`,
    alternates: { canonical: type.href },
  }
}

export default async function PropertyTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const type = getPropertyType(slug)
  if (!type || slug === 'large-land-parcels') notFound()

  const { data: listings } = await getPropertiesByType(slug)
  const relatedTools = type.relatedTools.map(getTool).filter(Boolean)
  const others = propertyTypes.filter((t) => t.slug !== slug).slice(0, 3)

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow={`Asset class · ${type.shortName}`}
          title={type.name}
          lede={type.tagline}
          crumbs={[{ label: 'Property Types', href: '/property-types' }, { label: type.shortName }]}
          stats={[
            { value: String(listings.length), label: 'Live on the marketplace' },
            { value: String(type.checklist.length), label: 'Checks in our review' },
            { value: type.metricLabels.extent, label: 'Measured on' },
            { value: type.iconTreatment, label: 'Presentation style' },
          ]}
          actions={[{ label: type.cta.label, href: type.cta.href, variant: 'gold', icon: 'arrow' }]}
        />

        {/* ── Intro + the detail that matters ── */}
        <section className="section-tight">
          <div className="wrap">
            <div className="splitRow">
              <Reveal>
                <div>
                  <span className="eyebrow">The decision you are actually making</span>
                  <p className="lede">{type.intro}</p>
                </div>
              </Reveal>
              <Reveal delay={70}>
                <div className="calloutBox">
                  <span className="eyebrow" style={{ marginBottom: 8 }}>
                    What decides it
                  </span>
                  <h3>{type.criticalDetail.headline}</h3>
                  <p>{type.criticalDetail.body}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── What the listing shows ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Presentation</span>
              <h2 className="h1">
                What every {type.shortName.toLowerCase()} listing <em>shows.</em>
              </h2>
              <p>
                Presented as a {type.iconTreatment} treatment rather than a generic property template — the
                fields below appear on every listing in this class, whether or not they flatter it.
              </p>
            </div>

            <div className="grid g2">
              {type.shows.map((s, i) => (
                <Reveal key={s.label} delay={i * 50}>
                  <div className="listCard">
                    <h3>{s.label}</h3>
                    <p>{s.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── The checklist ── */}
        <section className="section">
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">Diligence</span>
                  <h2 className="h1">
                    What we check before we would <em>let you buy it.</em>
                  </h2>
                  <p className="body-text">
                    These sit on top of the six-stage protocol every parcel goes through. They are the checks
                    specific to this asset class — the ones a general property review would not run.
                  </p>
                  <div style={{ marginTop: 20 }}>
                    <Link href="/verification" className="link-arrow">
                      See the underlying six-stage protocol →
                    </Link>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={70}>
                <ul className="checkList">
                  {type.checklist.map((c) => (
                    <li key={c}>
                      <Icon name="check" size={16} stroke={2.4} />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Live inventory ── */}
        {listings.length > 0 && (
          <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
            <div className="wrap">
              <div className="sectionHead--split sectionHead">
                <div>
                  <span className="eyebrow">Live inventory</span>
                  <h2 className="h1">
                    Currently on the <em>marketplace.</em>
                  </h2>
                </div>
                <Link href={`/marketplace?type=${type.slug}`} className="btn btn-ghost">
                  Open in the marketplace
                </Link>
              </div>

              <div className="grid g3">
                {listings.slice(0, 6).map((p, i) => (
                  <Reveal key={p.code} delay={i * 50}>
                    <PropertyTypeCard property={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Buyer questions ── */}
        <section className="section">
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <div>
                <span className="eyebrow">Questions we get</span>
                <h2 className="h1">
                  The ones worth <em>asking early.</em>
                </h2>
                <p className="lede">
                  Asked before a site visit rather than after an agreement, these change what you pay.
                </p>

                {relatedTools.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <span className="eyebrow" style={{ marginBottom: 12 }}>
                      Tools for this asset class
                    </span>
                    <div className="stack">
                      {relatedTools.map(
                        (t) =>
                          t && (
                            <Link key={t.slug} href={`/tools/${t.slug}`} className="advisorCard">
                              <span className="advisorCard__avatar">
                                <Icon name={t.icon} size={20} />
                              </span>
                              <div>
                                <strong>{t.name}</strong>
                                <small>{t.short}</small>
                              </div>
                            </Link>
                          )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="faqList">
                {type.buyerQuestions.map((q) => (
                  <details key={q.q} className="faqItem" open>
                    <summary>
                      {q.q}
                      <span className="plus" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <p>{q.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="splitRow">
              <Reveal>
                <div>
                  <span className="eyebrow">Next step</span>
                  <h2 className="h1">
                    Have a {type.shortName.toLowerCase()} asset <em>reviewed.</em>
                  </h2>
                  <p className="body-text">
                    Tell us which parcel or building you are looking at. We will tell you which of the checks
                    above are likely to bind, and what a full review would cost, before you commit to
                    anything.
                  </p>
                  <p className="body-text" style={{ fontSize: '.9rem', color: 'var(--muted)' }}>
                    Typical audience for this class: {type.audience}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={70}>
                <LeadForm
                  kind="Enquiry"
                  source={type.href}
                  heading={`Ask about ${type.shortName.toLowerCase()}`}
                  blurb="Straight to the advisory desk. No call centre in between."
                  qualifier={{
                    name: 'requirement',
                    label: 'What are you looking at?',
                    placeholder:
                      type.slug === 'warehouses'
                        ? 'e.g. 120,000 sq ft, 10m clear height, Hoskote'
                        : 'Location, size and intended use',
                  }}
                  whatsappMessage={`Hi Bhumi Estates — I have a question about ${type.name.toLowerCase()}:`}
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Other classes ── */}
        <section className="section-tight">
          <div className="wrap">
            <span className="eyebrow">Other asset classes</span>
            <div className="typeGrid" style={{ marginTop: 18 }}>
              {others.map((o) => (
                <Link key={o.slug} href={o.href} className="typeCard">
                  <span className="typeCard__icon">
                    <Icon name={o.icon} size={24} />
                  </span>
                  <h3>{o.name}</h3>
                  <span className="typeCard__tag">{o.tagline}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
