import { Suspense } from 'react'
import { EmailView } from '@/components/erp/RecordsViews'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'New email · Admin' }

export default async function AdminEmail() {
  const me = await currentUser()
  return (
    <Suspense>
      <EmailView senderName={me?.name ?? 'Bhumi Estates'} />
    </Suspense>
  )
}
