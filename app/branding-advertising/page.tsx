import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import BigHero from '@/components/site/BigHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import { brandingPractice } from '@/lib/content/services'
import { architecture, capabilities, capabilitiesIntro, caseStudies, crownJewel, films, glance, hero, led, masts, numbers, teams, why, work, type Shot } from '@/lib/content/brandingWork'
import { billboards, billboardIntro, billboardSummary } from '@/lib/content/billboards'
import { wa, brand } from '@/lib/content/brand'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Branding & Outdoor Advertising: every site, a landmark',
  description:
    'We turn project sites into landmarks that sell, from the first hoarding to a 150-ft mast: 29 projects across Bengaluru, Hyderabad, Chennai and Mysore. Plus outdoor media bought on sightline and traffic direction.',
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

function Photo({ shot, className, natural }: { shot: Shot; className?: string; natural?: boolean }) {
  return (
    <figure className={`bpPhoto ${className ?? ''}`} style={natural ? { aspectRatio: `${shot.w} / ${shot.h}` } : undefined}>
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
                <a href="#glance">At a glance</a>
              </li>
              <li>
                <a href="#capabilities">Capabilities</a>
              </li>
              <li>
                <a href="#work">Selected work</a>
              </li>
              <li>
                <a href="#case-studies">Case studies</a>
              </li>
              <li>
                <a href="#high-masts">High masts</a>
              </li>
              <li>
                <a href="#launch-films">Launch films</a>
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

        {/* ── At a glance ── */}
        <section className="section bwGlance" id="glance">
          <div className="wrap">
            <div className="bwGlance__grid">
              <Reveal>
                <div className="secHead">
                  <span className="secTag">{glance.eyebrow}</span>
                  <h2 className="h1">
                    {glance.title.before} <em>{glance.title.italic}</em>
                  </h2>
                  <p className="lede">{glance.lede}</p>
                </div>
                <ol className="bwPoints">
                  {glance.points.map((pt) => (
                    <li key={pt.n}>
                      <span className="bwPoints__n">{pt.n}</span>
                      <div>
                        <h3>{pt.title}</h3>
                        <p>{pt.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
              <Reveal delay={90}>
                <Photo shot={hero.image} natural className="bwGlance__photo" />
                <p className="bwCaption">{hero.caption}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Our work, in six numbers ── */}
        <section className="bwNumbers" id="numbers">
          <div className="wrap">
            <Reveal>
              <span className="secTag">Our work, in six numbers</span>
            </Reveal>
            <dl className="bwNumbers__grid">
              {numbers.map((n, i) => (
                <Reveal key={n.label} delay={(i % 3) * 60}>
                  <div className="bwNumber">
                    <dd>
                      <strong>{n.value}</strong>
                    </dd>
                    <dt>{n.label}</dt>
                    <p>{n.note}</p>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Capabilities: one team, recce to upkeep ── */}
        <section className="section bwCaps" id="capabilities">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">Capabilities</span>
                <h2 className="h1">
                  One team, <em>recce to upkeep.</em>
                </h2>
                <p className="lede">{capabilitiesIntro}</p>
              </div>
            </Reveal>
            <div className="bwCaps__grid">
              {capabilities.map((c, i) => (
                <Reveal key={c.n} delay={(i % 3) * 70}>
                  <article className="bwCap">
                    <Photo shot={c.image} className="bwCap__photo" />
                    <div className="bwCap__body">
                      <span className="bwCap__n">{c.n}</span>
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <p className="bwTeams">{teams}</p>
          </div>
        </section>

        {/* ── Why Bhumi Estates ── */}
        <section className="section bwWhy" id="why">
          <div className="wrap">
            <div className="bwWhy__grid">
              <Reveal>
                <div className="secHead">
                  <span className="secTag">Why Bhumi Estates</span>
                  <h2 className="h1">
                    {why.title.before} <em>{why.title.italic}</em>
                  </h2>
                  <p className="lede">{why.lede}</p>
                </div>
                <div className="bwWhy__items">
                  {why.items.map((it) => (
                    <div key={it.title} className="bwWhy__item">
                      <h3>{it.title}</h3>
                      <p>{it.body}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={90}>
                <Photo shot={why.image} natural className="bwWhy__photo" />
                <p className="bwCaption">{why.caption}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── The crown jewel ── */}
        <section className="bwCrown" id="crown-jewel">
          <div className="wrap">
            <div className="bwCrown__grid">
              <Reveal>
                <Photo shot={crownJewel.image} natural className="bwCrown__photo" />
              </Reveal>
              <Reveal delay={90}>
                <span className="secTag">High masts · {crownJewel.title}</span>
                <h2 className="h1">{crownJewel.heading}</h2>
                <dl className="bwFacts">
                  {crownJewel.facts.map((f) => (
                    <div key={f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Selected work ── */}
        <section className="section bwWork" id="work">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">Selected work</span>
                <h2 className="h1">
                  Every site, <em>a landmark.</em>
                </h2>
                <p className="lede">Site branding, LED walls, interiors and installations across Bengaluru, Hyderabad and Chennai, photographed on site.</p>
              </div>
            </Reveal>
            <div className="bwWorkList">
              {work.map((w, i) => (
                <Reveal key={w.id}>
                  <article className={`bwProject ${i % 2 ? 'is-flip' : ''}`} id={w.id}>
                    <header className="bwProject__head">
                      <span className="bwProject__n">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <span className="bwProject__place">
                          {w.place}
                          {w.status ? ` · ${w.status}` : ''}
                        </span>
                        <h3>{w.name}</h3>
                        <p>{w.line}</p>
                        {w.facts ? (
                          <dl className="bwFacts bwFacts--tight">
                            {w.facts.map((f) => (
                              <div key={f.label}>
                                <dt>{f.label}</dt>
                                <dd>{f.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                      </div>
                    </header>
                    <div className={`bwGallery bwGallery--${Math.min(w.shots.length, 4)}`}>
                      {w.shots.map((s, si) => (
                        <Photo key={s.src} shot={s} natural={w.shots.length === 1} className={si === 0 ? 'is-lead' : ''} />
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Case studies ── */}
        <section className="section bwCases" id="case-studies">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">Case studies</span>
                <h2 className="h1">
                  Brief, challenge, <em>result.</em>
                </h2>
              </div>
            </Reveal>
            {caseStudies.map((cs) => (
              <Reveal key={cs.id}>
                <article className="bwCase" id={cs.id}>
                  <header>
                    <span className="bwProject__place">{cs.title}</span>
                    <h3>{cs.heading}</h3>
                  </header>
                  <div className="bwCase__cols">
                    {cs.sections.map((s) => (
                      <div key={s.label}>
                        <h4>{s.label}</h4>
                        <p>{s.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className={`bwGallery bwGallery--${Math.min(cs.shots.length, 4)}`}>
                    {cs.shots.map((s, si) => (
                      <Photo key={s.src} shot={s} className={si === 0 ? 'is-lead' : ''} />
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── High masts + LED network ── */}
        <section className="section bwMasts" id="high-masts">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">{masts.title}</span>
                <h2 className="h1">{masts.heading}</h2>
              </div>
              <div className="bpMatrix" role="region" aria-label="High masts" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Height</th>
                      <th scope="col">Project</th>
                      <th scope="col">Location</th>
                      <th scope="col">Status</th>
                      <th scope="col">Also</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masts.rows.map((r) => (
                      <tr key={r.name}>
                        <th scope="row">{r.height}</th>
                        <td>{r.name}</td>
                        <td>{r.place}</td>
                        <td>
                          <span className={`bwStatus is-${r.status.toLowerCase()}`}>{r.status}</span>
                        </td>
                        <td>{r.extra}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="bwCaption">{masts.note}</p>
            </Reveal>
          </div>
        </section>

        <section className="bwLed" id="led-network">
          <div className="wrap">
            <Reveal>
              <span className="secTag">Our LED network</span>
              <h2 className="h1">
                {led.title.before} <em>{led.title.italic}</em>
              </h2>
              <dl className="bwLed__stats">
                {led.stats.map((s) => (
                  <div key={s.label}>
                    <dd>
                      <strong>{s.value}</strong>
                    </dd>
                    <dt>{s.label}</dt>
                  </div>
                ))}
              </dl>
              <ul className="bwLed__places" aria-label="Corridors and junctions">
                {led.places.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── Launch films ── */}
        <section className="section bwFilms" id="launch-films">
          <div className="wrap">
            <div className="bwFilms__grid">
              <Reveal>
                <div className="secHead">
                  <span className="secTag">Launch films</span>
                  <h2 className="h1">
                    {films.title.before} <em>{films.title.italic}</em>
                  </h2>
                  <p className="lede">{films.lede}</p>
                </div>
                <div className="bwFilms__items">
                  {films.items.map((f) => (
                    <article key={f.name}>
                      <span className="bwProject__place">{f.project}</span>
                      <h3>{f.name}</h3>
                      <p>{f.body}</p>
                    </article>
                  ))}
                </div>
                <ul className="bwChips" aria-label="Production kit">
                  {films.kit.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={90}>
                <Photo shot={films.image} natural className="bwFilms__photo" />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── In-house architecture ── */}
        <section className="section bwArch" id="architecture">
          <div className="wrap">
            <Reveal>
              <div className="secHead">
                <span className="secTag">In-house architecture</span>
                <h2 className="h1">
                  {architecture.title.before} <em>{architecture.title.italic}</em>
                </h2>
                <p className="lede">{architecture.lede}</p>
              </div>
            </Reveal>
            <div className="bwGallery bwGallery--4 bwGallery--even">
              {architecture.shots.map((s) => (
                <Photo key={s.src} shot={s} />
              ))}
            </div>
            <p className="bwCaption">{architecture.note}</p>
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
