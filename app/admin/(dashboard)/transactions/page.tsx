import TransactionBoard from '@/components/admin/TransactionBoard'
import { getTransactions, getProperties } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Transactions · Admin' }

export default async function TransactionsPage() {
  const [{ data, source }, { data: properties }] = await Promise.all([
    getTransactions(),
    getProperties({ admin: true }),
  ])
  return <TransactionBoard transactions={data} properties={properties} source={source} />
}
