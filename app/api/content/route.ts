import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { setContent, resetContent, getContent } from '@/lib/cms'
import { getBlockDef } from '@/lib/content/schema'

export const dynamic = 'force-dynamic'

/* Editing page copy. Admin-only — this writes what the public
   site renders. Only keys declared in the schema are accepted, so
   a caller cannot invent a block or write arbitrary rows. */

export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
  if (!getBlockDef(key)) return NextResponse.json({ error: 'Unknown block' }, { status: 404 })

  return NextResponse.json({ data: await getContent(key) })
}

export async function PUT(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  try {
    const { key, value } = await req.json()
    if (typeof key !== 'string') {
      return NextResponse.json({ error: 'key required' }, { status: 400 })
    }
    const def = getBlockDef(key)
    if (!def) return NextResponse.json({ error: 'Unknown block' }, { status: 404 })
    if (value === null || typeof value !== 'object') {
      return NextResponse.json({ error: 'value must be an object' }, { status: 400 })
    }

    /* Only fields the schema declares are stored. Anything else the
       browser sends is dropped rather than persisted. */
    const allowed = new Set(def.fields.map((f) => f.key))
    const clean: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (allowed.has(k)) clean[k] = v
    }

    await setContent(key, clean)
    return NextResponse.json({ ok: true, data: await getContent(key) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

/** Revert a block to the copy compiled into the codebase. */
export async function DELETE(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const key = new URL(req.url).searchParams.get('key')
  if (!key || !getBlockDef(key)) {
    return NextResponse.json({ error: 'Unknown block' }, { status: 404 })
  }
  try {
    await resetContent(key)
    return NextResponse.json({ ok: true, data: await getContent(key) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
