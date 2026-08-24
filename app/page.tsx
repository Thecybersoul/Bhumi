import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import HeroVideo from '@/components/site/HeroVideo'
import Carousel from '@/components/site/Carousel'
import { practices } from '@/lib/content/services'
import { billboards } from '@/lib/content/billboards'
import { getProperties } from '@/lib/db'
import { hero, practicesIntro, standard, closingCta } from '@/lib/content/home'

export const revalidate = 300

const inr = (cr: number) => `₹${cr} Cr`

export default async function Home() {
  const { data: properties } = await getProperties()
  const featured = properties.slice(0, 6)

  const [property, branding] = practices

  return (
    <>
      <SiteHeader variant="transparent" />

      <main id="main">
        {/* ── Hero ──
            Sized to the viewport on every device, so the fold lands
            at the bottom of the footage rather than part-way into
            the next section. */}
        <section className="homeHero">
          <div className="homeHero__bg" aria-hidden="true">
            <HeroVideo className="homeHero__video" />
          </div>
          <div className="homeHero__scrim" aria-hidden="true" />
          <div className="wrap">
            <Reveal>
              <span className="eyebrow eyebrow-light is-desktop">{hero.eyebrow}</span>
              <span className="eyebrow eyebrow-light is-mobile">{hero.mobileEyebrow}</span>
              <h1 className="display homeHero__title">
                {hero.title.before} <em>{hero.title.italic}</em>
                {hero.title.after}
              </h1>
              <p className="homeHero__sub is-desktop">{hero.subhead}</p>
              <p className="homeHero__sub is-mobile">{hero.mobileSubhead}</p>

              <div className="homeHero__actions">
                <Link href={hero.secondary.href} className="btn btn-gold btn-lg">
                  {hero.secondary.label}
                  <Icon name="arrow" size={15} />
                </Link>
                <Link href={hero.tertiary.href} className="btn btn-outline-light btn-lg">
                  {hero.tertiary.label}
                  <Icon name="arrow" size={15} />
                </Link>
              </div>
            </Reveal>
          </div>

          <a href="#practices" className="homeHero__scroll" aria-label="Scroll to what we do">
            <span />
          </a>
        </section>

        {/* ── The two practices ── */}
        <section className="section" id="practices">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">{practicesIntro.eyebrow}</span>
                <h2 className="h1">
                  {practicesIntro.title.before} <em>{practicesIntro.title.italic}</em>
                </h2>
                <p className="lede">{practicesIntro.body}</p>
              </div>
            </Reveal>

            <div className="practiceGrid">
              {practices.map((p, i) => (
                <Reveal key={p.slug} delay={i * 90}>
                  <Link href={p.href} className="practiceCard">
                    <span className="practiceCard__eyebrow">{p.eyebrow}</span>
                    <h3 className="practiceCard__name">{p.name}</h3>
                    <p className="practiceCard__pitch">{p.pitch}</p>

                    <ul className="practiceCard__services">
                      {p.services.map((s) => (
                        <li key={s.slug}>
                          <Icon name={s.icon} size={19} />
                          <span>
                            <strong>{s.name}</strong>
                            <small>{s.short}</small>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <span className="practiceCard__go">
                      Explore {p.shortName} <Icon name="arrow" size={15} />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Property Consultancy: listings carousel ── */}
        {featured.length > 0 && (
          <section className="section-tight railSection">
            <div className="wrap">
              <Reveal>
                <div className="secHead secHead--row">
                  <div>
                    <span className="secTag">{property.name}</span>
                    <h2 className="h1">
                      Land and property, <em>currently on the desk.</em>
                    </h2>
                  </div>
                  <Link href="/marketplace" className="btn btn-outline">
                    Open the marketplace <Icon name="arrow" size={14} />
                  </Link>
                </div>
              </Reveal>

              <Carousel label="Property listings">
                {featured.map((p) => (
                  <Link key={p.code} href="/marketplace" className="railCard">
                    <div className="railCard__photo">
                      <img src={p.img_url} alt={p.title} loading="lazy" width={800} height={520} />
                      <span className="railCard__type">{p.location}</span>
                    </div>
                    <div className="railCard__body">
                      <h3>{p.title}</h3>
                      <dl className="railCard__facts">
                        {p.extent_acres > 0 && (
                          <div>
                            <dt>Extent</dt>
                            <dd>{p.extent_acres} acres</dd>
                          </div>
                        )}
                        {p.price_per_acre_cr > 0 && (
                          <div>
                            <dt>Guide</dt>
                            <dd>{inr(p.price_per_acre_cr)}/acre</dd>
                          </div>
                        )}
                        <div>
                          <dt>Use</dt>
                          <dd>{p.land_use}</dd>
                        </div>
                      </dl>
                    </div>
                  </Link>
                ))}
              </Carousel>
            </div>
          </section>
        )}

        {/* ── Branding: billboard carousel ── */}
        <section className="section railSection is-dark">
          <div className="wrap">
            <Reveal>
              <div className="secHead secHead--row">
                <div>
                  <span className="secTag">{branding.name}</span>
                  <h2 className="h1">
                    Screens on the corridors <em>that carry the city.</em>
                  </h2>
                </div>
                <Link href="/branding-advertising#inventory" className="btn btn-outline-light">
                  All sites <Icon name="arrow" size={14} />
                </Link>
              </div>
            </Reveal>

            <Carousel label="Outdoor advertising sites">
              {billboards.map((b) => (
                <Link
                  key={b.id}
                  href="/branding-advertising#inventory"
                  className="railCard is-board"
                >
                  <div className="railCard__photo">
                    <img
                      src={b.image}
                      alt={b.imageIsMap ? `Location map for ${b.name}` : `Panel at ${b.name}`}
                      loading="lazy"
                      width={800}
                      height={520}
                    />
                    <span className="railCard__type">{b.zone} Bengaluru</span>
                  </div>
                  <div className="railCard__body">
                    <h3>{b.name}</h3>
                    <dl className="railCard__facts">
                      <div>
                        <dt>Size</dt>
                        <dd>{b.size}</dd>
                      </div>
                      <div>
                        <dt>Area</dt>
                        <dd>{b.area}</dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              ))}
            </Carousel>
          </div>
        </section>

        {/* ── How we work ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">{standard.eyebrow}</span>
                <h2 className="h1">
                  {standard.title.before} <em>{standard.title.italic}</em>
                </h2>
                <p className="lede">{standard.body}</p>
              </div>
            </Reveal>

            <div className="ruleGrid">
              {standard.rules.map((r, i) => (
                <Reveal key={r.rule} delay={i * 80}>
                  <div className="ruleCard">
                    <Icon name="check" size={18} />
                    <h3>{r.rule}</h3>
                    <p>{r.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing ── */}
        <section className="closing">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow eyebrow-light">{closingCta.eyebrow}</span>
              <h2 className="display closing__title">
                {closingCta.title.before} <em>{closingCta.title.italic}</em>
              </h2>
              <p className="closing__body">{closingCta.body}</p>
              <div className="closing__actions">
                <Link href={closingCta.primary.href} className="btn btn-gold btn-lg">
                  {closingCta.primary.label} <Icon name="arrow" size={15} />
                </Link>
                <a href={closingCta.secondary.href} className="btn btn-outline-light btn-lg">
                  <Icon name="phone" size={15} /> {closingCta.secondary.label}
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
