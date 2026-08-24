import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import BigHero from '@/components/site/BigHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import Carousel from '@/components/site/Carousel'
import { propertyPractice } from '@/lib/content/services'
import { verificationStages } from '@/lib/content/verification'
import { insights } from '@/lib/content/insights'
import { getProperties } from '@/lib/db'
import { wa } from '@/lib/content/brand'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Property Consultancy — land sourcing, verification and development',
  description:
    'Sourcing the parcel worth buying, proving the title holds up in law, and building what goes on it. Land sourcing, verification and legal, and construction and development across Bengaluru.',
  alternates: { canonical: '/property-consultancy' },
}

const inr = (cr: number) => `₹${cr} Cr`

export default async function PropertyConsultancyPage() {
  const p = propertyPractice
  const { data: properties } = await getProperties()
  const listings = properties.slice(0, 6)

  const sourcing = p.services.find((s) => s.slug === 'land-sourcing')!
  const verification = p.services.find((s) => s.slug === 'verification-legal')!
  const development = p.services.find((s) => s.slug === 'construction-development')!

  const relevant = insights.filter((i) => i.category !== 'Outdoor Advertising').slice(0, 3)

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
            { label: 'Browse listings', href: '#marketplace', variant: 'gold' },
            { label: 'Talk to an advisor', href: '/contact', variant: 'outline' },
          ]}
        />

        {/* ══ Vertical one: the land itself ══
            Marketplace and sourcing are the same conversation — what
            is available, and what to do when it is not. They lead the
            page for that reason. */}
        <section className="section marketLead" id="marketplace">
          <div className="wrap">
            <Reveal>
              <div className="secHead secHead--row">
                <div>
                  <span className="secTag">Marketplace</span>
                  <h2 className="h1">
                    Land and property, <em>currently on the desk.</em>
                  </h2>
                  <p className="lede">
                    Every listing states its verification position and the number that decides its asset
                    class. If nothing here fits, sourcing starts from a written brief instead.
                  </p>
                </div>
                <Link href="/marketplace" className="btn btn-gold btn-lg">
                  Open the marketplace <Icon name="arrow" size={15} />
                </Link>
              </div>
            </Reveal>

            {listings.length > 0 ? (
              <Carousel label="Property listings">
                {listings.map((l) => (
                  <Link key={l.code} href="/marketplace" className="railCard">
                    <div className="railCard__photo">
                      <img src={l.img_url} alt={l.title} loading="lazy" width={800} height={520} />
                      <span className="railCard__type">{l.location}</span>
                    </div>
                    <div className="railCard__body">
                      <h3>{l.title}</h3>
                      <dl className="railCard__facts">
                        {l.extent_acres > 0 && (
                          <div>
                            <dt>Extent</dt>
                            <dd>{l.extent_acres} acres</dd>
                          </div>
                        )}
                        {l.price_per_acre_cr > 0 && (
                          <div>
                            <dt>Guide</dt>
                            <dd>{inr(l.price_per_acre_cr)}/acre</dd>
                          </div>
                        )}
                        <div>
                          <dt>Use</dt>
                          <dd>{l.land_use}</dd>
                        </div>
                      </dl>
                    </div>
                  </Link>
                ))}
              </Carousel>
            ) : (
              <p className="lede">Inventory is being onboarded. Tell us what you are looking for meanwhile.</p>
            )}
          </div>
        </section>

        {/* ── Land sourcing — same vertical as the marketplace ── */}
        <section className="serviceBlock is-alt" id="land-sourcing">
          <div className="wrap">
            <div className="serviceBlock__grid">
              <Reveal>
                <div className="serviceBlock__lead">
                  <span className="serviceBlock__num">{sourcing.number}</span>
                  <div className="serviceBlock__icon">
                    <Icon name={sourcing.icon} size={30} />
                  </div>
                  <h2 className="h1">{sourcing.name}</h2>
                  <p className="serviceBlock__short">{sourcing.short}</p>
                  <p className="lede">{sourcing.summary}</p>
                </div>
              </Reveal>

              <Reveal delay={90}>
                <div className="serviceBlock__deliver">
                  <h3>What you get</h3>
                  <ul>
                    {sourcing.deliverables.map((d) => (
                      <li key={d}>
                        <Icon name="check" size={15} />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={wa.sourcing}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-block"
                  >
                    <Icon name="whatsapp" size={14} /> Send a sourcing brief
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ Vertical two: proving it ══
            The protocol and the buyer checklist live on their own
            page — this is the summary and the door to it. */}
        <section className="section verifLead" id="verification-legal">
          <div className="wrap">
            <div className="verifLead__grid">
              <Reveal>
                <div>
                  <span className="secTag">{verification.number} · {verification.name}</span>
                  <h2 className="h1">
                    Four stages, each one <em>answering a question.</em>
                  </h2>
                  <p className="lede">{verification.summary}</p>
                  <div className="verifLead__actions">
                    <Link
                      href="/property-consultancy/verification-legal"
                      className="btn btn-gold btn-lg"
                    >
                      How verification works <Icon name="arrow" size={15} />
                    </Link>
                    <Link
                      href="/property-consultancy/verification-legal#checklist"
                      className="btn btn-outline btn-lg"
                    >
                      Buyer checklist
                    </Link>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <ol className="stageMini">
                  {verificationStages.map((s) => (
                    <li key={s.key}>
                      <span className="stageMini__num">{s.number}</span>
                      <span className="stageMini__body">
                        <strong>{s.title}</strong>
                        <small>{s.question}</small>
                      </span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ Vertical three: building it ══ */}
        <section className="serviceBlock is-alt" id="construction-development">
          <div className="wrap">
            <div className="serviceBlock__grid">
              <Reveal>
                <div className="serviceBlock__lead">
                  <span className="serviceBlock__num">{development.number}</span>
                  <div className="serviceBlock__icon">
                    <Icon name={development.icon} size={30} />
                  </div>
                  <h2 className="h1">{development.name}</h2>
                  <p className="serviceBlock__short">{development.short}</p>
                  <p className="lede">{development.summary}</p>

                  <div className="serviceBlock__answers">
                    <h3>Questions this answers</h3>
                    <ul>
                      {development.answers.map((a) => (
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
                    {development.deliverables.map((d) => (
                      <li key={d}>
                        <Icon name="check" size={15} />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={wa.development}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-block"
                  >
                    <Icon name="whatsapp" size={14} /> Discuss a project
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Insights ── */}
        <section className="section-tight" id="insights">
          <div className="wrap">
            <Reveal>
              <div className="secHead secHead--row">
                <div>
                  <span className="secTag">Insights</span>
                  <h2 className="h1">
                    How this market <em>actually works.</em>
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
                  Tell us what you need <Icon name="arrow" size={15} />
                </Link>
                <a
                  href={wa.verification}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-light btn-lg"
                >
                  <Icon name="whatsapp" size={15} /> Ask about verification
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
