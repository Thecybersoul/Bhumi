// Rasterizes the same brand SVGs the web app uses (public/img/logos/)
// into the app icon / adaptive icon / splash / login-screen assets the
// Expo app needs. Re-run whenever the source logo changes — same
// reasoning as gen-icons.js, just for mobile/assets instead of app/.
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const logos = path.join(root, 'public/img/logos')
const out = path.join(root, 'mobile/assets')

const NAVY = '#0E3B2E'

function densityFor(svgPath, targetPx) {
  const viewBox = fs.readFileSync(svgPath, 'utf8').match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)/)
  const width = Number(viewBox[1])
  return Math.ceil(72 * (targetPx / width)) * 2
}

/** The icon mark alone, transparent background, centered in a square
    canvas at `scale` of the canvas size — Android's adaptive-icon
    safe zone is the center ~66%, so the foreground must not fill
    the whole 1024, or the launcher's mask crops the mark itself. */
async function markOnTransparent(svgPath, canvasPx, scale) {
  const markPx = Math.round(canvasPx * scale)
  const density = densityFor(svgPath, markPx)
  const mark = await sharp(svgPath, { density })
    .resize(markPx, markPx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  return sharp({
    create: { width: canvasPx, height: canvasPx, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer()
}

async function main() {
  fs.mkdirSync(out, { recursive: true })

  const iconDark = path.join(logos, 'bhumi-estates-icon-dark.svg') // light-colored mark, for the dark/green background
  const wordmarkLight = path.join(logos, 'bhumi-estates-wordmark-light.svg') // dark-colored lockup, for a light/white background

  // App icon: the mark on the brand-green square, no pre-rounded
  // corners — iOS/Android apply their own mask on top of a square.
  const markOnIcon = await markOnTransparent(iconDark, 1024, 0.62)
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: NAVY } })
    .composite([{ input: markOnIcon, gravity: 'center' }])
    .png()
    .toFile(path.join(out, 'icon.png'))

  // Android adaptive icon: background + foreground as separate layers.
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: NAVY } })
    .png()
    .toFile(path.join(out, 'android-icon-background.png'))

  fs.writeFileSync(path.join(out, 'android-icon-foreground.png'), await markOnTransparent(iconDark, 1024, 0.5))

  // Monochrome (Android 13+ themed icons): the OS retints this at
  // runtime from its own alpha shape, so the source mark's own
  // colors are irrelevant — the same transparent-background render
  // already used for the foreground works as-is.
  fs.writeFileSync(path.join(out, 'android-icon-monochrome.png'), await markOnTransparent(iconDark, 1024, 0.5))

  // Splash: just the mark, transparent — sits on the splash
  // backgroundColor set in app.json.
  fs.writeFileSync(path.join(out, 'splash-icon.png'), await markOnTransparent(iconDark, 1024, 0.42))

  // Tightly-cropped monogram for inline UI use (a header icon next
  // to a title) — the icon/adaptive-icon renders above are padded
  // to Android's safe zone on purpose, which is too much air for
  // sitting next to text.
  fs.writeFileSync(path.join(out, 'monogram.png'), await markOnTransparent(iconDark, 512, 0.94))

  // Favicon for the web preview target.
  fs.writeFileSync(
    path.join(out, 'favicon.png'),
    await sharp(path.join(logos, 'bhumi-estates-favicon.svg'), { density: densityFor(path.join(logos, 'bhumi-estates-favicon.svg'), 196) })
      .resize(196, 196)
      .png()
      .toBuffer()
  )

  // Wordmark for the login screen — dark lockup for the white card.
  const wmWidth = 900
  const wmHeight = Math.round(wmWidth * (1167 / 5394))
  fs.writeFileSync(
    path.join(out, 'wordmark-light.png'),
    await sharp(wordmarkLight, { density: densityFor(wordmarkLight, wmWidth) })
      .resize(wmWidth, wmHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  )

  console.log('Mobile brand assets regenerated in mobile/assets.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
