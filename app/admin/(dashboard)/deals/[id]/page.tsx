import DealEditor from '@/components/erp/DealEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Deal · Admin' }

export default async function AdminDeal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DealEditor id={id} />
}
