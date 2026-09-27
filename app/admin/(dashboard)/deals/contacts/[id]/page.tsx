import ContactEditor from '@/components/erp/ContactEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contact · Admin' }

export default async function AdminContact({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContactEditor id={id} />
}
