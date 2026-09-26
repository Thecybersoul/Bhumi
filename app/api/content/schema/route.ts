import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { getAllContent, editedKeys } from '@/lib/cms'
import { blocks, PAGES } from '@/lib/content/schema'

export const dynamic = 'force-dynamic'

// GET /api/content/schema — every editable block with its field list and
// current value, in one call. The web admin generates its forms from the
// same schema server-side; the mobile app has no access to lib/, so it
// generates them from this instead.
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const [values, edited] = await Promise.all([getAllContent(), editedKeys()])
  return NextResponse.json({
    pages: PAGES.filter((p) => p.id !== 'media'),
    blocks: blocks.map((b) => ({
      key: b.key,
      page: b.page,
      title: b.title,
      description: b.description,
      preview: b.preview,
      fields: b.fields,
      value: values[b.key] ?? b.default,
      edited: edited.has(b.key),
    })),
  })
}
