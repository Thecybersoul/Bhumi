/* Thumbnails for listings that have no photo of their own — almost every
   Property Register import shares the generic /img/p1.jpg. These are real
   parcels of land, so a stock or invented "photo" would mislead. Each card
   is plain and factual: the real Bhumi Estates lockup, the listing's category,
   its extent and rate, and supporting facts the record states. The look
   follows what the listing IS (listingKind), and each kind leads with the
   number its buyer decides on (a plot: the rate per sq ft; a parcel:
   acres). No decoration.

   Imagery (a sketch, survey or aerial) goes only on the codes listed in
   APPROVED_IMAGERY below: either a file at scripts/thumbnail-imagery/<CODE>.jpg|png, or a
   document filed on the listing with category Sketch, Map, Survey, Aerial
   or Location (upload it through the connector's upload_document).

     npx tsx --env-file=.env.local scripts/generate-listing-thumbnails.ts [CODE...]     # samples saved locally, nothing written
     npx tsx --env-file=.env.local scripts/generate-listing-thumbnails.ts --apply       # generate + set img_url for every listing still on the placeholder
     npx tsx --env-file=.env.local scripts/generate-listing-thumbnails.ts --apply --all # regenerate for every listing, even ones with a real photo

   Codes after --apply (e.g. --apply P001 P002) republish just those.

   Real photos set through get_upload_link/set_listing_photo win — this
   only touches listings on the shared placeholder (or all, with --all). */
import sharp from 'sharp'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServiceClient } from '../lib/supabase'
import { getProperties } from '../lib/db'
import { size, price, listingKind, type ListingKindKey } from '../lib/listing'
import { documentBytes } from '../lib/document-files'
import { createSessionToken } from '../lib/session'
import { listUsers } from '../lib/users'
import type { Property } from '../lib/types'

const ORIGIN = process.env.ORIGIN || 'http://localhost:3000'
const PLACEHOLDER = '/img/p1.jpg'
/* Imagery goes only on listings explicitly approved for it. */
const APPROVED_IMAGERY = ['P009']
const MEDIA_BUCKET = 'media'
const W = 1800
const H = 1200 // 3:2, the shape the marketplace card shows
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = 'Arial, Helvetica, sans-serif'

/* ─── The logo: the full stacked lockup, read from the committed artwork ─── */
const LOGO_VB = { x: 319, y: 915, w: 5394, h: 1167 }
const readLogo = (file: string) =>
  readFileSync(join(process.cwd(), 'public/img/logos', file), 'utf8').trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const LOGO = { dark: readLogo('bhumi-estates-primary-dark.svg'), light: readLogo('bhumi-estates-primary-light.svg') }
function logo(x: number, y: number, width: number, onLight: boolean): string {
  const s = width / LOGO_VB.w
  return `<g transform="translate(${x},${y}) scale(${s}) translate(${-LOGO_VB.x},${-LOGO_VB.y})">${onLight ? LOGO.light : LOGO.dark}</g>`
}

/* ─── Themes: every kind looks like what it is ─── */
interface Theme {
  stops: [string, string, string]
  ink: string
  accent: string
  accentSoft: string
  light: boolean
}
const THEMES: Record<ListingKindKey, Theme> = {
  plot: { stops: ['#0B4030', '#052B1F', '#031A12'], ink: '#F6F3EC', accent: '#C98D36', accentSoft: '#D9B978', light: false },
  layout: { stops: ['#0B4030', '#052B1F', '#031A12'], ink: '#F6F3EC', accent: '#C98D36', accentSoft: '#D9B978', light: false },
  'large-plot': { stops: ['#0F4A47', '#07302E', '#041D1C'], ink: '#F4F6F3', accent: '#D9B978', accentSoft: '#E8D3A1', light: false },
  'farm-plot': { stops: ['#4A5A26', '#33401B', '#222B12'], ink: '#F7F4E6', accent: '#E3C766', accentSoft: '#EAD58F', light: false },
  'land-parcel': { stops: ['#0B4030', '#052B1F', '#031A12'], ink: '#F6F3EC', accent: '#C98D36', accentSoft: '#D9B978', light: false },
  'commercial-plot': { stops: ['#1D2C27', '#111C18', '#0A110F'], ink: '#F4F2EC', accent: '#D9A441', accentSoft: '#E6C27A', light: false },
  'commercial-building': { stops: ['#1D2C27', '#111C18', '#0A110F'], ink: '#F4F2EC', accent: '#D9A441', accentSoft: '#E6C27A', light: false },
  villa: { stops: ['#FBF8F1', '#F6F3EC', '#EBE4D3'], ink: '#0E3B2E', accent: '#9E7833', accentSoft: '#B08A45', light: true },
  apartment: { stops: ['#FBF8F1', '#F6F3EC', '#EBE4D3'], ink: '#0E3B2E', accent: '#9E7833', accentSoft: '#B08A45', light: true },
  warehouse: { stops: ['#1D2C27', '#111C18', '#0A110F'], ink: '#F4F2EC', accent: '#D9A441', accentSoft: '#E6C27A', light: false },
}

