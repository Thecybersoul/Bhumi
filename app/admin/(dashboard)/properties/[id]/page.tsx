import ListingEditor from '@/components/erp/ListingEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Listing · Admin' }

export default async function AdminListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ListingEditor id={decodeURIComponent(id)} />
}
