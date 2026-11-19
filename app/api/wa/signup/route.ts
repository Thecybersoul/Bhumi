import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { GRAPH, connectAccount, disconnectAccount, listAccounts, waConfigured } from '@/lib/wa'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* Connect WhatsApp (Meta Embedded Signup, coexistence).
   GET   what the browser needs to start sign-up (no secrets), and the linked numbers
   POST  {code, waba_id, phone_number_id}  finish sign-up
   POST  {disconnect: id}                  stop capture for a number */

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied
  let accounts: Awaited<ReturnType<typeof listAccounts>> = []
  try {
    accounts = await listAccounts()
  } catch {
    // migration 026 not applied yet
  }
  return NextResponse.json({
    configured: waConfigured(),
    webhook_ready: !!(process.env.WA_VERIFY_TOKEN && process.env.META_APP_SECRET),
    app_id: process.env.META_APP_ID ?? null,
    config_id: process.env.WA_CONFIG_ID ?? null,
    graph_version: GRAPH().split('/').pop(),
    accounts,
  })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied
  const user = await currentUser()
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  try {
    if (body.disconnect) {
      await disconnectAccount(String(body.disconnect))
      await logActivity({ action: 'update', entity_type: 'capture', entity_id: String(body.disconnect), entity_label: 'WhatsApp', summary: 'Disconnected a WhatsApp number from capture' })
      return NextResponse.json({ ok: true })
    }
    if (!waConfigured()) return NextResponse.json({ error: 'The Meta app is not set up on the server yet (META_APP_ID, META_APP_SECRET, WA_CONFIG_ID).' }, { status: 400 })
    const code = String(body.code ?? '')
    const waba = String(body.waba_id ?? '')
    const pnid = String(body.phone_number_id ?? '')
    if (!code || !waba || !pnid) return NextResponse.json({ error: 'Sign-up did not finish: code, waba_id and phone_number_id are required.' }, { status: 400 })
    const r = await connectAccount(code, waba, pnid, user?.name ?? 'ERP')
    await logActivity({ action: 'create', entity_type: 'capture', entity_id: pnid, entity_label: `WhatsApp ${r.display_phone}`, summary: `Connected WhatsApp ${r.display_phone} for capture` })
    return NextResponse.json({ ok: true, ...r })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
