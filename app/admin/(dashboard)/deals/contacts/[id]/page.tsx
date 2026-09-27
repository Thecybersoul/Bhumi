import ContactEditor from '@/components/erp/ContactEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contact · Admin' }

export default async function AdminContact({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ agent?: string }> }) {
  const [{ id }, { agent }] = await Promise.all([params, searchParams])
  return <ContactEditor id={id} agent={agent === '1'} />
}
