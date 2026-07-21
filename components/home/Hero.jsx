'use client'

import Link from 'next/link'
import Logo from '../Logo'
import { hero } from '@/lib/copy/home'
import styles from './Hero.module.css'

export default function Hero() {
  const h = hero
  return (
    <section className={styles.hero}>
      {/* Ambient glow orbs */}
      <div className={styles.orbGold} aria-hidden="true" />
      <div className={styles.orbGreen} aria-hidden="true" />

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className="brand" style={{ color: '#fff' }}>
            <Logo theme="dark" style={{ height: 36 }} />
          </Link>
          <div className={styles.navLinks}>
            <Link href="/marketplace" className={styles.navLink}>Marketplace</Link>
            <Link href="/insights" className={styles.navLink}>Insights</Link>
            <a
              href={h.primaryCta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.navLink} ${styles.navLinkGold}`}
            >
              WhatsApp&nbsp;→
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className={styles.content}>
        <span className={styles.eyebrow}>
          <span className={styles.dot} />
          {h.eyebrow}
        </span>

        <h1 className={styles.title}>
          {h.title.before}{' '}
          <em>{h.title.italic}</em>
          {h.title.after}
        </h1>

        <p className={styles.subtitle}>{h.subhead}</p>

        <div className={styles.actions}>
          <a
            className={styles.btnPrimary}
            href={h.primaryCta.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            {h.primaryCta.label}
          </a>
          <Link className={styles.btnSecondary} href={h.secondaryCta.href}>
            {h.secondaryCta.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a className={styles.btnTertiary} href={h.callCta.href}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {h.callCta.label}
          </a>
        </div>


      </div>
    </section>
  )
}
