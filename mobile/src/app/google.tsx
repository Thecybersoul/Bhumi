import { useEffect } from 'react'
import { router } from 'expo-router'
import { LoadingScreen } from '@/components/ui'

/* Landing spot for bhumiadmin://google?google=connected — where the
   server sends the phone after the Google consent screen. The More
   tab already refreshes its status on focus, so all this does is
   step back to wherever the admin started. */
export default function GoogleReturn() {
  useEffect(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/profile')
  }, [])
  return <LoadingScreen />
}
