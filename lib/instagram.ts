import { createHmac } from 'node:crypto'
import { createServiceClient } from './supabase'

/* ═══════════════════════════════════════════════════════════
   Instagram through Meta's API: "Instagram API with Instagram Login"
   (no Facebook Page needed). Migration 027.

   Setup, once (see the Instagram page in the admin): in the same Meta app
   as WhatsApp, add the Instagram product → "API setup with Instagram
   login", set the redirect URL to <site>/api/ig/callback, and put
   IG_APP_ID and IG_APP_SECRET on Vercel. Publishing to the firm's own
   account needs no App Review. All of it is free.
   ═══════════════════════════════════════════════════════════ */

const GRAPH = 'https://graph.instagram.com'
export const IG_SCOPES = ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_comments', 'instagram_business_manage_messages']
export const igConfigured = () => !!(process.env.IG_APP_ID && process.env.IG_APP_SECRET)
export const redirectUri = (origin: string) => `${origin.replace('://bhumiestates.in', '://www.bhumiestates.in')}/api/ig/callback`

const db = () => createServiceClient()

export interface IgAccount { id: string; ig_user_id: string; username: string; token: string; token_expires_at: string | null; status: string; last_error: string; connected_at: string }
export interface IgPost {
  id: string
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  kind: 'image' | 'carousel' | 'reel'
  image_urls: string[]
  video_url: string
  caption: string
  property_id: string | null
  scheduled_at: string | null
  published_at: string | null
  ig_media_id: string
  permalink: string
  error: string
  approved_by: string | null
  created_by: string | null
  created_at: string
}

/** A signed `state` so the OAuth callback knows the request came from us. */
export function signState(userId: string): string {
  const exp = Date.now() + 10 * 60_000
  const payload = `${userId}.${exp}`
  const sig = createHmac('sha256', process.env.IG_APP_SECRET ?? '').update(payload).digest('hex').slice(0, 32)
  return `${payload}.${sig}`
}
export function readState(state: string): string | null {
  const [uid, exp, sig] = state.split('.')
  if (!uid || !exp || !sig || Number(exp) < Date.now()) return null
  const want = createHmac('sha256', process.env.IG_APP_SECRET ?? '').update(`${uid}.${exp}`).digest('hex').slice(0, 32)
  return want === sig ? uid : null
}

export function authorizeUrl(origin: string, userId: string): string {
  const q = new URLSearchParams({
    client_id: process.env.IG_APP_ID!,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: IG_SCOPES.join(','),
    state: signState(userId),
  })
  return `https://www.instagram.com/oauth/authorize?${q}`
}

