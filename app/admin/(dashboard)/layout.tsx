import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Belt and braces: proxy.ts guards the route, and the layout
  // re-checks server-side so a misconfigured matcher cannot leak
  // an admin page.
  const user = await currentUser()
  if (!user) redirect('/admin/login')

  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>
}
