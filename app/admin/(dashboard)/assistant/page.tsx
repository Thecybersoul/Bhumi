import { Suspense } from 'react'
import AssistantView from '@/components/erp/AssistantView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Assistant · Admin' }

export default function AdminAssistant() {
  return (
    <Suspense>
      <AssistantView />
    </Suspense>
  )
}
