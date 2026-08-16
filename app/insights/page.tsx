import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import { insights, insightCategories } from '@/lib/content/insights'

export const metadata: Metadata = {
  title: 'Insights — regulation explainers, corridor notes and market data',
  description:
    'Karnataka land conversion rules, why we never accept a seller\'s encumbrance certificate, area share vs revenue share, what a K-RERA number proves, Grade A warehouse specifications, and the real cost of registering property.',
  alternates: { canonical: '/insights' },
}

export default function InsightsPage() {
  const [lead, ...rest] = insights

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Insights"
          title="The reference material we wanted"
          italic="and could not find."
          lede="Written to be useful whether or not you ever engage us. Each piece answers a question people are actually searching for, and ends in a specific next step rather than a newsletter signup."
          crumbs={[{ label: 'Insights' }]}
        />

        <section className="section">
          <div className="wrap">
            {/* Lead article */}
            <Reveal>
              <Link href={`/insights/${lead.slug}`} className="card card-hover" style={{ display: 'block', padding: 'clamp(28px, 4vw, 48px)', marginBottom: 32 }}>
                <div className="listCard__meta" style={{ marginBottom: 14 }}>
                  <span className="badge badge-gold">{lead.category}</span>
                  <span>
                    {new Date(lead.published).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>{lead.read_minutes} min read</span>
                </div>
                <h2 className="h1" style={{ maxWidth: '22ch' }}>
                  {lead.title}
                </h2>
                <p className="lede">{lead.excerpt}</p>
                <span className="link-arrow" style={{ marginTop: 18, display: 'inline-flex' }}>
                  Read the explainer →
                </span>
              </Link>
            </Reveal>

            <div className="row-wrap" style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Topics:</span>
              {insightCategories.map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
            </div>

            <div className="grid g3">
              {rest.map((n, i) => (
                <Reveal key={n.slug} delay={i * 50}>
                  <Link href={`/insights/${n.slug}`} className="listCard">
                    <div className="listCard__meta">
                      <span className="badge badge-gold">{n.category}</span>
                      <span>{n.read_minutes} min read</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.excerpt}</p>
                    <div className="listCard__foot">
                      <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>
                        {new Date(n.published).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="ctaBand">
          <div className="wrap ctaBand__inner">
            <div>
              <span className="eyebrow eyebrow-light">No dead ends</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                Reading is <em>not</em> diligence.
              </h2>
              <p>
                Everything here is general. Your parcel is specific. A free preliminary review tells you which
                of these actually applies to what you own.
              </p>
            </div>
            <div className="ctaBand__actions">
              <Link href="/verification#review" className="btn btn-gold btn-lg">
                Get a free verification review
              </Link>
              <Link href="/checklist" className="btn btn-outline-light btn-lg">
                Download the checklist
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
