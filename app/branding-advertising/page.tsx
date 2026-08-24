import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import BigHero from '@/components/site/BigHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { brandingPractice } from '@/lib/content/services'
import { billboards, billboardIntro, billboardSummary } from '@/lib/content/billboards'
import { wa, brand } from '@/lib/content/brand'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Branding & Outdoor Advertising — project identity and media that earns the spend',
  description:
    'Real estate project branding and outdoor advertising: naming and identity, boundary walls, entrance pylons and site hoarding, then billboards, highmasts and transit media bought on sightline and traffic direction.',
  alternates: { canonical: '/branding-advertising' },
}

/* How outdoor is actually judged. Generic craft principles, not a
   claim about campaigns we have run. */
const outdoorPrinciples = [
  {
    title: 'Direction before rate',
    body: 'A site is bought on which way the traffic is moving. A hoarding facing outbound evening traffic reaches a different person from the same structure facing inbound morning traffic, at the same price.',
  },
  {
    title: 'Dwell time is the real currency',
    body: 'A signal-side site with ninety seconds of stationary traffic outperforms a higher-footfall site people pass at speed. Impressions counted without dwell are a vanity number.',
  },
  {
    title: 'Six words, read at speed',
    body: 'Outdoor is read in under three seconds from a moving vehicle. Copy that works on a brochure page almost never survives the transfer without being cut down hard.',
  },
  {
    title: 'Format changes the design',
    body: 'A highmast is seen from distance and below; a wall wrap is seen close and flat. Shrinking one artwork to fit every format is the most common and most expensive shortcut in the category.',
  },
  {
    title: 'Proof of display, dated',
    body: 'A booking is not a guarantee that the site ran. Mounting should be verified with dated, geo-tagged photographs — the same standard any media buyer should ask of anyone.',
  },
  {
    title: 'Say what is measured',
    body: 'Outdoor reach is modelled, not counted. Reporting should separate what was verified from what was estimated, and label the difference rather than blurring it.',
  },
]

