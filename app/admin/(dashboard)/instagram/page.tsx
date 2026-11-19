import { Suspense } from 'react'
import InstagramView from '@/components/erp/InstagramView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Instagram · Admin' }

export default function AdminInstagram() {
  return (
    <Suspense>
      <InstagramView />
    </Suspense>
  )
}
