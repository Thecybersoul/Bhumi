// Generate a "wordmark" logo variant: the B monogram + BHUMI ESTATES,
// without the "WHERE VISION MEETS VALUE" tagline.
//
// The tagline sits in a 20-unit-tall band (y 341–361) of a 446-unit-tall
// artwork. At the 38–42px heights used in the site header and footer it
// renders about 3px tall — an illegible smear. Dropping a tagline at small
// sizes is standard brand practice; the full lockup (horizontal / primary)
// keeps it for large-format use.
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

// Tagline glyphs, identified by bounding box (see scripts/logo-bbox.js):
// every path whose vertical extent falls inside the tagline band.
const TAGLINE_BAND = { y0: 335, y1: 368 }

function isTagline(d) {
  const nums = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
  const ys = []
  for (let k = 1; k < nums.length; k += 2) ys.push(nums[k])
  if (!ys.length) return false
  const min = Math.min(...ys)
  const max = Math.max(...ys)
  return min >= TAGLINE_BAND.y0 && max <= TAGLINE_BAND.y1
}

for (const theme of ['dark', 'light']) {
  const srcPath = path.join(root, `public/img/logos/bhumi-estates-horizontal-${theme}.svg`)
  const svg = fs.readFileSync(srcPath, 'utf8')

  let removed = 0
  const out = svg.replace(/<path[^>]*\sd="([^"]+)"[^>]*\/?>/g, (match, d) => {
    if (isTagline(d)) {
      removed++
      return ''
    }
    return match
  })

  // Tighten the viewBox to the remaining artwork (mark + wordmark),
  // so the lockup optically fills its box instead of floating in
  // whitespace left behind by the removed tagline.
  const cropped = out.replace(
    /viewBox="[^"]*"\s*width="[^"]*"\s*height="[^"]*"/,
    'viewBox="25 25 1232 400" width="1232" height="400"'
  )

  const destPath = path.join(root, `public/img/logos/bhumi-estates-wordmark-${theme}.svg`)
  fs.writeFileSync(destPath, cropped)
  console.log(`${theme}: removed ${removed} tagline paths -> ${path.basename(destPath)}`)
}
