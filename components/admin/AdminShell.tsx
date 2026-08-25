'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Icon, { type IconName } from '@/components/site/Icon'

/* Organised around what someone actually comes here to do. Editing
   the site is the common case and leads; operating the pipeline and
   reading enquiries follow; reference material sits last rather than
   competing with the work. */

const nav: { group: string; items: { href: string; label: string; icon: IconName; hint?: string }[] }[] = [
  {
    group: 'Edit the site',
    items: [
      { href: '/admin/dashboard', label: 'Overview', icon: 'gauge' },
      { href: '/admin/content/home', label: 'Homepage', icon: 'structure' },
      { href: '/admin/content/property', label: 'Property Consultancy', icon: 'land' },
      { href: '/admin/content/branding', label: 'Branding & Advertising', icon: 'billboard' },
      { href: '/admin/content/brand', label: 'Brand & contact', icon: 'shield', hint: 'Name, phone, socials' },
      { href: '/admin/media', label: 'Media', icon: 'map', hint: 'Images, video, PDFs' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { href: '/admin/properties', label: 'Listings', icon: 'land' },
      { href: '/admin/verifications', label: 'Verification pipeline', icon: 'shield', hint: 'The four-stage board' },
    ],
  },
  {
    group: 'Enquiries',
    items: [
      { href: '/admin/leads', label: 'Lead inbox', icon: 'handshake', hint: 'Every conversion path' },
      { href: '/admin/data-room', label: 'Document requests', icon: 'lock' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { href: '/admin/metrics', label: 'What to measure', icon: 'checklist' },
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
