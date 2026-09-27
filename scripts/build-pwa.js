// Build the iPhone home-screen app: the Expo app in mobile/, exported for the
// web and served by this site under /app (see the /app rewrites in
// next.config.js). The export is committed, so Vercel serves it as static
// files without installing the mobile toolchain. Re-run after any change to
// mobile/ that should reach the iPhone app, then commit public/app/.
//
//   node scripts/build-pwa.js
//
// Needs mobile/node_modules (cd mobile && npm install).
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const root = path.resolve(__dirname, '..')
const mobile = path.join(root, 'mobile')
const out = path.join(root, 'public/app')
const srcIcon = path.join(mobile, 'assets/icon.png') // full-bleed, green background

async function icons() {
  const publicDir = path.join(mobile, 'public')
  // iOS ignores transparency in touch icons and fills it with black, so
  // flatten onto the brand green rather than trusting the source's alpha.
  const flat = (size) => sharp(srcIcon).resize(size, size).flatten({ background: '#0E3B2E' }).png()
  await flat(180).toFile(path.join(publicDir, 'apple-touch-icon.png'))
  await flat(192).toFile(path.join(publicDir, 'icon-192.png'))
  await flat(512).toFile(path.join(publicDir, 'icon-512.png'))
}

async function main() {
  if (!fs.existsSync(path.join(mobile, 'node_modules'))) {
    throw new Error('mobile/node_modules is missing: run `npm install` in mobile/ first.')
  }
  await icons()
  fs.rmSync(out, { recursive: true, force: true })
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', out, '--clear'], {
    cwd: mobile,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  })
  console.log(`\nExported to ${path.relative(root, out)}/ — commit it to publish.`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
