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
import { corridors, getCorridor, corridorDisclaimer } from '@/lib/content/corridors'
import { getPropertyType } from '@/lib/content/propertyTypes'
import { insights } from '@/lib/content/insights'
import { caseStudies } from '@/lib/content/caseStudies'
import { getProperties } from '@/lib/db'

export const revalidate = 300

export function generateStaticParams() {
  return corridors.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const c = getCorridor(slug)
  if (!c) return {}
  return {
    title: `${c.name} — land prices, infrastructure and what to check`,
    description: `${c.headline} Indicative land ₹${c.price_low}–${c.price_high} Cr per acre. Infrastructure pipeline, what the corridor suits, and the specific risks we check for.`,
    alternates: { canonical: `/corridors/${c.slug}` },
  }
}

export default async function CorridorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const corridor = getCorridor(slug)
  if (!corridor) notFound()

  const { data: all } = await getProperties()
  const listings = all.filter((p) => p.corridor === slug)
  const related = insights.filter((i) => i.corridor === slug)
  const cases = caseStudies.filter((c) => c.corridor.toLowerCase().includes(corridor.name.split(/[&,]/)[0].trim().toLowerCase()))
  const others = corridors.filter((c) => c.slug !== slug)

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow={`${corridor.zone} Bengaluru · Growth corridor`}
          title={corridor.name}
          lede={corridor.headline}
          crumbs={[{ label: 'Corridors', href: '/corridors' }, { label: corridor.name.split(/[&,]/)[0].trim() }]}
          stats={[
            { value: `₹${corridor.price_low}–${corridor.price_high}`, label: 'Cr per acre, indicative' },
            { value: `${corridor.yoy_pct}%`, label: 'Indicative YoY movement' },
            { value: String(listings.length), label: 'On the marketplace' },
            { value: String(corridor.infrastructure.length), label: 'Infrastructure items tracked' },
          ]}
        />

        <section className="section-tight">
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">The read</span>
                  <p className="lede">{corridor.summary}</p>

                  <div style={{ marginTop: 28 }}>
                    <span className="eyebrow" style={{ marginBottom: 12 }}>
                      What is driving it
                    </span>
                    <ul className="checkList">
                      {corridor.drivers.map((d) => (
                        <li key={d}>
                          <Icon name="check" size={16} stroke={2.4} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={70}>
                <div>
                  {/* Watch-outs get equal weight to drivers. A corridor
                      page that only sells the corridor is an advert. */}
                  <div className="calloutBox" style={{ background: 'var(--flagged-bg)', borderColor: 'rgba(192,57,43,.25)' }}>
                    <span className="eyebrow" style={{ marginBottom: 8, color: 'var(--flagged)' }}>
                      What goes wrong here
                    </span>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {corridor.watch_outs.map((w) => (
                        <li
                          key={w}
                          style={{ fontSize: '.89rem', color: 'var(--ink-2)', lineHeight: 1.65, paddingLeft: 20, position: 'relative' }}
                        >
                          <span style={{ position: 'absolute', left: 0, color: 'var(--flagged)', fontWeight: 700 }}>×</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: 22 }}>
                    <span className="eyebrow" style={{ marginBottom: 12 }}>
                      Best suited to
                    </span>
                    <div className="chips">
                      {corridor.best_for.map((b) => {
                        const t = getPropertyType(b)
                        return t ? (
                          <Link key={b} href={t.href} className="chip">
                            {t.shortName}
                          </Link>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Infrastructure pipeline */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Infrastructure pipeline</span>
              <h2 className="h1">
                What is built, what is <em>promised.</em>
              </h2>
              <p>
                Status matters more than the announcement. An operating asset reprices land today; a planned
                one reprices it when the tender is awarded, which may be years apart.
              </p>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Detail</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {corridor.infrastructure.map((inf) => (
                    <tr key={inf.label}>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{inf.label}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{inf.detail}</td>
                      <td>
                        <span
                          className={`badge ${
                            inf.status === 'Operating'
                              ? 'badge-verified'
                              : inf.status.includes('construction') || inf.status.includes('progress')
                                ? 'badge-progress'
                                : 'badge-pending'
                          }`}
                        >
                          {inf.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 16, lineHeight: 1.7, maxWidth: '88ch' }}>
              {corridorDisclaimer}
            </p>
          </div>
        </section>

        {/* Inventory */}
        {listings.length > 0 && (
          <section className="section">
            <div className="wrap">
              <div className="sectionHead--split sectionHead">
                <div>
                  <span className="eyebrow">In this corridor</span>
                  <h2 className="h1">
                    Currently <em>listed.</em>
                  </h2>
                </div>
                <Link href="/marketplace" className="btn btn-ghost">
                  Full marketplace
                </Link>
              </div>
              <div className="grid g3">
                {listings.map((p, i) => (
                  <Reveal key={p.code} delay={i * 50}>
                    <PropertyTypeCard property={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related reading */}
        {(related.length > 0 || cases.length > 0) && (
          <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
            <div className="wrap">
              <span className="eyebrow">Further reading on this corridor</span>
              <div className="grid g3" style={{ marginTop: 18 }}>
                {cases.map((c) => (
                  <Link key={c.slug} href={`/portfolio/${c.slug}`} className="listCard">
                    <span className="badge badge-navy">Case study</span>
                    <h3>{c.title}</h3>
                    <p>{c.summary.slice(0, 150)}…</p>
                  </Link>
                ))}
                {related.map((n) => (
                  <Link key={n.slug} href={`/insights/${n.slug}`} className="listCard">
                    <span className="badge badge-gold">{n.category}</span>
                    <h3>{n.title}</h3>
                    <p>{n.excerpt.slice(0, 150)}…</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="section">
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">Buying here?</span>
                  <h2 className="h1">
                    Send the survey number before you send the <em>advance.</em>
                  </h2>
                  <p className="body-text">
                    We know this corridor&rsquo;s specific failure modes — the ones listed above are not
                    generic caution, they are what we have actually found here. A preliminary read is free and
                    takes a couple of days.
                  </p>

                  <div style={{ marginTop: 24 }}>
                    <span className="eyebrow" style={{ marginBottom: 12 }}>
                      Other corridors
                    </span>
                    <div className="chips">
                      {others.map((o) => (
                        <Link key={o.slug} href={`/corridors/${o.slug}`} className="chip">
                          {o.name.split(/[&,]/)[0].trim()}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={70}>
                <LeadForm
                  kind="Verification review"
                  source={`/corridors/${corridor.slug}`}
                  corridor={corridor.slug}
                  heading={`Checking a parcel in ${corridor.name.split(/[&,]/)[0].trim()}?`}
                  blurb="Survey number and village is enough to start."
                  qualifier={{
                    name: 'survey_number',
                    label: 'Survey number and village',
                    placeholder: 'e.g. Sy. 44/2',
                  }}
                  whatsappMessage={`Hi Bhumi Estates — I'm looking at a parcel in ${corridor.name}. Survey number:`}
                />
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
