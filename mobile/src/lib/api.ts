import { useCallback } from 'react'
import { API_URL } from './config'
import { useSession } from './auth'

export class ApiError extends Error {}

async function request<T>(token: string | null, path: string, init?: RequestInit): Promise<T> {
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
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`)
  return body as T
}

/** Bound to the current session's token — every screen calls
    `const api = useApi()` once and uses api.get/post/patch/put/del/upload. */
export function useApi() {
  const { token } = useSession()

  const get = useCallback(<T,>(path: string) => request<T>(token, path), [token])
  const send = useCallback(
    <T,>(method: string, path: string, body?: unknown) =>
      request<T>(token, path, { method, body: JSON.stringify(body ?? {}) }),
    [token]
  )
  const post = useCallback(<T,>(path: string, body?: unknown) => send<T>('POST', path, body), [send])
  const patch = useCallback(<T,>(path: string, body?: unknown) => send<T>('PATCH', path, body), [send])
  const put = useCallback(<T,>(path: string, body?: unknown) => send<T>('PUT', path, body), [send])
  const del = useCallback(<T,>(path: string) => request<T>(token, path, { method: 'DELETE' }), [token])
  const upload = useCallback(
    <T,>(path: string, form: FormData) => request<T>(token, path, { method: 'POST', body: form }),
    [token]
  )

  return { get, post, patch, put, del, upload }
}
