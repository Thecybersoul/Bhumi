import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Logo from '@/components/Logo'
import SiteFooter from '@/components/site/SiteFooter'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { landingPages, getLandingPage } from '@/lib/content/landingPages'
import { brand, whatsapp } from '@/lib/content/brand'

/* Campaign landing pages — Plan §7.
   Deliberately stripped of site navigation: one offer, one next
   step, nowhere else to go. Campaign traffic never lands on the
   homepage, and it does not get handed the full site menu either. */

export function generateStaticParams() {
  return landingPages.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const lp = getLandingPage(slug)
  if (!lp) return {}
  return {
    title: `${lp.headline} ${lp.headlineItalic}`,
    description: lp.subhead.slice(0, 180),
    alternates: { canonical: `/lp/${lp.slug}` },
    // Campaign pages should not compete with the canonical pages
    // in organic search.
    robots: { index: false, follow: true },
  }
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lp = getLandingPage(slug)
  if (!lp) notFound()

  return (
    <>
      {/* Minimal chrome: brand and one phone number. No nav. */}
      <header className="lpHeader">
        <div className="wrap lpHeader__inner">
          <Link href="/" aria-label={`${brand.name} home`}>
            <Logo theme="dark" style={{ height: 34 }} />
          </Link>
          <a href={`tel:${brand.phoneRaw}`} className="lpHeader__phone">
            <Icon name="phone" size={14} />
            {brand.phone}
          </a>
        </div>
      </header>

      <main id="main">
        <section className="lpHero">
          <div className="lpHero__bg" aria-hidden="true" />
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'center' }}>
              <div>
                <Reveal>
                  <span className="eyebrow eyebrow-light">{lp.eyebrow}</span>
                  <h1 className="display" style={{ maxWidth: '16ch', margin: '14px 0 22px' }}>
                    {lp.headline} <em>{lp.headlineItalic}</em>
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '1.06rem', lineHeight: 1.72, maxWidth: '52ch' }}>
                    {lp.subhead}
                  </p>

                  <a
                    href={whatsapp(lp.cta.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold btn-lg"
                    style={{ marginTop: 30 }}
                  >
                    <Icon name="whatsapp" size={17} />
                    {lp.cta.label}
                  </a>

                  <div className="pageHero__stats" style={{ marginTop: 42 }}>
                    {lp.proof.map((p) => (
                      <div key={p.label}>
                        <span className="numeral">{p.value}</span>
                        <small>{p.label}</small>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              <Reveal delay={90}>
                <LeadForm
                  kind={lp.slug === 'free-land-verification' ? 'Verification review' : 'Enquiry'}
                  source={`/lp/${lp.slug}`}
                  corridor={lp.corridor}
                  heading={lp.offer.label}
                  blurb="Two fields and the one detail we need to be useful."
                  qualifier={lp.formQualifier}
                  whatsappMessage={lp.cta.whatsapp}
                  whatsappLabel={lp.cta.label}
                  submitLabel={lp.cta.label}
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* The offer */}
        <section className="section">
          <div className="wrap-narrow">
            <div className="calloutBox">
              <span className="eyebrow" style={{ marginBottom: 8 }}>
                What you actually get
              </span>
              <h2 className="h2" style={{ marginBottom: 10 }}>
                {lp.offer.label}
              </h2>
              <p style={{ fontSize: '.98rem', lineHeight: 1.78 }}>{lp.offer.detail}</p>
            </div>
          </div>
        </section>

        <section className="section-tight">
          <div className="wrap">
            <div className="grid g3">
              {lp.bullets.map((b, i) => (
                <Reveal key={b.title} delay={i * 60}>
                  <div className="listCard">
                    <span className="typeCard__icon" style={{ width: 42, height: 42 }}>
                      <Icon name="check" size={20} stroke={2.4} />
                    </span>
                    <h3>{b.title}</h3>
                    <p>{b.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Objections, answered plainly */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap-narrow">
            <span className="eyebrow">Reasonable objections</span>
            <h2 className="h1" style={{ marginBottom: 22 }}>
              The things you are <em>actually</em> wondering.
            </h2>
            <div className="faqList">
              {lp.objections.map((o) => (
                <details key={o.q} className="faqItem" open>
                  <summary>
                    {o.q}
                    <span className="plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{o.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* One next step */}
        <section className="ctaBand">
          <div className="wrap ctaBand__inner">
            <div>
              <span className="eyebrow eyebrow-light">One next step</span>
              <h2 className="h1" style={{ color: '#fff' }}>
                {lp.cta.label}
              </h2>
              <p>
                WhatsApp is the fastest route and goes to an advisor, not an autoresponder. If you would
                rather we called you, use the form above.
              </p>
            </div>
            <div className="ctaBand__actions">
              <a
                href={whatsapp(lp.cta.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold btn-lg"
              >
                <Icon name="whatsapp" size={17} /> {lp.cta.label}
              </a>
              <a href={`tel:${brand.phoneRaw}`} className="btn btn-outline-light btn-lg">
                <Icon name="phone" size={15} /> {brand.phone}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
