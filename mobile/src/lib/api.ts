import { useCallback, useMemo } from 'react'
import { API_URL } from './config'
import { useSession } from './auth'

export class ApiError extends Error {
  /** The HTTP status and parsed body, for callers that act on them —
      e.g. a 409 naming the contact who already has that number. */
  constructor(message: string, public status = 0, public body: Record<string, unknown> = {}) {
    super(message)
  }
}

async function request<T>(token: string | null, path: string, init?: RequestInit, onExpired?: () => void): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      // A multipart body must set its own boundary — never a JSON content type.
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  // A rejected token means the session is over: back to sign-in,
  // instead of every screen showing "Not authorised".
  if (res.status === 401 && token) onExpired?.()
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body)
  return body as T
}

/** Bound to the current session's token — every screen calls
    `const api = useApi()` once and uses api.get/post/patch/put/del/upload. */
export function useApi() {
  const { token, signOut } = useSession()

  const get = useCallback(<T,>(path: string) => request<T>(token, path, undefined, signOut), [token, signOut])
  const send = useCallback(
    <T,>(method: string, path: string, body?: unknown) =>
      request<T>(token, path, { method, body: JSON.stringify(body ?? {}) }, signOut),
    [token, signOut]
  )
  const post = useCallback(<T,>(path: string, body?: unknown) => send<T>('POST', path, body), [send])
  const patch = useCallback(<T,>(path: string, body?: unknown) => send<T>('PATCH', path, body), [send])
  const put = useCallback(<T,>(path: string, body?: unknown) => send<T>('PUT', path, body), [send])
  const del = useCallback(<T,>(path: string) => request<T>(token, path, { method: 'DELETE' }, signOut), [token, signOut])
  const upload = useCallback(
    <T,>(path: string, form: FormData) => request<T>(token, path, { method: 'POST', body: form }, signOut),
    [token, signOut]
  )

  // Memoised: screens list `api` in effect dependencies, so a fresh
  // object every render would refetch in a loop.
  return useMemo(() => ({ get, post, patch, put, del, upload }), [get, post, patch, put, del, upload])
}
