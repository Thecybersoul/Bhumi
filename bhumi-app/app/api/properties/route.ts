import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/properties — returns all properties (admin sees all, public only 'Live')
export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const admin = searchParams.get('admin') === '1'

  let query = supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (!admin) {
    query = query.eq('status', 'Live')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/properties — create new property (admin only)
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('properties')
    .insert([body])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
