import { NextRequest, NextResponse } from 'next/server'
import { assertSocial, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { createServiceClient } from '@/lib/supabase'
import { account, authorizeUrl, cleanPost, disconnect, igConfigured, listPosts, publish, recentMedia, reply } from '@/lib/instagram'
import { publishImage } from '@/lib/document-files'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/* Instagram (migration 027, lib/instagram.ts).
   GET                         connection status and posts
   POST {action:'connect'}     → {url} to send the person to Instagram's sign-in
   POST {action:'disconnect', id}
   POST {action:'create', image_urls[]|video_url, caption, property_id?, scheduled_at?}   a draft
   POST {action:'update', id, ...fields}       drafts and scheduled posts only
   POST {action:'approve', id}  scheduled_at in the future → scheduled; otherwise published now
   POST {action:'unschedule', id}  back to draft
   POST {action:'delete', id}   drafts, scheduled and failed posts only (never a published one) */

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** document_ids: photos in the ERP's Documents (JPEG/PNG/WebP), made public and added to image_urls. */
async function photosFromDocuments(body: Record<string, unknown>) {
  const ids = Array.isArray(body.document_ids) ? (body.document_ids as unknown[]).map(String).slice(0, 10) : []
  if (!ids.length) return
  const urls: string[] = Array.isArray(body.image_urls) ? (body.image_urls as string[]) : []
  for (const id of ids) {
    const r = await publishImage(id, { allowPrivate: true, folder: 'instagram' })
    if ('error' in r) throw new Error(r.error)
    urls.push(r.url)
  }
  body.image_urls = urls
}

async function ready() {
  const { error } = await createServiceClient().from('ig_posts').select('id').limit(1)
  return !error
}

export async function GET(req: NextRequest) {
  const denied = await assertSocial()
  if (denied) return denied
  if (req.nextUrl.searchParams.get('insights')) {
    try {
      return NextResponse.json(await recentMedia(Number(req.nextUrl.searchParams.get('limit')) || 12))
    } catch (e) {
      return bad((e as Error).message, 400)
    }
  }
  if (!(await ready())) return NextResponse.json({ ready: false, configured: igConfigured(), error: 'Instagram needs database migration 027. Open Setup and apply pending updates.' })
  const a = await account()
  return NextResponse.json({
    ready: true,
    configured: igConfigured(),
    account: a ? { id: a.id, username: a.username, token_expires_at: a.token_expires_at, last_error: a.last_error, connected_at: a.connected_at } : null,
    posts: await listPosts(),
  })
}

export async function POST(req: NextRequest) {
  const denied = await assertSocial()
  if (denied) return denied
  const user = await currentUser()
  const by = user?.name ?? 'ERP'
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return bad('Invalid request body')
  const sb = createServiceClient()
  const id = String(body.id ?? '')
  try {
    switch (body.action) {
      case 'connect':
        if (!igConfigured()) return bad('The Instagram app is not set up on the server yet (META_APP_ID, META_APP_SECRET and IG_CONFIG_ID).')
        return NextResponse.json({ url: authorizeUrl(req.nextUrl.origin, user?.id ?? '') })

      case 'disconnect':
        await disconnect(id)
        await logActivity({ action: 'update', entity_type: 'instagram', entity_id: id, entity_label: 'Instagram', summary: 'Disconnected Instagram' })
        return NextResponse.json({ ok: true })

      case 'create': {
        await photosFromDocuments(body)
        const row = { ...cleanPost(body), status: 'draft', created_by: by, updated_by: by }
        const { data, error } = await sb.from('ig_posts').insert(row).select('*').single()
        if (error) return bad(error.message, 500)
        await logActivity({ action: 'create', entity_type: 'instagram', entity_id: data.id, entity_label: String(data.caption).slice(0, 60) || 'Instagram post', summary: 'Drafted an Instagram post' })
        return NextResponse.json({ ok: true, data }, { status: 201 })
      }

      case 'update': {
        await photosFromDocuments(body)
        const { data: cur } = await sb.from('ig_posts').select('status').eq('id', id).maybeSingle()
        if (!cur) return bad('No such post', 404)
        if (!['draft', 'scheduled', 'failed'].includes(cur.status)) return bad('A published post can only be changed in Instagram.')
        const { data, error } = await sb.from('ig_posts').update({ ...cleanPost(body), updated_by: by, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
        if (error) return bad(error.message, 500)
        return NextResponse.json({ ok: true, data })
      }

      case 'approve': {
        const { data: p } = await sb.from('ig_posts').select('*').eq('id', id).maybeSingle()
        if (!p) return bad('No such post', 404)
        if (p.status === 'published') return NextResponse.json({ ok: true, data: p })
        if (p.scheduled_at && new Date(p.scheduled_at).getTime() > Date.now() + 60_000) {
          const { data } = await sb.from('ig_posts').update({ status: 'scheduled', approved_by: by, error: '', updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
          await logActivity({ action: 'update', entity_type: 'instagram', entity_id: id, entity_label: String(p.caption).slice(0, 60) || 'Instagram post', summary: `Scheduled an Instagram post for ${new Date(p.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` })
          return NextResponse.json({ ok: true, data })
        }
        await sb.from('ig_posts').update({ approved_by: by }).eq('id', id)
        const data = await publish(id, by)
        await logActivity({ action: 'update', entity_type: 'instagram', entity_id: id, entity_label: String(p.caption).slice(0, 60) || 'Instagram post', summary: 'Published an Instagram post' })
        return NextResponse.json({ ok: true, data })
      }

      case 'unschedule': {
        const { data } = await sb.from('ig_posts').update({ status: 'draft', updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'scheduled').select('*').maybeSingle()
        return NextResponse.json({ ok: true, data })
      }

      case 'delete': {
        const { data: p } = await sb.from('ig_posts').select('status').eq('id', id).maybeSingle()
        if (!p) return NextResponse.json({ ok: true })
        if (p.status === 'published' || p.status === 'publishing') return bad('A published post can only be deleted in Instagram.')
        await sb.from('ig_posts').delete().eq('id', id)
        return NextResponse.json({ ok: true })
      }

      case 'reply': {
        if (body.confirmed !== true) return bad('Replying needs confirmed: true, given only when the person has asked for this exact reply to be sent.')
        const text = String(body.text ?? '').trim().slice(0, 1000)
        if (!text) return bad('text is required')
        const { data: m } = await sb.from('wa_messages').select('external_id,thread_id').eq('id', String(body.message_id ?? '')).maybeSingle()
        if (!m) return bad('No such message', 404)
        const { data: t } = await sb.from('wa_threads').select('id,title,channel,ext_id').eq('id', m.thread_id).maybeSingle()
        if (!t || t.channel !== 'instagram') return bad('That message is not from Instagram. Use the WhatsApp reply for WhatsApp chats.')
        const ext = String(m.external_id)
        const target = ext.startsWith('igc:') ? { comment_id: ext.slice(4) } : { dm_to: String(t.ext_id ?? '') }
        if (!target.comment_id && !target.dm_to) return bad('This Instagram chat has no user id to reply to.')
        const sent = await reply(target, text)
        await sb.from('wa_messages').insert({ thread_id: t.id, external_id: sent ? (target.comment_id ? `igc:${sent}` : `ig:${sent}`) : `igout:${Date.now()}`, source: 'webhook', from_me: true, sent_at: new Date().toISOString(), kind: 'text', body: text, state: 'filed', outcome: `Sent by ${by}` })
        await logActivity({ action: 'create', entity_type: 'instagram', entity_id: t.id, entity_label: t.title, summary: `Replied on Instagram to ${t.title}` })
        return NextResponse.json({ ok: true, id: sent })
      }

      default:
        return bad('Unknown action')
    }
  } catch (e) {
    return bad((e as Error).message, 500)
  }
}
