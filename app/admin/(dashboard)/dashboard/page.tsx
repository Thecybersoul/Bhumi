import HomeView from '@/components/erp/HomeView'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Home · Admin' }

/* Home: what needs doing today, not what the business is worth.
   The same view as the app's Home tab. The earlier value-focused
   figures (pipeline value, commission, win rate) still live at
   /admin/metrics. */
export default async function AdminHome() {
  const me = await currentUser()
  return <HomeView firstName={me?.name.split(' ')[0] ?? ''} />
}
