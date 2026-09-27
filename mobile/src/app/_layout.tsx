import { useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import * as Updates from 'expo-updates'
import { SessionProvider, useSession } from '@/lib/auth'
import { clearAll, configureNotifications, ensurePermission, refreshAll, registerBackgroundRefresh } from '@/lib/notify'
import { forget as forgetWebPush, registerWorker } from '@/lib/webPush'
import { useShareIntent } from 'expo-share-intent'
import { setShared } from '@/lib/shared'
import { LoadingScreen } from '@/components/ui'
import { colors } from '@/lib/theme'
import '@/lib/webAlert'

configureNotifications()

/* expo-notifications has no web implementation of this hook: calling it
   throws and blanks the iPhone home-screen app. Platform.OS never changes
   at runtime, so choosing the hook once here keeps hook order stable. */
const useLastNotificationResponse: () => Notifications.NotificationResponse | null | undefined =
  Platform.OS === 'web' ? () => null : Notifications.useLastNotificationResponse

/* Reminders and team updates while someone is signed in. Refresh on
   sign-in and whenever the app comes back to the foreground (at most
   every two minutes). Background refresh covers the rest. Signing out
   clears every scheduled reminder. */
function useNotifications(token: string | null) {
  const last = useRef(0)
  const signedIn = useRef(false)
  useEffect(() => {
    // The iPhone home-screen app: the server pushes (lib/webPush.ts). Keep
    // the worker registered while signed in; signing out stops this device
    // receiving that person's notifications.
    if (Platform.OS === 'web') {
      if (token) registerWorker()
      else if (signedIn.current) forgetWebPush()
      signedIn.current = !!token
      return
    }
    if (!token) {
      clearAll()
      return
    }
    const run = () => {
      if (Date.now() - last.current < 120_000) return
      last.current = Date.now()
      refreshAll().catch(() => {})
    }
    ensurePermission().then(() => {
      registerBackgroundRefresh()
      run()
    })
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run())
    return () => sub.remove()
  }, [token])

  // Tapping a notification opens what it's about.
  const response = useLastNotificationResponse()
  useEffect(() => {
    const path = response?.notification.request.content.data?.path
    if (token && typeof path === 'string' && path) router.push(path as never)
  }, [response, token])
}

/* Shared into Bhumi from WhatsApp (or any app): hand it to the
   assistant, which files it as a listing or lead. On builds without the
   share module, and on the web, the hook does nothing. */
function useSharedIntoApp(token: string | null) {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({ resetOnBackground: true, disabled: Platform.OS === 'web' })
  useEffect(() => {
    if (!hasShareIntent || !token) return
    setShared({
      text: [shareIntent.text, shareIntent.webUrl && !shareIntent.text?.includes(shareIntent.webUrl) ? shareIntent.webUrl : null].filter(Boolean).join('\n'),
      files: (shareIntent.files ?? []).map((f) => ({ uri: f.path, name: f.fileName || 'shared-file', mime: f.mimeType || 'application/octet-stream', size: f.size ?? null })),
    })
    resetShareIntent()
    router.push({ pathname: '/assistant', params: { shared: String(Date.now()) } })
  }, [hasShareIntent, shareIntent, token, resetShareIntent])
}

/* Over-the-air updates, applied promptly. By default expo-updates only
   swaps in a downloaded update on a cold start, and Android keeps apps
   alive for days, so phones lagged far behind. Instead: whenever the app
   opens or comes back to the foreground (at most every 5 minutes), check;
   if there's a new version and it arrives within a few seconds, restart
   into it straight away, before anyone has started typing. A slower
   download still lands and is used on the next open. */
function useFreshUpdates() {
  const last = useRef(0)
  useEffect(() => {
    if (Platform.OS === 'web' || __DEV__ || !Updates.isEnabled) return
    const run = async () => {
      if (Date.now() - last.current < 5 * 60_000) return
      last.current = Date.now()
      const started = Date.now()
      try {
        const r = await Updates.checkForUpdateAsync()
        if (!r.isAvailable) return
        const f = await Updates.fetchUpdateAsync()
        if (f.isNew && Date.now() - started < 8000 && AppState.currentState === 'active') await Updates.reloadAsync()
      } catch {
        /* offline or the update server is unreachable: try again later */
      }
    }
    run()
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run())
    return () => sub.remove()
  }, [])
}

function RootNavigator() {
  const { token, isLoading } = useSession()
  useNotifications(token)
  useFreshUpdates()
  useSharedIntoApp(isLoading ? null : token)
  if (isLoading) return <LoadingScreen />

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="transaction/[id]" options={{ title: 'Transaction' }} />
        <Stack.Screen name="property/[id]" options={{ title: 'Listing' }} />
        <Stack.Screen name="lead/[id]" options={{ title: 'Lead' }} />
        <Stack.Screen name="contact/[id]" options={{ title: 'Contact' }} />
        <Stack.Screen name="content/index" options={{ title: 'Website content' }} />
        <Stack.Screen name="content/[key]" options={{ title: 'Edit content' }} />
        <Stack.Screen name="media" options={{ title: 'Media library' }} />
        <Stack.Screen name="documents" options={{ title: 'Documents' }} />
        <Stack.Screen name="meeting/[id]" options={{ title: 'Meeting' }} />
        <Stack.Screen name="activity" options={{ title: 'Team activity' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="assistant" options={{ title: 'Assistant' }} />
        <Stack.Screen name="chat/index" options={{ title: 'Messages' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Messages' }} />
        <Stack.Screen name="email" options={{ title: 'New email', presentation: 'modal' }} />
        <Stack.Screen name="google" options={{ headerShown: false, animation: 'none' }} />
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
