'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  Bell,
  Briefcase,
  CircleCheck,
  ExternalLink,
  FolderOpen,
  Gauge,
  House,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  Mail,
  Map,
  Megaphone,
  Menu,
  MessagesSquare,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { Avatar } from '@/components/erp/ui'
import SearchPalette from '@/components/erp/SearchPalette'
import { ASSISTANT } from '@/components/erp/lib'

/* The same workspace as the mobile app, in the same order: Home,
   Deals, Listings, Meetings, Tasks. The website's content editors
   sit below in their own group, and records (documents, the team's
   activity) below those. The signed-in person sits at the foot and
   opens their Profile: account, team, Google Workspace. */

type Item = { href: string; label: string; icon: LucideIcon; hint?: string; match?: string }

const nav: { group: string; items: Item[] }[] = [
  {
    group: 'Workspace',
    items: [
      { href: '/admin/dashboard', label: 'Home', icon: House },
      { href: '/admin/deals', label: 'Deals', icon: Briefcase, hint: 'Leads, deals, contacts & document requests', match: '/admin/deals' },
      { href: '/admin/properties', label: 'Listings', icon: Map, hint: 'Marketplace & verification', match: '/admin/properties' },
      { href: '/admin/meetings', label: 'Meetings', icon: Users, hint: 'Visits, calls & discussions', match: '/admin/meetings' },
      { href: '/admin/notes-tasks', label: 'Tasks & notes', icon: CircleCheck },
      { href: '/admin/messages', label: 'Messages', icon: MessagesSquare, hint: 'Team chat' },
    ],
  },
  {
    group: 'Records',
    items: [
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
      { href: '/admin/documents', label: 'Documents', icon: FolderOpen },
      { href: '/admin/activity', label: 'Team activity', icon: Activity },
    ],
  },
  {
    group: 'Website',
    items: [
      { href: '/admin/content/home', label: 'Homepage', icon: LayoutTemplate },
      { href: '/admin/content/property', label: 'Property Consultancy', icon: Map },
      { href: '/admin/content/branding', label: 'Branding & Advertising', icon: Megaphone },
      { href: '/admin/content/brand', label: 'Brand & contact', icon: Mail },
      { href: '/admin/media', label: 'Media', icon: ImageIcon },
    ],
  },
]

export interface ShellUser {
  name: string
  email: string
}

export default function AdminShell({ user, children }: { user: ShellUser | null; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  // Unread team updates, refreshed on every page change.
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    if (pathname === '/admin/notifications') return setUnread(0)
    fetch('/api/notifications?limit=40', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => b && setUnread(b.unread ?? 0))
      .catch(() => {})
  }, [pathname])

  const active = (i: Item) => (i.match ? pathname.startsWith(i.match) : pathname === i.href)

  // ⌘K / Ctrl+K opens search from anywhere in the admin.
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearching((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="adminLayout">
      {open && <div className="overlay adminLayout__overlay" onClick={() => setOpen(false)} />}

      <aside className={`adminSidebar ${open ? 'is-open' : ''}`}>
        <Link href="/admin/dashboard" className="adminSidebar__brand">
          <Logo theme="dark" style={{ height: 34 }} />
        </Link>

        <div className="adminSidebar__tools">
          <button className="adminSidebar__search" onClick={() => (setOpen(false), setSearching(true))}>
            <Search size={15} /> <span>Search</span> <kbd>⌘K</kbd>
          </button>
          {ASSISTANT && (
            <Link href="/admin/assistant" className="adminSidebar__ask" onClick={() => setOpen(false)} title="Bhumi Assistant">
              <Sparkles size={15} /> Ask
            </Link>
          )}
        </div>

        <nav className="adminSidebar__nav" aria-label="Admin">
          {nav.map((group) => (
            <div key={group.group} className="adminSidebar__group">
              <span className="adminSidebar__groupLabel">{group.group}</span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`adminSidebar__item ${active(item) ? 'is-active' : ''}`}
                >
                  <item.icon size={17} />
                  <span style={{ flex: 1 }}>
                    {item.label}
                    {item.hint && <small>{item.hint}</small>}
                  </span>
                  {item.href === '/admin/notifications' && unread ? (
                    <span className="erpPill" style={{ background: 'var(--gold)', color: '#fff' }}>{unread > 9 ? '9+' : unread}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="adminSidebar__foot">
          {user ? (
            <Link href="/admin/profile" className="erpMe" onClick={() => setOpen(false)}>
              <Avatar name={user.name} size={34} />
              <span style={{ minWidth: 0 }}>
                <b>{user.name}</b>
                <small>{user.email}</small>
              </span>
            </Link>
          ) : null}
          <Link href="/" target="_blank" className="adminSidebar__view">
            <ExternalLink size={14} /> View the live site
          </Link>
          <Link href="/admin/setup" onClick={() => setOpen(false)} className="adminSidebar__view">
            <Gauge size={14} /> Setup & database status
          </Link>
          <button className="btn btn-sm btn-ghost btn-block" onClick={logout}>
            <LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Sign out
          </button>
        </div>
      </aside>

      <main className="adminMain">
        <div className="adminMain__topbar">
          <Logo theme="light" style={{ height: 30 }} />
          <span style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setSearching(true)} aria-label="Search">
              <Search size={18} />
            </button>
            {ASSISTANT && (
              <Link className="btn btn-sm btn-ghost" href="/admin/assistant" aria-label="Assistant">
                <Sparkles size={18} />
              </Link>
            )}
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
          </span>
        </div>
        {children}
        <SearchPalette open={searching} onClose={() => setSearching(false)} />
      </main>
    </div>
  )
}
