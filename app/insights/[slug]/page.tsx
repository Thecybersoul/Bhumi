import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { insights, getInsight } from '@/lib/content/insights'
import { getCorridor } from '@/lib/content/corridors'

export function generateStaticParams() {
  return insights.map((i) => ({ slug: i.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const insight = getInsight(slug)
  if (!insight) return {}
  return {
    title: insight.title,
    description: insight.excerpt.slice(0, 180),
    alternates: { canonical: `/insights/${insight.slug}` },
    openGraph: { type: 'article', publishedTime: insight.published },
  }
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const insight = getInsight(slug)
  if (!insight) notFound()

  const corridor = insight.corridor ? getCorridor(insight.corridor) : null
  const more = insights.filter((i) => i.slug !== slug).slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: insight.title,
    description: insight.excerpt,
    datePublished: insight.published,
    author: { '@type': 'Organization', name: insight.author },
    publisher: { '@type': 'Organization', name: 'Bhumi Estates' },
  }

  return (
    <>
      <SiteHeader />

      <main id="main" className="article">
        <article>
          <header className="article__head">
            <div className="wrap-narrow">
              <nav className="pageHero__crumbs" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span>
                  <span aria-hidden="true">/</span>
                  <Link href="/insights">Insights</Link>
                </span>
              </nav>

              <span className="badge badge-gold">{insight.category}</span>
              <h1 className="h1" style={{ margin: '18px 0 20px' }}>
                {insight.title}
              </h1>
              <p className="lede">{insight.excerpt}</p>

              <div className="article__meta">
                <span>{insight.author}</span>
                <span>
                  {new Date(insight.published).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span>{insight.read_minutes} min read</span>
                {corridor && (
                  <Link href={`/corridors/${corridor.slug}`} className="link-arrow">
                    {corridor.name.split(/[&,]/)[0].trim()} corridor →
                  </Link>
                )}
              </div>
            </div>
          </header>

          <div className="wrap-narrow article__body">
            {insight.body.map((block, i) => (
              <section key={i}>
                {block.heading && <h2 className="h2">{block.heading}</h2>}
                <p>{block.text}</p>
              </section>
            ))}

            <aside className="article__note">
              <Icon name="flag" size={16} />
              <p>
                This is general information, current as of publication, and it is not legal or tax advice.
                Karnataka&rsquo;s land rules change, and how any of it applies turns on your specific parcel
                and documents. Take a position to your own counsel before acting on it.
              </p>
            </aside>
          </div>
        </article>

        {/* Every page ends in a next step (Plan §2) */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <div>
                <span className="eyebrow">Apply it to your parcel</span>
                <h2 className="h1">
                  General is useful. <em>Specific</em> is what you are paying for.
                </h2>
                <p className="body-text">
                  Send a survey number and we will tell you which of the above actually binds on your land,
                  free, in a couple of days.
                </p>

                <div style={{ marginTop: 26 }}>
                  <span className="eyebrow" style={{ marginBottom: 12 }}>
                    Keep reading
                  </span>
                  <div className="stack">
                    {more.map((m) => (
                      <Link key={m.slug} href={`/insights/${m.slug}`} className="advisorCard">
                        <span className="advisorCard__avatar" style={{ fontSize: '.7rem' }}>
                          {m.read_minutes}m
                        </span>
                        <div>
                          <strong style={{ fontSize: '.88rem', lineHeight: 1.4 }}>{m.title}</strong>
                          <small>{m.category}</small>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <LeadForm
                kind="Verification review"
                source={`/insights/${insight.slug}`}
                corridor={insight.corridor}
                heading="Have your parcel checked"
                blurb="Free preliminary read. No obligation and no pitch deck."
                qualifier={{
                  name: 'survey_number',
                  label: 'Survey number and location',
                  placeholder: 'e.g. Sy. 118/4, Sarjapur',
                }}
                whatsappMessage={`Hi Bhumi Estates — I read your piece on "${insight.title}" and have a question about my parcel:`}
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
