import { NextRequest, NextResponse } from 'next/server'
import { insertReturningId, getLeads, update } from '@/lib/db'
import { assertAdmin, currentUser } from '@/lib/auth'
import { contactsReady, ensureContact, schemaHint } from '@/lib/contacts'
import { LEAD_CHANNELS, LEAD_KINDS, isStage, leadFields, stageEffects } from '@/lib/leads'
import { createServiceClient } from '@/lib/supabase'
import type { LeadChannel, LeadKind } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

/* POST /api/leads — two callers:
   · the website's forms (public): name + phone/email + what they asked about;
   · an advisor adding a lead by hand (signed in): the same, plus the
     requirement, owner and follow-up fields from migration 015.
   Either way the person is found or created in contacts, so a repeat
   enquirer is recognised. */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const me = await currentUser()
  const name = String(body.name ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const email = String(body.email ?? '').trim()

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  // An advisor may add a lead from a contact already on file.
  if (!phone && !email && !(me && body.contact_id)) {
    return NextResponse.json({ error: 'A phone number or an email address is required' }, { status: 400 })
  }

  const kind = LEAD_KINDS.includes(body.kind as LeadKind) ? (body.kind as LeadKind) : 'Enquiry'
  const record: Record<string, unknown> = {
    kind,
    name: name.slice(0, 160),
    company: String(body.company ?? '').slice(0, 160),
    phone: phone.slice(0, 40),
    email: email.slice(0, 160),
    property_code: String(body.property_code ?? '').slice(0, 40),
    property_type: String(body.property_type ?? '').slice(0, 40),
    corridor: String(body.corridor ?? '').slice(0, 60),
    source: String(body.source ?? '').slice(0, 120),
    channel: LEAD_CHANNELS.slice(0, 4).includes(body.channel as LeadChannel) ? String(body.channel) : 'Form',
    stage: 'New',
    payload: typeof body.payload === 'object' && body.payload ? body.payload : {},
    notes: String(body.notes ?? '').slice(0, 2000),
  }

  if (me) {
    const extra = leadFields(body)
    delete extra.stage
    Object.assign(record, extra)
    if (!record.source) record.source = `Added by ${me.name}`
    if (!('assigned_to' in extra)) record.assigned_to = me.name
  }

  // Known person? Link them; new person? Start their contact card.
  if (await contactsReady()) {
    if (!record.contact_id) {
      record.contact_id = await ensureContact({
        name,
        phone,
        email,
        company: String(record.company ?? ''),
        role: ['Sell', 'Rent out'].includes(String(record.intent)) || kind === 'Listing request' ? 'Seller' : 'Buyer',
        source: `Lead · ${kind}`,
      }).catch(() => null)
    }
    if (kind === 'Listing request' && !record.intent) record.intent = 'Sell'
  } else if (!me) {
    delete record.contact_id
  }

  const result = await insertReturningId('leads', record)
  if (!result.ok) {
    return NextResponse.json(
      { error: me ? schemaHint(result.error) : 'Could not record the enquiry. Please use WhatsApp.' },
      { status: 502 }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      persisted: result.persisted,
      id: me ? result.id : undefined,
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

/** Admin: advance a lead's pipeline stage — the one-tap "→ next" on a
    lead card. Kept as a query-string PATCH because app builds already
    installed on phones call it this way. */
export async function PATCH(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const stage = searchParams.get('stage')

  if (!id || !stage) return NextResponse.json({ error: 'Missing id or stage' }, { status: 400 })
  if (!isStage(stage)) return NextResponse.json({ error: 'Unknown stage' }, { status: 400 })

  let patch: Record<string, unknown> = { stage }
  if (await contactsReady()) {
    const before = (await createServiceClient().from('leads').select('stage, last_contacted_at').eq('id', id).maybeSingle()).data
    patch = { ...patch, ...stageEffects(stage, before ?? undefined) }
  }
  const result = await update('leads', id, patch)
  if (!result.ok) return NextResponse.json({ error: schemaHint(result.error) }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted })
}
