import Constants from 'expo-constants'

/* The backend is the same Next.js app the web admin talks to —
   set EXPO_PUBLIC_API_URL when starting the dev server, or edit
   app.json's expo.extra.apiUrl for a build. No trailing slash. */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'http://localhost:3000'
