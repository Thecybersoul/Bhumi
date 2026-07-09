import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.footerRow}>
          <div>
            <Link href="/" className="brand">
              <span className="mark">ಭೂ</span>
              <span style={{ color: '#fff' }}>Bhūmī<small style={{ color: 'var(--gold-soft)' }}>BENGALURU LAND EXCHANGE</small></span>
            </Link>
            <p style={{ marginTop: 12, color: '#9aa6a0' }}>The definitive land exchange for Bengaluru's next decade of growth. Premium, verified, and transparent.</p>
          </div>
          <div className={styles.links}>
            <Link href="/marketplace">Explore Properties</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
        <div className={styles.fbot}>
          <span>© {new Date().getFullYear()} Bhūmī Land Exchange. All rights reserved.</span>
          <span>Bengaluru · India</span>
        </div>
      </div>
    </footer>
  )
}
