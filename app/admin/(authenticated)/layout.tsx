'use client'

import React, { useState } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import Logo from '@/components/Logo'
import styles from '@/app/admin/(authenticated)/dashboard/dashboard.module.css'

export default function AuthenticatedAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
      
      {/* Sidebar Wrapper */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className={styles.main}>
        {/* Mobile Topbar */}
        <div className={styles.mobileTopbar}>
          <Logo variant="horizontal" theme="light" style={{ height: '32px' }} />
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Menu"
          >
            ☰
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
