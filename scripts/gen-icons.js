// Rasterize the favicon tile (public/img/logos/bhumi-estates-favicon.svg —
// the B monogram on a rounded dark-green square) into the favicon/icon
// assets Next.js expects via file convention. Re-run whenever the source
// logo changes.
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const srcSvg = path.join(root, 'public/img/logos/bhumi-estates-favicon.svg')
const MAX_ICON_SIZE = 512

// Render at just enough density to comfortably cover the largest icon we
// need (density is DPI-based, so it scales with the source viewBox size —
// a fixed value would either blur small logos or blow past sharp's pixel
// limit on large ones).
function densityFor(svgPath, targetPx) {
  const viewBoxWidth = Number(fs.readFileSync(svgPath, 'utf8').match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+)/)[1])
  return Math.ceil(72 * (targetPx / viewBoxWidth)) * 2 // 2x headroom for a crisp downsize
}

async function pngBuffer(size) {
  return sharp(srcSvg, { density: densityFor(srcSvg, MAX_ICON_SIZE) })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

function buildIco(pngBuffers, sizes) {
  // Minimal ICO container embedding PNG-format images (supported since Vista).
  const count = pngBuffers.length
  const headerSize = 6 + 16 * count
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(count, 4)

  const entries = []
  let offset = headerSize
  sizes.forEach((size, i) => {
    const buf = pngBuffers[i]
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size, 0)
    entry.writeUInt8(size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(buf.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += buf.length
    entries.push(entry)
  })
  return Buffer.concat([header, ...entries, ...pngBuffers])
}

async function main() {
  const sizes = [16, 32, 48]
  const icoBuffers = await Promise.all(sizes.map(pngBuffer))
  fs.writeFileSync(path.join(root, 'app/favicon.ico'), buildIco(icoBuffers, sizes))

  fs.writeFileSync(path.join(root, 'app/icon.png'), await pngBuffer(256))
  fs.writeFileSync(path.join(root, 'app/apple-icon.png'), await pngBuffer(180))
  fs.writeFileSync(path.join(root, 'public/icons/icon-192.png'), await pngBuffer(192))
  fs.writeFileSync(path.join(root, 'public/icons/icon-512.png'), await pngBuffer(512))

  console.log('Icons regenerated from the favicon tile.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
