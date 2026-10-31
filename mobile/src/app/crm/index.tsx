import { Redirect, useLocalSearchParams } from 'expo-router'

/* The Sales CRM is now the funnel in the Sales tab. */
export default function CrmMoved() {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  return <Redirect href={{ pathname: '/sales', params: { view: tab === 'pipeline' ? 'deals' : tab ?? 'funnel' } }} />
}
