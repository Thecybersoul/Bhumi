import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { readSignedRequest } from '@/lib/meta-signed'

export const dynamic = 'force-dynamic'

/* Meta calls this when someone removes the Bhumi app from their Instagram
   or Facebook account (the "Deauthorize callback URL"). The firm's own
   Instagram connection is marked disconnected so the ERP stops using a
   revoked token. Signed by Meta; nothing else is accepted. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const data = readSignedRequest(String(form?.get('signed_request') ?? ''))
  if (!data) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
  const uid = String(data.user_id ?? '')
  if (uid) {
    await createServiceClient()
      .from('ig_accounts')
      .update({ status: 'disconnected', token: '', last_error: 'Removed in Instagram', updated_at: new Date().toISOString() })
      .eq('ig_user_id', uid)
      .then(() => null, () => null)
  }
  return NextResponse.json({ ok: true })
}
