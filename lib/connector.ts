import { createHash, randomBytes } from 'node:crypto'
import { createServiceClient, hasSupabase } from './supabase'
import { getUser, type AdminUser } from './users'

/* Claude connector links (migration 019). A link is
   https://<site>/api/mcp/<secret>; the secret is 32 random bytes, shown
   once, and only its SHA-256 is stored. See app/api/mcp/[token]. */

export interface ConnectorToken {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
}

const hash = (secret: string) => createHash('sha256').update(secret).digest('hex')

export async function connectorReady(): Promise<boolean> {
  if (!hasSupabase()) return false
  const { error } = await createServiceClient().from('connector_tokens').select('id').limit(1)
  return !error
}

/** A new link secret for this person. The caller shows it once. */
export async function createConnectorToken(userId: string, label = 'Claude'): Promise<string> {
  const secret = randomBytes(32).toString('base64url')
  const { error } = await createServiceClient().from('connector_tokens').insert({ user_id: userId, token_hash: hash(secret), label: label.slice(0, 60) })
  if (error) throw new Error(error.message)
  return secret
}

export async function listConnectorTokens(userId: string): Promise<ConnectorToken[]> {
  const { data } = await createServiceClient()
    .from('connector_tokens')
    .select('id,label,created_at,last_used_at')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
  return (data ?? []) as ConnectorToken[]
}

export async function revokeConnectorToken(userId: string, id: string) {
  await createServiceClient().from('connector_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId)
}

/** The active person behind a link secret, or null. Records the use. */
export async function userForConnector(secret: string): Promise<AdminUser | null> {
  if (!secret || secret.length < 30 || !hasSupabase()) return null
  const sb = createServiceClient()
  const { data } = await sb.from('connector_tokens').select('id,user_id,revoked_at,last_used_at').eq('token_hash', hash(secret)).maybeSingle()
  if (!data || data.revoked_at) return null
  const user = await getUser(String(data.user_id))
  if (!user) return null
  // At most one write a minute, not one per request.
  if (!data.last_used_at || Date.now() - new Date(data.last_used_at).getTime() > 60_000) {
    await sb.from('connector_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
  }
  return user
}
