import Link from 'next/link'
import Logo from '@/components/Logo'
import Icon from './Icon'
import { brand, wa } from '@/lib/content/brand'
import { practices } from '@/lib/content/services'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="siteFooter">
      <div className="wrap">
        {/* No dead ends — the footer itself carries a next step. */}
        <div className="siteFooter__cta">
          <div>
            <span className="eyebrow eyebrow-light">One next step</span>
            <h2 className="h2">Tell us what you are trying to do.</h2>
            <p>A parcel to find, a title to check, or a launch that needs to be seen.</p>
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
            <Logo variant="wordmark" theme="dark" style={{ height: 52 }} />
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
              <a href={brand.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Icon name="instagram" size={17} />
              </a>
            </div>
          </div>

          {practices.map((p) => (
            <div key={p.slug} className="siteFooter__col">
              <h3>
                <Link href={p.href}>{p.name}</Link>
              </h3>
              <ul>
                {p.services.map((s) => (
                  <li key={s.slug}>
                    <Link href={`${p.href}#${s.slug}`}>{s.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

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

      </div>
    </footer>
  )
}
