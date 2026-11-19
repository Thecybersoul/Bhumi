import { Suspense } from 'react'
import InboxView from '@/components/erp/InboxView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'WhatsApp Inbox · Admin' }

export default function AdminInbox() {
  return (
    <Suspense>
      <InboxView />
    </Suspense>
  )
}
