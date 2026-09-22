import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SessionProvider, useSession } from '@/lib/auth'
import { LoadingScreen } from '@/components/ui'

function RootNavigator() {
  const { token, isLoading } = useSession()
  if (isLoading) return <LoadingScreen />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  )
}
