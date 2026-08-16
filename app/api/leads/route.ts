import { NextRequest, NextResponse } from 'next/server'
import { insert, getLeads, update } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import type { LeadKind } from '@/lib/types'

export const dynamic = 'force-dynamic'

const KINDS: LeadKind[] = [
  'Enquiry',
  'Site visit',
  'Verification review',
  'Data room',
  'Checklist download',
  'Tool result',
  'Listing request',
  'Advisor call',
]

/** Confirmation copy per conversion path — the acknowledgement
    should tell the visitor what actually happens next, not just
    that a form was received. */
const ACK: Partial<Record<LeadKind, string>> = {
  'Verification review': 'An advisor will come back within two working days with a preliminary read.',
  'Checklist download': 'The checklist is on its way to your inbox.',
  'Tool result': 'Your inputs are with the advisory desk. Expect a reply the same working day.',
  'Data room': 'A named advisor reviews every data room request personally.',
  'Site visit': 'We will call to confirm a time, usually within one working day.',
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const email = String(body.email ?? '').trim()

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!phone && !email) {
    return NextResponse.json({ error: 'A phone number or an email address is required' }, { status: 400 })
  }

  const kind = KINDS.includes(body.kind as LeadKind) ? (body.kind as LeadKind) : 'Enquiry'

  const record = {
    kind,
    name: name.slice(0, 160),
    company: String(body.company ?? '').slice(0, 160),
    phone: phone.slice(0, 40),
    email: email.slice(0, 160),
    property_code: String(body.property_code ?? '').slice(0, 40),
    property_type: String(body.property_type ?? '').slice(0, 40),
    corridor: String(body.corridor ?? '').slice(0, 60),
    source: String(body.source ?? '').slice(0, 120),
    channel: ['WhatsApp', 'Form', 'Call', 'Landing page'].includes(String(body.channel))
      ? String(body.channel)
      : 'Form',
    stage: 'New',
    payload: typeof body.payload === 'object' && body.payload ? body.payload : {},
    notes: String(body.notes ?? '').slice(0, 2000),
  }

  const result = await insert('leads', record)
  if (!result.ok) {
    return NextResponse.json({ error: 'Could not record the enquiry. Please use WhatsApp.' }, { status: 502 })
  }

  return NextResponse.json(
    {
      ok: true,
      persisted: result.persisted,
      message: ACK[kind] ?? 'An advisor will be in touch shortly.',
    },
    { status: 201 }
  )
}

/** Admin: the unified lead inbox. */
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const { data, source } = await getLeads()
  return NextResponse.json({ data, source })
}

/** Admin: advance a lead's pipeline stage. */
export async function PATCH(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const stage = searchParams.get('stage')
  const STAGES = ['New', 'Contacted', 'Qualified', 'Visit', 'Closed']

  if (!id || !stage) return NextResponse.json({ error: 'Missing id or stage' }, { status: 400 })
  if (!STAGES.includes(stage)) return NextResponse.json({ error: 'Unknown stage' }, { status: 400 })

  const result = await update('leads', id, { stage })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
