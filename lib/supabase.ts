import { createClient, SupabaseClient } from '@supabase/supabase-js'

/** True when the environment carries enough credentials to reach
    Supabase server-side. Callers use this to choose between live
    data and the seeded fallback rather than throwing. */
export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function hasPublicSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Lazy browser client — avoids build-time errors when env vars are absent
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _client = createClient(url, key)
  }
  return _client
}

// Server-side service client — new instance each call (the service
// key must never be cached into anything that reaches the browser)
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service env vars')
  return createClient(url, key)
}
