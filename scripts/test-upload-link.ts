/* End-to-end check of get_upload_link / app/api/upload/[token]: a real
   file PUT directly to a one-time link, never typed as base64, becomes
   a listing's public img_url — and every rejection path (replay,
   expiry, wrong type, over-limit, SSRF) actually rejects.

     npx tsx --env-file=.env.local scripts/test-upload-link.ts

   Against local dev (npm run dev on :3000, or pass ORIGIN=...). Creates
   a throwaway Draft listing, deletes it and everything attached to it
   afterwards — this is the same database production uses, there is no
   sandbox. Exits non-zero on any failure. */
import { createHash, randomBytes } from 'node:crypto'
import { listUsers } from '../lib/users'
import { createConnectorToken, listConnectorTokens, revokeConnectorToken } from '../lib/connector'
import { createSessionToken } from '../lib/session'
import { signUploadToken } from '../lib/upload-link'

const ORIGIN = process.env.ORIGIN || 'http://localhost:3000'

let step = ''
const fails: string[] = []
function check(label: string, ok: boolean, detail?: string) {
  step = label
  if (ok) console.log(`  ok  ${label}`)
  else {
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
    fails.push(label)
  }
}

async function rpc(secret: string, method: string, params?: Record<string, unknown>) {
  const res = await fetch(`${ORIGIN}/api/mcp/${secret}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

function textsOf(body: { result?: { content?: { type: string; text?: string }[] } }): string[] {
  return (body?.result?.content ?? []).map((c) => c.text).filter(Boolean) as string[]
}
function jsonBlockOf<T extends object>(body: unknown, has: string): T | undefined {
  return textsOf(body as never)
    .map((t) => { try { return JSON.parse(t) } catch { return null } })
    .find((p) => p && typeof p === 'object' && has in (p as object)) as T | undefined
}

// ~200 KB. Only the first 3 bytes need to be a real JPEG SOI marker to
// exercise the server's magic-byte sniff; the rest is filler, which is
// enough to test the upload pipeline, size limit and byte-for-byte
// round trip without needing a real photo on disk.
function fakeJpeg(bytes: number): Buffer {
  const buf = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), randomBytes(bytes - 3)])
  return buf
}
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

async function main() {
  const admin = (await listUsers()).find((u) => u.active)
  if (!admin) throw new Error('No active admin account to act as.')
  console.log(`Acting as ${admin.name}`)

  const label = `test-upload-link-${Date.now()}`
  const secret = await createConnectorToken(admin.id, label)
  const bearer = await createSessionToken(admin.id, 10 * 60)
  if (!bearer) throw new Error('Could not mint an admin session token (AUTH_SECRET missing?).')
  const adminHeaders = { Authorization: `Bearer ${bearer}` }

  let listingId: string | null = null
  let documentId: string | null = null
  let imgUrl: string | null = null

  try {
    const code = `TEST-${Date.now().toString(36).toUpperCase()}`
    const created = await rpc(secret, 'tools/call', { name: 'create_listing', arguments: { code, title: 'Upload link test — safe to delete', location: 'Test', zone: 'North' } })
    listingId = jsonBlockOf<{ id: string }>(created.body, 'id')?.id ?? null
    check('create_listing created a Draft listing', !created.body?.result?.isError && !!listingId, JSON.stringify(created.body))
    if (!listingId) return

    // --- happy path: mint a link, PUT real bytes, confirm img_url ---
    const link1 = await rpc(secret, 'tools/call', { name: 'get_upload_link', arguments: { purpose: 'listing_photo', listing_id: listingId, file_name: 'thumb.jpg' } })
    const upload1 = jsonBlockOf<{ upload_url: string }>(link1.body, 'upload_url')?.upload_url ?? null
    check('get_upload_link returned an upload_url', !link1.body?.result?.isError && !!upload1 && upload1.startsWith(`${ORIGIN}/api/upload/`), JSON.stringify(link1.body))

    const jpeg = fakeJpeg(200 * 1024)
    const jpegHash = sha256(jpeg)
    let imgSha: string | null = null
    if (upload1) {
      const put = await fetch(upload1, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(jpeg) })
      const putJson = (await put.json().catch(() => ({}))) as { img_url?: string; document_id?: string }
      imgUrl = putJson.img_url ?? null
      documentId = putJson.document_id ?? null
      check('PUT to upload_url accepted the file', put.status === 200 && !!imgUrl, `HTTP ${put.status} ${JSON.stringify(putJson)}`)

      if (imgUrl) {
        const fetched = await fetch(imgUrl)
        const bytes = Buffer.from(await fetched.arrayBuffer())
        imgSha = sha256(bytes)
        check('img_url is publicly fetchable (200)', fetched.ok, `HTTP ${fetched.status}`)
        check('published bytes match the uploaded file (sha256)', imgSha === jpegHash)
      }

      // --- replay: the same link must not work twice ---
      const replay = await fetch(upload1, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(jpeg) })
      check('replaying the same upload_url is rejected', replay.status === 401, `HTTP ${replay.status}`)
    }

    if (listingId) {
      const row = await fetch(`${ORIGIN}/api/properties?admin=1`, { headers: adminHeaders })
        .then((r) => r.json())
        .then((j) => (j.data as { id: string; img_url: string; status: string }[]).find((p) => p.id === listingId))
      check('listing row has img_url set', !!row && row.img_url === imgUrl, JSON.stringify(row))
      check('listing is still Draft (photo upload must not publish it)', row?.status === 'Draft', row?.status)
    }

    // --- expired token: signed directly with a negative TTL ---
    const expired = await signUploadToken({ uid: admin.id, purpose: 'listing_photo', listing_id: listingId }, -1)
    if (expired) {
      const res = await fetch(`${ORIGIN}/api/upload/${expired}`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(jpeg) })
      check('an expired token is rejected', res.status === 401, `HTTP ${res.status}`)
    } else {
      check('an expired token is rejected', false, 'could not sign a token locally (AUTH_SECRET missing?)')
    }

    // --- wrong type: a fresh link, but the bytes are not an image ---
    const link2 = await rpc(secret, 'tools/call', { name: 'get_upload_link', arguments: { purpose: 'listing_photo', listing_id: listingId } })
    const upload2 = jsonBlockOf<{ upload_url: string }>(link2.body, 'upload_url')?.upload_url ?? null
    if (upload2) {
      const res = await fetch(upload2, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(Buffer.from('not an image, just text pretending to be one')) })
      check('a non-image file is rejected for purpose listing_photo', res.status === 415, `HTTP ${res.status}`)
    } else {
      check('a non-image file is rejected for purpose listing_photo', false, 'could not mint a second link')
    }

    // --- over-limit: a fresh link, a file over the 10 MB cap ---
    const link3 = await rpc(secret, 'tools/call', { name: 'get_upload_link', arguments: { purpose: 'listing_photo', listing_id: listingId } })
    const upload3 = jsonBlockOf<{ upload_url: string }>(link3.body, 'upload_url')?.upload_url ?? null
    if (upload3) {
      const big = fakeJpeg(11 * 1024 * 1024)
      const res = await fetch(upload3, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(big) })
      check('a file over the 10 MB limit is rejected', res.status === 413, `HTTP ${res.status}`)
    } else {
      check('a file over the 10 MB limit is rejected', false, 'could not mint a third link')
    }

    // --- SSRF: source_url pointing at a private/loopback address ---
    const ssrf = await rpc(secret, 'tools/call', { name: 'set_listing_photo', arguments: { listing_id: listingId, source_url: 'https://127.0.0.1:1/x.jpg' } })
    const ssrfErr = textsOf(ssrf.body).join(' ')
    check('a private-IP source_url is rejected', Boolean(ssrf.body?.result?.isError) && /private|internal/i.test(ssrfErr), ssrfErr)
  } finally {
    console.log('Cleaning up…')
    if (documentId) {
      const r = await rpc(secret, 'tools/call', { name: 'delete_record', arguments: { type: 'document', id: documentId, confirmed: true } })
      console.log('  delete document:', JSON.stringify(r.body))
    }
    if (listingId) {
      const r = await rpc(secret, 'tools/call', { name: 'delete_record', arguments: { type: 'listing', id: listingId, confirmed: true } })
      console.log('  delete listing:', JSON.stringify(r.body))
    }
    if (imgUrl) {
      const media = await fetch(`${ORIGIN}/api/media`, { headers: adminHeaders }).then((r) => r.json())
      const row = (media.data as { id: string; url: string }[] | undefined)?.find((m) => m.url === imgUrl)
      if (row) await fetch(`${ORIGIN}/api/media?id=${row.id}`, { method: 'DELETE', headers: adminHeaders })
    }
    const tokens = await listConnectorTokens(admin.id)
    const mine = tokens.find((t) => t.label === label)
    if (mine) await revokeConnectorToken(admin.id, mine.id)
  }

  console.log('')
  if (fails.length) {
    console.log(`FAILED: ${fails.length} check(s) did not pass.`)
    process.exit(1)
  }
  console.log('PASS: upload links work end to end, and every rejection path rejects.')
}

main().catch((e) => {
  console.error(`Error during "${step}":`, e.message)
  process.exit(1)
})
