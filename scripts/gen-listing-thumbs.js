/* Listing thumbnails.
 *
 * One card image per listing, 1200x800 to match the 3:2 the
 * marketplace card reserves. Two kinds, because listings arrive as
 * two different things:
 *
 *   plan  a document we were actually sent — a sanctioned layout,
 *         a floor plan, a survey sketch. The scan is cropped to the
 *         drawing and pushed to clean black-on-white, so the card
 *         shows the real thing rather than a stock photograph of
 *         somebody else's land.
 *
 *   spec  no drawing and no photograph yet. A typographic card
 *         stating what the listing is. Honest about having no
 *         image, and still legible at card size — which a grey
 *         "no photo available" placeholder is not.
 *
 * Text is drawn with a system serif. That is fine because the PNGs
 * are committed: the font only has to exist on the machine that
 * regenerates them, never on the server or the visitor's device.
 *
 *   node scripts/gen-listing-thumbs.js
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const { availabilityOverlay } = require('./listing-plots')

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public/img/listings')

const PAPER = '#FCFBF8'
const NAVY = '#0E3B2E'
const GOLD = '#C2974A'
const INK = '#0A2A20'

const W = 1200
const H = 800

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A scanned drawing, cropped and cleaned onto the brand ground. */
async function planCard({ src, crop, eyebrow, caption, out, availability }) {
  const cleaned = await sharp(src)
    .extract(crop)
    .greyscale()
    .normalise()
    // Push the scan's grey cast to white without eating the linework.
    .linear(1.9, -70)
    .sharpen()
    .toBuffer()

  /* Tint at full crop resolution, then scale. sharp composites after
     resize within one pipeline whatever order the calls are written
     in, so these have to be separate passes. */
  let base = cleaned
  if (availability) {
    const wash = await sharp(Buffer.from(availabilityOverlay(crop.width, crop.height)))
      .resize(crop.width, crop.height, { fit: 'fill' })
      .png()
      .toBuffer()
    base = await sharp(cleaned).composite([{ input: wash }]).png().toBuffer()
  }

  const drawing = await sharp(base)
    .resize({ width: W - 150, height: H - 210, fit: 'inside', withoutEnlargement: false })
    .toBuffer()

  const meta = await sharp(drawing).metadata()

  const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>
    <text x="60" y="72" font-family="Georgia, serif" font-size="21" letter-spacing="4"
          fill="${GOLD}">${esc(eyebrow.toUpperCase())}</text>
    <rect x="60" y="${H - 96}" width="70" height="2" fill="${GOLD}"/>
    <text x="60" y="${H - 52}" font-family="Georgia, serif" font-size="26"
          fill="${INK}">${esc(caption)}</text>
  </svg>`)

  await sharp(frame)
    .composite([
      {
        input: drawing,
        left: Math.round((W - meta.width) / 2),
        top: Math.round(105 + (H - 210 - meta.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log('plan ->', path.basename(out))
}

/** A real photograph of the actual property. Cropped to the card's
    ratio and lifted a little; no heavy filter, because a buyer is
    going to stand in front of this building and compare. */
async function photoCard({ src, out, crop }) {
  let img = sharp(src)
  if (crop) img = img.extract(crop)
  await img
    .resize(W, H, { fit: 'cover', position: crop ? 'centre' : 'attention' })
    .modulate({ brightness: 1.04, saturation: 1.06 })
    .sharpen()
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out)
  console.log('photo ->', path.basename(out))
}

/* Social exports. Same picture, the two ratios a feed actually uses.
   Written outside public/ — these are for posting, not for serving. */
const SOCIAL = path.join(root, 'listing-social')
const SOCIAL_SIZES = { square: [1080, 1080], portrait: [1080, 1350] }

async function socialCuts({ src, name, crop }) {
  fs.mkdirSync(SOCIAL, { recursive: true })
  for (const [label, [w, h]] of Object.entries(SOCIAL_SIZES)) {
    let img = sharp(src)
    if (crop) img = img.extract(crop)
    await img
      .resize(w, h, { fit: 'cover', position: crop ? 'centre' : 'attention' })
      .modulate({ brightness: 1.04, saturation: 1.06 })
      .sharpen()
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(path.join(SOCIAL, `${name}-${label}.jpg`))
  }
  console.log('social ->', name, Object.keys(SOCIAL_SIZES).join(', '))
}

/** No drawing: state the listing in type. */
async function specCard({ eyebrow, headline, sub, caption, out }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${NAVY}"/>
    <rect x="46" y="46" width="${W - 92}" height="${H - 92}" fill="none"
          stroke="${GOLD}" stroke-opacity="0.34" stroke-width="1.5"/>
    <text x="100" y="176" font-family="Georgia, serif" font-size="22" letter-spacing="4.5"
          fill="${GOLD}">${esc(eyebrow.toUpperCase())}</text>
    <text x="100" y="356" font-family="Georgia, serif" font-size="112"
          fill="#F6F3EC">${esc(headline)}</text>
    <text x="100" y="436" font-family="Georgia, serif" font-size="40"
          fill="#F6F3EC" fill-opacity="0.86">${esc(sub)}</text>
    <rect x="100" y="516" width="82" height="2" fill="${GOLD}"/>
    <text x="100" y="596" font-family="Georgia, serif" font-size="27" letter-spacing="1"
          fill="${GOLD}">${esc(caption)}</text>
  </svg>`
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(W, H, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log('spec ->', path.basename(out))
}

/* One entry per listing. `src` paths are the documents we were sent;
   keep them out of the repo and point at wherever they live. */
const SCRATCH = process.env.LISTING_SRC || path.join(root, '.listing-sources')

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  const planSrc = path.join(SCRATCH, 'doddasanne-layout.jpg')
  if (fs.existsSync(planSrc)) {
    await planCard({
      src: planSrc,
      crop: { left: 60, top: 420, width: 850, height: 930 },
      availability: true,
      eyebrow: 'Sanctioned layout · Sy. No. 1/1',
      caption: '5 of 23 plots available · Doddasanne, Devanahalli',
      out: path.join(outDir, 'doddasanne-layout.png'),
    })
  } else {
    console.log('skip doddasanne — source not found at', planSrc)
  }

  const photoSrc = path.join(SCRATCH, 'jp-nagar-building.jpg')
  if (fs.existsSync(photoSrc)) {
    /* Shot from the pavement looking up, so the frame is mostly sky.
       Crop to the facade before the ratio crop, or 'cover' centres on
       cloud. */
    const crop = { left: 0, top: 210, width: 1164, height: 1000 }
    await photoCard({ src: photoSrc, crop, out: path.join(outDir, 'jp-nagar-3bhk.jpg') })
    await socialCuts({ src: photoSrc, name: 'jp-nagar-3bhk', crop: { left: 0, top: 60, width: 1164, height: 1220 } })
  } else {
    /* No photograph yet — say what it is rather than show a grey box. */
    await specCard({
      eyebrow: 'Ready to move · BDA, A-Khata',
      headline: '3 BHK',
      sub: '1,460 sq ft · 36.5 × 40 ft',
      caption: 'JP Nagar, Bengaluru',
      out: path.join(outDir, 'jp-nagar-3bhk.png'),
    })
  }

  await socialCuts({
    src: path.join(outDir, 'doddasanne-layout.png'),
    name: 'doddasanne-layout',
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
