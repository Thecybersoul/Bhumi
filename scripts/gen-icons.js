// One-off script: rasterize the restored original brand mark
// (public/img/logos/bhumi-estates-icon-dark.svg) into the favicon/icon
// assets Next.js expects via file convention. Run once, then delete.
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const srcSvg = path.join(root, 'public/img/logos/bhumi-estates-icon-dark.svg')

async function pngBuffer(size, bg) {
  return sharp(srcSvg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: bg })
    .png()
    .toBuffer()
}

function buildIco(pngBuffers) {
  // Minimal ICO container embedding PNG-format images (supported since Vista).
  const count = pngBuffers.length
  const headerSize = 6 + 16 * count
  let offset = headerSize
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(count, 4)

  const dirEntries = []
  for (const buf of pngBuffers) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(256 % 256, 0) // width (0 = 256, but we use 32/48 so fine below)
    dirEntries.push({ buf, entry })
  }

  // Rebuild properly per-image (widths 16/32/48 all < 256, so literal byte is fine)
  const sizes = [16, 32, 48]
  const parts = [header]
  const entries = []
  offset = headerSize
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
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 }
  const navy = { r: 11, g: 34, b: 57, alpha: 1 } // #0B2239, matches theme-color

  const [ico16, ico32, ico48] = await Promise.all([
    pngBuffer(16, transparent),
    pngBuffer(32, transparent),
    pngBuffer(48, transparent),
  ])
  fs.writeFileSync(path.join(root, 'app/favicon.ico'), buildIco([ico16, ico32, ico48]))

  const icon32 = await pngBuffer(32, transparent)
  fs.writeFileSync(path.join(root, 'app/icon.png'), icon32)

  const apple180 = await pngBuffer(180, navy)
  fs.writeFileSync(path.join(root, 'app/apple-icon.png'), apple180)

  const icon192 = await pngBuffer(192, transparent)
  fs.writeFileSync(path.join(root, 'public/icons/icon-192.png'), icon192)

  const icon512 = await pngBuffer(512, transparent)
  fs.writeFileSync(path.join(root, 'public/icons/icon-512.png'), icon512)

  console.log('Icons regenerated from original brand mark.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
