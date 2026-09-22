import { useCallback } from 'react'
import { API_URL } from './config'
import { useSession } from './auth'

export class ApiError extends Error {}

async function request<T>(token: string | null, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`)
  return body as T
}

/** Bound to the current session's token — every screen calls
    `const api = useApi()` once and uses api.get/post/patch/del. */
export function useApi() {
  const { token } = useSession()

  const get = useCallback(<T,>(path: string) => request<T>(token, path), [token])
  const post = useCallback(
    <T,>(path: string, body?: unknown) => request<T>(token, path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    [token]
  )
  const patch = useCallback(
    <T,>(path: string, body?: unknown) => request<T>(token, path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
    [token]
  )
  const del = useCallback(<T,>(path: string) => request<T>(token, path, { method: 'DELETE' }), [token])

  return { get, post, patch, del }
}