async function ig<T = Record<string, unknown>>(path: string, token: string, init?: { method?: string; params?: Record<string, string> }): Promise<T> {
  const q = new URLSearchParams({ ...(init?.params ?? {}) })
  const isPost = init?.method === 'POST'
  const url = `${GRAPH}${path}${!isPost && q.toString() ? `?${q}` : ''}`
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(isPost ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: isPost ? q.toString() : undefined,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(json.error?.message ?? `Instagram answered ${res.status}`)
  return json
}

/** OAuth code → long-lived (60-day) token, stored with the account. */
export async function connect(origin: string, code: string, by: string) {
  const form = new URLSearchParams({ client_id: process.env.IG_APP_ID!, client_secret: process.env.IG_APP_SECRET!, grant_type: 'authorization_code', redirect_uri: redirectUri(origin), code })
  const res = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form, cache: 'no-store' })
  type Short = { access_token?: string; user_id?: string | number; error_message?: string }
  const body = (await res.json().catch(() => ({}))) as Short & { data?: Short[] }
  const short: Short = body.data?.[0] ?? body // Meta documents both shapes
  if (!short.access_token) throw new Error(short.error_message ?? body.error_message ?? 'Instagram did not return a token')
  const longRes = await fetch(`${GRAPH}/access_token?${new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: process.env.IG_APP_SECRET!, access_token: short.access_token })}`, { cache: 'no-store' })
  const long = (await longRes.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: { message?: string } }
  // A short-lived token dies in an hour and can't be refreshed, so it is never stored.
  if (!long.access_token) throw new Error(`Instagram did not give a lasting token: ${long.error?.message ?? longRes.status}`)
  const token = long.access_token
  const me = await ig<{ user_id?: string; id?: string; username?: string }>('/me', token, { params: { fields: 'user_id,username' } })
  const igUserId = String(me.user_id ?? me.id ?? short.user_id ?? '')
  const { error } = await db()
    .from('ig_accounts')
    .upsert(
      { ig_user_id: igUserId, username: me.username ?? '', token, token_expires_at: long.expires_in ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null, status: 'connected', last_error: '', connected_by: by, updated_at: new Date().toISOString() },
      { onConflict: 'ig_user_id' }
    )
  if (error) throw new Error(error.message)
  // Deliver this account's DMs and comments to /api/ig/webhook (needed per account, after login).
  try {
    await ig(`/v27.0/${igUserId}/subscribed_apps`, token, { method: 'POST', params: { subscribed_fields: 'messages,comments' } })
  } catch (e) {
    await db().from('ig_accounts').update({ last_error: `Webhook subscription: ${(e as Error).message}` }).eq('ig_user_id', igUserId)
  }
  return { username: me.username ?? '' }
}

export async function account(): Promise<IgAccount | null> {
  const { data } = await db().from('ig_accounts').select('*').eq('status', 'connected').order('connected_at', { ascending: false }).limit(1).maybeSingle()
  return (data as IgAccount) ?? null
}

export async function disconnect(id: string) {
  await db().from('ig_accounts').update({ status: 'disconnected', token: '', updated_at: new Date().toISOString() }).eq('id', id)
}

/** Long-lived tokens last 60 days; refresh any older than 7 days so they never lapse. */
export async function refreshTokenIfDue() {
  const a = await account()
  if (!a?.token_expires_at) return
  const left = new Date(a.token_expires_at).getTime() - Date.now()
  if (left > 53 * 86_400_000) return
  try {
    const r = await fetch(`${GRAPH}/refresh_access_token?${new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: a.token })}`, { cache: 'no-store' })
    const j = (await r.json()) as { access_token?: string; expires_in?: number }
    if (j.access_token) await db().from('ig_accounts').update({ token: j.access_token, token_expires_at: new Date(Date.now() + (j.expires_in ?? 5_184_000) * 1000).toISOString(), last_error: '' }).eq('id', a.id)
  } catch (e) {
    await db().from('ig_accounts').update({ last_error: `Token refresh: ${(e as Error).message}` }).eq('id', a.id)
  }
}

/* ─── Posts ───────────────────────────────────────────────── */

export async function listPosts(limit = 50): Promise<IgPost[]> {
  const { data } = await db().from('ig_posts').select('*').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []) as IgPost[]
}

const httpsOnly = (u: unknown) => typeof u === 'string' && /^https:\/\//i.test(u.trim())

export function cleanPost(body: Record<string, unknown>) {
  const imgs = Array.isArray(body.image_urls) ? (body.image_urls as unknown[]).filter(httpsOnly).map((u) => String(u).trim()).slice(0, 10) : undefined
  const video = body.video_url !== undefined ? (httpsOnly(body.video_url) ? String(body.video_url).trim() : '') : undefined
  const out: Record<string, unknown> = {}
  if (imgs) out.image_urls = imgs
  if (video !== undefined) out.video_url = video
  if (body.caption !== undefined) out.caption = String(body.caption).slice(0, 2200)
  if (body.property_id !== undefined) out.property_id = body.property_id ? String(body.property_id) : null
  if (body.scheduled_at !== undefined) out.scheduled_at = body.scheduled_at && !Number.isNaN(Date.parse(String(body.scheduled_at))) ? new Date(String(body.scheduled_at)).toISOString() : null
  const v = (out.video_url as string | undefined) ?? ''
  const n = ((out.image_urls as string[] | undefined) ?? []).length
  if (out.video_url !== undefined || out.image_urls !== undefined) out.kind = v ? 'reel' : n > 1 ? 'carousel' : 'image'
  return out
}

