import { after } from 'next/server'
import { insertReturningId } from './db'
import { contactsReady, ensureContact } from './contacts'
import { ensureRecordFolder } from './google'
import type { CommissionType, Representing, TransactionStage } from './types'

export const TRANSACTION_STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
export const REPRESENTING: Representing[] = ['Buyer', 'Seller', 'Both']
export const COMMISSION_TYPES: CommissionType[] = ['Percentage', 'Flat']

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const num = (v: unknown) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null)

/** Find or create the buyer's and seller's contact cards from what a
    deal records about them, unless the caller already chose them. */
export async function partyContacts(body: Record<string, unknown>): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  if (!(await contactsReady())) return out
  for (const side of ['buyer', 'seller'] as const) {
    const key = `${side}_contact_id`
    if (key in body) {
      out[key] = body[key] ? String(body[key]) : null
      continue
    }
    const name = str(body[`${side}_name`], 160)
    if (!name) continue
    const id = await ensureContact({
      name,
      phone: str(body[`${side}_phone`], 40),
      email: str(body[`${side}_email`], 160),
      role: side === 'buyer' ? 'Buyer' : 'Seller',
      source: 'Deal',
    }).catch(() => null)
    if (id) out[key] = id
  }
  return out
}

/** Open a deal. Shared by POST /api/transactions and a lead's
    "Convert to deal", so both write exactly the same record. */
export async function createTransaction(body: Record<string, unknown>) {
  const propertyLabel = str(body.property_label, 200)
  const buyerName = str(body.buyer_name, 160)
  const sellerName = str(body.seller_name, 160)
  if (!propertyLabel) return { ok: false as const, status: 400, error: 'A property or deal label is required' }
  if (!buyerName && !sellerName) return { ok: false as const, status: 400, error: 'At least a buyer or seller name is required' }

  const reference = `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`
  const row: Record<string, unknown> = {
    reference,
    property_id: body.property_id ? String(body.property_id) : null,
    property_label: propertyLabel,
    off_market: !body.property_id,
    stage: TRANSACTION_STAGES.includes(body.stage as TransactionStage) ? body.stage : 'Enquiry',
    outcome: 'In progress',
    buyer_name: buyerName,
    buyer_phone: str(body.buyer_phone, 40),
    buyer_email: str(body.buyer_email, 160),
    seller_name: sellerName,
    seller_phone: str(body.seller_phone, 40),
    seller_email: str(body.seller_email, 160),
    representing: REPRESENTING.includes(body.representing as Representing) ? body.representing : 'Both',
    deal_value_cr: num(body.deal_value_cr),
    commission_type: COMMISSION_TYPES.includes(body.commission_type as CommissionType) ? body.commission_type : 'Percentage',
    commission_value: num(body.commission_value),
    commission_collected: false,
    advisor: str(body.advisor, 80),
    meetings: [],
    documents: [],
    notes: str(body.notes, 1000),
    opened_at: new Date().toISOString(),
    ...(await partyContacts(body)),
  }
  if (body.lead_id && (await contactsReady())) row.lead_id = String(body.lead_id)

  const result = await insertReturningId('transactions', row)
  if (!result.ok) return { ok: false as const, status: 502, error: result.error ?? 'Could not save the deal' }
  // Every deal gets its own Drive folder the moment it exists.
  if (result.id) {
    const id = result.id
    after(() => ensureRecordFolder({ section: 'Deals', entityType: 'transaction', entityId: id, label: `${reference} · ${propertyLabel}` }).catch(() => null))
  }
  return { ok: true as const, id: result.id, reference, persisted: result.persisted }
}
