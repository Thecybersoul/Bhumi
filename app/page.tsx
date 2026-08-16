import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import CorridorMap from '@/components/site/CorridorMap'
import { getTransparency } from '@/lib/db'
import { verificationStages } from '@/lib/content/verification'
import { pillars } from '@/lib/content/pillars'
import { propertyTypes } from '@/lib/content/propertyTypes'
import { caseStudies } from '@/lib/content/caseStudies'
import { insights } from '@/lib/content/insights'
import { tools } from '@/lib/content/tools'
import { wa } from '@/lib/content/brand'
import {
  hero,
  positioning,
  verificationTeaser,
  typesTeaser,
  proofTeaser,
  largeParcelTeaser,
  faq,
  closingCta,
} from '@/lib/content/home'

export const revalidate = 300

export default async function Home() {
  const { data: stats, recent } = await getTransparency()

  const flagPct = Math.round((stats.parcels_flagged / stats.parcels_reviewed) * 100)

  /* The credibility bar is served from the live verification
     record rather than hardcoded, so it can never drift from
     what the transparency dashboard publishes (Plan §3B). */
  const credibility = [
    {
      value: stats.parcels_reviewed.toLocaleString('en-IN'),
      label: 'Parcels put through diligence',
      note: `${stats.acreage_reviewed.toLocaleString('en-IN')} acres reviewed`,
    },
    {
      value: `${flagPct}%`,
      label: 'Carried a disqualifying red flag',
      note: 'We publish this figure. Nobody else does.',
    },
    {
      value: `${stats.median_turnaround_days}`,
      label: 'Median days to a decision',
      note: 'Intake to dated certificate',
    },
    {
      value: '6',
      label: 'Stages, each separately tracked',
      note: 'Never one "under review" status',
    },
  ]

  const featuredTools = tools.filter((t) => t.featured)
  const featuredInsights = insights.slice(0, 3)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <SiteHeader variant="transparent" />

      <main id="main">
        {/* ── Hero: land as the hero, proof as the promise ── */}
        <section className="homeHero">
          <div className="homeHero__bg" aria-hidden="true" />
          <svg className="homeHero__contour" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <path
                key={i}
                d={`M-50 ${140 + i * 52} C 220 ${80 + i * 52}, 420 ${210 + i * 52}, 660 ${150 + i * 52} S 1060 ${60 + i * 52}, 1250 ${130 + i * 52}`}
                fill="none"
                stroke="#C2974A"
                strokeWidth={i % 3 === 0 ? 1.4 : 0.7}
                opacity={i % 3 === 0 ? 0.9 : 0.5}
              />
            ))}
          </svg>

          <div className="wrap">
            <div className="homeHero__grid">
              <div>
                <Reveal>
                  <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
                  <h1 className="display homeHero__title">
                    {hero.title.before} <em>{hero.title.italic}</em>
                    {hero.title.after}
                  </h1>
                  <p className="homeHero__sub">{hero.subhead}</p>
                </Reveal>

                <Reveal delay={90}>
                  <div className="homeHero__actions">
                    <a
                      href={hero.primary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-gold btn-lg"
                    >
                      <Icon name="whatsapp" size={17} />
                      {hero.primary.label}
                    </a>
                    <Link href={hero.secondary.href} className="btn btn-outline-light btn-lg">
                      {hero.secondary.label}
                      <Icon name="arrow" size={15} />
                    </Link>
                    <a href={hero.tertiary.href} className="btn btn-outline-light btn-lg">
                      <Icon name="phone" size={15} />
                      {hero.tertiary.label}
                    </a>
                  </div>
                </Reveal>
              </div>

              {/* The protocol, visible from the first screen */}
              <Reveal delay={160}>
                <aside className="homeHero__aside">
                  <span className="homeHero__asideLabel">
                    <span className="dot-pulse" /> The verification protocol
                  </span>
                  <div className="homeHero__miniStages">
                    {verificationStages.map((s) => (
                      <div key={s.key} className="homeHero__miniStage">
                        <span className="homeHero__miniNum">{s.number}</span>
                        <span>{s.title}</span>
                        <span className="homeHero__miniDays">
                          {s.typicalDays[0]}–{s.typicalDays[1]}d
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="homeHero__asideFoot">
                    <Link href="/verification">Walk through every stage →</Link>
                  </div>
                </aside>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Credibility bar (Plan §3B) ── */}
        <section className="credBar">
          <div className="wrap">
            <div className="credBar__grid">
              {credibility.map((c) => (
                <div key={c.label} className="credBar__item">
                  <span className="credBar__value numeral">{c.value}</span>
                  <span className="credBar__label">{c.label}</span>
                  <span className="credBar__note">{c.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The standard ── */}
        <section className="section">
          <div className="wrap">
            <div className="splitRow">
              <Reveal>
                <div>
                  <span className="eyebrow">{positioning.eyebrow}</span>
                  <h2 className="h1">
                    {positioning.title.before} <em>{positioning.title.italic}</em>
                  </h2>
                  <p className="lede">{positioning.body}</p>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <ul className="ruleList">
                  {positioning.rules.map((r) => (
                    <li key={r.rule}>
                      <span className="ruleList__mark">
                        <Icon name="check" size={17} stroke={2.4} />
                      </span>
                      <div>
                        <strong>{r.rule}</strong>
                        <p>{r.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Verification flagship teaser ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead--split sectionHead">
              <div>
                <span className="eyebrow">{verificationTeaser.eyebrow}</span>
                <h2 className="h1">
                  {verificationTeaser.title.before} <em>{verificationTeaser.title.italic}</em>
                </h2>
                <p>{verificationTeaser.body}</p>
              </div>
              <div className="row-wrap">
                <Link href={verificationTeaser.cta.href} className="btn btn-primary">
                  {verificationTeaser.cta.label}
                </Link>
                <Link href={verificationTeaser.secondary.href} className="btn btn-ghost">
                  {verificationTeaser.secondary.label}
                </Link>
              </div>
            </div>

            <div className="grid g3">
              {verificationStages.map((s, i) => (
                <Reveal key={s.key} delay={i * 60}>
                  <Link href={`/verification#stage-${s.key}`} className="listCard" style={{ height: '100%' }}>
                    <div className="listCard__meta">
                      <span className="stepper__marker" style={{ width: 28, height: 28, fontSize: '.74rem' }}>
                        {s.number}
                      </span>
                      <span>
                        {s.typicalDays[0]}–{s.typicalDays[1]} days
                      </span>
                    </div>
                    <h3>{s.title}</h3>
                    <p>{s.summary}</p>
                  </Link>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="calloutBox" style={{ marginTop: 28 }}>
                <h3>
                  {flagPct}% of parcels that reach us carry a disqualifying finding.
                </h3>
                <p>
                  We publish that number, the stage each failure happened at, and the reasons behind them —
                  updated monthly and never restated downward. It is the single most direct test of whether a
                  diligence claim means anything.{' '}
                  <Link href="/verification#transparency" className="link-arrow">
                    See the transparency dashboard →
                  </Link>
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Six-pillar value chain (Plan §6) ── */}
        <section className="section">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">The six-pillar value chain</span>
              <h2 className="h1">
                Land through to final sale, <em>one accountable party.</em>
              </h2>
              <p>
                Most firms in this market either broker land or build on it. Doing both is what lets us tell a
                parcel&rsquo;s whole story — and what makes us answerable for it at every stage rather than
                only the one that suits us.
              </p>
            </div>

            <div className="pillarGrid">
              {pillars.map((p, i) => (
                <Reveal key={p.slug} delay={i * 50}>
                  <article className="pillarCard">
                    <span className="pillarCard__num">{p.number}</span>
                    <span className="pillarCard__icon">
                      <Icon name={p.icon} size={22} />
                    </span>
                    <h3>{p.name}</h3>
                    <span className="pillarCard__short">{p.short}</span>
                    <p>{p.promise}</p>
                    <div className="pillarCard__foot">
                      <Link href={`/services/${p.slug}`} className="link-arrow">
                        {p.name} →
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Property types (Plan §4) ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead--split sectionHead">
              <div>
                <span className="eyebrow">{typesTeaser.eyebrow}</span>
                <h2 className="h1">
                  {typesTeaser.title.before} <em>{typesTeaser.title.italic}</em>
                </h2>
                <p>{typesTeaser.body}</p>
              </div>
              <Link href="/property-types" className="btn btn-ghost">
                All property types
              </Link>
            </div>

            <div className="typeGrid">
              {propertyTypes.map((t, i) => (
                <Reveal key={t.slug} delay={i * 50}>
                  <Link href={t.href} className="typeCard">
                    <span className="typeCard__icon">
                      <Icon name={t.icon} size={26} />
                    </span>
                    <h3>{t.name}</h3>
                    <span className="typeCard__tag">{t.tagline}</span>
                    <div className="typeCard__critical">
                      <strong>What decides it</strong>
                      {t.criticalDetail.headline}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Corridors (Plan §3E) ── */}
        <section className="section">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Growth corridors</span>
              <h2 className="h1">
                We work six corridors, <em>not the whole city.</em>
              </h2>
              <p>
                A corridor note is only worth reading if it comes from someone who has walked parcels there.
                Each corridor carries its price band, its infrastructure pipeline, and the specific things we
                would check before buying in it.
              </p>
            </div>
            <CorridorMap />
          </div>
        </section>

        {/* ── Large land parcels pillar (Plan §9) ── */}
        <section className="section on-navy" style={{ background: 'var(--navy)' }}>
          <div className="wrap">
            <div className="splitRow">
              <Reveal>
                <div>
                  <span className="eyebrow eyebrow-light">{largeParcelTeaser.eyebrow}</span>
                  <h2 className="h1">
                    {largeParcelTeaser.title.before} <em>{largeParcelTeaser.title.italic}</em>
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,.76)', lineHeight: 1.75, marginTop: 16 }}>
                    {largeParcelTeaser.body}
                  </p>
                  <div style={{ marginTop: 28 }}>
                    <Link href={largeParcelTeaser.cta.href} className="btn btn-gold btn-lg">
                      {largeParcelTeaser.cta.label}
                      <Icon name="arrow" size={15} />
                    </Link>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <ul className="gate__list" style={{ margin: 0 }}>
                  {largeParcelTeaser.points.map((p) => (
                    <li key={p}>
                      <Icon name="check" size={16} stroke={2.4} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Proof (Plan §2) ── */}
        <section className="section">
          <div className="wrap">
            <div className="sectionHead--split sectionHead">
              <div>
                <span className="eyebrow">{proofTeaser.eyebrow}</span>
                <h2 className="h1">
                  {proofTeaser.title.before} <em>{proofTeaser.title.italic}</em>
                </h2>
                <p>{proofTeaser.body}</p>
              </div>
              <Link href="/portfolio" className="btn btn-ghost">
                All case studies
              </Link>
            </div>

            <div className="grid g2">
              {caseStudies.slice(0, 2).map((c, i) => (
                <Reveal key={c.slug} delay={i * 70}>
                  <Link href={`/portfolio/${c.slug}`} className="listCard">
                    <div className="listCard__meta">
                      <span className="badge badge-navy">{c.corridor.split('&')[0].trim()}</span>
                      <span>{c.pillars.length} pillars</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p>{c.summary}</p>
                    <div className="resultsRow" style={{ marginTop: 14 }}>
                      {c.results.slice(0, 3).map((r) => (
                        <div key={r.label}>
                          <span className="numeral">{r.value}</span>
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

        {/* ── Tools (Plan §8) ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead--split sectionHead">
              <div>
                <span className="eyebrow">Decision support</span>
                <h2 className="h1">
                  Reach a decision <em>before</em> you speak to anyone.
                </h2>
                <p>
                  Each tool produces an illustrative answer in a couple of minutes, and tells you honestly
                  what still needs checking at parcel level.
                </p>
              </div>
              <Link href="/tools" className="btn btn-ghost">
                All tools
              </Link>
            </div>

            <div className="grid g3">
              {featuredTools.map((t, i) => (
                <Reveal key={t.slug} delay={i * 60}>
                  <Link href={`/tools/${t.slug}`} className="listCard">
                    <span className="typeCard__icon" style={{ width: 44, height: 44 }}>
                      <Icon name={t.icon} size={21} />
                    </span>
                    <h3>{t.name}</h3>
                    <p>{t.outcome}</p>
                    <div className="listCard__foot">
                      <span className="link-arrow">{t.minutes} min →</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Insights ── */}
        <section className="section">
          <div className="wrap">
            <div className="sectionHead--split sectionHead">
              <div>
                <span className="eyebrow">Insights</span>
                <h2 className="h1">
                  Written to be <em>useful on its own.</em>
                </h2>
                <p>
                  Regulation explainers, corridor notes and market data — the reference material we wanted to
                  hand clients and could not find anywhere.
                </p>
              </div>
              <Link href="/insights" className="btn btn-ghost">
                All insights
              </Link>
            </div>

            <div className="grid g3">
              {featuredInsights.map((n, i) => (
                <Reveal key={n.slug} delay={i * 60}>
                  <Link href={`/insights/${n.slug}`} className="listCard">
                    <div className="listCard__meta">
                      <span className="badge badge-gold">{n.category}</span>
                      <span>{n.read_minutes} min read</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.excerpt}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <div>
                <span className="eyebrow">{faq.eyebrow}</span>
                <h2 className="h1">
                  {faq.title.before} <em>{faq.title.italic}</em>
                </h2>
                <p className="lede">
                  If a question you have is not here, ask it on WhatsApp — the answer comes back from an
                  advisor, not an autoresponder.
                </p>
                <div style={{ marginTop: 24 }}>
                  <a href={wa.general} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                    <Icon name="whatsapp" size={16} /> Ask us directly
                  </a>
                </div>
              </div>

              <div className="faqList">
                {faq.items.map((f) => (
                  <details key={f.q} className="faqItem">
                    <summary>
                      {f.q}
                      <span className="plus" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── One next step ── */}
        <section className="ctaBand">
          <div className="wrap ctaBand__inner">
            <div>
              <span className="eyebrow eyebrow-light">{closingCta.eyebrow}</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                {closingCta.title.before} <em>{closingCta.title.italic}</em>
              </h2>
              <p>{closingCta.body}</p>
            </div>
            <div className="ctaBand__actions">
              <a
                href={closingCta.primary.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold btn-lg"
              >
                <Icon name="whatsapp" size={17} /> {closingCta.primary.label}
              </a>
              <Link href={closingCta.secondary.href} className="btn btn-outline-light btn-lg">
                <Icon name="download" size={16} /> {closingCta.secondary.label}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* recent is derived from the live case record; referenced so
          the dashboard and this bar always share one source. */}
      <span hidden data-in-progress={recent.inProgress} />
    </>
  )
}
