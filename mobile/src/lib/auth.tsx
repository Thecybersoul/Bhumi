import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from './config'

const TOKEN_KEY = 'bhumi_admin_token'

/* SecureStore has no web implementation at all (it throws, rather
   than degrading) — localStorage is the web equivalent for a
   token that isn't especially sensitive on a platform with no
   OS-level secure storage anyway. Native (iOS/Android, the actual
   target) keeps the hardware-backed SecureStore. */
const storage = {
  async get(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null
    return SecureStore.getItemAsync(key)
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value)
    return SecureStore.setItemAsync(key, value)
  },
  async remove(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key)
    return SecureStore.deleteItemAsync(key)
  },
}

interface SessionState {
  token: string | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

/** The one credential the app holds — the same signed session
    token `lib/session.ts` issues on the web, just carried in
    SecureStore + a bearer header instead of a cookie (see
    lib/auth.ts's isAdmin() on the backend). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    storage
      .get(TOKEN_KEY)
      .then(setToken)
      .finally(() => setIsLoading(false))
  }, [])

  async function signIn(email: string, password: string) {
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json()
      if (!res.ok || !body.token) {
        setError(body.error ?? 'Sign in failed')
        return false
      }
      await storage.set(TOKEN_KEY, body.token)
      setToken(body.token)
      return true
    } catch {
      setError('Could not reach the server. Check the app is pointed at the right URL.')
      return false
    }
  }

  async function signOut() {
    await storage.remove(TOKEN_KEY)
    setToken(null)
  }

  return (
    <SessionContext.Provider value={{ token, isLoading, error, signIn, signOut }}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
