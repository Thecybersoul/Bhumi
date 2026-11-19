import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { canUseSocial } from '@/lib/social'
import InboxView from '@/components/erp/InboxView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'WhatsApp Inbox · Admin' }

export default async function AdminInbox() {
  // Sanjog's alone (lib/social.ts); the API routes refuse everyone else too.
  if (!canUseSocial(await currentUser())) redirect('/admin/dashboard')
  return (
    <Suspense>
      <InboxView />
    </Suspense>
  )
}
