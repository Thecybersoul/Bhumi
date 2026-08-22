import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { caseStudies } from '@/lib/content/caseStudies'
import { corridors, corridorDisclaimer } from '@/lib/content/corridors'
import { tools } from '@/lib/content/tools'
import { insights } from '@/lib/content/insights'
import { getPropertyType } from '@/lib/content/propertyTypes'

/* One resource hub instead of four thin index pages (work, corridors,
   tools, insights). Each section shows the shortest useful summary and
   hands off to the detail page, rather than restating it here. */

export const metadata: Metadata = {
  title: 'Resources — work, corridors, tools and insights',
  description:
    'Case studies with project figures, corridor price bands across Bengaluru, decision tools, and written explainers — in one place.',
  alternates: { canonical: '/resources' },
}

const sections = [
  { id: 'work', label: 'Work' },
  { id: 'corridors', label: 'Corridors' },
  { id: 'tools', label: 'Tools' },
  { id: 'insights', label: 'Insights' },
]

/** Cards carry a teaser, not the whole summary — the detail page has that. */
function clamp(text: string, max = 150) {
  if (text.length <= max) return text
  return text.slice(0, text.lastIndexOf(' ', max)).replace(/[,;:.]$/, '') + '…'
}

export default function ResourcesPage() {
  const recentInsights = [...insights].sort((a, b) => b.published.localeCompare(a.published))

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Resources"
          title="The work, and the thinking"
          italic="behind it."
          lede="Projects we have run with the numbers attached, the corridors we operate in, the tools we use to reach a decision early, and what we have written down."
          crumbs={[{ label: 'Resources' }]}
        />

        {/* Jump nav — four destinations, one page */}
        <nav className="resourceNav" aria-label="Sections">
          <div className="wrap resourceNav__inner">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="resourceNav__link">
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Work ── */}
        <section className="section-tight" id="work">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Work</span>
              <h2 className="h1">
                Projects, with the numbers <em>left in.</em>
              </h2>
              <p>Each one names what went wrong, or what we walked away from.</p>
            </div>

            <div className="grid g2">
              {caseStudies.map((c, i) => (
                <Reveal key={c.slug} delay={i * 50}>
                  <Link href={`/portfolio/${c.slug}`} className="listCard">
                    <div className="listCard__meta">
                      <span className="badge badge-navy">{c.corridor.split(/[&,]/)[0].trim()}</span>
                      <span>{getPropertyType(c.property_type)?.shortName ?? c.property_type}</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p>{clamp(c.summary)}</p>
                    <div className="resultsRow" style={{ marginTop: 14 }}>
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

        {/* ── Corridors ── */}
        <section
          className="section-tight"
          id="corridors"
          style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}
        >
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Corridors</span>
              <h2 className="h1">
                What your budget <em>actually reaches.</em>
              </h2>
              <p>Indicative bands across the six corridors we work in. Open a corridor for the full note.</p>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Corridor</th>
                    <th>Zone</th>
                    <th>Indicative band</th>
                    <th>YoY</th>
                    <th>Best suited to</th>
                  </tr>
                </thead>
                <tbody>
                  {corridors.map((c) => (
                    <tr key={c.slug}>
                      <td>
                        <Link href={`/corridors/${c.slug}`} style={{ fontWeight: 600, color: 'var(--navy)' }}>
                          {c.name}
                        </Link>
                      </td>
                      <td>{c.zone}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                        ₹{c.price_low}–{c.price_high} Cr/ac
                      </td>
                      <td>
                        <span className="badge badge-gold">{c.yoy_pct}%</span>
                      </td>
                      <td style={{ fontSize: '.8rem' }}>
                        {c.best_for
                          .map((b) => getPropertyType(b)?.shortName ?? b)
                          .slice(0, 3)
                          .join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 18, lineHeight: 1.7, maxWidth: '90ch' }}>
              {corridorDisclaimer}
            </p>
          </div>
        </section>

        {/* ── Tools ── */}
        <section className="section-tight" id="tools">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Tools</span>
              <h2 className="h1">
                Reach a decision <em>early.</em>
              </h2>
              <p>Illustrative planning ranges, not valuations. Each one takes a couple of minutes.</p>
            </div>

            <div className="grid g2">
              {tools.map((t, i) => (
                <Reveal key={t.slug} delay={i * 40}>
                  <Link href={`/tools/${t.slug}`} className="listCard">
                    <div className="listCard__meta">
                      <span className="badge badge-navy">
                        <Icon name={t.icon} size={13} /> {t.minutes} min
                      </span>
                    </div>
                    <h3>{t.name}</h3>
                    <p>{t.outcome}</p>
                    <div className="listCard__foot">
                      <span className="link-arrow">Open the tool →</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Insights ── */}
        <section
          className="section-tight"
          id="insights"
          style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}
        >
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Insights</span>
              <h2 className="h1">
                Written to be useful <em>on its own.</em>
              </h2>
            </div>

            <div className="grid g2">
              {recentInsights.map((n, i) => (
                <Reveal key={n.slug} delay={i * 40}>
                  <Link href={`/insights/${n.slug}`} className="listCard">
                    <div className="listCard__meta">
                      <span className="badge badge-navy">{n.category}</span>
                      <span>{n.read_minutes} min read</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{clamp(n.excerpt, 130)}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  )
}
