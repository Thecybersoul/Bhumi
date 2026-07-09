import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization — avoids build-time errors when env vars are absent
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

// Server-side service client — new instance each call (service key must not be cached in browser)
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service env vars')
  return createClient(url, key)
}
