import AdminTabs from '@/components/admin/AdminTabs'
import VerificationBoard from '@/components/admin/VerificationBoard'
import ListingsView from '@/components/erp/ListingsView'
import { getVerificationCases, deriveFromCases } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Listings · Admin' }

/* Listings and verification sit together: a verification case is
   always about one specific parcel. The listings tab is the same
   view as the app's Listings tab. */
export default async function AdminProperties({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const { data: cases, source } = await getVerificationCases()

  return (
    <div className="erpPage">
      <AdminTabs
        defaultTab={tab}
        tabs={[
          { id: 'listings', label: 'Marketplace', content: <ListingsView /> },
          { id: 'verification', label: 'Verification', count: cases.length, content: <VerificationBoard cases={cases} source={source} aggregate={deriveFromCases(cases)} /> },
        ]}
      />
    </div>
  )
}