export default function BrandingPage() {
  const p = brandingPractice

  return (
    <>
      <SiteHeader variant="transparent" />

      <main id="main">
        <BigHero
          eyebrow={p.eyebrow}
          title={p.title.before}
          italic={p.title.italic}
          lede={p.lede}
          mobileLede={p.mobileLede}
          actions={[
            { label: 'Start a project', href: '/contact', variant: 'gold' },
            {
              label: 'Plan a campaign',
              href: wa.outdoorAdvertising,
              variant: 'outline',
              external: true,
              icon: 'whatsapp',
            },
          ]}
        />

        <nav className="sectionNav" aria-label="On this page">
          <div className="wrap">
            <ul>
              {p.services.map((s) => (
                <li key={s.slug}>
                  <a href={`#${s.slug}`}>{s.name}</a>
                </li>
              ))}
              <li>
                <a href="#inventory">Bookable sites</a>
              </li>
              <li>
                <a href="#principles">How outdoor is judged</a>
              </li>
            </ul>
          </div>
        </nav>

        {/* ── The two services ── */}
        {p.services.map((s, i) => (
          <section
            key={s.slug}
            id={s.slug}
            className={`serviceBlock ${i % 2 === 1 ? 'is-alt' : ''}`}
          >
            <div className="wrap">
              <div className="serviceBlock__grid">
                <Reveal>
                  <div className="serviceBlock__lead">
                    <span className="serviceBlock__num">{s.number}</span>
                    <div className="serviceBlock__icon">
                      <Icon name={s.icon} size={30} />
                    </div>
                    <h2 className="h1">{s.name}</h2>
                    <p className="serviceBlock__short">{s.short}</p>
                    <p className="lede">{s.summary}</p>

                    <div className="serviceBlock__answers">
                      <h3>Questions this answers</h3>
                      <ul>
                        {s.answers.map((a) => (
                          <li key={a}>
                            <Icon name="arrow" size={13} />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={90}>
                  <div className="serviceBlock__deliver">
                    <h3>What you get</h3>
                    <ul>
                      {s.deliverables.map((d) => (
                        <li key={d}>
                          <Icon name="check" size={15} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/contact" className="btn btn-outline btn-block">
                      Discuss {s.name.toLowerCase()} <Icon name="arrow" size={14} />
                    </Link>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        ))}

        {/* ── Bookable outdoor inventory ──
            Partner-operated panels, stated as such. */}
        <section className="section boardSection" id="inventory">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">{billboardIntro.eyebrow}</span>
                <h2 className="h1">
                  {billboardIntro.title.before} <em>{billboardIntro.title.italic}</em>
                </h2>
                <p className="lede">{billboardIntro.body}</p>
              </div>

              <div className="boardSummary">
                <span>{billboardSummary.total} sites</span>
                {billboardSummary.zones.map((z) => (
                  <span key={z}>{z} Bengaluru</span>
                ))}
                <span>Up to {billboardSummary.largest.area}</span>
              </div>
            </Reveal>

            <div className="boardGrid">
              {billboards.map((b, i) => (
                <Reveal key={b.id} delay={i * 55}>
                  <article className="boardCard">
                    <div className="boardCard__photo">
                      <img
                        src={b.image}
                        alt={
                          b.imageIsMap
                            ? `Location map for ${b.name}`
                            : `Outdoor panel at ${b.name}`
                        }
                        loading="lazy"
                        width={1200}
                        height={675}
                      />
                      {b.imageIsMap && <span className="boardCard__mapTag">Location map</span>}
                    </div>
                    <div className="boardCard__head">
                      <span className="boardCard__num">{b.number}</span>
                      <div className="boardCard__title">
                        <h3>{b.name}</h3>
                        <span className="boardCard__zone">
                          {b.zone} Bengaluru
                          {b.location ? ` · ${b.location}` : ''}
                        </span>
                      </div>
                      <div className="boardCard__size">
                        <strong>{b.size}</strong>
                        <small>{b.area}</small>
                      </div>
                    </div>

                    <dl className="boardCard__flow">
                      <div>
                        <Icon name="arrow" size={13} />
                        <div>
                          <dt>Traffic from</dt>
                          <dd>{b.trafficFrom.join(' · ')}</dd>
                        </div>
                      </div>
                      <div>
                        <Icon name="pin" size={13} />
                        <div>
                          <dt>Heading towards</dt>
                          <dd>{b.goingTowards.join(' · ')}</dd>
                        </div>
                      </div>
                    </dl>

                    <div className="boardCard__foot">
                      <span className="boardCard__coords">{b.coordinates}</span>
                      {b.availableFrom && <span className="boardCard__soon">{b.availableFrom}</span>}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <p className="boardNote">
                {billboardIntro.suited} {billboardIntro.note}
              </p>
              <div className="boardCta">
                <a
                  href={wa.outdoorAdvertising}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold btn-lg"
                >
                  <Icon name="whatsapp" size={16} /> Check availability and rates
                </a>
                <Link href="/contact?intent=outdoor-advertising" className="btn btn-outline btn-lg">
                  Plan a campaign <Icon name="arrow" size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Craft principles ── */}
        <section className="section principlesSection" id="principles">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">The craft</span>
                <h2 className="h1">
                  How an outdoor site is <em>actually judged.</em>
                </h2>
                <p className="lede">
                  These are the rules of the category, not claims about our own campaigns. If a media plan
                  you are shown ignores them, it is worth asking why.
                </p>
              </div>
            </Reveal>

            <div className="principleGrid">
              {outdoorPrinciples.map((pr, i) => (
                <Reveal key={pr.title} delay={i * 60}>
                  <div className="principleCard">
                    <span className="principleCard__idx">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{pr.title}</h3>
                    <p>{pr.body}</p>
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
              <span className="eyebrow eyebrow-light">Who this is for</span>
              <h2 className="display closing__title">
                If any of these is <em>you.</em>
              </h2>
              <ul className="closing__audience">
                {p.audience.map((a) => (
                  <li key={a}>
                    <Icon name="check" size={15} />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <div className="closing__actions">
                <Link href="/contact" className="btn btn-gold btn-lg">
                  Start a project <Icon name="arrow" size={15} />
                </Link>
                <a href={`tel:${brand.phoneRaw}`} className="btn btn-outline-light btn-lg">
                  <Icon name="phone" size={15} /> {brand.phone}
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
