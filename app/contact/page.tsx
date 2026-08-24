import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { brand, wa } from '@/lib/content/brand'
import { practices } from '@/lib/content/services'

export const metadata: Metadata = {
  title: 'Contact — WhatsApp first, form second',
  description:
    'Reach the Bhumi Estates advisory desk on WhatsApp or by phone. Tell us which practice you need — property consultancy or branding — and a short form is available as a backup, never as the only option.',
  alternates: { canonical: '/contact' },
}

const routes = [
  {
    label: 'Land verification',
    detail: 'A survey number and a village is enough to start. Free preliminary read in 2–3 days.',
    href: wa.verification,
    icon: 'shield' as const,
    primary: true,
  },
  {
    label: 'Land sourcing',
    detail: 'Tell us what you need — extent, corridor, budget and intended use.',
    href: wa.sourcing,
    icon: 'land' as const,
  },
  {
    label: 'Construction & development',
    detail: 'Taking a parcel from land to a finished asset.',
    href: wa.development,
    icon: 'crane' as const,
  },
  {
    label: 'Project branding',
    detail: 'Naming and identity, boundary walls, entrance pylons and site signage.',
    href: wa.branding,
    icon: 'billboard' as const,
  },
  {
    label: 'Outdoor advertising',
    detail: 'Site selection, media buying and campaigns reported on qualified leads.',
    href: wa.outdoorAdvertising,
    icon: 'megaphone' as const,
  },
]

/* Service pages link here as /contact?intent=<slug>. Map those onto the
   dropdown so the form arrives pre-filled instead of asking again. */
const INTENT_TO_OPTION: Record<string, string> = {
  verification: 'Land verification',
  sourcing: 'Land sourcing',
  commercial: 'Land sourcing',
  residential: 'Land verification',
  villa: 'Land verification',
  'verification-legal': 'Land verification',
  'land-sourcing': 'Land sourcing',
  'construction-development': 'Construction & development',
  development: 'Construction & development',
  'project-branding': 'Project branding',
  branding: 'Project branding',
  'outdoor-advertising': 'Outdoor advertising',
  advertising: 'Outdoor advertising',
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>
}) {
  const { intent } = await searchParams
  const preselected = intent ? INTENT_TO_OPTION[intent] : undefined

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Contact"
          title="WhatsApp first."
          italic="A form is the backup,"
          after=" never the only option."
          lede="It is how landowners and developers in this market actually make first contact, so we built for that rather than making you fill in eleven fields to ask one question."
          crumbs={[{ label: 'Contact' }]}
        />

        <section className="section">
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">Pick the desk</span>
                  <h2 className="h1">
                    Every route goes to a <em>person.</em>
                  </h2>
                  <p className="body-text">
                    Choosing a route below just means your message arrives with context attached, so the first
                    reply is an answer rather than a question about what you need.
                  </p>

                  <div className="stack" style={{ marginTop: 26 }}>
                    {routes.map((r) => (
                      <a
                        key={r.label}
                        href={r.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="advisorCard"
                        style={
                          r.primary
                            ? { borderColor: 'rgba(194,151,74,.5)', background: 'var(--gold-tint)' }
                            : undefined
                        }
                      >
                        <span className="advisorCard__avatar">
                          <Icon name={r.icon} size={20} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <strong>{r.label}</strong>
                          <small>{r.detail}</small>
                        </div>
                        <Icon name="whatsapp" size={18} />
                      </a>
                    ))}
                  </div>

                  <div className="contactLines">
                    <a href={`tel:${brand.phoneRaw}`} className="contactLines__row">
                      <Icon name="phone" size={17} />
                      <span>{brand.phone}</span>
                    </a>
                    <a href={`mailto:${brand.email}`} className="contactLines__row">
                      <Icon name="mail" size={17} />
                      <span>{brand.email}</span>
                    </a>
                    <div className="contactLines__row">
                      <Icon name="pin" size={17} />
                      <span>
                        {brand.address.line1}, {brand.address.line2}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <div className="stack" style={{ gap: 22 }}>
                  <LeadForm
                    kind="Enquiry"
                    source="/contact"
                    heading="Or leave your details"
                    blurb="Four fields. An advisor replies, usually the same working day."
                    qualifier={{
                      name: 'interest',
                      label: 'What do you need?',
                      options: [
                        'Land verification',
                        'Land sourcing',
                        'Large land parcel',
                        'Development',
                        'Branding',
                        'Outdoor advertising',
                        'Selling land or a property',
                        'Something else',
                      ],
                      defaultValue: preselected,
                    }}
                    whatsappMessage="Hi Bhumi Estates — I'd like to speak to someone about:"
                  />

                  <div className="panel">
                    <span className="eyebrow" style={{ marginBottom: 10 }}>
                      What we do
                    </span>
                    <div className="chips">
                      {practices.flatMap((pr) =>
                        pr.services.map((sv) => (
                          <Link key={sv.slug} href={`${pr.href}#${sv.slug}`} className="chip">
                            {sv.name}
                          </Link>
                        ))
                      )}
                    </div>
                    <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 16, lineHeight: 1.65 }}>
                      K-RERA agent registration {brand.reraNumber}. Verify at{' '}
                      <a href="https://rera.karnataka.gov.in" target="_blank" rel="noopener noreferrer" className="link-arrow">
                        rera.karnataka.gov.in
                      </a>
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
