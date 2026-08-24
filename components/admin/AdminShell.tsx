'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Icon, { type IconName } from '@/components/site/Icon'

/* The admin is organised around what the business plan actually
   asks the team to operate: a verification pipeline, a published
   transparency figure, a unified lead inbox across every
   conversion path, a data-room queue, and the §13 metrics. */

const nav: { group: string; items: { href: string; label: string; icon: IconName; hint?: string }[] }[] = [
  {
    group: 'Operate',
    items: [
      { href: '/admin/dashboard', label: 'Overview', icon: 'gauge' },
      { href: '/admin/verifications', label: 'Verification pipeline', icon: 'shield', hint: 'The four-stage board' },
      { href: '/admin/leads', label: 'Lead inbox', icon: 'handshake', hint: 'Every conversion path' },
      { href: '/admin/data-room', label: 'Data room requests', icon: 'lock', hint: 'NDA-gated' },
    ],
  },
  {
    group: 'Publish',
    items: [
      { href: '/admin/properties', label: 'Listings', icon: 'land' },
      { href: '/admin/transparency', label: 'Transparency figures', icon: 'compare', hint: 'What the public sees' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { href: '/admin/metrics', label: 'What to measure', icon: 'checklist' },
      { href: '/admin/plan', label: 'Website business plan', icon: 'structure' },
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
