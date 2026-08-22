import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import VerificationStepper from '@/components/site/VerificationStepper'
import { pillars, getPillar } from '@/lib/content/pillars'
import { caseStudies } from '@/lib/content/caseStudies'

export function generateStaticParams() {
  return pillars.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const pillar = getPillar(slug)
  if (!pillar) return {}
  return {
    title: pillar.name,
    description: `${pillar.short}. ${pillar.promise}`,
    alternates: { canonical: `/services/${pillar.slug}` },
  }
}

export default async function PillarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pillar = getPillar(slug)
  if (!pillar) notFound()

  const related = pillar.worksWellWith.map(getPillar).filter(Boolean)
  const evidence = caseStudies.filter((c) => c.pillars.includes(pillar.slug))

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow={`Pillar ${pillar.number} · ${pillar.short}`}
          title={pillar.name}
          lede={pillar.promise}
          crumbs={[{ label: 'Services', href: '/services' }, { label: pillar.name }]}
          stats={pillar.proofPoints.map((p) => ({ value: p.value, label: p.label }))}
          actions={[{ label: pillar.cta.label, href: pillar.cta.href, variant: 'gold', icon: 'arrow' }]}
        />

        <section className="section-tight">
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">Why this exists</span>
                  <h2 className="h1">
                    The judgment, not just the <em>service.</em>
                  </h2>
                  <p className="lede">{pillar.judgment}</p>
                  <p className="body-text" style={{ marginTop: 18, fontSize: '.9rem', color: 'var(--muted)' }}>
                    <strong style={{ color: 'var(--navy)' }}>Who this is for:</strong> {pillar.audience}
                  </p>
                </div>
              </Reveal>

              <Reveal delay={70}>
                <div className="panel">
                  <span className="eyebrow" style={{ marginBottom: 12 }}>
                    What the engagement delivers
                  </span>
                  <ul className="checkList">
                    {pillar.deliverables.map((d) => (
                      <li key={d}>
                        <Icon name="check" size={16} stroke={2.4} />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Verification pillar carries the full stepper inline */}
        {pillar.slug === 'verification' && (
          <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
            <div className="wrap">
              <div className="sectionHead">
                <span className="eyebrow">The protocol</span>
                <h2 className="h1">
                  Six stages, published in <em>full.</em>
                </h2>
                <p>
                  The same protocol shown on the flagship page, reproduced here so you can see exactly what a
                  verification engagement covers before you commission one.
                </p>
              </div>
              <VerificationStepper compact initialOpen={null} />
              <div style={{ marginTop: 26 }}>
                <Link href="/verification" className="btn btn-primary">
                  Open the flagship page and the transparency dashboard
                  <Icon name="arrow" size={15} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <section className="section">
            <div className="wrap">
              <div className="sectionHead--split sectionHead">
                <div>
                  <span className="eyebrow">Evidence</span>
                  <h2 className="h1">
                    Where this pillar did the <em>work.</em>
                  </h2>
                  <p>Projects where {pillar.name.toLowerCase()} was central, with the numbers it produced.</p>
                </div>
                <Link href="/portfolio" className="btn btn-ghost">
                  All case studies
                </Link>
              </div>

              <div className="grid g2">
                {evidence.map((c, i) => (
                  <Reveal key={c.slug} delay={i * 60}>
                    <Link href={`/portfolio/${c.slug}`} className="listCard">
                      <div className="listCard__meta">
                        <span className="badge badge-navy">{c.corridor.split('&')[0].trim()}</span>
                        <span>
                          {new Date(c.published).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h3>{c.title}</h3>
                      <p>{c.summary}</p>
                      <div className="resultsRow" style={{ marginTop: 12 }}>
                        {c.results.slice(0, 3).map((r) => (
                          <div key={r.label}>
                            <span className="numeral" style={{ fontSize: '1.05rem' }}>
                              {r.value}
                            </span>
                            <small>{r.label}</small>
                          </div>
                        ))}
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA + related pillars */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">Next step</span>
                  <h2 className="h1">
                    Start with a <em>conversation,</em> not a proposal.
                  </h2>
                  <p className="body-text">
                    Tell us the situation. If this pillar is not what you need, we will say so — engaging us
                    for work that does not move your position is worse for us than not engaging us at all.
                  </p>

                  {related.length > 0 && (
                    <div style={{ marginTop: 28 }}>
                      <span className="eyebrow" style={{ marginBottom: 12 }}>
                        Usually engaged alongside
                      </span>
                      <div className="stack">
                        {related.map(
                          (r) =>
                            r && (
                              <Link key={r.slug} href={`/services/${r.slug}`} className="advisorCard">
                                <span className="advisorCard__avatar">
                                  <Icon name={r.icon} size={20} />
                                </span>
                                <div>
                                  <strong>{r.name}</strong>
                                  <small>{r.short}</small>
                                </div>
                              </Link>
                            )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>

              <Reveal delay={70}>
                <LeadForm
                  kind="Enquiry"
                  source={`/services/${pillar.slug}`}
                  heading={`Discuss ${pillar.name.toLowerCase()}`}
                  blurb="Goes straight to the advisory desk."
                  qualifier={{
                    name: 'situation',
                    label: 'Briefly, what is the situation?',
                    placeholder: 'Location, extent, and what you are trying to achieve',
                  }}
                  whatsappMessage={`Hi Bhumi Estates — I'd like to discuss ${pillar.name.toLowerCase()}:`}
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
