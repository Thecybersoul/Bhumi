import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { brand, wa } from '@/lib/content/brand'
import { pillars } from '@/lib/content/pillars'

export const metadata: Metadata = {
  title: 'Contact — WhatsApp first, form second',
  description:
    'Reach the Bhumi Estates advisory desk on WhatsApp or by phone. Large-parcel enquiries route to a named advisor. A short form is available as a backup, never as the only option.',
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
    detail: 'Brief us on a mandate — extent, corridor, budget and intended use.',
    href: wa.sourcing,
    icon: 'land' as const,
  },
  {
    label: 'Large land parcels',
    detail: 'Institutional and bulk enquiries route to a named advisor, not a shared inbox.',
    href: wa.largeParcel,
    icon: 'large-land-parcels' as const,
  },
  {
    label: 'Development',
    detail: 'Taking a parcel from land to finished asset, through our partner network.',
    href: wa.development,
    icon: 'crane' as const,
  },
  {
    label: 'Branding',
    detail: 'Boundary walls, entrance pylons, highmasts and site signage.',
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

export default function ContactPage() {
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

                  <div className="factGrid" style={{ marginTop: 30 }}>
                    <div>
                      <span className="factGrid__label">Phone</span>
                      <span className="factGrid__value" style={{ fontSize: '1rem' }}>
                        <a href={`tel:${brand.phoneRaw}`}>{brand.phone}</a>
                      </span>
                    </div>
                    <div>
                      <span className="factGrid__label">General</span>
                      <span className="factGrid__value" style={{ fontSize: '.9rem' }}>
                        <a href={`mailto:${brand.email}`}>{brand.email}</a>
                      </span>
                    </div>
                    <div>
                      <span className="factGrid__label">Large parcels</span>
                      <span className="factGrid__value" style={{ fontSize: '.9rem' }}>
                        <a href={`mailto:${brand.advisorEmail}`}>{brand.advisorEmail}</a>
                      </span>
                    </div>
                    <div>
                      <span className="factGrid__label">Office</span>
                      <span className="factGrid__value" style={{ fontSize: '.88rem', lineHeight: 1.5 }}>
                        {brand.address.line1}
                        <br />
                        {brand.address.line2}
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
                    }}
                    whatsappMessage="Hi Bhumi Estates — I'd like to speak to someone about:"
                  />

                  <div className="panel">
                    <span className="eyebrow" style={{ marginBottom: 10 }}>
                      What we do
                    </span>
                    <div className="chips">
                      {pillars.map((p) => (
                        <Link key={p.slug} href={`/services/${p.slug}`} className="chip">
                          {p.name}
                        </Link>
                      ))}
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