/* ─── Copy: only what the listing itself states ─── */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const titleCase = (s: string) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase())
const firstClause = (s: string) => s.split(/\s*[\/,(]\s*/)[0].trim()
const shortPlace = (s: string) => {
  const f = firstClause(s)
  return f.length > 30 ? f.split(/s*[–-]s*/)[0] : f
}
function clip(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max).replace(/[\s,·–-]+\S*$/, '')
  return `${cut || s.slice(0, max)}…`
}
const inr = (n: number) => n.toLocaleString('en-IN')
const money = (cr: number) => (cr >= 1 ? `₹${cr.toFixed(cr < 10 ? 1 : 0)} Cr` : `₹${Math.round(cr * 100)} L`)

/** Trust cues, each one stated by the record — never a claim we invented. */
function trustChips(p: Property): string[] {
  const all = `${p.engagement ?? ''} ${(p.use_cases ?? []).join(' ')}`
  const chips: string[] = []
  if (/sanctioned/i.test(p.zoning ?? '')) chips.push('Sanctioned layout')
  else if (/^converted|conversion completed/i.test(p.conversion ?? '') || /converted/i.test(p.zoning ?? '')) chips.push('Converted')
  if (/outright/i.test(all) && /joint|\bJD\b/i.test(all)) chips.push('Outright or JD')
  else if (/joint development|\bJD\b/i.test(all)) chips.push('Joint development')
  if (/corner/i.test(`${p.dimensions ?? ''} ${p.title}`)) chips.push('Corner site')
  if (/a-?khata/i.test(p.ownership ?? '')) chips.push('A-Khata')
  else if (/single owner/i.test(p.ownership ?? '')) chips.push('Single owner')
  if (/yellow/i.test(p.zoning ?? '')) chips.push('Yellow zone')
  return chips.slice(0, 3)
}

interface Copy {
  eyebrow: string
  hero: string
  hookLabel: string
  hook: string
  hookSub: string | null
  where: string
  cta: string
}
function copyFor(p: Property, key: ListingKindKey): Copy {
  const total = price(p)
  const onRequest = p.price_type === 'On Request' || !total
  const eyebrow = clip((shortPlace(p.corridor || p.location) || `${p.zone} Bengaluru`).toUpperCase(), 30)
  const loc = firstClause(p.location)
  const where = clip(loc && loc.toUpperCase() !== eyebrow ? loc : `${p.zone} Bengaluru`, 30)
  const sz = size(p)
  const hero = key === 'apartment' || key === 'villa' ? (p.unit_mix || sz || '') : sz ?? ''

  // Lead with the figure a buyer of this kind actually decides on.
  let hookLabel = 'PRICE'
  let hook = total ?? 'On request'
  let hookSub: string | null = null
  const perSqft = p.price_per_sqft ? `₹${inr(p.price_per_sqft)} / sq ft` : null
  const perAcre = p.price_per_acre_cr ? `${money(p.price_per_acre_cr)} / acre` : null
  if (!onRequest) {
    if (['plot', 'layout', 'commercial-plot', 'commercial-building', 'apartment', 'villa'].includes(key) && perSqft) {
      hookLabel = 'RATE'
      hook = perSqft
      hookSub = p.price_total_cr ? `Total ${money(p.price_total_cr)}` : null
    } else if (['large-plot', 'land-parcel'].includes(key) && perAcre) {
      hookLabel = 'RATE'
      hook = perAcre
      hookSub = p.price_total_cr ? `Total ${money(p.price_total_cr)}` : null
    }
  }
  if (onRequest) {
    hookLabel = 'PRICE'
    hook = 'On request'
  }
  const cta = onRequest ? 'Ask for the price · bhumiestates.in' : 'Enquire · bhumiestates.in'
  return { eyebrow, hero: titleCase(hero), hookLabel, hook, hookSub, where, cta }
}

/* ─── Imagery ─── */
async function imageryFor(p: Property): Promise<Buffer | null> {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const f = join(process.cwd(), 'scripts/thumbnail-imagery', `${p.code}.${ext}`)
    if (existsSync(f)) return readFileSync(f)
  }
  const { data } = await createServiceClient()
    .from('documents')
    .select('id,name,category,mime')
    .eq('entity_type', 'property')
    .eq('entity_id', p.id)
    .like('mime', 'image/%')
  const doc = (data ?? []).find((d) => /sketch|map|survey|aerial|location/i.test(`${d.category} ${d.name}`))
  if (!doc) return null
  const got = await documentBytes(String(doc.id))
  return 'error' in got ? null : got.bytes
}

