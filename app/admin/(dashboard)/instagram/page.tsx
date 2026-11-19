import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { canUseSocial } from '@/lib/social'
import InstagramView from '@/components/erp/InstagramView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Instagram · Admin' }

export default async function AdminInstagram() {
  // Sanjog's alone (lib/social.ts); the API routes refuse everyone else too.
  if (!canUseSocial(await currentUser())) redirect('/admin/dashboard')
  return (
    <Suspense>
      <InstagramView />
    </Suspense>
  )
}
