import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import HeroVideo from '@/components/site/HeroVideo'
import { practices } from '@/lib/content/services'
import { industryContext, contextNote, verificationStages } from '@/lib/content/verification'
import {
  hero,
  practicesIntro,
  standard,
  verificationTeaser,
  brandingTeaser,
  faq,
  closingCta,
} from '@/lib/content/home'

export const revalidate = 300

export default function Home() {
  return (
    <>
      <SiteHeader variant="transparent" />

      <main id="main">
        {/* ── Hero ──
            Mobile deliberately carries the eyebrow, the headline and
            one short line — the footage behind it is the point. */}
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
        </section>

        {/* ── Industry context ──
            Generic ground rules, not a track record. */}
        <section className="contextBar">
          <div className="wrap">
            <div className="contextBar__grid">
              {industryContext.map((s) => (
                <div key={s.label} className="contextBar__item">
                  <span className="contextBar__value">{s.value}</span>
                  <span className="contextBar__label">{s.label}</span>
                  <span className="contextBar__note">{s.note}</span>
                </div>
              ))}
            </div>
            <p className="contextBar__disclaimer">{contextNote}</p>
          </div>
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

        {/* ── Verification teaser ── */}
        <section className="section-tight verifTeaser">
          <div className="wrap">
            <div className="verifTeaser__grid">
              <Reveal>
                <div>
                  <span className="secTag">{verificationTeaser.eyebrow}</span>
                  <h2 className="h1">
                    {verificationTeaser.title.before} <em>{verificationTeaser.title.italic}</em>
                  </h2>
                  <p className="lede">{verificationTeaser.body}</p>
                  <Link href={verificationTeaser.cta.href} className="btn btn-outline btn-lg">
                    {verificationTeaser.cta.label} <Icon name="arrow" size={15} />
                  </Link>
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

        {/* ── Branding teaser ── */}
        <section className="section brandTeaser">
          <div className="wrap">
            <Reveal>
              <div className="brandTeaser__inner">
                <span className="secTag">{brandingTeaser.eyebrow}</span>
                <h2 className="display brandTeaser__title">
                  {brandingTeaser.title.before} <em>{brandingTeaser.title.italic}</em>
                </h2>
                <p className="lede">{brandingTeaser.body}</p>
                <Link href={brandingTeaser.cta.href} className="btn btn-gold btn-lg">
                  {brandingTeaser.cta.label} <Icon name="arrow" size={15} />
                </Link>
              </div>
            </Reveal>
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

        {/* ── FAQ ── */}
        <section className="section-tight faqSection">
          <div className="wrap-narrow">
            <Reveal>
              <div className="secHead">
                <span className="secTag">{faq.eyebrow}</span>
                <h2 className="h1">
                  {faq.title.before} <em>{faq.title.italic}</em>
                </h2>
              </div>
            </Reveal>
            <div className="faqList">
              {faq.items.map((item) => (
                <details key={item.q} className="faqItem">
                  <summary>
                    {item.q}
                    <span className="plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{item.a}</p>
                </details>
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
