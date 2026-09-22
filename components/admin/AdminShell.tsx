'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Icon, { type IconName } from '@/components/site/Icon'

/* Four things run this business day to day: the inventory, the
   deal pipeline (which leads and data-room requests both feed),
   the properties' verification status (folded into Properties —
   a case is always about one specific parcel), and the follow-up
   memory (Notes & Tasks). Everything else — editing the site's
   copy, the original business-plan reference material, database
   setup — is either a lower-frequency job (Content) or a utility
   (Setup, in the footer) rather than something to check daily. */

const nav: { group: string; items: { href: string; label: string; icon: IconName; hint?: string }[] }[] = [
  {
    group: 'Business',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: 'gauge' },
      { href: '/admin/properties', label: 'Properties', icon: 'land', hint: 'Listings & verification' },
      { href: '/admin/deals', label: 'Deals', icon: 'balance', hint: 'Pipeline, leads & documents' },
      { href: '/admin/notes-tasks', label: 'Notes & Tasks', icon: 'checklist' },
    ],
  },
  {
    group: 'Content',
    items: [
      { href: '/admin/content/home', label: 'Homepage', icon: 'structure' },
      { href: '/admin/content/property', label: 'Property Consultancy', icon: 'land-parcels' },
      { href: '/admin/content/branding', label: 'Branding & Advertising', icon: 'billboard' },
      { href: '/admin/content/brand', label: 'Brand & contact', icon: 'mail' },
      { href: '/admin/media', label: 'Media', icon: 'map' },
    ],
  },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div className="adminLayout">
      {open && <div className="overlay adminLayout__overlay" onClick={() => setOpen(false)} />}

      <aside className={`adminSidebar ${open ? 'is-open' : ''}`}>
        <Link href="/" className="adminSidebar__brand">
          <Logo theme="dark" style={{ height: 34 }} />
        </Link>

        <nav className="adminSidebar__nav" aria-label="Admin">
          {nav.map((group) => (
            <div key={group.group} className="adminSidebar__group">
              <span className="adminSidebar__groupLabel">{group.group}</span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`adminSidebar__item ${pathname === item.href ? 'is-active' : ''}`}
                >
                  <Icon name={item.icon} size={17} />
                  <span>
                    {item.label}
                    {item.hint && <small>{item.hint}</small>}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="adminSidebar__foot">
          <Link href="/" target="_blank" className="adminSidebar__view">
            <Icon name="arrow" size={14} /> View the live site
          </Link>
          <Link href="/admin/setup" onClick={() => setOpen(false)} className="adminSidebar__view">
            <Icon name="gauge" size={14} /> Setup & database status
          </Link>
          <button className="btn btn-sm btn-ghost btn-block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="adminMain">
        <div className="adminMain__topbar">
          <Logo theme="light" style={{ height: 30 }} />
          <button className="btn btn-sm btn-ghost" onClick={() => setOpen(true)} aria-label="Open menu">
            ☰
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}
