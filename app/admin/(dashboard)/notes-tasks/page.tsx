import NotesTasksBoard from '@/components/admin/NotesTasksBoard'
import { getTasks, getNotes } from '@/lib/db'
import { isConnected } from '@/lib/google'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notes & Tasks · Admin' }

export default async function NotesTasksPage() {
  const [{ data: tasks, source: taskSource }, { data: notes, source: noteSource }, googleConnected] = await Promise.all([
    getTasks(),
    getNotes(),
    isConnected(),
  ])
  const source = taskSource === 'live' && noteSource === 'live' ? 'live' : 'fallback'
  return <NotesTasksBoard tasks={tasks} notes={notes} source={source} googleConnected={googleConnected} />
}
