import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal, { Stagger } from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { propertyPractice } from '@/lib/content/services'
import { designs, designIntro, designCounts } from '@/lib/content/designs'
import { wa } from '@/lib/content/brand'

export const metadata: Metadata = {
  title: 'Construction & Development — approvals, drawings and site supervision',
  description:
    'Taking a parcel to a finished asset: approval pathway, architect and consultant selection, contractor tendering on a like-for-like scope, and stage-gated site supervision. With design and build renders from the team that delivers it.',
  alternates: { canonical: '/property-consultancy/construction-development' },
}

/* How the work is actually sequenced. Generic to any build in this
   market — nothing here claims a project we have delivered. */
const stages = [
  {
    n: '01',
    title: 'Feasibility and approvals',
    body: 'Which authority governs the parcel, what it permits, and the order the approvals have to be taken in. The answer decides the programme more than any other single factor.',
  },
  {
    n: '02',
    title: 'Design and drawings',
    body: 'Architect and consultant selection, then drawings reviewed against the brief and against whatever verification turned up — a setback flagged at diligence has to still be on the drawing when it is submitted.',
  },
  {
    n: '03',
    title: 'Tendering',
    body: 'Contractors bid on a like-for-like scope, so the numbers can actually be compared. A cheaper bid against a thinner scope is not a cheaper build.',
  },
  {
    n: '04',
    title: 'Site supervision',
    body: 'Stage-gated, with dated progress reporting. The question being answered on every visit is whether what is on site matches the drawing and the specification.',
  },
]

export default function ConstructionDevelopmentPage() {
  const service = propertyPractice.services.find((s) => s.slug === 'construction-development')!

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Property Consultancy"
          title="From parcel to"
          italic="finished asset."
          lede={service.summary}
          crumbs={[
            { label: 'Property Consultancy', href: '/property-consultancy' },
            { label: 'Construction & Development' },
          ]}
          tone="navy"
          actions={[
            { label: 'Discuss a build', href: wa.development, variant: 'gold', external: true, icon: 'whatsapp' },
          ]}
        />

        {/* ── How the work runs ── */}
        <section className="section">
          <div className="wrap">
            <Reveal variant="mask">
              <span className="secTag">How the work runs</span>
            </Reveal>
            <Reveal variant="mask" delay={70}>
              <h2 className="h1 buildStages__title">
                Four stages, in the order <em>they actually happen.</em>
              </h2>
            </Reveal>

            <Stagger className="buildStages" step={80}>
              {stages.map((s) => (
                <div key={s.n} className="buildStage">
                  <span className="buildStage__n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="section-tight checklistSection">
          <div className="wrap">
            <div className="buildDeliver">
              <Reveal>
                <div>
                  <span className="secTag">What you get</span>
                  <h2 className="h1">
                    The questions this <em>answers.</em>
                  </h2>
                  <ul className="serviceBlock__answers-list">
                    {service.answers.map((a) => (
                      <li key={a}>
                        <Icon name="arrow" size={13} />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={90}>
                <div className="serviceBlock__deliver">
                  <h3>Deliverables</h3>
                  <ul>
                    {service.deliverables.map((d) => (
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

        {/* ── The full design gallery ── */}
        <section className="section designSection" id="design-gallery">
          <div className="wrap">
            <Reveal>
              <div className="secHead secHead--row">
                <div>
                  <span className="secTag">{designIntro.eyebrow}</span>
                  <h2 className="h1">
                    {designIntro.title.before} <em>{designIntro.title.italic}</em>
                  </h2>
                  <p className="lede">{designIntro.body}</p>
                </div>
                <div className="designSection__counts">
                  <span>{designCounts.exterior} exteriors</span>
                  <span>{designCounts.interior} interiors</span>
                </div>
              </div>
            </Reveal>

            <div className="designGrid">
              {designs.map((d, i) => (
                <Reveal key={d.id} variant="wipe" delay={(i % 3) * 90}>
                  <figure className="designCard">
                    <div className="designCard__photo">
                      <img
                        src={d.image}
                        alt={`${d.title} — ${d.note}`}
                        loading="lazy"
                        width={1400}
                        height={875}
                      />
                      <span className="designCard__kind">{d.kind}</span>
                    </div>
                    <figcaption>
                      <strong>{d.title}</strong>
                      <span>{d.note}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <p className="designSection__note">{designIntro.attribution}</p>
            </Reveal>
          </div>
        </section>

        <section className="closing">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow eyebrow-light">One next step</span>
              <h2 className="display closing__title">
                Tell us what you want <em>built.</em>
              </h2>
              <p className="closing__body">
                A plot with a plan, or a plan that still needs a plot. We will tell you what is realistic
                on programme and cost before anything is quoted.
              </p>
              <div className="closing__actions">
                <a
                  href={wa.development}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold btn-lg"
                >
                  <Icon name="whatsapp" size={15} /> Discuss a build
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
