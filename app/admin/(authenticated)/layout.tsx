'use client'

import React, { useState } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
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
        {children}
      </main>

      {/* Mobile Toggle Button */}
      <button 
        className={styles.mobileToggle} 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  )
}
