import Constants from 'expo-constants'
import { Platform } from 'react-native'

/* The backend is the same Next.js app the web admin talks to —
   set EXPO_PUBLIC_API_URL when starting the dev server, or edit
   app.json's expo.extra.apiUrl for a build. No trailing slash.

   The web export is served by that same site under /app (the iPhone
   home-screen app), so a production web build talks to whichever origin
   it was loaded from — apex, www or a preview deploy alike. */
const sameOrigin =
  Platform.OS === 'web' && !__DEV__ ? (globalThis.location?.origin as string | undefined) : undefined

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  sameOrigin ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'http://localhost:3000'
