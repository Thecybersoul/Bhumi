import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { caseStudies, getCaseStudy } from '@/lib/content/caseStudies'
import { getPillar } from '@/lib/content/pillars'
import { getPropertyType } from '@/lib/content/propertyTypes'

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const c = getCaseStudy(slug)
  if (!c) return {}
  return {
    title: c.title,
    description: c.summary.slice(0, 180),
    alternates: { canonical: `/portfolio/${c.slug}` },
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()

  const others = caseStudies.filter((c) => c.slug !== slug).slice(0, 3)
  const type = getPropertyType(study.property_type)

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow={`${study.corridor.split(/[&,]/)[0].trim()} · ${type?.shortName ?? ''}`}
          title={study.title}
          crumbs={[{ label: 'Portfolio', href: '/portfolio' }, { label: 'Case study' }]}
          lede={study.summary}
        />

        <section className="section-tight">
          <div className="wrap">
            <div className="sectionHead" style={{ marginBottom: 24 }}>
              <span className="eyebrow">The parcel</span>
            </div>
            <div className="factGrid">
              {study.parcel.map((p) => (
                <div key={p.label}>
                  <span className="factGrid__label">{p.label}</span>
                  <span className="factGrid__value">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">The mandate, stage by stage</span>
              <h2 className="h1">
                What actually <em>happened.</em>
              </h2>
            </div>

            <ol className="journeyList">
              {study.journey.map((j) => (
                <li key={j.stage}>
                  <strong>{j.stage}</strong>
                  <p>{j.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">The numbers</span>
              <h2 className="h1">
                Results, <em>not adjectives.</em>
              </h2>
              <p>
                Every figure below is a mandate number. Where a metric is not actionable, we say so rather
                than letting it flatter the result.
              </p>
            </div>

            <div className="resultsRow">
              {study.results.map((r) => (
                <div key={r.label}>
                  <span className="numeral" style={{ fontSize: '1.6rem' }}>
                    {r.value}
                  </span>
                  <small>{r.label}</small>
                  {r.note && <em>{r.note}</em>}
                </div>
              ))}
            </div>

            <div className="row-wrap" style={{ marginTop: 28 }}>
              <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Pillars engaged:</span>
              {study.pillars.map((p) => {
                const pillar = getPillar(p)
                return pillar ? (
                  <Link key={p} href={`/services/${p}`} className="chip">
                    <Icon name={pillar.icon} size={13} /> {pillar.name}
                  </Link>
                ) : null
              })}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">Similar situation?</span>
                  <h2 className="h1">
                    Most mandates start with a <em>single question.</em>
                  </h2>
                  <p className="body-text">
                    Tell us what you are looking at and what you are trying to achieve. If we have run
                    something close to it, we will tell you what it cost and how long it took.
                  </p>

                  <div style={{ marginTop: 26 }}>
                    <span className="eyebrow" style={{ marginBottom: 12 }}>
                      Other mandates
                    </span>
                    <div className="stack">
                      {others.map((o) => (
                        <Link key={o.slug} href={`/portfolio/${o.slug}`} className="advisorCard">
                          <span className="advisorCard__avatar">
                            <Icon name={getPropertyType(o.property_type)?.icon ?? 'land'} size={20} />
                          </span>
                          <div>
                            <strong style={{ fontSize: '.88rem', lineHeight: 1.4 }}>{o.title}</strong>
                            <small>{o.corridor.split(/[&,]/)[0].trim()}</small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={70}>
                <LeadForm
                  kind="Enquiry"
                  source={`/portfolio/${study.slug}`}
                  heading="Brief us on your mandate"
                  blurb="Straight to the advisory desk, not a shared inbox."
                  qualifier={{
                    name: 'mandate',
                    label: 'What are you trying to achieve?',
                    placeholder: 'Extent, corridor, intended use, timeline',
                  }}
                  whatsappMessage="Hi Bhumi Estates — I read a case study on your site and have a similar situation:"
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
