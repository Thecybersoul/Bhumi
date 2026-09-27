import { NextRequest, NextResponse } from 'next/server'
import { getContacts, getLeads, getMeetings, getNotes, getProperties, getTasks, getTransactions } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { createServiceClient, hasSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface SearchHit {
  type: 'lead' | 'contact' | 'agent' | 'property' | 'transaction' | 'meeting' | 'task' | 'note' | 'document'
  id: string
  title: string
  sub: string
  /** For a document, task or note: the record it belongs to. */
  entity_type?: string | null
  entity_id?: string | null
}

const PER_GROUP = 6
const s = (v: unknown) => (v == null ? '' : String(v))

/* GET /api/search?q= — one box for everything: people and agents by
   name, phone, agency or RERA number; listings by code, title or
   place; deals by reference, parcel or party; leads, meetings,
   tasks, notes and documents by their words. Live records only. */
export async function GET(req: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase()
  if (q.length < 2) return NextResponse.json({ data: [] })
  const digits = q.replace(/\D/g, '')
  const words = q.split(/\s+/).filter(Boolean)
  const hit = (text: string, phones: string[] = []) => {
    const t = text.toLowerCase()
    if (words.every((w) => t.includes(w))) return true
    return digits.length >= 4 && phones.some((p) => p.replace(/\D/g, '').includes(digits))
  }
  const live = <T,>(r: { data: T[]; source: string }) => (r.source === 'live' ? r.data : [])

  const [leads, contacts, props, deals, meetings, tasks, notes, docs] = await Promise.all([
    getLeads().then(live),
    getContacts().then(live),
    getProperties({ admin: true }).then(live),
    getTransactions().then(live),
    getMeetings().then(live),
    getTasks().then(live),
    getNotes().then(live),
    hasSupabase()
      ? createServiceClient()
          .from('documents')
          .select('id, name, category, entity_type, entity_id, entity_label')
          .order('created_at', { ascending: false })
          .limit(1000)
          .then((r) => (r.data ?? []) as Record<string, unknown>[])
      : Promise.resolve([] as Record<string, unknown>[]),
  ])

  const out: SearchHit[] = []
  const take = <T,>(list: T[], match: (x: T) => boolean, map: (x: T) => SearchHit) => out.push(...list.filter(match).slice(0, PER_GROUP).map(map))

  take(
    contacts,
    (c) => hit(`${c.name} ${c.company ?? ''} ${c.email} ${c.agency ?? ''} ${c.rera_number ?? ''} ${c.city ?? ''} ${c.operating_areas ?? ''}`, [c.phone, c.alt_phone ?? '']),
    (c) => {
      const agent = c.roles?.includes('Agent')
      return {
        type: agent ? 'agent' : 'contact',
        id: c.id,
        title: c.name,
        sub: [agent ? c.agency || 'Agent' : c.roles?.join(', '), c.phone, agent ? c.operating_areas : c.company].filter(Boolean).join(' · '),
      }
    }
  )
  take(
    leads,
    (l) => hit(`${l.name} ${l.company} ${l.email} ${l.locations ?? ''} ${l.corridor ?? ''} ${l.property_code ?? ''} ${l.notes}`, [l.phone]),
    (l) => ({ type: 'lead', id: l.id, title: l.name, sub: [l.intent ?? l.kind, l.stage === 'Visit' ? 'Site visit' : l.stage, l.locations || l.corridor].filter(Boolean).join(' · ') })
  )
  take(
    props,
    (p) => hit(`${p.code} ${p.title} ${p.location} ${p.corridor ?? ''} ${p.survey_number ?? ''}`),
    (p) => ({ type: 'property', id: p.id, title: `${p.code} · ${p.title}`, sub: [p.location, p.status].join(' · ') })
  )
  take(
    deals,
    (d) => hit(`${d.reference} ${d.property_label} ${d.buyer_name} ${d.seller_name}`, [d.buyer_phone ?? '', d.seller_phone ?? '']),
    (d) => ({ type: 'transaction', id: d.id, title: `${d.reference} · ${d.property_label}`, sub: [d.outcome === 'In progress' ? d.stage : d.outcome, [d.buyer_name, d.seller_name].filter(Boolean).join(' ↔ ')].filter(Boolean).join(' · ') })
  )
  take(
    meetings,
    (m) => hit(`${m.title} ${m.location ?? ''} ${m.attendees ?? ''} ${m.entity_label ?? ''}`),
    (m) => ({ type: 'meeting', id: m.id, title: m.title, sub: [m.kind, new Date(m.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), m.entity_label].filter(Boolean).join(' · ') })
  )
  take(
    tasks,
    (t) => hit(`${t.title} ${t.entity_label ?? ''}`),
    (t) => ({ type: 'task', id: t.id, title: t.title, sub: [t.status, t.entity_label].filter(Boolean).join(' · '), entity_type: t.entity_type, entity_id: t.entity_id })
  )
  take(
    notes,
    (n) => hit(`${n.body} ${n.entity_label ?? ''}`),
    (n) => ({ type: 'note', id: n.id, title: n.body.slice(0, 80), sub: n.entity_label || 'Note', entity_type: n.entity_type, entity_id: n.entity_id })
  )
  take(
    docs,
    (d) => hit(`${s(d.name)} ${s(d.category)} ${s(d.entity_label)}`),
    (d) => ({ type: 'document', id: s(d.id), title: s(d.name), sub: [s(d.category), s(d.entity_label)].filter(Boolean).join(' · '), entity_type: s(d.entity_type), entity_id: d.entity_id ? s(d.entity_id) : null })
  )

  return NextResponse.json({ data: out })
}
