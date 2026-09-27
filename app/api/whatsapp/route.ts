import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { erpCaller, errorOf, type ErpCall } from '@/lib/erp-call'
import { publishImage } from '@/lib/document-files'
import { parseWhatsApp, type ContactDraft, type Draft, type ListingDraft, type LeadDraft } from '@/lib/whatsapp/parse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* The free WhatsApp import: no AI, no cost (lib/whatsapp/parse.ts).

   POST { action: 'parse', text }
     → { result, codes, duplicates, existing_contact }
       result: the drafts read from the post, and who sent it;
       codes: a suggested listing code for each listing draft;
       duplicates: per draft, listings already on file that look the same;
       existing_contact: the contact already on file with that phone.

   POST { action: 'save', text, drafts, contact, photos }
     → { created: [{ type, id, label }], contact_id }
       Saves the reviewed drafts as Draft listings (or a lead), files the
       sender as a contact and links them, attaches the photos, and makes
       the first photo the listing's picture. Everything goes through the
       ERP's own routes, as the signed-in person. */

interface Listed {
  id: string
  code: string
  title: string
  location?: string
  extent_acres?: number
  survey_number?: string
  plot_area_sqft?: number
}

const TYPE_LETTER: Record<string, string> = {
  'land-parcels': 'P',
  'large-land-parcels': 'P',
  residential: 'R',
  villas: 'V',
  commercial: 'C',
  warehouses: 'W',
}

/** BLR-<type>-<yy><nn>, continuing the running number for the year across all types. */
function nextCodes(existing: Listed[], drafts: Draft[]): string[] {
  const yy = String(new Date().getFullYear()).slice(2)
  let n = existing.reduce((max, l) => {
    const m = l.code?.match(new RegExp(`^BLR-[A-Z]+-${yy}(\\d{2,3})$`))
    return m ? Math.max(max, Number(m[1])) : max
  }, 0)
  return drafts.map((d) => (d.kind === 'listing' ? `BLR-${TYPE_LETTER[d.property_type] ?? 'P'}-${yy}${String(++n).padStart(2, '0')}` : ''))
}

