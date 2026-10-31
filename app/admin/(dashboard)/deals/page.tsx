import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/* Deals now live inside the Sales funnel. This keeps old links, saved
   bookmarks and notification deep links working. */
const TAB: Record<string, string> = { leads: 'leads', contacts: 'contacts', agents: 'agents', documents: 'docs', docs: 'docs', pipeline: 'deals' }

export default async function AdminDeals({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  redirect(`/admin/crm?tab=${TAB[tab ?? ''] ?? 'deals'}`)
}
