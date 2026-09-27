import LeadEditor from '@/components/erp/LeadEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Lead · Admin' }

export default async function AdminLead({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ contact?: string }> }) {
  const [{ id }, { contact }] = await Promise.all([params, searchParams])
  return <LeadEditor id={id} contactId={contact} />
}
