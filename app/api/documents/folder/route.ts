import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { ensureRecordFolder } from '@/lib/google'
import { DOCUMENT_ENTITY_TYPES, DRIVE_SECTION, type DocumentEntityType } from '@/lib/documents'

export const dynamic = 'force-dynamic'

// GET /api/documents/folder?entity_type=&entity_id=&entity_label=
// → { url } of the record's Google Drive folder, creating it if needed.
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const p = req.nextUrl.searchParams
  const type = p.get('entity_type') as DocumentEntityType
  const id = p.get('entity_id')
  if (!DOCUMENT_ENTITY_TYPES.includes(type) || !id) return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 })

  try {
    const folder = await ensureRecordFolder({ section: DRIVE_SECTION[type], entityType: type, entityId: id, label: p.get('entity_label') ?? '' })
    if (!folder) return NextResponse.json({ error: 'Google Drive is not connected' }, { status: 409 })
    return NextResponse.json({ url: folder.url })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