async function waitFinished(container: string, token: string) {
  for (let i = 0; i < 20; i++) {
    const s = await ig<{ status_code?: string }>(`/${container}`, token, { params: { fields: 'status_code' } })
    if (s.status_code === 'FINISHED') return
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Instagram could not process the media (${s.status_code})`)
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('Instagram is still processing the video; it will be retried.')
}

/** Publish one post now. */
export async function publish(postId: string, by: string): Promise<IgPost> {
  const sb = db()
  const a = await account()
  if (!a) throw new Error('Instagram is not connected.')
  const { data: p } = await sb.from('ig_posts').select('*').eq('id', postId).maybeSingle()
  if (!p) throw new Error('No such post')
  const post = p as IgPost
  if (post.status === 'published') return post
  if (!post.video_url && !post.image_urls.length) throw new Error('Add at least one photo (or a video) first.')
  await sb.from('ig_posts').update({ status: 'publishing', error: '', approved_by: post.approved_by ?? by }).eq('id', postId)
  try {
    const u = a.ig_user_id
    let creation: string
    if (post.kind === 'reel') {
      const c = await ig<{ id: string }>(`/${u}/media`, a.token, { method: 'POST', params: { media_type: 'REELS', video_url: post.video_url, caption: post.caption, share_to_feed: 'true' } })
      await waitFinished(c.id, a.token)
      creation = c.id
    } else if (post.image_urls.length > 1) {
      const children: string[] = []
      for (const url of post.image_urls) {
        const c = await ig<{ id: string }>(`/${u}/media`, a.token, { method: 'POST', params: { image_url: url, is_carousel_item: 'true' } })
        children.push(c.id)
      }
      for (const c of children) await waitFinished(c, a.token)
      const c = await ig<{ id: string }>(`/${u}/media`, a.token, { method: 'POST', params: { media_type: 'CAROUSEL', children: children.join(','), caption: post.caption } })
      await waitFinished(c.id, a.token)
      creation = c.id
    } else {
      const c = await ig<{ id: string }>(`/${u}/media`, a.token, { method: 'POST', params: { image_url: post.image_urls[0], caption: post.caption } })
      await waitFinished(c.id, a.token)
      creation = c.id
    }
    const pub = await ig<{ id: string }>(`/${u}/media_publish`, a.token, { method: 'POST', params: { creation_id: creation } })
    const info = await ig<{ permalink?: string }>(`/${pub.id}`, a.token, { params: { fields: 'permalink' } }).catch(() => ({}) as { permalink?: string })
    const { data } = await sb
      .from('ig_posts')
      .update({ status: 'published', ig_media_id: pub.id, permalink: info.permalink ?? '', published_at: new Date().toISOString(), error: '', updated_by: by, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .select('*')
      .single()
    return data as IgPost
  } catch (e) {
    const msg = (e as Error).message
    await sb.from('ig_posts').update({ status: 'failed', error: msg.slice(0, 500), updated_at: new Date().toISOString() }).eq('id', postId)
    throw new Error(msg)
  }
}

/** Publish approved posts whose time has come. Called by the 5-minute reminders job. */
export async function publishDue() {
  if (!igConfigured()) return 0
  const { data } = await db().from('ig_posts').select('id,approved_by').eq('status', 'scheduled').lte('scheduled_at', new Date().toISOString()).limit(5)
  let n = 0
  for (const p of data ?? []) {
    try {
      await publish(p.id, p.approved_by ?? 'Schedule')
      n++
    } catch (e) {
      console.error('[bhumi] ig publish failed', (e as Error).message)
    }
  }
  await refreshTokenIfDue()
  return n
}

/* ─── Conversations and numbers ───────────────────────────── */

/** "@name" for an Instagram user id, best effort (DM webhooks carry only the id). */
export async function usernameFor(igsid: string): Promise<string> {
  const a = await account()
  if (!a) return ''
  try {
    const r = await ig<{ username?: string; name?: string }>(`/${igsid}`, a.token, { params: { fields: 'username,name' } })
    return r.username ? `@${r.username}` : r.name ?? ''
  } catch {
    return ''
  }
}

/** Reply to a DM (Meta allows it within 24 hours of their last message) or to a comment. */
export async function reply(target: { dm_to?: string; comment_id?: string }, text: string): Promise<string> {
  const a = await account()
  if (!a) throw new Error('Instagram is not connected.')
  if (target.comment_id) {
    const r = await ig<{ id: string }>(`/${target.comment_id}/replies`, a.token, { method: 'POST', params: { message: text } })
    return r.id
  }
  const res = await fetch(`${GRAPH}/${a.ig_user_id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${a.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: target.dm_to }, message: { text } }),
    cache: 'no-store',
  })
  const j = (await res.json().catch(() => ({}))) as { message_id?: string; error?: { message?: string } }
  if (!res.ok) throw new Error(j.error?.message ?? `Instagram answered ${res.status}`)
  return j.message_id ?? ''
}

