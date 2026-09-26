import { Suspense } from 'react'
import TasksView from '@/components/erp/TasksView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tasks & notes · Admin' }

export default function AdminNotesTasks() {
  return (
    <Suspense>
      <TasksView />
    </Suspense>
  )
}
