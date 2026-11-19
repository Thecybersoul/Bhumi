import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { createServiceClient } from '@/lib/supabase'
import { account, authorizeUrl, cleanPost, disconnect, igConfigured, listPosts, publish } from '@/lib/instagram'

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

async function ready() {
  const { error } = await createServiceClient().from('ig_posts').select('id').limit(1)
  return !error
}

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied
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
  const denied = await assertAdmin()
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
        if (!igConfigured()) return bad('The Instagram app is not set up on the server yet (IG_APP_ID and IG_APP_SECRET).')
        return NextResponse.json({ url: authorizeUrl(req.nextUrl.origin, user?.id ?? '') })

      case 'disconnect':
        await disconnect(id)
        await logActivity({ action: 'update', entity_type: 'instagram', entity_id: id, entity_label: 'Instagram', summary: 'Disconnected Instagram' })
        return NextResponse.json({ ok: true })

      case 'create': {
        const row = { ...cleanPost(body), status: 'draft', created_by: by, updated_by: by }
        const { data, error } = await sb.from('ig_posts').insert(row).select('*').single()
        if (error) return bad(error.message, 500)
        await logActivity({ action: 'create', entity_type: 'instagram', entity_id: data.id, entity_label: String(data.caption).slice(0, 60) || 'Instagram post', summary: 'Drafted an Instagram post' })
        return NextResponse.json({ ok: true, data }, { status: 201 })
      }

      case 'update': {
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

      default:
        return bad('Unknown action')
    }
  } catch (e) {
    return bad((e as Error).message, 500)
  }
}