/** Resizes and feathers the edges so the picture melts into the card. */
async function featheredImagery(buf: Buffer, boxW: number, boxH: number): Promise<{ data: string; w: number; h: number }> {
  const img = await sharp(buf).resize({ width: boxW, height: boxH, fit: 'inside' }).ensureAlpha().png().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = img.info
  const mask = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="b"><feGaussianBlur stdDeviation="22"/></filter></defs><rect x="38" y="38" width="${w - 76}" height="${h - 76}" fill="#fff" filter="url(#b)"/></svg>`
  )
  const out = await sharp(img.data).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  return { data: out.toString('base64'), w, h }
}

/* ─── The card ───
   Plain and factual: no decoration. The whole card is used — identity
   and category along the top, the two numbers that matter in the middle,
   supporting facts below, place and enquiry along the bottom. */
const cell = (x: number, y: number, label: string, value: string, t: Theme) =>
  `<text x="${x}" y="${y}" font-family="${SANS}" font-size="26" font-weight="bold" letter-spacing="5" fill="${t.accentSoft}">${esc(label)}</text>
  <text x="${x}" y="${y + 58}" font-family="${SERIF}" font-size="48" fill="${t.ink}">${esc(value)}</text>`

/** Supporting facts, each one stated by the record. */
function facts(p: Property): [string, string][] {
  const out: [string, string][] = []
  const fit = (v: string, n = 28) => (v.length <= n ? v : '')
  const road = fit((p.road_type ?? '').split(/[;(]/)[0].trim())
  if (road) out.push(['ACCESS', road])
  const use = fit((p.land_use ?? '').split(/[;(,]/)[0].trim())
  if (use) out.push(['LAND USE', use])
  const own = (p.ownership ?? '').trim()
  if (fit(own)) out.push(['OWNERSHIP', own])
  if (p.dimensions && fit(p.dimensions, 32)) out.push(['DIMENSIONS', p.dimensions])
  return out.slice(0, 4)
}

async function cardSVG(p: Property): Promise<string> {
  const { key, label } = listingKind(p)
  const t = THEMES[key]
  const c = copyFor(p, key)
  const art = APPROVED_IMAGERY.includes(p.code) ? await imageryFor(p) : null
  const img = art ? await featheredImagery(art, 860, 780) : null
  const rule = (y: number) => `<line x1="100" y1="${y}" x2="${W - 100}" y2="${y}" stroke="${t.accent}" stroke-opacity="0.45" stroke-width="2"/>`
  const fs = Math.min(img ? 190 : 210, Math.floor((img ? 760 : 820) / (Math.max(c.hero.length, 1) * 0.5)))
  const fx = facts(p)
  const badgeW = Math.round(label.length * 17 + 64)

  const head = `
  ${logo(100, 96, 470, t.light)}
  <rect x="${W - 100 - badgeW}" y="104" width="${badgeW}" height="60" rx="30" fill="${t.accent}"/>
  <text x="${W - 100 - badgeW / 2}" y="144" text-anchor="middle" font-family="${SANS}" font-size="26" font-weight="bold" letter-spacing="3" fill="${t.light ? '#FFFFFF' : '#10231B'}">${esc(label.toUpperCase())}</text>`
  const foot = `
  ${rule(1020)}
  <text x="100" y="1100" font-family="${SERIF}" font-style="italic" font-size="46" fill="${t.ink}">${esc(c.where)}</text>
  <text x="${W - 100}" y="1100" text-anchor="end" font-family="${SANS}" font-size="30" letter-spacing="1" fill="${t.ink}" opacity="0.7">${esc(c.cta)}</text>`
  const bg = `<defs><radialGradient id="bg" cx="0.5" cy="0.4" r="0.95"><stop offset="0" stop-color="${t.stops[0]}"/><stop offset="0.6" stop-color="${t.stops[1]}"/><stop offset="1" stop-color="${t.stops[2]}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>`

  if (img) {
    // Approved imagery: picture on the right, facts stacked on the left.
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${bg}
  <image x="${W - 80 - img.w}" y="230" width="${img.w}" height="${img.h}" href="data:image/png;base64,${img.data}"/>
  ${head}
  <text x="100" y="330" font-family="${SANS}" font-size="34" font-weight="bold" letter-spacing="5" fill="${t.accent}">${esc(c.eyebrow)}</text>
  <text x="92" y="${330 + fs * 0.85 + 30}" font-family="${SERIF}" font-size="${fs}" fill="${t.ink}">${esc(c.hero)}</text>
  ${cell(100, 640, c.hookLabel, c.hook, t)}
  ${c.hookSub ? `<text x="100" y="745" font-family="${SERIF}" font-style="italic" font-size="40" fill="${t.ink}" opacity="0.85">${esc(c.hookSub)}</text>` : ''}
  ${fx.slice(0, 2).map(([l, v], i) => cell(100, 800 + i * 120, l, v, t)).join('')}
  ${foot}
</svg>`
  }

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${bg}
  ${head}
  ${rule(250)}
  <text x="100" y="326" font-family="${SANS}" font-size="34" font-weight="bold" letter-spacing="5" fill="${t.accent}">${esc(c.eyebrow)}</text>
  <text x="${W - 100}" y="326" text-anchor="end" font-family="${SANS}" font-size="30" letter-spacing="3" fill="${t.ink}" opacity="0.6">${esc(p.code)}</text>
  <text x="92" y="${360 + fs * 0.85}" font-family="${SERIF}" font-size="${fs}" fill="${t.ink}">${esc(c.hero)}</text>
  <line x1="1000" y1="370" x2="1000" y2="660" stroke="${t.accent}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="1060" y="420" font-family="${SANS}" font-size="28" font-weight="bold" letter-spacing="6" fill="${t.accentSoft}">${esc(c.hookLabel)}</text>
  <text x="1056" y="${420 + 110}" font-family="${SERIF}" font-size="${Math.min(104, Math.floor(640 / (c.hook.length * 0.52)))}" font-weight="bold" fill="${t.accent}">${esc(c.hook)}</text>
  ${c.hookSub ? `<text x="1060" y="600" font-family="${SERIF}" font-style="italic" font-size="46" fill="${t.ink}" opacity="0.85">${esc(c.hookSub)}</text>` : ''}
  ${rule(710)}
  ${fx.map(([l, v], i) => cell(100 + (i % 2) * 850, 790 + Math.floor(i / 2) * 120, l, v, t)).join('')}
  ${foot}
</svg>`
}

async function renderPNG(p: Property): Promise<Buffer> {
  return sharp(Buffer.from(await cardSVG(p))).png().toBuffer()
}

async function publish(p: Property, png: Buffer, bearer: string): Promise<{ img_url: string } | { error: string }> {
  const sb = createServiceClient()
  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets?.some((b) => b.name === MEDIA_BUCKET)) await sb.storage.createBucket(MEDIA_BUCKET, { public: true })
  const path = `listings/generated/${p.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}.png`
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, png, { contentType: 'image/png', upsert: false, cacheControl: '31536000' })
  if (error) return { error: error.message }
  const url = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
  await sb.from('media').insert({ path, url, kind: 'image', mime: 'image/png', bytes: png.length, alt: p.title, title: `${p.code} — generated card`, folder: 'listings' })

  const res = await fetch(`${ORIGIN}/api/properties/${p.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify({ img_url: url }),
  })
  if (!res.ok) return { error: `Setting img_url failed (HTTP ${res.status})` }
  return { img_url: url }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const all = process.argv.includes('--all')
  const codes = process.argv.slice(2).filter((a) => !a.startsWith('--'))

  const { data: properties } = await getProperties({ admin: true })
  // A card needs something to say: skip empty drafts.
  const targets = properties.filter((p) => (codes.length ? codes.includes(p.code) : all || !p.img_url || p.img_url === PLACEHOLDER) && (size(p) || price(p)))

  if (!apply) {
    const samples = codes.length ? properties.filter((p) => codes.includes(p.code)) : targets
    for (const p of samples) {
      const out = `${tmpdir()}/bhumi-thumbnail-${p.code}.png`
      writeFileSync(out, await renderPNG(p))
      console.log(`${p.code.padEnd(11)} ${listingKind(p).label.padEnd(20)} ${out}`)
    }
    console.log(`\nDry run — no database changes. ${targets.length} of ${properties.length} listings would get a card. Re-run with --apply.`)
    return
  }

  const admin = (await listUsers()).find((u) => u.active)
  if (!admin) throw new Error('No active admin account to act as.')
  const bearer = await createSessionToken(admin.id, 20 * 60)
  if (!bearer) throw new Error('Could not mint an admin session token (AUTH_SECRET missing?).')

  console.log(`Generating thumbnails for ${targets.length} listing(s) as ${admin.name}...`)
  let ok = 0
  for (const p of targets) {
    const result = await publish(p, await renderPNG(p), bearer)
    if ('error' in result) console.log(`  FAIL  ${p.code}  ${result.error}`)
    else {
      console.log(`  ok    ${p.code}  ${result.img_url}`)
      ok++
    }
  }
  console.log(`\nDone: ${ok}/${targets.length} published.`)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
