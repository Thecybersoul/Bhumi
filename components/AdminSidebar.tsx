'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from '@/app/admin/(authenticated)/dashboard/dashboard.module.css'
import Logo from './Logo'

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      <Link href="/" className={styles.sbrand}>
        <Logo variant="icon" theme="light" style={{ transform: 'scale(0.8)' }} />
        <span>Bhumi Estates <small>ADMIN</small></span>
      </Link>

      <nav className={styles.sidenav}>
        <Link
          href="/admin/dashboard"
          onClick={handleNavClick}
          className={`${styles.navItem} ${pathname === '/admin/dashboard' ? styles.navItemActive : ''}`}
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </Link>
        <Link
          href="/admin/feasibility"
          onClick={handleNavClick}
          className={`${styles.navItem} ${pathname === '/admin/feasibility' ? styles.navItemActive : ''}`}
        >
          <span>📊</span>
          <span>Feasibility Plan</span>
        </Link>
        <Link
          href="/admin/blueprint"
          onClick={handleNavClick}
          className={`${styles.navItem} ${pathname === '/admin/blueprint' ? styles.navItemActive : ''}`}
        >
          <span>🗺</span>
          <span>Blueprint</span>
        </Link>
      </nav>

      <div className={styles.sidebarFooter}>
        <Link href="/marketplace" target="_blank" className={styles.viewSite}>↗ View marketplace</Link>
        <button className="btn btn-sm btn-ghost" style={{width: '100%', justifyContent: 'center'}} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </>
  )
}
