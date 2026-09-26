import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from './config'

export const TOKEN_KEY = 'bhumi_admin_token'

/* SecureStore has no web implementation at all (it throws, rather
   than degrading) — localStorage is the web equivalent for a
   token that isn't especially sensitive on a platform with no
   OS-level secure storage anyway. Native (iOS/Android, the actual
   target) keeps the hardware-backed SecureStore. */
export const storage = {
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

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

interface SessionState {
  token: string | null
  user: SessionUser | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)
const USER_KEY = 'bhumi_admin_user'

/* A usable token has three parts (<expiry>.<account>.<signature>)
   and an expiry still in the future. Tokens from before named
   accounts have two parts and are dropped, which sends that person
   to sign in once under their own name. */
const alive = (t: string | null) => !!t && t.split('.').length === 3 && Number(t.split('.')[0]) > Date.now()

/** The one credential the app holds is the signed session token that
    `lib/session.ts` issues on the web. Here it is carried in
    SecureStore and a bearer header instead of a cookie; see
    lib/auth.ts's currentUser() on the backend. The token names the
    account, so every change made from this phone is recorded
    against that person. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const t = await storage.get(TOKEN_KEY)
        if (!alive(t)) {
          if (t) await storage.remove(TOKEN_KEY)
          return
        }
        setToken(t)
        const cached = await storage.get(USER_KEY)
        if (cached) setUser(JSON.parse(cached))
        // Refresh the profile in the background; a rejected token is
        // handled by useApi's 401 → sign-out on the first screen load.
        fetch(`${API_URL}/api/admin/me`, { headers: { Authorization: `Bearer ${t}` } })
          .then((r) => (r.ok ? r.json() : null))
          .then((b) => {
            if (b?.user) {
              setUser(b.user)
              storage.set(USER_KEY, JSON.stringify(b.user))
            }
          })
          .catch(() => {})
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  async function signIn(email: string, password: string) {
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, client: 'app' }),
      })
      const body = await res.json()
      if (!res.ok || !body.token) {
        setError(body.error ?? 'Sign in failed')
        return false
      }
      await storage.set(TOKEN_KEY, body.token)
      if (body.user) await storage.set(USER_KEY, JSON.stringify(body.user))
      setUser(body.user ?? null)
      setToken(body.token)
      return true
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      return false
    }
  }

  // Stable identity: useApi() depends on it, and screens depend on api.
  const signOut = useCallback(async () => {
    await storage.remove(TOKEN_KEY)
    await storage.remove(USER_KEY)
    setUser(null)
    setToken(null)
  }, [])

  return (
    <SessionContext.Provider value={{ token, user, isLoading, error, signIn, signOut }}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
