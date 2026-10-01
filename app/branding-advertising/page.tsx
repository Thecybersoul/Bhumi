import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import BigHero from '@/components/site/BigHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { brandingPractice } from '@/lib/content/services'
import { capabilities, portfolioIntro, portfolioStats, process, processIntro, projects, scopeMatrix, type Shot } from '@/lib/content/brandingPortfolio'
import { billboards, billboardIntro, billboardSummary } from '@/lib/content/billboards'
import { wa, brand } from '@/lib/content/brand'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Branding & Outdoor Advertising: experience centres, site arrivals and approaches',
  description:
    'Real estate project branding delivered for Prestige Group: experience centres and interiors, entrance arches, LED screens, road medians, pole flags and hoardings across three projects. Plus outdoor media bought on sightline and traffic direction.',
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

function Photo({ shot, className }: { shot: Shot; className?: string }) {
  return (
    <figure className={`bpPhoto ${className ?? ''}`}>
      <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading="lazy" decoding="async" />
      {shot.label ? <figcaption>{shot.label}</figcaption> : null}
    </figure>
  )
}

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
              <li>
                <a href="#work">Selected work</a>
              </li>
              <li>
                <a href="#project-branding">What we deliver</a>
              </li>
              <li>
                <a href="#process">How we work</a>
              </li>
              <li>
                <a href="#projects">The projects</a>
              </li>
              <li>
                <a href="#outdoor-advertising">Outdoor advertising</a>
              </li>
              <li>
                <a href="#inventory">Bookable sites</a>
              </li>
              <li>
                <a href="#principles">How outdoor is judged</a>
              </li>
            </ul>
          </div>
        </nav>

        {/* ── Selected work: Prestige Group (the portfolio deck) ── */}
        <section className="section bpIntro" id="work">
          <div className="wrap">
            <div className="bpIntro__grid">
              <Reveal>
                <div className="secHead">
                  <span className="secTag">{portfolioIntro.eyebrow}</span>
                  <h2 className="h1">
                    {portfolioIntro.title.before} <em>{portfolioIntro.title.italic}</em>
                  </h2>
                  <p className="lede">{portfolioIntro.body}</p>
                </div>
                <dl className="bpStats">
                  {portfolioStats.map((st) => (
                    <div key={st.label}>
                      <dt>{st.label}</dt>
                      <dd>
                        <strong>{st.value}</strong>
                        <span>{st.note}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
              <Reveal delay={90}>
                <Photo shot={portfolioIntro.image} className="bpIntro__image" />
              </Reveal>
            </div>
          </div>
          <Reveal>
            <Photo shot={portfolioIntro.banner} className="bpBanner" />
          </Reveal>
        </section>

        {/* ── What we deliver: the three capability areas ── */}
        <section className="section bpCaps" id="project-branding">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">Capabilities</span>
                <h2 className="h1">
                  What we <em>deliver.</em>
                </h2>
                <p className="lede">{p.services[0].summary}</p>
              </div>
            </Reveal>
            <div className="bpCaps__grid">
              {capabilities.map((c, i) => (
                <Reveal key={c.number} delay={i * 70}>
                  <article className="bpCap">
                    <Photo shot={c.image} />
                    <div className="bpCap__body">
                      <span className="bpCap__num">{c.number}</span>
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How we work ── */}
        <section className="section bpProcess" id="process">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">How we work</span>
                <h2 className="h1">
                  One team, <em>brief to upkeep.</em>
                </h2>
              </div>
            </Reveal>
            <ol className="bpSteps" aria-label={processIntro}>
              {process.map((st, i) => (
                <Reveal key={st.number} delay={i * 60} as="li">
                  <span className="bpSteps__num">{st.number}</span>
                  <h3>{st.title}</h3>
                  <p>{st.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── The three projects ── */}
        <div id="projects">
          {projects.map((pr, pi) => (
            <section key={pr.number} className={`section bpProject ${pi % 2 === 1 ? 'is-alt' : ''}`} id={`project-${pr.number}`}>
              <div className="wrap">
                <Reveal>
                  <header className="bpProject__head">
                    <span className="bpProject__num">{pr.number}</span>
                    <div>
                      <span className="secTag">
                        Project {pr.number}
                        {pr.status ? ` · ${pr.status}` : ''}
                      </span>
                      <h2 className="h1">{pr.name}</h2>
                      <p className="lede">{pr.summary}</p>
                    </div>
                    <span className="bpProject__count">
                      <strong>{String(pr.scopes.length).padStart(2, '0')}</strong> scope areas
                    </span>
                  </header>
                </Reveal>
                {pr.cover ? (
                  <Reveal>
                    <Photo shot={pr.cover} className="bpProject__cover" />
                  </Reveal>
                ) : null}
                <div className="bpScopes">
                  {pr.scopes.map((sc, si) => (
                    <Reveal key={sc.title} delay={(si % 3) * 60}>
                      <article className={`bpScope ${sc.shots.length ? '' : 'is-text'} ${sc.shots.length > 1 ? 'is-pair' : ''}`}>
                        {sc.shots.length ? (
                          <div className="bpScope__shots">
                            {sc.shots.map((sh) => (
                              <Photo key={sh.src} shot={sh} />
                            ))}
                          </div>
                        ) : null}
                        <div className="bpScope__body">
                          <span className="bpScope__idx">
                            {pr.name.replace(/ @ .*/, '')} · {String(si + 1).padStart(2, '0')}
                          </span>
                          <h3>{sc.title}</h3>
                          <p>{sc.body}</p>
                          <dl>
                            <div>
                              <dt>Placement</dt>
                              <dd>{sc.placement}</dd>
                            </div>
                            <div>
                              <dt>Format</dt>
                              <dd>{sc.format}</dd>
                            </div>
                          </dl>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* ── Scope across projects ── */}
        <section className="section bpMatrixSection" id="scope">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">Scope across projects</span>
                <h2 className="h1">
                  What was <em>delivered.</em>
                </h2>
              </div>
              <div className="bpMatrix" role="region" aria-label="Scope delivered by project" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Scope</th>
                      {scopeMatrix.projects.map((n) => (
                        <th scope="col" key={n}>
                          {n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scopeMatrix.rows.map((r) => (
                      <tr key={r.scope}>
                        <th scope="row">{r.scope}</th>
                        {r.on.map((on, i) => (
                          <td key={i}>{on ? <span className="bpMatrix__dot" aria-label="Delivered" /> : <span className="sr-only">Not in scope</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Outdoor advertising (the media-buying service) ── */}
        {p.services.filter((s) => s.slug === 'outdoor-advertising').map((s, i) => (
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
