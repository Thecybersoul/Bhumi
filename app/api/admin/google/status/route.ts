import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { hasGoogleAuth, isConnected, disconnect, connectionInfo, serviceStatus, WORKSPACE_EMAIL } from '@/lib/google'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const [connected, services, info] = await Promise.all([isConnected(), serviceStatus(), connectionInfo()])
  return NextResponse.json({
    configured: hasGoogleAuth(),
    connected,
    drive: services.drive,
    services,
    // Connected, but granted before a service was added: reconnect to get it.
    missing: connected ? Object.entries(services).filter(([, on]) => !on).map(([k]) => k) : [],
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
