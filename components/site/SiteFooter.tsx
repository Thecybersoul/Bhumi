import Link from 'next/link'
import Logo from '@/components/Logo'
import Icon from './Icon'
import { brand, wa } from '@/lib/content/brand'
import { pillars } from '@/lib/content/pillars'
import { propertyTypes } from '@/lib/content/propertyTypes'
import { corridors } from '@/lib/content/corridors'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="siteFooter">
      <div className="wrap">
        {/* No dead ends (Plan §2, Zell on liquidity) — the footer
            itself carries a next step, not just links. */}
        <div className="siteFooter__cta">
          <div>
            <span className="eyebrow eyebrow-light">One next step</span>
            <h2 className="h2">Tell us what you are trying to do.</h2>
            <p>A sourcing brief, a site that needs branding, or a campaign that needs to be seen.</p>
          </div>
          <div className="siteFooter__ctaActions">
            <Link href="/contact" className="btn btn-gold btn-lg">
              Tell us what you need <Icon name="arrow" size={15} />
            </Link>
            <a href={`tel:${brand.phoneRaw}`} className="btn btn-outline-light btn-lg">
              <Icon name="phone" size={15} /> {brand.phone}
            </a>
          </div>
        </div>

        <div className="siteFooter__cols">
          <div className="siteFooter__brandCol">
            <Logo variant="wordmark" theme="dark" style={{ height: 38 }} />
            <p className="siteFooter__tagline">{brand.tagline}</p>
            <p className="siteFooter__address">
              {brand.address.line1}
              <br />
              {brand.address.line2}
            </p>
            <p className="siteFooter__contact">
              <a href={`tel:${brand.phoneRaw}`}>{brand.phone}</a>
              <br />
              <a href={`mailto:${brand.email}`}>{brand.email}</a>
            </p>
            <div className="siteFooter__social">
              <a href={wa.general} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <Icon name="whatsapp" size={17} />
              </a>
              <a href={brand.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                in
              </a>
              <a href={brand.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Icon name="play" size={16} filled />
              </a>
            </div>
          </div>

          <div className="siteFooter__col">
            <h3>Services</h3>
            <ul>
              {pillars.map((p) => (
                <li key={p.slug}>
                  <Link href={`/services/${p.slug}`}>{p.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="siteFooter__col">
            <h3>Property types</h3>
            <ul>
              {propertyTypes.map((t) => (
                <li key={t.slug}>
                  <Link href={t.href}>{t.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="siteFooter__col">
            <h3>Corridors</h3>
            <ul>
              {corridors.map((c) => (
                <li key={c.slug}>
                  <Link href={`/corridors/${c.slug}`}>{c.name.split('&')[0].trim()}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="siteFooter__col">
            <h3>Resources</h3>
            <ul>
              <li><Link href="/resources#work">Our work</Link></li>
              <li><Link href="/resources#corridors">Corridors</Link></li>
              <li><Link href="/resources#tools">Decision tools</Link></li>
              <li><Link href="/resources#insights">Insights</Link></li>
              <li><Link href="/marketplace">Marketplace</Link></li>
              <li><Link href="/verification">Verification protocol</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* K-RERA requires the registration number to appear in
            advertising so a buyer can verify before visiting. */}
        <div className="siteFooter__rera">
          <Icon name="shield" size={15} />
          <span>
            K-RERA agent registration <strong>{brand.reraNumber}</strong> · Verify at{' '}
            <a href="https://rera.karnataka.gov.in" target="_blank" rel="noopener noreferrer">
              rera.karnataka.gov.in
            </a>
          </span>
        </div>

        <div className="siteFooter__bottom">
          <span>
            © {year} {brand.legalName}. All rights reserved.
          </span>
          <div className="siteFooter__legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <span>Bengaluru · Karnataka · India</span>
          </div>
        </div>

        <p className="siteFooter__disclaimer">
          Information on this site is provided for evaluation and planning. Price bands, tool outputs and
          corridor data are indicative, are not valuations or tax advice, and should be confirmed at parcel
          level before any commitment. Verification findings relate only to the parcel and scope stated in the
          relevant report.
        </p>
      </div>
    </footer>
  )
}
