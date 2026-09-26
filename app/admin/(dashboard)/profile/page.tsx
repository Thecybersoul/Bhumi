import ProfileView from '@/components/erp/ProfileView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Profile · Admin' }

export default async function AdminProfile({ searchParams }: { searchParams: Promise<{ google?: string; google_message?: string }> }) {
  const { google, google_message } = await searchParams
  return <ProfileView googleResult={google} googleMessage={google_message} />
}
