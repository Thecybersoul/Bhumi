import { NextRequest, NextResponse } from 'next/server'
import { getTransactions, insert } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import type { TransactionStage, CommissionType, Representing } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
const REPRESENTING: Representing[] = ['Buyer', 'Seller', 'Both']
const COMMISSION_TYPES: CommissionType[] = ['Percentage', 'Flat']

// GET /api/transactions — admin only, the whole pipeline is internal
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const { data, source } = await getTransactions()
  return NextResponse.json({ data, source })
}

// POST /api/transactions — open a new transaction, listed or off-market
export async function POST(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const propertyLabel = String(body.property_label ?? '').trim()
  const buyerName = String(body.buyer_name ?? '').trim()
  const sellerName = String(body.seller_name ?? '').trim()

  if (!propertyLabel) return NextResponse.json({ error: 'A property or deal label is required' }, { status: 400 })
  if (!buyerName && !sellerName) {
    return NextResponse.json({ error: 'At least a buyer or seller name is required' }, { status: 400 })
  }

  const representing = REPRESENTING.includes(body.representing as Representing)
    ? (body.representing as Representing)
    : 'Both'
  const commissionType = COMMISSION_TYPES.includes(body.commission_type as CommissionType)
    ? (body.commission_type as CommissionType)
    : 'Percentage'

  const reference = `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`

  const result = await insert('transactions', {
    reference,
    property_id: body.property_id ? String(body.property_id) : null,
    property_label: propertyLabel.slice(0, 200),
    off_market: !body.property_id,
    stage: STAGES.includes(body.stage as TransactionStage) ? body.stage : 'Enquiry',
    outcome: 'In progress',
    buyer_name: buyerName.slice(0, 160),
    buyer_phone: String(body.buyer_phone ?? '').slice(0, 40),
    buyer_email: String(body.buyer_email ?? '').slice(0, 160),
    seller_name: sellerName.slice(0, 160),
    seller_phone: String(body.seller_phone ?? '').slice(0, 40),
    seller_email: String(body.seller_email ?? '').slice(0, 160),
    representing,
    deal_value_cr: body.deal_value_cr != null && body.deal_value_cr !== '' ? Number(body.deal_value_cr) : null,
    commission_type: commissionType,
    commission_value:
      body.commission_value != null && body.commission_value !== '' ? Number(body.commission_value) : null,
    commission_collected: false,
    advisor: String(body.advisor ?? '').slice(0, 80),
    meetings: [],
    documents: [],
    notes: String(body.notes ?? '').slice(0, 1000),
    opened_at: new Date().toISOString(),
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true, persisted: result.persisted, reference }, { status: 201 })
}
