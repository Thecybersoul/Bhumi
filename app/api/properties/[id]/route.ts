import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { update, remove } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = await update('properties', id, body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  // The home page, the marketplace grid, the listing page and the
  // property-consultancy page all cache a listing's photo and figures
  // for 2–5 minutes (ISR). A photo set here — by the admin, the app or
  // the assistant/MCP connector — should show on the public site within
  // seconds rather than waiting out that window.
  if (result.persisted) {
    revalidatePath('/')
    revalidatePath('/marketplace')
    revalidatePath('/marketplace/[code]', 'page')
    revalidatePath('/property-consultancy')
  }
  return NextResponse.json({ ok: true, persisted: result.persisted })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const result = await remove('properties', id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
