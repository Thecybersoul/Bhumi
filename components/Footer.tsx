import Link from 'next/link'
import styles from './Footer.module.css'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.footerRow} style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: '300px' }}>
            <Link href="/" className="brand" style={{ display: 'inline-block' }}>
              <Logo variant="horizontal" theme="dark" />
            </Link>
            <p style={{ marginTop: 16, color: '#9aa6a0', fontSize: '0.9rem' }}>
              India's most trusted spatial-intelligence-first land platform. Premium, verified, and transparent.
            </p>
          </div>
          <div className={styles.links} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '1rem', fontFamily: 'var(--serif)' }}>Platform</h4>
            <Link href="/marketplace">Explore Properties</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
          <div className={styles.links} style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#9aa6a0', fontSize: '0.9rem' }}>
            <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '1rem', fontFamily: 'var(--serif)' }}>Contact Us</h4>
            <p><strong>Phone:</strong> <a href="tel:+918123845749" style={{ color: 'inherit' }}>+91 81238 45749</a></p>
            <p><strong>Email:</strong> <a href="mailto:contact@bhumiestates.in" style={{ color: 'inherit' }}>contact@bhumiestates.in</a></p>
            <p><strong>Address:</strong><br />7th Main, 4th Block,<br />Jayanagar, Bengaluru.</p>
          </div>
        </div>
        <div className={styles.fbot} style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6f7a73' }}>
          <span>© {new Date().getFullYear()} Bhumi Estates. All rights reserved.</span>
          <span>Bengaluru · India</span>
        </div>
      </div>
    </footer>
  )
}
