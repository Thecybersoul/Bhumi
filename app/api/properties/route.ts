import { NextRequest, NextResponse } from 'next/server'
import { getProperties, insert } from '@/lib/db'
import { assertAdmin, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/properties — public sees Live only; ?admin=1 requires a session
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const wantsAdmin = searchParams.get('admin') === '1'

  if (wantsAdmin && !(await isAdmin())) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const { data, source } = await getProperties({ admin: wantsAdmin })

  const type = searchParams.get('type')
  const corridor = searchParams.get('corridor')
  const filtered = data.filter(
    (p) => (!type || p.property_type === type) && (!corridor || p.corridor === corridor)
  )

  return NextResponse.json({ data: filtered, source })
}

// POST /api/properties — create (admin only)
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.code || !body.title) {
    return NextResponse.json({ error: 'Code and title are required' }, { status: 400 })
  }

  const result = await insert('properties', body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, persisted: result.persisted }, { status: 201 })
}
