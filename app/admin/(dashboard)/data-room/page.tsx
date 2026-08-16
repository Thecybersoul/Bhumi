import DataRoomQueue from '@/components/admin/DataRoomQueue'
import { getDataRoomRequests } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Data room requests · Admin' }

export default async function DataRoomPage() {
  const { data, source } = await getDataRoomRequests()
  return <DataRoomQueue requests={data} source={source} />
}
