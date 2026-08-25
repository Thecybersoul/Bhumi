'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'
import Icon from './Icon'
import { primaryNav, brand } from '@/lib/content/brand'

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
    document.body.classList.toggle('nav-open', menuOpen)
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('nav-open')
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const solid = variant === 'light' || scrolled
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <header className={`siteHeader ${solid ? 'is-solid' : 'is-transparent'}`}>
        <div className="wrap siteHeader__inner">
          <Link href="/" className="siteHeader__brand" aria-label={`${brand.name} home`}>
            <Logo variant="wordmark" theme={solid ? 'light' : 'dark'} style={{ height: 38 }} />
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
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
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
            <a href={`tel:${brand.phoneRaw}`} className="siteHeader__call">
              <Icon name="phone" size={13} />
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
      </header>

      {/* Rendered outside <header> on purpose: the header carries a
          backdrop-filter, which makes it a containing block for fixed
          descendants — a drawer nested inside it would size itself to
          the header bar rather than the viewport. */}
      {menuOpen && (
        <div className="mobileNav" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="mobileNav__scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="mobileNav__panel">
            <nav aria-label="Mobile">
              {primaryNav.map((item) => (
                <div key={item.href} className="mobileNav__group">
                  <Link href={item.href} className="mobileNav__link">
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="mobileNav__children">
                      {item.children.map((c) => (
                        <Link key={c.href} href={c.href}>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <a href={`tel:${brand.phoneRaw}`} className="btn btn-primary btn-block mobileNav__call">
              <Icon name="phone" size={15} /> Call {brand.phone}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
