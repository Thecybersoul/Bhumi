import { NextRequest, NextResponse } from 'next/server'
import { syncRegister } from '@/lib/sheets'
import { safeEqual } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* Daily Vercel Cron (vercel.json). Vercel sends
   `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set this
   route refuses every caller, so it can't be triggered by the public. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!secret || !safeEqual(got, secret)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  try {
    const state = await syncRegister('Daily sync')
    return NextResponse.json({ ok: true, last_synced_at: state.last_synced_at })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message })
  }
}
