import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { hasGoogleAuth, isConnected, hasDrive, disconnect, connectionInfo, WORKSPACE_EMAIL } from '@/lib/google'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const [connected, drive, info] = await Promise.all([isConnected(), hasDrive(), connectionInfo()])
  return NextResponse.json({
    configured: hasGoogleAuth(),
    connected,
    drive,
    account: WORKSPACE_EMAIL,
    email: info?.email || null,
    connected_by: info?.connected_by || null,
    connected_at: info?.connected_at ?? null,
  })
}

export async function DELETE() {
  const denied = await assertAdmin()
  if (denied) return denied

  const info = await connectionInfo()
  await disconnect()
  await logActivity({ action: 'disconnect', entity_type: 'google', entity_label: info?.email || 'Google', summary: 'Disconnected Google Workspace' })
  return NextResponse.json({ ok: true })
}
