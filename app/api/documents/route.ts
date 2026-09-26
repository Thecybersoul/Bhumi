import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { getDriveFile, hasDrive, startDriveUpload } from '@/lib/google'
import {
  DOCUMENT_ENTITY_TYPES,
  DOCUMENTS_BUCKET,
  DRIVE_SECTION,
  MAX_BUCKET_MB,
  MAX_DOCUMENT_MB,
  ensureBucket,
  extension,
  slug,
  type DocumentEntityType,
} from '@/lib/documents'

export const dynamic = 'force-dynamic'

function entityType(v: unknown): DocumentEntityType {
  return DOCUMENT_ENTITY_TYPES.includes(v as DocumentEntityType) ? (v as DocumentEntityType) : 'general'
}

function noDatabase() {
  return NextResponse.json(
    { error: 'No database attached, so documents cannot be stored. Attach Supabase and run migration 011.' },
    { status: 503 }
  )
}

// GET /api/documents?entity_type=&entity_id=  — newest first
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasSupabase()) return NextResponse.json({ data: [], source: 'fallback' })

  const p = req.nextUrl.searchParams
  try {
    let q = createServiceClient().from('documents').select('*').order('created_at', { ascending: false }).limit(500)
    if (p.get('entity_type')) q = q.eq('entity_type', entityType(p.get('entity_type')))
    if (p.get('entity_id')) q = q.eq('entity_id', p.get('entity_id')!)
    const { data, error } = await q
    if (error) return NextResponse.json({ data: [], source: 'fallback', error: error.message })
    return NextResponse.json({ data: data ?? [], source: 'live' })
  } catch (e) {
    return NextResponse.json({ data: [], source: 'fallback', error: (e as Error).message })
  }
}

/* POST /api/documents — two actions, told apart by `action`:

   { action: 'start', name, mime, bytes, entity_type, entity_label, destination? }
     → { storage, upload: { url, method, headers } , path? }
     Picks Drive when it is connected with Drive access (or when
     destination is 'drive'), otherwise the private bucket.

   { action: 'record', storage, path | drive_file_id | link, name, … }
     → the stored row. `link` records an existing Drive/URL file
     without uploading anything. */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasSupabase()) return noDatabase()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const type = entityType(body.entity_type)
  const label = String(body.entity_label ?? '').slice(0, 160)
  const name = String(body.name ?? '').trim().slice(0, 200) || 'Document'
  const mime = String(body.mime ?? '').slice(0, 120) || 'application/octet-stream'
  const bytes = Number(body.bytes) > 0 ? Math.round(Number(body.bytes)) : null

  try {
    if (body.action === 'start') {
      if (bytes && bytes > MAX_DOCUMENT_MB * 1024 * 1024) {
        return NextResponse.json({ error: `Documents are limited to ${MAX_DOCUMENT_MB} MB` }, { status: 413 })
      }
      const wantDrive = body.destination === 'drive' || (body.destination !== 'storage' && (await hasDrive()))
      if (wantDrive) {
        const session = await startDriveUpload({ section: DRIVE_SECTION[type], record: label, name, mime, bytes: bytes ?? undefined })
        if (!session) return NextResponse.json({ error: 'Google Drive is not connected' }, { status: 409 })
        return NextResponse.json({
          storage: 'drive',
          upload: { url: session.uploadUrl, method: 'PUT', headers: { 'Content-Type': mime } },
        })
      }

      if (bytes && bytes > MAX_BUCKET_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `Files over ${MAX_BUCKET_MB} MB need Google Drive connected (More → Google Workspace)` },
          { status: 413 }
        )
      }
      const sb = await ensureBucket()
      const path = `${type}/${slug(label) || 'general'}/${Date.now().toString(36)}-${slug(name) || 'file'}.${extension(name)}`
      const { data, error } = await sb.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path)
      if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not start upload' }, { status: 500 })
      return NextResponse.json({
        storage: 'supabase',
        path,
        upload: { url: data.signedUrl, method: 'PUT', headers: { 'Content-Type': mime, 'x-upsert': 'false' } },
      })
    }

    if (body.action !== 'record') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

    const row: Record<string, unknown> = {
      entity_type: type,
      entity_id: body.entity_id ? String(body.entity_id).slice(0, 80) : null,
      entity_label: label,
      name,
      category: String(body.category ?? 'Other').slice(0, 60) || 'Other',
      mime,
      bytes,
    }

    if (body.link) {
      const link = String(body.link).trim()
      if (!/^https:\/\//i.test(link)) return NextResponse.json({ error: 'A link must start with https://' }, { status: 400 })
      const driveId = link.match(/\/d\/([\w-]{20,})/)?.[1] ?? link.match(/[?&]id=([\w-]{20,})/)?.[1] ?? null
      Object.assign(row, { storage: 'drive', path: 'link', drive_file_id: driveId, url: link, mime: row.mime === 'application/octet-stream' ? '' : row.mime })
    } else if (body.storage === 'drive') {
      const file = await getDriveFile(String(body.drive_file_id ?? ''))
      if (!file) return NextResponse.json({ error: 'That file is not in the connected Drive' }, { status: 400 })
      Object.assign(row, { storage: 'drive', drive_file_id: file.id, url: file.url, mime: file.mime || mime, bytes: file.bytes ?? bytes })
    } else {
      const path = String(body.path ?? '')
      if (!path || path.includes('..')) return NextResponse.json({ error: 'path required' }, { status: 400 })
      const sb = createServiceClient()
      const dir = path.slice(0, path.lastIndexOf('/'))
      const { data: listed } = await sb.storage.from(DOCUMENTS_BUCKET).list(dir, { search: path.slice(dir.length + 1) })
      if (!listed?.length) return NextResponse.json({ error: 'The upload did not arrive — try again' }, { status: 400 })
      Object.assign(row, { storage: 'supabase', path })
    }

    const { data, error } = await createServiceClient().from('documents').insert(row).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
