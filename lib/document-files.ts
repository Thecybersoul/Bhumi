import { createServiceClient, hasSupabase } from './supabase'
import { downloadDriveFile } from './google'
import { DOCUMENTS_BUCKET, type DocumentRow } from './documents'
import { MEDIA_BUCKET } from './cms'

/* Reading an ERP document's bytes, and turning an image document into a
   listing's public photo. Shared by the AI assistant and the free
   WhatsApp import. Documents stay private; a listing photo is a copy in
   the public media library. */

/** A stored ERP document's row and bytes, from Drive or the private bucket. */
export async function documentBytes(id: string): Promise<{ doc: DocumentRow; bytes: Buffer } | { error: string }> {
  if (!hasSupabase()) return { error: 'No database attached.' }
  const { data } = await createServiceClient().from('documents').select('*').eq('id', id).maybeSingle()
  const doc = data as DocumentRow | null
  if (!doc) return { error: `No document with id ${id}.` }
  let bytes: Buffer | null = null
  if (doc.storage === 'drive') {
    if (!doc.drive_file_id || doc.path === 'link') return { error: `${doc.name} is a linked file outside the ERP's Drive folders and can't be opened here.` }
    const got = await downloadDriveFile(doc.drive_file_id).catch(() => null)
    bytes = got?.data ?? null
  } else if (doc.path) {
    const { data: blob } = await createServiceClient().storage.from(DOCUMENTS_BUCKET).download(doc.path)
    bytes = blob ? Buffer.from(await blob.arrayBuffer()) : null
  }
  if (!bytes) return { error: `Couldn't download ${doc.name} (or it is over 20 MB).` }
  return { doc, bytes }
}

/** Copy an image document into the public media library, so it can be a
    listing's photo on the website. Documents themselves stay private. */
export async function publishImage(id: string): Promise<{ url: string } | { error: string }> {
  const got = await documentBytes(id)
  if ('error' in got) return got
  const { doc, bytes } = got
  const mime = (doc.mime || '').toLowerCase()
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[mime]
  if (!ext) return { error: `${doc.name} is ${mime || 'not an image'}; a listing photo must be a JPEG, PNG or WebP.` }
  const sb = createServiceClient()
  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets?.some((b) => b.name === MEDIA_BUCKET)) await sb.storage.createBucket(MEDIA_BUCKET, { public: true })
  const base = doc.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'photo'
  const path = `listings/${Date.now().toString(36)}-${base}.${ext}`
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType: mime, upsert: false, cacheControl: '31536000' })
  if (error) return { error: error.message }
  const url = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
  await sb.from('media').insert({ path, url, kind: 'image', mime, bytes: bytes.length, alt: doc.name, title: doc.name, folder: 'listings' })
  return { url }
}
