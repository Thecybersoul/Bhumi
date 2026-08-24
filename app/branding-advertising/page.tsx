import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import BigHero from '@/components/site/BigHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { brandingPractice } from '@/lib/content/services'
import { insights } from '@/lib/content/insights'
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
  const relevant = insights.filter((i) => i.category === 'Outdoor Advertising').slice(0, 3)

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
                <a href="#principles">How outdoor is judged</a>
              </li>
              <li>
                <a href="#insights">Insights</a>
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

        {/* ── Compliance note ── */}
        <section className="section-tight">
          <div className="wrap-narrow">
            <Reveal>
              <div className="complianceNote">
                <Icon name="shield" size={20} />
                <div>
                  <h3>Advertising a project has rules attached</h3>
                  <p>
                    Any advertisement for a registered real estate project must carry its RERA registration
                    number so a buyer can verify the project before visiting it. We build that into the
                    artwork rather than treating it as a disclaimer to be added later, and our own agent
                    registration is published in the footer of this site.
                  </p>
                  <a
                    href="https://rera.karnataka.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="complianceNote__link"
                  >
                    Verify any K-RERA registration <Icon name="arrow" size={13} />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Insights ── */}
        {relevant.length > 0 && (
          <section className="section-tight" id="insights">
            <div className="wrap">
              <Reveal>
                <div className="secHead secHead--row">
                  <div>
                    <span className="secTag">Insights</span>
                    <h2 className="h1">
                      Notes on <em>being seen.</em>
                    </h2>
                  </div>
                  <Link href="/insights" className="btn btn-outline">
                    All insights <Icon name="arrow" size={14} />
                  </Link>
                </div>
              </Reveal>

              <div className="insightGrid">
                {relevant.map((a, i) => (
                  <Reveal key={a.slug} delay={i * 70}>
                    <Link href={`/insights/${a.slug}`} className="insightCard">
                      <span className="insightCard__kicker">{a.category}</span>
                      <h3>{a.title}</h3>
                      <p>{a.excerpt}</p>
                      <span className="insightCard__go">
                        Read <Icon name="arrow" size={13} />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

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
