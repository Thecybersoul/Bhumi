import Link from 'next/link'
import styles from './Footer.module.css'
import Logo from './Logo'
import { footer } from '@/lib/copy/footer'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.taglineRow}>
          <Link href="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Logo theme="dark" style={{ height: 40 }} />
          </Link>
          <p className={styles.tagline}>{footer.tagline}</p>
        </div>

        <div className={styles.colsRow}>
          {footer.columns.map((col) => (
            <div key={col.title} className={styles.col}>
              <h4 className={styles.colTitle}>{col.title}</h4>
              <ul className={styles.links}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Reach us</h4>
            <p className={styles.address}>
              {footer.address.line1}<br />
              {footer.address.line2}<br /><br />
              <a href={`tel:${footer.address.phone.replace(/\s/g, '')}`}>{footer.address.phone}</a><br />
              <a href={`mailto:${footer.address.email}`}>{footer.address.email}</a>
            </p>
            <div className={styles.social} style={{ marginTop: 14 }}>
              <a href="https://wa.me/918123845749" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a>
              <a href="https://www.linkedin.com/company/bhumiestates" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>
              <a href="https://www.youtube.com/@bhumiestates" target="_blank" rel="noopener" aria-label="YouTube">▶</a>
            </div>
          </div>
        </div>

        <div className={styles.fbot}>
          <span>© {new Date().getFullYear()} Bhūmī Estates. All rights reserved.</span>
          <span>{footer.copyright}</span>
        </div>
      </div>
    </footer>
  )
}
