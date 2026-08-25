import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import HeroVideo from '@/components/site/HeroVideo'
import Carousel from '@/components/site/Carousel'
import PracticeThread from '@/components/site/PracticeThread'
import { practices } from '@/lib/content/services'
import { billboards } from '@/lib/content/billboards'
import { designs } from '@/lib/content/designs'
import { getProperties } from '@/lib/db'
import { getAllContent } from '@/lib/cms'
import { hero as heroDefault } from '@/lib/content/home'

export const revalidate = 300

const inr = (cr: number) => `₹${cr} Cr`

type Copy = Record<string, any>

export default async function Home() {
  const [{ data: properties }, content] = await Promise.all([getProperties(), getAllContent()])
  const featured = properties.slice(0, 6)

  /* Edited copy layered over the compiled defaults — see lib/cms.ts.
     Every one of these resolves even with no database attached. */
  const hero = content['home.hero'] as Copy
  const media = content['home.heroMedia'] as Copy
  const practicesIntro = content['home.whatWeDo'] as Copy
  const constructionTeaser = content['home.construction'] as Copy
  const closingCta = content['home.closing'] as Copy

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
            <HeroVideo className="homeHero__video" src={media.video} poster={media.poster} />
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
                <Link href={heroDefault.secondary.href} className="btn btn-gold btn-lg">
                  {heroDefault.secondary.label}
                  <Icon name="arrow" size={15} />
                </Link>
                <Link href={heroDefault.tertiary.href} className="btn btn-outline-light btn-lg">
                  {heroDefault.tertiary.label}
                  <Icon name="arrow" size={15} />
                </Link>
              </div>
            </Reveal>
          </div>

          <a href="#practices" className="homeHero__scroll" aria-label="Scroll to what we do">
            <span />
          </a>
        </section>

        {/* ── What we do — the thread ── */}
        <section className="section threadSection" id="practices">
          <div className="wrap">
            <Reveal variant="mask">
              <span className="secTag">{practicesIntro.eyebrow}</span>
            </Reveal>
            <Reveal variant="mask" delay={80}>
              <h2 className="display threadSection__title">
                {practicesIntro.title.before} <em>{practicesIntro.title.italic}</em>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="lede threadSection__lede">{practicesIntro.body}</p>
            </Reveal>

            <PracticeThread practices={practices} />
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

        {/* ── Construction & development ── */}
        <section className="section-tight buildSection" id="build">
          <div className="wrap">
            <div className="buildSection__head">
              <Reveal variant="mask">
                <span className="secTag">{constructionTeaser.eyebrow}</span>
              </Reveal>
              <Reveal variant="mask" delay={70}>
                <h2 className="h1">
                  {constructionTeaser.title.before} <em>{constructionTeaser.title.italic}</em>
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="lede">{constructionTeaser.body}</p>
              </Reveal>
              <Reveal delay={200}>
                <Link href="/property-consultancy#design-gallery" className="btn btn-outline">
                  See the build practice <Icon name="arrow" size={14} />
                </Link>
              </Reveal>
            </div>

            <Carousel label="Design and build renders">
              {designs.slice(0, 8).map((d) => (
                <figure key={d.id} className="buildCard">
                  <div className="buildCard__photo">
                    <img src={d.image} alt={d.title} loading="lazy" width={1400} height={875} />
                  </div>
                  <figcaption>{d.title}</figcaption>
                </figure>
              ))}
            </Carousel>
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
                <Link href="/contact" className="btn btn-gold btn-lg">
                  Tell us what you need <Icon name="arrow" size={15} />
                </Link>
                <a href={`tel:${(content['brand.identity'] as Copy).phoneRaw}`} className="btn btn-outline-light btn-lg">
                  <Icon name="phone" size={15} /> Call an advisor
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
