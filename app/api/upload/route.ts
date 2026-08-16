import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, hasSupabase } from '@/lib/supabase'
import { assertAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/* Listing media upload. Admin-only: this writes to storage with
   the service role, so an unauthenticated caller here would be an
   open write endpoint against the project's bucket. */

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

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
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported type ${file.type}. Allowed: JPEG, PNG, WebP, AVIF.` },
        { status: 415 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds the 10 MB limit' }, { status: 413 })
    }

    // Derive the extension from the validated MIME type rather than
    // the client-supplied filename.
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const supabase = createServiceClient()

    const { error } = await supabase.storage.from('properties').upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error('[bhumi] storage upload failed', error)
      return NextResponse.json({ error: error.message }, { status: 502 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('properties').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl }, { status: 201 })
  } catch (err) {
    console.error('[bhumi] upload handler error', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
