import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { moveDriveFile, trashDriveFile } from '@/lib/google'
import { logActivity } from '@/lib/activity'
import { DOCUMENT_ENTITY_TYPES, DOCUMENTS_BUCKET, DRIVE_SECTION, type DocumentEntityType, type DocumentRow } from '@/lib/documents'

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

// PATCH /api/documents/:id — rename, recategorise, or file it on a
// different record ({ entity_type, entity_id, entity_label }). A file
// this app put in Drive moves to that record's folder too; a linked
// file is only re-pointed, never moved.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await assertAdmin()
  if (denied) return denied
  const body = await req.json().catch(() => ({}))
  const patch: Record<string, string | null> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim().slice(0, 200)
  if (typeof body.category === 'string' && body.category.trim()) patch.category = body.category.trim().slice(0, 60)
  const refile = DOCUMENT_ENTITY_TYPES.includes(body.entity_type as DocumentEntityType)
  if (refile) {
    patch.entity_type = body.entity_type
    patch.entity_id = body.entity_id ? String(body.entity_id).slice(0, 80) : null
    patch.entity_label = String(body.entity_label ?? '').slice(0, 160)
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  const id = (await params).id
  const before = refile ? await find(id) : null
  const { data, error } = await createServiceClient().from('documents').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (refile && before) {
    const doc = data as DocumentRow
    if (doc.storage === 'drive' && doc.drive_file_id && doc.path !== 'link') {
      await moveDriveFile(doc.drive_file_id, {
        section: DRIVE_SECTION[doc.entity_type],
        entityType: doc.entity_type,
        entityId: doc.entity_id,
        label: doc.entity_label,
        category: doc.category,
      }).catch(() => null)
    }
    await logActivity({
      action: 'link',
      entity_type: doc.entity_type,
      entity_id: doc.entity_id,
      entity_label: doc.entity_label,
      summary: `Filed ${doc.name}${doc.category && !['Other', 'Attachment'].includes(doc.category) ? ` (${doc.category})` : ''} here`,
    })
  }
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
  await logActivity({
    action: 'delete',
    entity_type: doc.entity_type,
    entity_id: doc.entity_id,
    entity_label: doc.entity_label,
    summary: `Removed ${doc.name}${doc.storage === 'drive' && doc.path !== 'link' ? ' (moved to Drive trash)' : ''}`,
  })
  return NextResponse.json({ ok: true })
}
