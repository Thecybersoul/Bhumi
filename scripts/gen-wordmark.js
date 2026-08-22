// Generate the "wordmark" logo variant: a tight crop of the horizontal
// lockup (mark + BHUMI ESTATES) around its actual ink, so it optically
// fills its box at the small heights used in the site header and footer
// instead of floating in the padding baked into the full lockup's canvas.
//
// The crop rectangle below was measured once by rendering
// bhumi-estates-horizontal-dark.svg to a transparent PNG and taking the
// non-transparent pixel bounding box, then adding ~3% padding. Re-measure
// and update these numbers if the horizontal artwork's proportions change.
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const CROP = { x: 180, y: 1010, w: 6615, h: 1480 }

for (const theme of ['dark', 'light']) {
  const srcPath = path.join(root, `public/img/logos/bhumi-estates-horizontal-${theme}.svg`)
  const svg = fs.readFileSync(srcPath, 'utf8')
  const out = svg.replace(/viewBox="[^"]*"/, `viewBox="${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}"`)

  const destPath = path.join(root, `public/img/logos/bhumi-estates-wordmark-${theme}.svg`)
  fs.writeFileSync(destPath, out)
  console.log(`${theme}: cropped to "${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}" -> ${path.basename(destPath)}`)
}
