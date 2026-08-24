import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { propertyPractice } from '@/lib/content/services'
import {
  verificationStages,
  whyDiscrete,
  totalTurnaround,
  checklist,
} from '@/lib/content/verification'
import { wa } from '@/lib/content/brand'

export const metadata: Metadata = {
  title: 'Land Verification & Legal — the four-stage protocol',
  description:
    'How a parcel is verified before money moves: four stages, each answering a question a buyer would ask out loud, plus six checks you can run yourself before paying anybody for diligence.',
  alternates: { canonical: '/property-consultancy/verification-legal' },
}

export default function VerificationLegalPage() {
  const service = propertyPractice.services.find((s) => s.slug === 'verification-legal')!

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Property Consultancy"
          title="Proving the title"
          italic="before money moves."
          lede={service.summary}
          crumbs={[
            { label: 'Property Consultancy', href: '/property-consultancy' },
            { label: 'Verification & Legal' },
          ]}
          tone="navy"
          actions={[
            { label: 'Start a review', href: wa.verification, variant: 'gold', external: true, icon: 'whatsapp' },
          ]}
        />

        {/* ── The protocol ── */}
        <section className="section verifSection" id="protocol">
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
                    Typical end-to-end:{' '}
                    <strong>
                      {totalTurnaround.low}–{totalTurnaround.high} working days
                    </strong>
                    , excluding time waiting on a document only you can supply.
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

        {/* ── Buyer checklist ── */}
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

        {/* ── What you get ── */}
        <section className="section">
          <div className="wrap-narrow">
            <Reveal>
              <div className="secHead">
                <span className="secTag">What you receive</span>
                <h2 className="h1">
                  A document, not <em>an opinion over the phone.</em>
                </h2>
              </div>
              <ul className="deliverList">
                {service.deliverables.map((d) => (
                  <li key={d}>
                    <Icon name="check" size={15} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="closing">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow eyebrow-light">One next step</span>
              <h2 className="display closing__title">
                Send us the survey number, <em>and what you hold.</em>
              </h2>
              <p className="closing__body">
                The first read costs nothing. We tell you what is missing from the file and whether the
                parcel is worth full diligence, before anything is quoted.
              </p>
              <div className="closing__actions">
                <a
                  href={wa.verification}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold btn-lg"
                >
                  <Icon name="whatsapp" size={15} /> Start a free review
                </a>
                <Link href="/property-consultancy" className="btn btn-outline-light btn-lg">
                  Back to Property Consultancy <Icon name="arrow" size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
