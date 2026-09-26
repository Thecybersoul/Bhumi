import { Suspense } from 'react'
import MeetingEditor from '@/components/erp/MeetingEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Meeting · Admin' }

export default async function AdminMeeting({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense>
      <MeetingEditor id={id} />
    </Suspense>
  )
}
