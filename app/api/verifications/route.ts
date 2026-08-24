import { NextRequest, NextResponse } from 'next/server'
import { getVerificationCases, deriveFromCases, update, insert } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import type { StageStatus, VerificationStageKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* The verification pipeline — the record behind the internal
   board. Case-level detail is admin-only; only the aggregate is
   ever exposed publicly, and only once there is one to show. */

const STAGES: VerificationStageKey[] = ['documents', 'title', 'site', 'report']
const STATUSES: StageStatus[] = ['Not started', 'In progress', 'Flagged', 'Verified']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const aggregateOnly = searchParams.get('aggregate') === '1'

  const { data, source } = await getVerificationCases()

  if (aggregateOnly) {
    return NextResponse.json({ data: deriveFromCases(data), source })
  }

  const denied = await assertAdmin()
  if (denied) return denied

  return NextResponse.json({ data, source, aggregate: deriveFromCases(data) })
}

/** Advance or flag a single stage on a case. */
export async function PATCH(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const id = String(body.id ?? '')
  const stageKey = String(body.stage ?? '') as VerificationStageKey
  const status = String(body.status ?? '') as StageStatus

  if (!id) return NextResponse.json({ error: 'Missing case id' }, { status: 400 })
  if (!STAGES.includes(stageKey)) return NextResponse.json({ error: 'Unknown stage' }, { status: 400 })
  if (!STATUSES.includes(status)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 })

  const { data: cases } = await getVerificationCases()
  const record = cases.find((c) => c.id === id)
  if (!record) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const stages = record.stages.map((s) =>
    s.key === stageKey
      ? {
          ...s,
          status,
          completed_at: status === 'Verified' || status === 'Flagged' ? new Date().toISOString() : null,
          reviewer: String(body.reviewer ?? s.reviewer ?? ''),
          note: String(body.note ?? s.note ?? ''),
        }
      : s
  )

  // A flag anywhere stops the case; all six verified closes it.
  const flagged = stages.find((s) => s.status === 'Flagged')
  const allVerified = stages.every((s) => s.status === 'Verified')
  const outcome = flagged ? 'Flagged' : allVerified ? 'Verified' : 'In progress'
  const closed = outcome !== 'In progress'

  const patch: Record<string, unknown> = { stages, outcome }
  if (closed) {
    const closedAt = record.closed_at ?? new Date().toISOString()
    patch.closed_at = closedAt
    patch.turnaround_days = Math.max(
      1,
      Math.round((new Date(closedAt).getTime() - new Date(record.opened_at).getTime()) / 86400000)
    )
    if (flagged && body.flag_reason) patch.flag_reason = String(body.flag_reason).slice(0, 400)
  } else {
    patch.closed_at = null
    patch.turnaround_days = null
  }

  const result = await update('verification_cases', id, patch)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

  return NextResponse.json({ ok: true, persisted: result.persisted, outcome })
}

/** Open a new verification case. */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const label = String(body.parcel_label ?? '').trim()
  if (!label) return NextResponse.json({ error: 'A parcel label is required' }, { status: 400 })

  const reference = `VER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`

  const result = await insert('verification_cases', {
    id: reference,
    reference,
    parcel_label: label.slice(0, 200),
    location: String(body.location ?? '').slice(0, 120),
    survey_number: String(body.survey_number ?? '').slice(0, 120),
    extent_acres: Number(body.extent_acres) || null,
    client_name: String(body.client_name ?? '').slice(0, 160),
    advisor: String(body.advisor ?? '').slice(0, 80),
    outcome: 'In progress',
    stages: STAGES.map((key, i) => ({
      key,
      status: i === 0 ? 'In progress' : 'Not started',
      reviewer: String(body.advisor ?? ''),
      note: '',
    })),
    opened_at: new Date().toISOString(),
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted, reference }, { status: 201 })
}
