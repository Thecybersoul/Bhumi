import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { insights } from '@/lib/content/insights'

export const metadata: Metadata = {
  title: 'Insights — how land, diligence and outdoor media actually work',
  description:
    'Explainers on Karnataka land regulation, title diligence, transactions and outdoor advertising. Written to be useful on their own rather than as a pitch.',
  alternates: { canonical: '/insights' },
}

export default function InsightsIndex() {
  const [lead, ...rest] = insights
  const categories = Array.from(new Set(insights.map((i) => i.category)))

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Insights"
          title="How this market"
          italic="actually works."
          lede="Explainers on the rules, the records and the habits that decide whether a parcel or a campaign is worth what is being asked for it. Written to be useful whether or not you ever engage us."
          crumbs={[{ label: 'Insights' }]}
          tone="cream"
        />

        <section className="section-tight">
          <div className="wrap">
            <Reveal>
              <div className="chips" style={{ marginBottom: 30 }}>
                {categories.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            </Reveal>

            {lead && (
              <Reveal>
                <Link href={`/insights/${lead.slug}`} className="insightLead">
                  <div>
                    <span className="insightCard__kicker">{lead.category}</span>
                    <h2 className="h1">{lead.title}</h2>
                    <p className="lede">{lead.excerpt}</p>
                    <span className="insightCard__go">
                      Read · {lead.read_minutes} min <Icon name="arrow" size={14} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            )}

            <div className="insightGrid" style={{ marginTop: 28 }}>
              {rest.map((a, i) => (
                <Reveal key={a.slug} delay={i * 60}>
                  <Link href={`/insights/${a.slug}`} className="insightCard">
                    <span className="insightCard__kicker">{a.category}</span>
                    <h3>{a.title}</h3>
                    <p>{a.excerpt}</p>
                    <span className="insightCard__go">
                      Read · {a.read_minutes} min <Icon name="arrow" size={13} />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow eyebrow-light">One next step</span>
              <h2 className="display closing__title">
                Have a parcel or a project <em>in front of you?</em>
              </h2>
              <p className="closing__body">
                Reading about it is the cheap part. If you want the specific answer for your own site, that is
                the conversation to have.
              </p>
              <div className="closing__actions">
                <Link href="/contact" className="btn btn-gold btn-lg">
                  Tell us what you need <Icon name="arrow" size={15} />
                </Link>
                <Link href="/property-consultancy" className="btn btn-outline-light btn-lg">
                  Property Consultancy <Icon name="arrow" size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
