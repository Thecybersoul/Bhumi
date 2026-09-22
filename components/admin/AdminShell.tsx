'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Icon, { type IconName } from '@/components/site/Icon'

/* ERP-first ordering: the business — inventory, leads, verification,
   documents — leads. Editing the site's copy and reference material
   are real jobs too, but they are not what this admin is for, so
   they sit lower rather than competing with the work at the top. */

const nav: { group: string; items: { href: string; label: string; icon: IconName; hint?: string }[] }[] = [
  {
    group: 'Business',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: 'gauge' },
      { href: '/admin/properties', label: 'Properties', icon: 'land' },
      { href: '/admin/transactions', label: 'Transactions', icon: 'balance', hint: 'Deals being bought or sold' },
      { href: '/admin/leads', label: 'Leads', icon: 'handshake' },
      { href: '/admin/verifications', label: 'Verification', icon: 'shield' },
      { href: '/admin/data-room', label: 'Document requests', icon: 'lock' },
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
  {
    group: 'System',
    items: [
      { href: '/admin/metrics', label: 'Metrics', icon: 'checklist' },
      { href: '/admin/plan', label: 'Business plan', icon: 'compare' },
      { href: '/admin/setup', label: 'Setup', icon: 'gauge', hint: 'Database status' },
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
