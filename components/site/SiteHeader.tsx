'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'
import Icon from './Icon'
import { primaryNav, utilityNav, brand } from '@/lib/content/brand'

/* One consistent identity across every page (Plan §2) — the same
   header on the homepage, a corridor page and a tool. WhatsApp is
   the primary action in the bar itself (Plan §3F). */

export default function SiteHeader({ variant = 'light' }: { variant?: 'light' | 'transparent' }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setOpenGroup(null)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const solid = variant === 'light' || scrolled
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <header className={`siteHeader ${solid ? 'is-solid' : 'is-transparent'}`}>
      <div className="wrap siteHeader__inner">
        <Link href="/" className="siteHeader__brand" aria-label={`${brand.name} home`}>
          <Logo variant="wordmark" theme={solid ? 'light' : 'dark'} style={{ height: 34 }} />
        </Link>

        <nav className="siteHeader__nav" aria-label="Primary">
          {primaryNav.map((item) => (
            <div
              key={item.href}
              className="siteHeader__item"
              onMouseEnter={() => item.children && setOpenGroup(item.href)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <Link
                href={item.href}
                className={`siteHeader__link ${isActive(item.href) ? 'is-active' : ''}`}
                aria-expanded={item.children ? openGroup === item.href : undefined}
              >
                {item.label}
                {item.children && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </Link>

              {item.children && openGroup === item.href && (
                <div className="siteHeader__dropdown">
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} className="siteHeader__dropLink">
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="siteHeader__actions">
          <Link href="/marketplace" className="siteHeader__utility">
            Marketplace
          </Link>
          <a href={`tel:${brand.phoneRaw}`} className="btn btn-sm siteHeader__call">
            <Icon name="phone" size={14} />
            {brand.phone}
          </a>
          <button
            className="siteHeader__burger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={menuOpen ? 'is-open' : ''} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="siteHeader__mobile">
          <nav aria-label="Mobile">
            {primaryNav.map((item) => (
              <div key={item.href} className="siteHeader__mobileGroup">
                <Link href={item.href} className="siteHeader__mobileLink">
                  {item.label}
                  {item.description && <small>{item.description}</small>}
                </Link>
                {item.children && (
                  <div className="siteHeader__mobileChildren">
                    {item.children.map((c) => (
                      <Link key={c.href} href={c.href}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="siteHeader__mobileUtility">
              {utilityNav.map((u) => (
                <Link key={u.href} href={u.href}>
                  {u.label}
                </Link>
              ))}
            </div>
            <div className="siteHeader__mobileActions">
              <a href={`tel:${brand.phoneRaw}`} className="btn btn-primary btn-block">
                <Icon name="phone" size={15} /> Call {brand.phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
