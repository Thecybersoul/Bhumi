import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('bhumi_admin')
  return NextResponse.json({ ok: true })
}