const words = (s?: string) => new Set((s ?? '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3))

function lookAlikes(d: ListingDraft, all: Listed[]): Listed[] {
  const mine = words(d.location)
  return all.filter((l) => {
    if (d.survey_number && l.survey_number && d.survey_number.replace(/\s/g, '') === l.survey_number.replace(/\s/g, '')) return true
    const theirs = words(l.location)
    const samePlace = [...mine].some((w) => theirs.has(w))
    if (!samePlace) return false
    if (d.extent_acres && l.extent_acres) return Math.abs(d.extent_acres - l.extent_acres) / Math.max(d.extent_acres, l.extent_acres) < 0.03
    if (d.plot_area_sqft && l.plot_area_sqft) return d.plot_area_sqft === l.plot_area_sqft
    return false
  })
}

async function listings(call: ErpCall): Promise<Listed[]> {
  const r = await call('GET', '/api/properties?admin=1')
  return ((r.json.data as Listed[]) ?? []).map((l) => ({ ...l, id: String(l.id) }))
}

async function findContact(call: ErpCall, phone?: string): Promise<{ id: string; name: string } | null> {
  if (!phone) return null
  const r = await call('GET', `/api/search?q=${encodeURIComponent(phone.replace(/\s/g, ''))}`)
  const hits = (r.json.results as { type: string; id: string; label?: string; title?: string }[]) ?? (r.json.data as never[]) ?? []
  const hit = hits.find((h) => h.type === 'contact' || h.type === 'agent')
  return hit ? { id: String(hit.id), name: String(hit.label ?? hit.title ?? '') } : null
}

export async function POST(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const call = erpCaller(req.nextUrl.origin, { cookie: req.headers.get('cookie'), authorization: req.headers.get('authorization') })

  if (body?.action === 'parse') {
    const text = String(body.text ?? '').slice(0, 20_000)
    const result = parseWhatsApp(text)
    const all = result.drafts.some((d) => d.kind === 'listing') ? await listings(call) : []
    return NextResponse.json({
      result,
      codes: nextCodes(all, result.drafts),
      duplicates: result.drafts.map((d) => (d.kind === 'listing' ? lookAlikes(d, all).slice(0, 3).map((l) => ({ id: l.id, code: l.code, title: l.title })) : [])),
      existing_contact: await findContact(call, result.contact?.phone).catch(() => null),
    })
  }

  if (body?.action !== 'save') return NextResponse.json({ error: 'action must be parse or save' }, { status: 400 })

  const text = String(body.text ?? '')
  const drafts = (Array.isArray(body.drafts) ? body.drafts : []) as (Draft & { code?: string })[]
  const person = (body.contact ?? null) as (ContactDraft & { id?: string }) | null
  const photos = (Array.isArray(body.photos) ? body.photos : []) as { id: string; name: string; mime: string }[]
  if (!drafts.length) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })

  const created: { type: 'listing' | 'lead' | 'contact'; id: string; label: string }[] = []
  const problems: string[] = []

  // 1. The person, found or filed once.
  let contactId: string | null = person?.id ?? null
  if (!contactId && person && (person.phone || person.name)) {
    const found = await findContact(call, person.phone).catch(() => null)
    if (found) contactId = found.id
    else {
      const r = await call('POST', '/api/contacts', {
        name: person.name?.trim() || `WhatsApp contact ${person.phone ?? ''}`.trim(),
        phone: person.phone,
        roles: [person.role],
        ...(person.role === 'Agent' && person.agency ? { agency: person.agency } : {}),
        notes: 'Added from a WhatsApp post.',
      })
      if (r.status === 409 && r.json.duplicate) contactId = String((r.json.duplicate as { id: string }).id)
      else if (errorOf(r)) problems.push(`Contact: ${errorOf(r)}`)
      else {
        contactId = String(r.json.id)
        created.push({ type: 'contact', id: contactId, label: person.name || person.phone || 'Contact' })
      }
    }
  }
  const who = person?.name || person?.phone || 'the sender'

  // 2. Each draft.
  const codes = nextCodes(await listings(call), drafts)
  for (const [i, d] of drafts.entries()) {
    if (d.kind === 'lead') {
      const l = d as LeadDraft
      const r = await call('POST', '/api/leads', {
        name: person?.name || `WhatsApp enquiry ${person?.phone ?? ''}`.trim(),
        phone: person?.phone,
        ...(contactId ? { contact_id: contactId } : {}),
        intent: l.intent,
        stage: 'New',
        priority: 'Warm',
        channel: 'WhatsApp',
        property_type: l.property_type,
        size_requirement: l.size,
        locations: l.areas,
        notes: `${l.budget ? `Budget: ${l.budget}\n\n` : ''}From WhatsApp:\n${l.notes}`,
        source: 'WhatsApp',
      })
      if (errorOf(r)) problems.push(`Lead: ${errorOf(r)}`)
      else if (!r.json.id || r.json.persisted === false) problems.push('Lead: not saved, because the database isn’t connected.')
      else created.push({ type: 'lead', id: String(r.json.id), label: l.title })
      continue
    }

    const L = d as ListingDraft & { code?: string }
    const code = (L.code || codes[i]).trim()
    const payload: Record<string, unknown> = {
      code,
      title: L.title,
      property_type: L.property_type,
      status: 'Draft',
      location: L.location || 'Location to confirm',
      zone: L.zone ?? 'North',
      extent_acres: L.extent_acres ?? 0,
      price_per_acre_cr: L.price_per_acre_cr ?? 0,
      use_cases: [],
      amenities: '',
      risk: 'Low',
      img_url: '/img/p1.jpg',
      description: `${text.trim() && drafts.length > 1 ? `${L.description.trim()}\n\n` : ''}Source (WhatsApp, particulars as stated by ${who}, not verified):\n${(text || L.description).trim()}`,
    }
    for (const k of ['corridor', 'price_total_cr', 'price_per_sqft', 'plot_area_sqft', 'built_up_sqft', 'dimensions', 'conversion', 'khata', 'authority', 'facing', 'road_type', 'survey_number', 'price_type'] as const) {
      if (L[k] !== undefined && L[k] !== '') payload[k] = L[k]
    }
    const r = await call('POST', '/api/properties', payload)
    if (errorOf(r)) {
      problems.push(`${code}: ${errorOf(r)}`)
      continue
    }
    if (!r.json.id || r.json.persisted === false) {
      problems.push(`${code}: not saved, because the database isn’t connected.`)
      continue
    }
    const id = String(r.json.id)
    const label = `${code} · ${L.title}`
    created.push({ type: 'listing', id, label })

    if (contactId) {
      const role = person?.role === 'Agent' ? 'Listing agent' : person?.role === 'Landowner' ? 'Landowner' : 'Seller'
      const link = await call('POST', '/api/contact-links', { contact_id: contactId, entity_type: 'property', entity_id: id, entity_label: label, role })
      if (errorOf(link)) problems.push(`Linking ${who}: ${errorOf(link)}`)
    }

    // Photos go with the first listing (a post's photos belong to one property).
    if (i === drafts.findIndex((x) => x.kind === 'listing') && photos.length) {
      for (const p of photos) {
        const f = await call('PATCH', `/api/documents/${p.id}`, { entity_type: 'property', entity_id: id, entity_label: label, category: 'Photos' })
        if (errorOf(f)) problems.push(`${p.name}: ${errorOf(f)}`)
      }
      const first = photos.find((p) => /^image\/(jpeg|png|webp)$/.test(p.mime))
      if (first) {
        const pub = await publishImage(first.id)
        if ('error' in pub) problems.push(`Photo: ${pub.error}`)
        else {
          const u = await call('PUT', `/api/properties/${id}`, { img_url: pub.url })
          if (errorOf(u)) problems.push(`Photo: ${errorOf(u)}`)
        }
      }
    }
  }

  return NextResponse.json({ ok: created.some((c) => c.type !== 'contact'), created, contact_id: contactId, problems })
}
