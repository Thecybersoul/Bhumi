/* Share and tile artwork, both derived from the logo set in
   public/img/logos so they cannot drift from it.

   Two outputs:

   1. bhumi-estates-favicon.svg — the monogram on a rounded green
      tile. gen-icons.js rasterises this into every favicon and app
      icon, and its comment has always described the source as a
      plated tile. The logo rebuild dropped the plate from the whole
      set, which silently made the favicon source a transparent
      monogram: correct as a logo, wrong as an icon. A transparent
      apple-touch-icon is composited on black by iOS, and the
      monogram's dark-green strokes disappear against dark browser
      chrome. So the tile is rebuilt here from the dark-background
      artwork (cream strokes, gold B) rather than hand-maintained.

   2. opengraph-image.png / twitter-image.png — what renders when
      someone pastes a link into WhatsApp, LinkedIn or Slack. The
      lockup is embedded as vector, so it stays sharp and needs no
      font to draw the company name.

   Re-run after any change to the logo artwork:
     node scripts/gen-share-assets.js && node scripts/gen-icons.js
*/
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const logos = path.join(root, 'public/img/logos')

/* Brand tokens, mirrored from app/globals.css. */
const GREEN = '#0E3B2E'
const GREEN_DEEP = '#0A2A20'
const GOLD = '#C2974A'
const CREAM = '#F6F3EC'

/** Pull the drawable content and viewBox out of one of the logo SVGs. */
function readArtwork(name) {
  const svg = fs.readFileSync(path.join(logos, `${name}.svg`), 'utf8')
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1]
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return { viewBox, inner }
}

/* ── 1. The icon tile ──────────────────────────────────────── */

/* Measured once from bhumi-estates-icon-dark.svg by rendering it to a
   transparent PNG and taking the non-transparent bounding box. The
   monogram does not fill its own viewBox, and does not sit centred in
   it — there is 3.3% of slack on the left against 7.0% on the right.
   Sizing the tile off the viewBox therefore draws the mark too small
   and visibly off-centre. Re-measure if the artwork changes. */
const MONOGRAM = { inkWidthFrac: 0.898, centreXFrac: 0.4815 }

/* How much of the tile the mark's ink should cover. The favicon is
   read at 16px, where a mark floating in its padding turns to mush. */
const TILE_INK_COVERAGE = 0.66

function buildTile() {
  const { viewBox, inner } = readArtwork('bhumi-estates-icon-dark')
  const S = 1024

  const box = Math.round((S * TILE_INK_COVERAGE) / MONOGRAM.inkWidthFrac)
  const y = Math.round((S - box) / 2)
  // Nudge by the mark's own off-centre bias so the ink lands centred.
  const x = Math.round(y + (0.5 - MONOGRAM.centreXFrac) * box)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="Bhumi Estates">
  <rect width="${S}" height="${S}" rx="${Math.round(S * 0.22)}" fill="${GREEN}"/>
  <svg x="${x}" y="${y}" width="${box}" height="${box}" viewBox="${viewBox}">
${inner}
  </svg>
</svg>
`
  fs.writeFileSync(path.join(logos, 'bhumi-estates-favicon.svg'), svg)
  console.log('tile   -> bhumi-estates-favicon.svg')
}

/* ── 2. The share card ─────────────────────────────────────── */

async function buildShareCard() {
  const { viewBox, inner } = readArtwork('bhumi-estates-wordmark-dark')

  const W = 1200
  const H = 630
  /* Measured ink aspect of the wordmark crop. The artwork is trimmed
     to its ink, so width and height can be set directly. */
  const markW = 620
  const markH = Math.round(markW / 4.887)
  const markX = Math.round((W - markW) / 2)
  const markY = 156

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GREEN}"/>
      <stop offset="100%" stop-color="${GREEN_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <svg x="${markX}" y="${markY}" width="${markW}" height="${markH}" viewBox="${viewBox}">
${inner}
  </svg>

  <rect x="${W / 2 - 44}" y="${markY + markH + 58}" width="88" height="2" fill="${GOLD}"/>

  <text x="${W / 2}" y="${markY + markH + 148}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="${CREAM}">Land, verified before it is sold.</text>

  <text x="${W / 2}" y="${H - 74}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="21"
        letter-spacing="4.5" fill="${GOLD}">BENGALURU &#183; SOURCING &#183; BRANDING &#183; OUTDOOR</text>
</svg>
`

  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(W, H, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer()

  for (const dest of ['app/opengraph-image.png', 'app/twitter-image.png']) {
    fs.writeFileSync(path.join(root, dest), png)
    console.log(`share  -> ${dest}`)
  }
}

async function main() {
  buildTile()
  await buildShareCard()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
