import { Redirect, useLocalSearchParams } from 'expo-router'

/* Deals moved into the Sales tab. Notification links from older builds
   and bookmarks still open /deals; send them to the right view. */
export default function DealsMoved() {
  const { view } = useLocalSearchParams<{ view?: string }>()
  return <Redirect href={{ pathname: '/sales', params: { view: view ?? 'deals' } }} />
}
