import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { connectorReady, createConnectorToken, listConnectorTokens, revokeConnectorToken } from '@/lib/connector'

export const dynamic = 'force-dynamic'

/* Your Claude connector links (lib/connector.ts).
     GET              { links: [{ id, label, created_at, last_used_at }] }
     POST { label? }  { url }   a new link, shown this once
     DELETE ?id=      revoke a link                                 */

async function guard() {
  const me = await currentUser()
  if (!me) return { error: NextResponse.json({ error: 'Not authorised' }, { status: 401 }) }
  if (me.id === 'env') return { error: NextResponse.json({ error: 'Connecting Claude needs a named account.' }, { status: 400 }) }
  if (!(await connectorReady())) return { error: NextResponse.json({ error: 'The Claude connector needs a database update: open Setup and apply pending updates.' }, { status: 503 }) }
  return { me }
}

/** The public site address. Behind Vercel the request origin can be a deployment URL. */
function siteOrigin(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  return `${proto}://${host}`
}

export async function GET() {
  const g = await guard()
  if (g.error) return g.error
  return NextResponse.json({ links: await listConnectorTokens(g.me.id) })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const body = await req.json().catch(() => ({}))
  const label = String(body?.label ?? 'Claude').trim() || 'Claude'
  const secret = await createConnectorToken(g.me.id, label)
  await logActivity({ action: 'connect', entity_type: 'connector', entity_label: label, summary: 'Connected Claude to the ERP' })
  return NextResponse.json({ url: `${siteOrigin(req)}/api/mcp/${secret}` })
}

export async function DELETE(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  await revokeConnectorToken(g.me.id, id)
  await logActivity({ action: 'disconnect', entity_type: 'connector', entity_id: id, summary: 'Disconnected a Claude connector link' })
  return NextResponse.json({ ok: true })
}
