import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/enquiries
export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('enquiries')
    .select(`*, properties(code, title, location)`)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/enquiries — public endpoint
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('enquiries')
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/enquiries?id=xxx&stage=Contacted — advance pipeline stage
export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const stage = searchParams.get('stage')
  if (!id || !stage) return NextResponse.json({ error: 'Missing id or stage' }, { status: 400 })
  const { data, error } = await supabase
    .from('enquiries').update({ stage }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
