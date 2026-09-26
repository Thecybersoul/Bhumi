import { Suspense } from 'react'
import DealsView from '@/components/erp/DealsView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Deals · Admin' }

export default function AdminDeals() {
  return (
    <Suspense>
      <DealsView />
    </Suspense>
  )
}
