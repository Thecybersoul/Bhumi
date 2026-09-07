/* Listing posters — the shareable sheet for a development.
 *
 * One 1600x1000 image carrying the layout drawing, the statutory
 * position, what is still available and at what rate, and how to
 * reach us. Sized for WhatsApp forwarding and a LinkedIn post.
 *
 * Every figure is passed in below and matches the listing record in
 * lib/data/seed.ts, which is transcribed from the sanctioned plan.
 * The poster therefore cannot quietly drift from the website, and
 * correcting a number is a one-line edit rather than a redraw.
 *
 *   node scripts/gen-listing-poster.js
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'listing-social')
const SRC = process.env.LISTING_SRC || path.join(root, '.listing-sources')

const W = 1600
const H = 1000
const PANEL = 520
const NAVY = '#0E3B2E'
const NAVY_DEEP = '#0A2A20'
const GOLD = '#C2974A'
const GOLD_SOFT = '#D9B978'
const CREAM = '#F6F3EC'
const PAPER = '#FCFBF8'

const { AVAILABLE, SOLD, availabilityOverlay } = require('./listing-plots')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The key for that wash. */
function legend(x, y, scale = 1) {
  const s = (v) => Math.round(v * scale)
  return `
    <rect x="${x}" y="${y}" width="${s(16)}" height="${s(16)}" rx="2"
          fill="#1B6B4F" fill-opacity="0.55" stroke="#0E3B2E" stroke-width="1.6"/>
    <text x="${x + s(26)}" y="${y + s(13)}" font-family="Georgia, serif"
          font-size="${s(17)}" fill="#0E3B2E">Available — ${AVAILABLE.length} plots</text>
    <rect x="${x + s(215)}" y="${y}" width="${s(16)}" height="${s(16)}" rx="2"
          fill="#0A2A20" fill-opacity="0.22"/>
    <text x="${x + s(241)}" y="${y + s(13)}" font-family="Georgia, serif"
          font-size="${s(17)}" fill="#0E3B2E" fill-opacity="0.72">Sold — ${SOLD} plots</text>`
}

/** Greedy wrap on character count — enough for a fixed-width panel. */
function wrap(text, max) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      lines.push(line.trim())
      line = w
    } else {
      line = (line + ' ' + w).trim()
    }
  }
  if (line) lines.push(line)
  return lines
}

function panel(d) {
  const x = W - PANEL
  const out = []
  let y = 62

  out.push(`<rect x="${x}" y="0" width="${PANEL}" height="${H}" fill="${NAVY}"/>`)
  out.push(`<text x="${x + 34}" y="${y}" font-family="Georgia, serif" font-size="26" letter-spacing="3" fill="${GOLD}">PROPERTY DETAILS</text>`)
  y += 22
  out.push(`<rect x="${x + 34}" y="${y}" width="58" height="2" fill="${GOLD}"/>`)
  y += 30

  for (const [label, value] of d.details) {
    const lines = wrap(value, 29)
    const strong = d.bold.includes(label)
    out.push(`<text x="${x + 34}" y="${y + 14}" font-family="Georgia, serif" font-size="17" fill="${CREAM}" fill-opacity="0.6">${esc(label)}</text>`)
    lines.forEach((ln, i) => {
      out.push(`<text x="${x + 208}" y="${y + 14 + i * 21}" font-family="Georgia, serif" font-size="17" font-weight="${strong ? 'bold' : 'normal'}" fill="${strong ? GOLD_SOFT : CREAM}">${esc(ln)}</text>`)
    })
    y += Math.max(28, lines.length * 21 + 9)
    out.push(`<rect x="${x + 34}" y="${y - 9}" width="${PANEL - 68}" height="1" fill="${CREAM}" fill-opacity="0.12"/>`)
  }

  y += 10
  out.push(`<rect x="${x}" y="${y}" width="${PANEL}" height="70" fill="${NAVY_DEEP}"/>`)
  out.push(`<text x="${x + 34}" y="${y + 46}" font-family="Georgia, serif" font-size="23" fill="${CREAM}" fill-opacity="0.7">Price</text>`)
  out.push(`<text x="${W - 34}" y="${y + 46}" text-anchor="end" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="${GOLD_SOFT}">${esc(d.price)}</text>`)
  y += 70 + 34

  out.push(`<text x="${x + 34}" y="${y}" font-family="Georgia, serif" font-size="26" letter-spacing="3" fill="${GOLD}">KEY HIGHLIGHTS</text>`)
  y += 22
  out.push(`<rect x="${x + 34}" y="${y}" width="58" height="2" fill="${GOLD}"/>`)
  y += 30

  /* The contact bar is fixed to the bottom, so a highlight that would
     run under it is dropped rather than drawn behind it. Anything cut
     is reported, so the copy gets shortened instead of silently lost. */
  const floor = H - 86 - 16
  const dropped = []
  for (const h of d.highlights) {
    const lines = wrap(h, 40)
    const needed = lines.length * 21 + 10
    if (y + needed > floor) {
      dropped.push(h)
      continue
    }
    out.push(`<circle cx="${x + 42}" cy="${y + 8}" r="3.5" fill="${GOLD}"/>`)
    lines.forEach((ln, i) => {
      out.push(`<text x="${x + 60}" y="${y + 14 + i * 21}" font-family="Georgia, serif" font-size="16.5" fill="${CREAM}" fill-opacity="0.93">${esc(ln)}</text>`)
    })
    y += needed
  }
  if (dropped.length) {
    console.warn(`  ${dropped.length} highlight(s) did not fit and were omitted:`)
    dropped.forEach((h) => console.warn('    - ' + h))
  }

  out.push(`<rect x="${x}" y="${H - 86}" width="${PANEL}" height="86" fill="${NAVY_DEEP}"/>`)
  out.push(`<text x="${x + 34}" y="${H - 50}" font-family="Georgia, serif" font-size="19" fill="${GOLD_SOFT}">${esc(d.phone)}  ·  ${esc(d.email)}</text>`)
  out.push(`<text x="${x + 34}" y="${H - 22}" font-family="Georgia, serif" font-size="19" letter-spacing="2" fill="${CREAM}" fill-opacity="0.64">${esc(d.site)}</text>`)

  return out.join('\n')
}

