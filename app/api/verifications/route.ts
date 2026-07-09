import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export type VerificationStatus = 'Verified' | 'Pending' | 'N/A' | 'Flagged'

export interface VerificationItem {
  key: string
  label: string
  status: VerificationStatus
  date: string
  reviewer: string
  note: string
}

export interface VerificationRecord {
  property_id: string
  updated_at: string
  items: VerificationItem[]
}

// In-memory mock store for verifications (resets on serverless cold starts)
const globalStore = global as typeof globalThis & { __VERIFICATIONS_MAP: Map<string, VerificationRecord> }
if (!globalStore.__VERIFICATIONS_MAP) {
  globalStore.__VERIFICATIONS_MAP = new Map()
}

const DEFAULT_ITEMS: VerificationItem[] = [
  { key: 'title', label: 'Title Chain', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'ec', label: 'Encumbrance Certificate (EC)', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'khata', label: 'Khata', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'rtc', label: 'RTC / Pahani', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'survey', label: 'Survey Number & Boundary', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'zoning', label: 'Zoning & Land Use', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'conversion', label: 'Conversion Status', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'rera', label: 'RERA Applicability', status: 'Pending', date: '', reviewer: '', note: '' },
  { key: 'scope', label: 'Scope Note', status: 'Pending', date: '', reviewer: '', note: '' }
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')
  
  if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 })

  let record = globalStore.__VERIFICATIONS_MAP.get(propertyId)
  if (!record) {
    // Generate an empty mock record
    record = {
      property_id: propertyId,
      updated_at: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(DEFAULT_ITEMS))
    }
  }

  return NextResponse.json(record)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as VerificationRecord
  if (!body.property_id) return NextResponse.json({ error: 'property_id required' }, { status: 400 })

  body.updated_at = new Date().toISOString()
  globalStore.__VERIFICATIONS_MAP.set(body.property_id, body)

  return NextResponse.json({ success: true, record: body })
}
