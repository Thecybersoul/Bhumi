import { NextRequest, NextResponse } from 'next/server'
import { consumeUploadToken } from '@/lib/upload-link'
import { uploadInline, MAX_UPLOAD_LINK_BYTES } from '@/lib/assistant/tools'
import { publishImage } from '@/lib/document-files'
import { createSessionToken } from '@/lib/session'
import { erpCaller, errorOf } from '@/lib/erp-call'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* ═══════════════════════════════════════════════════════════
   The other half of get_upload_link (lib/assistant/tools.ts): a
   real file PUT directly here, bytes never typed into a chat.

   No session cookie — the signed, single-use token in the path is
   the only auth, so this must stay narrow: a fixed byte cap, a
   sniffed (not just declared) content type, and a token that is
   claimed before anything is written so a retried request can
   never double-file the same upload.
   ═══════════════════════════════════════════════════════════ */

const IMAGE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function sniff(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png'
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (bytes.length >= 4 && bytes.toString('ascii', 0, 4) === '%PDF') return 'application/pdf'
  return null
}

async function readLimited(req: NextRequest, maxBytes: number): Promise<{ data: Buffer } | { error: string }> {
  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > maxBytes) return { error: `That file is ${(len / 1048576).toFixed(1)} MB, over the ${(maxBytes / 1048576).toFixed(0)} MB limit.` }
  const reader = req.body?.getReader()
  if (!reader) return { error: 'No file body received.' }
  const chunks: Buffer[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > maxBytes) {
      await reader.cancel()
      return { error: `That file is over the ${(maxBytes / 1048576).toFixed(0)} MB limit.` }
    }
    chunks.push(Buffer.from(value))
  }
  if (!total) return { error: 'The file was empty.' }
  return { data: Buffer.concat(chunks) }
}

async function handle(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const payload = await consumeUploadToken(token)
  if (!payload) return NextResponse.json({ error: 'This upload link is invalid, expired, or already used. Ask for a new one.' }, { status: 401 })

  const read = await readLimited(req, MAX_UPLOAD_LINK_BYTES)
  if ('error' in read) return NextResponse.json({ error: read.error }, { status: 413 })

  const mime = sniff(read.data)
  const allowed = payload.purpose === 'listing_photo' ? mime !== null && mime !== 'application/pdf' : mime !== null
  if (!mime || !allowed) {
    return NextResponse.json(
      { error: payload.purpose === 'listing_photo' ? 'A listing photo must be a JPEG, PNG or WebP image.' : 'File type not recognised — JPEG, PNG, WebP and PDF are supported.' },
      { status: 415 }
    )
  }

  const bearer = await createSessionToken(payload.uid, 60)
  if (!bearer) return NextResponse.json({ error: 'Server is not configured to issue sessions (AUTH_SECRET).' }, { status: 500 })
  const call = erpCaller(req.nextUrl.origin, { authorization: `Bearer ${bearer}` })

  const name = payload.file_name || `upload-${Date.now()}.${IMAGE_EXT[mime] ?? 'pdf'}`
  const got = await uploadInline(
    { call },
    {
      name,
      mime,
      bytes: read.data,
      maxBytes: MAX_UPLOAD_LINK_BYTES,
      entity_type: payload.purpose === 'listing_photo' ? 'property' : payload.entity_type,
      entity_id: payload.purpose === 'listing_photo' ? payload.listing_id : payload.entity_id,
      entity_label: payload.entity_label,
      category: payload.purpose === 'listing_photo' ? 'Photos' : payload.category,
    }
  )
  if ('error' in got) return NextResponse.json({ error: got.error }, { status: 400 })

  if (payload.purpose === 'listing_photo') {
    const pub = await publishImage(String(got.doc.id))
    if ('error' in pub) return NextResponse.json({ error: pub.error }, { status: 400 })
    const r = await call('PUT', `/api/properties/${payload.listing_id}`, { img_url: pub.url })
    const err = errorOf(r)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
    return NextResponse.json({ ok: true, document_id: got.doc.id, img_url: pub.url })
  }
  return NextResponse.json({ ok: true, document_id: got.doc.id })
}

export const PUT = handle
export const POST = handle

export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'PUT, POST' } })
}
