/* Calling the ERP's own /api routes from the server, as a given person.
   Used by features that act on several records at once (the WhatsApp
   import, the Claude connector) so every write goes through the same
   routes as the app and the web: same validation, Drive folders,
   activity trail and attribution. */

export type ErpCall = (method: string, path: string, body?: unknown) => Promise<{ status: number; json: Record<string, unknown> }>

export function erpCaller(origin: string, auth: { cookie?: string | null; authorization?: string | null }): ErpCall {
  const headers: Record<string, string> = {}
  if (auth.cookie) headers.cookie = auth.cookie
  if (auth.authorization) headers.authorization = auth.authorization
  return async (method, path, body) => {
    const res = await fetch(`${origin}${path}`, {
      method,
      headers: { ...headers, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    return { status: res.status, json }
  }
}

export function errorOf(r: { status: number; json: Record<string, unknown> }): string | null {
  if (r.status < 400) return null
  return String(r.json.error ?? r.json.message ?? `Request failed (${r.status})`)
}
