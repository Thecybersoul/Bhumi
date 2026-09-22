import NotesTasksBoard from '@/components/admin/NotesTasksBoard'
import { getTasks, getNotes } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notes & Tasks · Admin' }

export default async function NotesTasksPage() {
  const [{ data: tasks, source: taskSource }, { data: notes, source: noteSource }] = await Promise.all([
    getTasks(),
    getNotes(),
  ])
  const source = taskSource === 'live' && noteSource === 'live' ? 'live' : 'fallback'
  return <NotesTasksBoard tasks={tasks} notes={notes} source={source} />
}
