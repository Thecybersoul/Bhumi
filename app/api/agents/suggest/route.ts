import { NextRequest, NextResponse } from 'next/server'
import { getContacts, getLead, getProperties } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { agentsFor, agentsReady } from '@/lib/agents'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* GET /api/agents/suggest?entity_type=property|lead&entity_id=
   Agents who work the listing's or lead's area (and property type),
   not already on it — with the reasons. */
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!(await agentsReady())) return NextResponse.json({ data: [] })

  const type = req.nextUrl.searchParams.get('entity_type')
  const id = req.nextUrl.searchParams.get('entity_id') ?? ''
  let where: { location?: string; corridor?: string; type?: string } = {}
  if (type === 'property') {
    const p = (await getProperties({ admin: true })).data.find((x) => x.id === id)
    if (p) where = { location: p.location, corridor: p.corridor, type: p.property_type }
  } else if (type === 'lead') {
    const l = await getLead(id)
    if (l) where = { location: l.locations, corridor: l.corridor, type: l.property_type || undefined }
  } else return NextResponse.json({ error: 'entity_type must be property or lead' }, { status: 400 })

  const [contacts, linked] = await Promise.all([
    getContacts(),
    createServiceClient().from('contact_links').select('contact_id').eq('entity_type', type).eq('entity_id', id),
  ])
  const exclude = new Set(((linked.data ?? []) as { contact_id: string }[]).map((x) => x.contact_id))
  const agents = (contacts.source === 'live' ? contacts.data : []).filter((c) => c.roles?.includes('Agent'))
  return NextResponse.json({ data: agentsFor(agents, where, exclude) })
}
