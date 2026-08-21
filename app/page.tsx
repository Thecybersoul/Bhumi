import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { getTransparency } from '@/lib/db'
import { pillars } from '@/lib/content/pillars'
import { propertyTypes } from '@/lib/content/propertyTypes'
import { hero } from '@/lib/content/home'

export const revalidate = 300

export default async function Home() {
  const { data: stats } = await getTransparency()
  const flagPct = Math.round((stats.parcels_flagged / stats.parcels_reviewed) * 100)

  const credibility = [
    { value: stats.parcels_reviewed.toLocaleString('en-IN'), label: 'Parcels verified' },
    { value: `${flagPct}%`, label: 'Carried a red flag' },
    { value: `${stats.median_turnaround_days}d`, label: 'Median turnaround' },
    { value: '6', label: 'Verification stages' },
  ]

  return (
    <>
      <SiteHeader variant="transparent" />

      <main id="main">
        {/* ── Hero ── */}
        <section className="homeHero">
          <div className="homeHero__bg" aria-hidden="true" />
          <div className="wrap">
            <div className="homeHero__grid" style={{ gridTemplateColumns: '1fr' }}>
              <Reveal>
                <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
                <h1 className="display homeHero__title" style={{ maxWidth: '17ch' }}>
                  {hero.title.before} <em>{hero.title.italic}</em>
                  {hero.title.after}
                </h1>
                <p className="homeHero__sub">{hero.subhead}</p>

                <div className="homeHero__actions">
                  <a href={hero.primary.href} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-lg">
                    <Icon name="whatsapp" size={17} />
                    {hero.primary.label}
                  </a>
                  <Link href={hero.secondary.href} className="btn btn-outline-light btn-lg">
                    {hero.secondary.label}
                    <Icon name="arrow" size={15} />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Credibility bar ── */}
        <section className="credBar">
          <div className="wrap">
            <div className="credBar__grid">
              {credibility.map((c) => (
                <div key={c.label} className="credBar__item">
                  <span className="credBar__value numeral">{c.value}</span>
                  <span className="credBar__label">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What we do ── */}
        <section className="section">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">What we do</span>
              <h2 className="h1">Land, verified — start to finish.</h2>
            </div>

            <div className="pillarGrid">
              {pillars.map((p) => (
                <Link key={p.slug} href={`/services/${p.slug}`} className="pillarCard">
                  <span className="pillarCard__icon">
                    <Icon name={p.icon} size={22} />
                  </span>
                  <h3>{p.name}</h3>
                  <span className="pillarCard__short">{p.short}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Property types ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead--split sectionHead">
              <div>
                <span className="eyebrow">Property types</span>
                <h2 className="h1">Every asset class we cover.</h2>
              </div>
              <Link href="/property-types" className="btn btn-ghost">
                See all
              </Link>
            </div>

            <div className="typeGrid">
              {propertyTypes.map((t) => (
                <Link key={t.slug} href={t.href} className="typeCard">
                  <span className="typeCard__icon">
                    <Icon name={t.icon} size={26} />
                  </span>
                  <h3>{t.name}</h3>
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
