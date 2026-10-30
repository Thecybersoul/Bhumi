import { Suspense } from 'react'
import CrmView from '@/components/erp/CrmView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sales CRM · Admin' }

export default function AdminCrm() {
  return (
    <Suspense>
      <CrmView />
    </Suspense>
  )
}