async function poster(d) {
  const planW = W - PANEL

  /* Clean the scan first, tint at full crop resolution, and only then
     scale — painting after the downscale would soften the edges of
     every wash against the linework. */
  const cleaned = await sharp(d.plan)
    .extract(d.crop)
    .greyscale()
    .normalise()
    // Push the scan's grey cast to white without eating the linework.
    .linear(1.9, -70)
    .toBuffer()

  /* Rasterise the wash at exactly the crop's pixel size. sharp renders
     an SVG at its own density otherwise, and a one-pixel disagreement
     makes composite refuse outright. */
  const wash = await sharp(Buffer.from(availabilityOverlay(d.crop.width, d.crop.height)))
    .resize(d.crop.width, d.crop.height, { fit: 'fill' })
    .png()
    .toBuffer()

  /* Two passes on purpose. sharp runs composite AFTER resize within a
     single pipeline whatever order the calls are written in, so tinting
     and scaling together would drop a full-size wash onto an already
     shrunken drawing and throw. */
  const tinted = await sharp(cleaned).composite([{ input: wash }]).png().toBuffer()

  const drawing = await sharp(tinted)
    .resize({ width: planW - 120, height: H - 360, fit: 'inside' })
    .toBuffer()
  const meta = await sharp(drawing).metadata()

  const left = `
    <rect x="0" y="0" width="${planW}" height="${H}" fill="${PAPER}"/>
    <text x="56" y="86" font-family="Georgia, serif" font-size="42" font-weight="bold" fill="${NAVY}">${esc(d.title)}</text>
    <text x="56" y="124" font-family="Georgia, serif" font-size="22" fill="${NAVY}" fill-opacity="0.7">${esc(d.subtitle)}</text>
    <rect x="56" y="148" width="70" height="2" fill="${GOLD}"/>
    <text x="56" y="${H - 42}" font-family="Georgia, serif" font-size="18" letter-spacing="2" fill="${GOLD}">${esc(d.footnote.toUpperCase())}</text>
    ${legend(56, H - 112)}`

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${left}${panel(d)}</svg>`
  )

  const dx = Math.round((planW - meta.width) / 2)
  const dy = 186 + Math.round((H - 360 - meta.height) / 2)

  /* The cleaned scan is pure white and the page is off-white, so the
     drawing would otherwise end in a faint seam. A plate and hairline
     make that edge deliberate. */
  const plate = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width + 28}" height="${meta.height + 28}">
       <rect x="0.5" y="0.5" width="${meta.width + 27}" height="${meta.height + 27}"
             fill="#ffffff" stroke="${GOLD}" stroke-opacity="0.4" stroke-width="1"/>
     </svg>`
  )

  const composites = [
    { input: plate, left: dx - 14, top: dy - 14 },
    { input: drawing, left: dx, top: dy },
  ]

  const logoPath = path.join(root, 'public/img/logos/bhumi-estates-wordmark-light.svg')
  if (fs.existsSync(logoPath)) {
    const logo = await sharp(logoPath, { density: 300 }).resize({ width: 240 }).png().toBuffer()
    composites.push({ input: logo, left: planW - 240 - 56, top: 60 })
  }

  fs.mkdirSync(outDir, { recursive: true })
  await sharp(svg, { density: 144 })
    .resize(W, H, { fit: 'fill' })
    .composite(composites)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(d.out)
  console.log('poster ->', path.basename(d.out))
}

async function main() {
  const plan = path.join(SRC, 'doddasanne-layout.jpg')
  if (!fs.existsSync(plan)) {
    console.error('source plan not found at', plan)
    process.exit(1)
  }

  await poster({
    plan,
    crop: { left: 60, top: 420, width: 850, height: 930 },
    title: 'Premium Residential Layout',
    subtitle: 'Doddasanne Village · Kasaba Hobli · Devanahalli Taluk',
    footnote: 'Final sanctioned layout — drawing as approved',
    price: '₹8,500 / sq ft',
    details: [
      ['Location', 'Doddasanne Village, Kasaba Hobli, Devanahalli Taluk'],
      ['Survey No.', 'Sy. No. 1/1 (part)'],
      ['Approval', 'BIAPPA approved layout'],
      ['Sanctioned area', '1 acre 15.75 guntas (5,640.23 sqm), plus 2 guntas kharab'],
      ['Total plots', '23 sites'],
      ['Available', 'Plot nos. 5, 6, 7, 8 and 15'],
      ['Plot size', '30 x 40 ft standard; odd sites 49.94-204.95 sqm'],
      ['Road width', '9m internal; 12m widened to 18m main road'],
    ],
    bold: ['Approval', 'Available'],
    highlights: [
      'BIAPPA approved, final sanctioned layout',
      'Conversion order No. 34962 dated 29 March 2025',
      'Ground + 1 floor permitted, FAR restricted to 1.0',
      'Three parks totalling 565.79 sqm, plus a 281.86 sqm civic amenity site',
      'Short drive from Kempegowda International Airport',
      'Single owner, clear title, direct registration',
    ],
    phone: '+91 81238 45749',
    email: 'estatesbhumi@gmail.com',
    site: 'bhumiestates.in',
    out: path.join(outDir, 'doddasanne-poster.jpg'),
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
