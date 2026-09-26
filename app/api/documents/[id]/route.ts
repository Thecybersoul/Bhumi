import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { trashDriveFile } from '@/lib/google'
import { DOCUMENTS_BUCKET, type DocumentRow } from '@/lib/documents'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

async function find(id: string): Promise<DocumentRow | null> {
  const { data } = await createServiceClient().from('documents').select('*').eq('id', id).maybeSingle()
  return (data as DocumentRow | null) ?? null
}

// GET /api/documents/:id — { url } to open it. Bucket files get a
// ten-minute signed link; the bucket itself is never public.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasSupabase()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc = await find((await params).id)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (doc.storage === 'drive') return NextResponse.json({ url: doc.url, storage: 'drive' })

  const { data, error } = await createServiceClient()
    .storage.from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.path!, 600, { download: false })
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not open' }, { status: 500 })
  return NextResponse.json({ url: data.signedUrl, storage: 'supabase' })
}

// PATCH /api/documents/:id — rename or recategorise
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await assertAdmin()
  if (denied) return denied
  const body = await req.json().catch(() => ({}))
  const patch: Record<string, string> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim().slice(0, 200)
  if (typeof body.category === 'string' && body.category.trim()) patch.category = body.category.trim().slice(0, 60)
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  const { data, error } = await createServiceClient().from('documents').update(patch).eq('id', (await params).id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

// DELETE /api/documents/:id — bucket files are removed; files this
// app uploaded to Drive go to Drive's trash (recoverable for 30 days);
// a linked Drive file is only unlinked, never touched.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await assertAdmin()
  if (denied) return denied

  const doc = await find((await params).id)
  if (!doc) return NextResponse.json({ ok: true })

  const sb = createServiceClient()
  if (doc.storage === 'supabase' && doc.path) await sb.storage.from(DOCUMENTS_BUCKET).remove([doc.path])
  if (doc.storage === 'drive' && doc.drive_file_id && doc.path !== 'link') await trashDriveFile(doc.drive_file_id)

  const { error } = await sb.from('documents').delete().eq('id', doc.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
