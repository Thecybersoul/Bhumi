import { NextResponse } from 'next/server'
import { assertAdmin, currentUser } from '@/lib/auth'
import { registerStatus, syncRegister } from '@/lib/sheets'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET /api/sheets — the register's URL and when it last synced
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied
  return NextResponse.json(await registerStatus())
}

// POST /api/sheets — sync now
export async function POST() {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  try {
    const state = await syncRegister(me.name)
    await logActivity({ action: 'sync', entity_type: 'sheets', entity_label: 'Google Sheets register', summary: 'Synced the ERP register to Google Sheets' }, me)
    return NextResponse.json({ ok: true, ...state })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
