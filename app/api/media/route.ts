import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { MEDIA_BUCKET } from '@/lib/cms'

export const dynamic = 'force-dynamic'

/* The media library: images, video and documents.

   Admin-only, because this writes to storage with the service
   role — an unauthenticated caller here would be an open write
   against the project's bucket.

   Type is decided from the MIME the browser reports *and* the
   extension is derived from that MIME rather than the filename,
   so a file called `x.jpg.html` cannot be stored as HTML and
   served back from our own origin. */

const KINDS: Record<string, { kind: 'image' | 'video' | 'document'; ext: string }> = {
  'image/jpeg': { kind: 'image', ext: 'jpg' },
  'image/png': { kind: 'image', ext: 'png' },
  'image/webp': { kind: 'image', ext: 'webp' },
  'image/avif': { kind: 'image', ext: 'avif' },
  'image/svg+xml': { kind: 'image', ext: 'svg' },
  'video/mp4': { kind: 'video', ext: 'mp4' },
  'video/webm': { kind: 'video', ext: 'webm' },
  'application/pdf': { kind: 'document', ext: 'pdf' },
}

/* Video needs real headroom; an image that large is a mistake. */
const LIMITS = { image: 12, video: 120, document: 25 } // MB

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  if (!hasSupabase()) return NextResponse.json({ data: [], source: 'fallback' })

  const kind = new URL(req.url).searchParams.get('kind')
  try {
    const sb = createServiceClient()
    let q = sb.from('media').select('*').order('created_at', { ascending: false }).limit(300)
    if (kind && kind !== 'all') q = q.eq('kind', kind)
    const { data, error } = await q
    if (error) return NextResponse.json({ data: [], error: error.message })
    return NextResponse.json({ data: data ?? [], source: 'live' })
  } catch (e) {
    return NextResponse.json({ data: [], error: (e as Error).message })
  }
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  if (!hasSupabase()) {
    return NextResponse.json(
      { error: 'No storage configured. Attach Supabase credentials to enable uploads.' },
      { status: 503 }
    )
  }

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder') as string) || 'general'
    const alt = (form.get('alt') as string) || null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const spec = KINDS[file.type]
    if (!spec) {
      return NextResponse.json(
        {
          error: `Unsupported type ${file.type || 'unknown'}. Allowed: JPEG, PNG, WebP, AVIF, SVG, MP4, WebM, PDF.`,
        },
        { status: 415 }
      )
    }
    const maxBytes = LIMITS[spec.kind] * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `${spec.kind} exceeds the ${LIMITS[spec.kind]} MB limit` },
        { status: 413 }
      )
    }

    const sb = createServiceClient()

    /* Create the bucket on first upload rather than making the
       operator do it by hand in a separate dashboard. */
    const { data: buckets } = await sb.storage.listBuckets()
    if (!buckets?.some((b) => b.name === MEDIA_BUCKET)) {
      await sb.storage.createBucket(MEDIA_BUCKET, { public: true })
    }

    const safeFolder = slug(folder) || 'general'
    const name = `${Date.now().toString(36)}-${slug(file.name) || spec.kind}.${spec.ext}`
    const path = `${safeFolder}/${name}`

    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error: upErr } = await sb.storage
      .from(MEDIA_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: '31536000' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: pub } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path)

    const row = {
      path,
      url: pub.publicUrl,
      kind: spec.kind,
      mime: file.type,
      bytes: file.size,
      alt,
      title: file.name,
      folder: safeFolder,
    }
    const { data, error } = await sb.from('media').insert(row).select().single()
    if (error) {
      // Storage succeeded but the row failed — do not leave an orphan.
      await sb.storage.from(MEDIA_BUCKET).remove([path])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const sb = createServiceClient()
    const { data: row } = await sb.from('media').select('path').eq('id', id).single()
    if (row?.path) await sb.storage.from(MEDIA_BUCKET).remove([row.path])
    const { error } = await sb.from('media').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
