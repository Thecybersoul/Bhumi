/* End-to-end check of the Claude-connector photo path: a base64 image
   sent to set_listing_photo over the real MCP HTTP endpoint becomes a
   listing's public img_url.

     npx tsx --env-file=.env.local scripts/test-photo-upload.ts

   Against local dev (npm run dev on :3000, or pass ORIGIN=...). Creates
   a throwaway Draft listing and document, then deletes both plus the
   orphaned media-library row and the temporary connector token it
   mints for itself — this is the same database production uses, there
   is no sandbox. Exits non-zero on any failure. */
import { listUsers } from '../lib/users'
import { createConnectorToken, listConnectorTokens, revokeConnectorToken } from '../lib/connector'
import { createSessionToken } from '../lib/session'

const ORIGIN = process.env.ORIGIN || 'http://localhost:3000'

// 2x2 red PNG.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mNk+M9QDwAChwGC4z0WngAAAABJRU5ErkJggg=='

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

async function main() {
  const admin = (await listUsers()).find((u) => u.active)
  if (!admin) throw new Error('No active admin account to act as.')
  console.log(`Acting as ${admin.name}`)

  const label = `test-photo-upload-${Date.now()}`
  const secret = await createConnectorToken(admin.id, label)
  const bearer = await createSessionToken(admin.id, 10 * 60)
  if (!bearer) throw new Error('Could not mint an admin session token (AUTH_SECRET missing?).')
  const adminHeaders = { Authorization: `Bearer ${bearer}` }

  let listingId: string | null = null
  let documentId: string | null = null
  let imgUrl: string | null = null

  try {
    const init = await rpc(secret, 'initialize', { protocolVersion: '2025-06-18' })
    check('initialize handshake', init.status === 200 && !!init.body?.result)

    const list = await rpc(secret, 'tools/list')
    const tools = (list.body?.result?.tools ?? []) as { name: string; inputSchema: { properties: Record<string, unknown> } }[]
    check('tools/list includes upload_document', tools.some((t) => t.name === 'upload_document'))
    const photoTool = tools.find((t) => t.name === 'set_listing_photo')
    check(
      'set_listing_photo schema accepts content_base64/file_name/mime_type',
      !!photoTool && ['content_base64', 'file_name', 'mime_type'].every((k) => k in photoTool.inputSchema.properties)
    )

    const code = `TEST-${Date.now().toString(36).toUpperCase()}`
    const created = await rpc(secret, 'tools/call', {
      name: 'create_listing',
      arguments: { code, title: 'Photo upload test — safe to delete', location: 'Test', zone: 'North' },
    })
    const createdTexts = (created.body?.result?.content ?? []).map((c: { type: string; text?: string }) => c.text).filter(Boolean)
    const createdJson = createdTexts.map((t: string) => { try { return JSON.parse(t) } catch { return null } }).find((p: unknown) => p && typeof p === 'object' && 'id' in (p as object)) as { id?: string } | undefined
    listingId = createdJson?.id ?? null
    check('create_listing created a Draft listing', created.status === 200 && !created.body?.result?.isError && !!listingId, JSON.stringify(created.body))

    if (listingId) {
      const photo = await rpc(secret, 'tools/call', {
        name: 'set_listing_photo',
        arguments: { listing_id: listingId, content_base64: PNG_BASE64, file_name: 'test-photo.png', mime_type: 'image/png' },
      })
      const texts = (photo.body?.result?.content ?? []).map((c: { type: string; text?: string }) => c.text).filter(Boolean)
      const payload = texts.map((t: string) => { try { return JSON.parse(t) } catch { return null } }).find((p: unknown) => p && typeof p === 'object' && 'img_url' in (p as object)) as { img_url?: string } | undefined
      imgUrl = payload?.img_url ?? null
      check('set_listing_photo returned a public img_url', photo.status === 200 && !photo.body?.result?.isError && !!imgUrl && /^https:\/\//.test(imgUrl ?? ''), JSON.stringify(photo.body))
    }

    if (imgUrl) {
      const fetched = await fetch(imgUrl)
      check('img_url is publicly fetchable (200, image/*)', fetched.ok && (fetched.headers.get('content-type') || '').startsWith('image/'), `HTTP ${fetched.status}`)
    }

    if (listingId) {
      const row = await fetch(`${ORIGIN}/api/properties?admin=1`, { headers: adminHeaders })
        .then((r) => r.json())
        .then((j) => (j.data as { id: string; code: string; img_url: string; status: string }[]).find((p) => p.id === listingId))
      check('listing row in the database has img_url set', !!row && row.img_url === imgUrl, JSON.stringify(row))
      check('listing is still Draft (photo upload must not publish it)', row?.status === 'Draft', row?.status)

      const docs = await fetch(`${ORIGIN}/api/documents?entity_type=property&entity_id=${listingId}`, { headers: adminHeaders })
        .then((r) => r.json())
        .then((j) => (j.data as { id: string; name: string; category: string }[]) ?? [])
      const doc = docs.find((d) => d.name === 'test-photo.png')
      documentId = doc?.id ?? null
      check('photo was filed as a document under Photos', !!doc && doc.category === 'Photos', JSON.stringify(docs))
    }
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
  console.log('PASS: photo upload over the MCP connector works end to end.')
}

main().catch((e) => {
  console.error(`Error during "${step}":`, e.message)
  process.exit(1)
})
