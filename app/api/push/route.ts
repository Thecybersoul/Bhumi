import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { DEFAULT_PUSH_PREFS, pushTo, vapidKeys, type PushPrefs, type Subscription } from '@/lib/webpush'

export const dynamic = 'force-dynamic'

/* Web Push subscriptions for the iPhone home-screen app (lib/webpush.ts).
     GET                         { publicKey, subscribed } for this device
     POST   { subscription, prefs }   turn notifications on for this device
     PATCH  { endpoint, prefs }        change this device's preferences
     PUT    { endpoint }               send this device a test notification
     DELETE ?endpoint=                  turn them off                         */

const PREF_KEYS = Object.keys(DEFAULT_PUSH_PREFS) as (keyof PushPrefs)[]
const cleanPrefs = (p: unknown): Partial<PushPrefs> => {
  if (!p || typeof p !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const k of PREF_KEYS) {
    const v = (p as Record<string, unknown>)[k]
    if (typeof v === typeof DEFAULT_PUSH_PREFS[k]) out[k] = v
  }
  return out as Partial<PushPrefs>
}

async function guard() {
  const me = await currentUser()
  if (!me) return { error: NextResponse.json({ error: 'Not authorised' }, { status: 401 }) }
  if (!hasSupabase() || me.id === 'env') return { error: NextResponse.json({ error: 'Notifications need a named account and the database' }, { status: 400 }) }
  return { me }
}

export async function GET(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const keys = await vapidKeys()
  if (!keys) return NextResponse.json({ error: 'Push is not set up' }, { status: 503 })
  const endpoint = req.nextUrl.searchParams.get('endpoint')
  let subscribed = false
  if (endpoint) {
    const { data } = await createServiceClient().from('push_subscriptions').select('id').eq('endpoint', endpoint).eq('user_id', g.me.id).maybeSingle()
    subscribed = !!data
  }
  return NextResponse.json({ publicKey: keys.publicKey, subscribed })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const body = await req.json().catch(() => null)
  const sub = body?.subscription
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth || !/^https:\/\//.test(sub.endpoint)) {
    return NextResponse.json({ error: 'A push subscription is required' }, { status: 400 })
  }
  const { error } = await createServiceClient()
    .from('push_subscriptions')
    .upsert(
      {
        user_id: g.me.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        prefs: cleanPrefs(body.prefs),
        user_agent: (req.headers.get('user-agent') ?? '').slice(0, 300),
      },
      { onConflict: 'endpoint' },
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const body = await req.json().catch(() => null)
  if (!body?.endpoint) return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
  const { error } = await createServiceClient()
    .from('push_subscriptions')
    .update({ prefs: cleanPrefs(body.prefs) })
    .eq('endpoint', body.endpoint)
    .eq('user_id', g.me.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const body = await req.json().catch(() => null)
  const { data } = await createServiceClient()
    .from('push_subscriptions')
    .select('id,user_id,endpoint,p256dh,auth,prefs')
    .eq('endpoint', body?.endpoint ?? '')
    .eq('user_id', g.me.id)
    .maybeSingle()
  if (!data) return NextResponse.json({ error: 'This device is not subscribed' }, { status: 404 })
  const sent = await pushTo([data as Subscription], {
    title: 'Bhumi notifications are on',
    body: 'You’ll get meeting reminders, due tasks, team updates and your day at a glance each morning.',
    path: '/',
    tag: 'test',
  })
  return sent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'The push service refused it' }, { status: 502 })
}

export async function DELETE(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const body = await req.json().catch(() => null)
  const endpoint = body?.endpoint || req.nextUrl.searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
  await createServiceClient().from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', g.me.id)
  return NextResponse.json({ ok: true })
}
