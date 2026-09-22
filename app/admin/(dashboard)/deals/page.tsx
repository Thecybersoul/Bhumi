import AdminTabs from '@/components/admin/AdminTabs'
import TransactionBoard from '@/components/admin/TransactionBoard'
import LeadInbox from '@/components/admin/LeadInbox'
import DataRoomQueue from '@/components/admin/DataRoomQueue'
import { getTransactions, getProperties, getLeads, getDataRoomRequests } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Deals · Admin' }

/* Everything that starts as someone else's interest and might end
   as a signed deal — the pipeline, the raw inbox feeding it, and
   the data-room requests that are really just a large-parcel
   flavour of the same inbox — lived as three separate nav entries.
   One page, three tabs: still three real views (each component is
   unchanged), just not three places to check every day. */

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const [{ data: transactions, source: txnSource }, { data: properties }, { data: leads, source: leadSource }, { data: dataRoom, source: dataRoomSource }] =
    await Promise.all([getTransactions(), getProperties({ admin: true }), getLeads(), getDataRoomRequests()])

  return (
    <>
      <AdminTabs
        defaultTab={tab}
        tabs={[
          {
            id: 'pipeline',
            label: 'Pipeline',
            count: transactions.length,
            content: <TransactionBoard transactions={transactions} properties={properties} source={txnSource} />,
          },
          {
            id: 'leads',
            label: 'Leads',
            count: leads.length,
            content: <LeadInbox leads={leads} source={leadSource} />,
          },
          {
            id: 'documents',
            label: 'Document requests',
            count: dataRoom.length,
            content: <DataRoomQueue requests={dataRoom} source={dataRoomSource} />,
          },
        ]}
      />
    </>
  )
}
