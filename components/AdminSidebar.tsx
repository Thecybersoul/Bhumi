'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from '@/app/admin/(authenticated)/dashboard/dashboard.module.css'

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
        <span className="mark" style={{width: 32, height: 32}}>ಭೂ</span>
        <span>Bhūmī <small>ADMIN</small></span>
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
          href="/admin/vision"
          onClick={handleNavClick}
          className={`${styles.navItem} ${pathname === '/admin/vision' ? styles.navItemActive : ''}`}
        >
          <span>👁</span>
          <span>Vision Brief</span>
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
