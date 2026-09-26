import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SessionProvider, useSession } from '@/lib/auth'
import { LoadingScreen } from '@/components/ui'
import { colors } from '@/lib/theme'

function RootNavigator() {
  const { token, isLoading } = useSession()
  if (isLoading) return <LoadingScreen />

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="transaction/[id]" options={{ title: 'Transaction' }} />
        <Stack.Screen name="property/[id]" options={{ title: 'Listing' }} />
        <Stack.Screen name="content/index" options={{ title: 'Website content' }} />
        <Stack.Screen name="content/[key]" options={{ title: 'Edit content' }} />
        <Stack.Screen name="media" options={{ title: 'Media library' }} />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SessionProvider>
  )
}
