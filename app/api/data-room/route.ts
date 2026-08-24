import { NextRequest, NextResponse } from 'next/server'
import { insert, update, getDataRoomRequests } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/* NDA-gated data room requests — Plan §9.
   Access is never granted by this endpoint. It records the
   request and routes it to a named advisor, who releases the
   memorandum manually. An automated gate is not a gate. */

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const parcel = String(body.parcel_code ?? '').trim()

  if (!name || !email || !parcel) {
    return NextResponse.json({ error: 'Name, email and parcel are required' }, { status: 400 })
  }
  if (body.nda_accepted !== true) {
    return NextResponse.json(
      { error: 'The confidentiality undertaking must be accepted before access can be requested.' },
      { status: 400 }
    )
  }

  const record = {
    parcel_code: parcel.slice(0, 40),
    parcel_label: String(body.parcel_label ?? '').slice(0, 200),
    name: name.slice(0, 160),
    organisation: String(body.organisation ?? '').slice(0, 160),
    role: String(body.role ?? '').slice(0, 120),
    email: email.slice(0, 160),
    phone: String(body.phone ?? '').slice(0, 40),
    buyer_type: ['Developer', 'Investor', 'Family office', 'Institution', 'Other'].includes(
      String(body.buyer_type)
    )
      ? String(body.buyer_type)
      : 'Other',
    ticket_size: String(body.ticket_size ?? '').slice(0, 60),
    nda_accepted: true,
    status: 'Pending',
  }

  const result = await insert('data_room_requests', record)
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Could not record the request. Please contact the advisory desk directly.' },
      { status: 502 }
    )
  }

  // Mirror into the unified lead inbox so nothing lives in only one place.
  await insert('leads', {
    kind: 'Data room',
    name: record.name,
    company: record.organisation,
    phone: record.phone,
    email: record.email,
    property_code: record.parcel_code,
    property_type: 'large-land-parcels',
    source: '/property-consultancy',
    channel: 'Form',
    stage: 'New',
    payload: { buyer_type: record.buyer_type, ticket_size: record.ticket_size, role: record.role },
    notes: `Data room request for ${record.parcel_code}. NDA accepted.`,
  })

  return NextResponse.json(
    {
      ok: true,
      persisted: result.persisted,
      message:
        'Your request is with the large-parcel advisory desk. Access to the memorandum is released by a named advisor, usually within one working day.',
    },
    { status: 201 }
  )
}

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const { data, source } = await getDataRoomRequests()
  return NextResponse.json({ data, source })
}

/** Admin: approve, decline or assign a request. */
export async function PATCH(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const status = searchParams.get('status')
  const advisor = searchParams.get('advisor')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (status) {
    if (!['Pending', 'Approved', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
    }
    patch.status = status
  }
  if (advisor) patch.assigned_advisor = advisor
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const result = await update('data_room_requests', id, patch)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
