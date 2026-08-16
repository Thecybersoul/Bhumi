import VerificationBoard from '@/components/admin/VerificationBoard'
import { getVerificationCases, deriveFromCases } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Verification pipeline · Admin' }

export default async function VerificationsPage() {
  const { data, source } = await getVerificationCases()
  return <VerificationBoard cases={data} source={source} aggregate={deriveFromCases(data)} />
}