/** The account's latest posts on Instagram with their likes and comments, and the profile's counts. */
export async function recentMedia(limit = 12) {
  const a = await account()
  if (!a) throw new Error('Instagram is not connected.')
  const r = await ig<{ data?: Record<string, unknown>[] }>(`/${a.ig_user_id}/media`, a.token, {
    params: { fields: 'id,caption,media_type,permalink,timestamp,like_count,comments_count', limit: String(Math.min(50, limit)) },
  })
  const profile = await ig<Record<string, unknown>>('/me', a.token, { params: { fields: 'username,followers_count,follows_count,media_count' } }).catch(() => ({}))
  return { profile, media: r.data ?? [] }
}

/** Comments on recent posts, read through the API: comment webhooks need Meta's Advanced
    Access, so this keeps comments arriving without it. Run by the 5-minute reminders job;
    already-seen comments are skipped by their id (wa_messages.external_id). */
export async function pollComments(posts = 8) {
  const a = await account()
  if (!a) return 0
  const { ingest, captureReady } = await import('./capture')
  if (!(await captureReady())) return 0
  const media = await ig<{ data?: { id: string; caption?: string; comments_count?: number }[] }>(`/${a.ig_user_id}/media`, a.token, { params: { fields: 'id,caption,comments_count', limit: String(posts) } })
  let n = 0
  for (const m of media.data ?? []) {
    if (!m.comments_count) continue
    const c = await ig<{ data?: { id: string; text?: string; username?: string; timestamp?: string; from?: { id?: string; username?: string } }[] }>(`/${m.id}/comments`, a.token, { params: { fields: 'id,text,username,timestamp,from', limit: '50' } }).catch(() => ({ data: [] }))
    const theirs = (c.data ?? []).filter((x) => (x.from?.username ?? x.username) !== a.username && x.from?.id !== a.ig_user_id)
    if (!theirs.length) continue
    const r = await ingest(
      { title: 'Instagram comments', source: 'webhook', intent_business: true, channel: 'instagram' },
      theirs.map((x) => ({ external_id: `igc:${x.id}`, sender_name: `@${x.from?.username ?? x.username ?? 'someone'}`, sent_at: x.timestamp ? new Date(x.timestamp).toISOString() : new Date().toISOString(), kind: 'text' as const, body: `${x.text ?? ''} (on post ${m.id})` })),
      'Instagram'
    )
    n += r.stored ?? 0
  }
  return n
}
