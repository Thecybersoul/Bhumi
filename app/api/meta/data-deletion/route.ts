import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { readSignedRequest } from '@/lib/meta-signed'

export const dynamic = 'force-dynamic'

/* Meta's "Data deletion request" callback. A person who used Instagram or
   Facebook login with the Bhumi app asks Meta to have their data deleted;
   Meta posts a signed_request here. The app only ever signs in the firm's
   own Instagram account, so the stored connection (token included) is
   removed, and Meta is given a status link and confirmation code as it
   requires. Anything else the person wants erased (chats, enquiries) is
   handled under "Your rights" on /privacy. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const data = readSignedRequest(String(form?.get('signed_request') ?? ''))
  if (!data) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
  const uid = String(data.user_id ?? '')
  if (uid) await createServiceClient().from('ig_accounts').delete().eq('ig_user_id', uid).then(() => null, () => null)
  const code = createHash('sha256').update(`${uid}:${data.issued_at ?? ''}`).digest('hex').slice(0, 16)
  const origin = req.nextUrl.origin.replace('://bhumiestates.in', '://www.bhumiestates.in')
  return NextResponse.json({ url: `${origin}/privacy?deletion=${code}#data-deletion`, confirmation_code: code })
}
