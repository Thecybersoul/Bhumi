import LeadInbox from '@/components/admin/LeadInbox'
import { getLeads } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Lead inbox · Admin' }

export default async function LeadsPage() {
  const { data, source } = await getLeads()
  return <LeadInbox leads={data} source={source} />
}
