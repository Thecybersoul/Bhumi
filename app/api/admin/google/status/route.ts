import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { hasGoogleAuth, isConnected, hasDrive, disconnect } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const [connected, drive] = await Promise.all([isConnected(), hasDrive()])
  return NextResponse.json({ configured: hasGoogleAuth(), connected, drive })
}

export async function DELETE() {
  const denied = await assertAdmin()
  if (denied) return denied

  await disconnect()
  return NextResponse.json({ ok: true })
}
