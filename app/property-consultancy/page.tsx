import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import BigHero from '@/components/site/BigHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { propertyPractice } from '@/lib/content/services'
import {
  verificationStages,
  whyDiscrete,
  totalTurnaround,
  checklist,
} from '@/lib/content/verification'
import { insights } from '@/lib/content/insights'
import { wa } from '@/lib/content/brand'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Property Consultancy — land sourcing, verification and development',
  description:
    'Sourcing the parcel worth buying, proving the title holds up in law, and building what goes on it. Land sourcing, verification and legal, and construction and development for Bengaluru and its growth corridors.',
  alternates: { canonical: '/property-consultancy' },
}

export default function PropertyConsultancyPage() {
  const p = propertyPractice
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
            { label: 'Talk to an advisor', href: '/contact', variant: 'gold' },
            { label: 'Browse the marketplace', href: '/marketplace', variant: 'outline' },
          ]}
        />

        {/* ── Section index ── */}
        <nav className="sectionNav" aria-label="On this page">
          <div className="wrap">
            <ul>
              {p.services.map((s) => (
                <li key={s.slug}>
                  <a href={`#${s.slug}`}>{s.name}</a>
                </li>
              ))}
              <li>
                <a href="#marketplace">Marketplace</a>
              </li>
              <li>
                <a href="#insights">Insights</a>
              </li>
            </ul>
          </div>
        </nav>

        {/* ── The three services ── */}
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

        {/* ── Verification protocol ── */}
        <section className="section verifSection" id="verification">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">The protocol</span>
                <h2 className="h1">
                  Four stages, each one <em>answering a question.</em>
                </h2>
                <p className="lede">{whyDiscrete.body}</p>
                <p className="verifSection__turnaround">
                  <Icon name="check" size={15} />
                  <span>
                    Typical end-to-end: <strong>{totalTurnaround.low}–{totalTurnaround.high} working days</strong>,
                    excluding time waiting on a document only you can supply.
                  </span>
                </p>
              </div>
            </Reveal>

            <div className="stageGrid">
              {verificationStages.map((s, i) => (
                <Reveal key={s.key} delay={i * 70}>
                  <article className="stageCard">
                    <header>
                      <span className="stageCard__num">{s.number}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p className="stageCard__q">{s.question}</p>
                      </div>
                    </header>

                    <p className="stageCard__plain">{s.plain}</p>

                    <h4>What gets checked</h4>
                    <ul className="stageCard__checks">
                      {s.checks.map((c) => (
                        <li key={c}>
                          <Icon name="check" size={13} />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>

                    {s.killers.length > 0 && (
                      <div className="stageCard__killers">
                        <h4>
                          <Icon name="flag" size={13} /> Ends the deal
                        </h4>
                        <ul>
                          {s.killers.map((k) => (
                            <li key={k}>{k}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <footer>
                      <span className="stageCard__out">{s.output}</span>
                      <span className="stageCard__days">
                        {s.typicalDays[0]}–{s.typicalDays[1]} days
                      </span>
                    </footer>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pre-diligence checklist ── */}
        <section className="section-tight checklistSection" id="checklist">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">Before you pay anybody</span>
                <h2 className="h1">
                  Six things you can check <em>yourself.</em>
                </h2>
                <p className="lede">
                  None of this replaces diligence. All of it can be done in an afternoon, and any one of
                  them failing is a reason to stop before money moves.
                </p>
              </div>
            </Reveal>

            <div className="checkGrid">
              {checklist.map((c, i) => (
                <Reveal key={c.id} delay={i * 60}>
                  <div className="checkCard">
                    <h3>{c.ask}</h3>
                    <p className="checkCard__why">{c.why}</p>
                    <div className="checkCard__verdicts">
                      <p className="is-good">
                        <Icon name="check" size={13} />
                        <span>{c.good}</span>
                      </p>
                      <p className="is-bad">
                        <Icon name="flag" size={13} />
                        <span>{c.bad}</span>
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Marketplace ── */}
        <section className="section marketTeaser" id="marketplace">
          <div className="wrap">
            <Reveal>
              <div className="marketTeaser__inner">
                <div>
                  <span className="secTag">Marketplace</span>
                  <h2 className="h1">
                    Listings that state their own <em>findings.</em>
                  </h2>
                  <p className="lede">
                    Every listing carries its verification position and the number that actually decides its
                    asset class. We are onboarding inventory now — parcels appear here once they have been
                    through the protocol above, not before.
                  </p>
                  <Link href="/marketplace" className="btn btn-gold btn-lg">
                    Open the marketplace <Icon name="arrow" size={15} />
                  </Link>
                </div>
                <a href={wa.sourcing} target="_blank" rel="noopener noreferrer" className="marketTeaser__aside">
                  <Icon name="whatsapp" size={22} />
                  <strong>Have a parcel to list?</strong>
                  <span>
                    Send us the survey number and what you know about it. We will tell you what is missing
                    before you commit to anything.
                  </span>
                  <span className="marketTeaser__go">
                    Message us <Icon name="arrow" size={13} />
                  </span>
                </a>
              </div>
            </Reveal>
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

        {/* ── Who it is for + CTA ── */}
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
