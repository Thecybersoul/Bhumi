import React from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import styles from '@/app/admin/(authenticated)/dashboard/dashboard.module.css'

export default function AuthenticatedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
