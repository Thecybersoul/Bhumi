/* Plot boxes for the Doddasanne layout, in the coordinate space of
 * the cropped plan (CROP below, 850 x 930).
 *
 * Measured by rendering the crop 1:1 under a 50px labelled grid and
 * reading each cell off it — see the git history for the throwaway
 * script. They are traced from a scan that is very slightly skewed,
 * so treat them as within a few pixels rather than surveyed. Fills
 * are translucent and inset for that reason: the drawing's own
 * linework and plot numbers stay visible and authoritative, and a
 * box a little out of true tints its cell rather than covering a
 * boundary.
 *
 * Numbers are NOT redrawn over the plan. The sanctioned drawing
 * already carries them, and printing our own risks them disagreeing.
 */
const CROP = { left: 60, top: 420, width: 850, height: 930 }

/** plot number -> [x, y, width, height] */
const BOXES = {
  18: [205, 340, 73, 70],
  19: [205, 410, 73, 68],

  20: [200, 575, 103, 73],
  21: [200, 648, 103, 70],
  22: [200, 725, 103, 67],
  23: [200, 795, 103, 72],

  17: [303, 575, 82, 70],
  16: [303, 645, 82, 70],
  15: [303, 719, 82, 70],
  14: [303, 788, 82, 82],

  9: [466, 508, 80, 70],
  10: [466, 578, 80, 70],
  11: [466, 648, 80, 70],
  12: [466, 718, 80, 70],
  13: [466, 790, 80, 75],

  8: [547, 508, 81, 70],
  7: [547, 578, 81, 70],
  6: [547, 648, 81, 70],
  5: [547, 718, 81, 70],
  4: [547, 790, 81, 75],

  1: [712, 378, 60, 59],
  2: [712, 437, 60, 63],
  3: [712, 500, 60, 63],
}

/* From the marketing sheet: everything except these is sold. */
const AVAILABLE = [5, 6, 7, 8, 15]

/** The wash, as an SVG string sized to the crop. Translucent, so the
    plan's own linework and plot numbers read through and remain the
    authority; the colour says which cell, the drawing says what it is.
    Sold plots are knocked back rather than hidden — a buyer should be
    able to see how much has already gone. */
function availabilityOverlay(w = CROP.width, h = CROP.height) {
  const parts = []
  for (const [num, [x, y, bw, bh]] of Object.entries(BOXES)) {
    const free = AVAILABLE.includes(Number(num))
    // Inset, so a box a few pixels out of true tints its own cell
    // instead of painting over a boundary it shares with a neighbour.
    const i = 3
    parts.push(
      `<rect x="${x + i}" y="${y + i}" width="${bw - i * 2}" height="${bh - i * 2}" rx="2"` +
        ` fill="${free ? '#1B6B4F' : '#0A2A20'}" fill-opacity="${free ? 0.34 : 0.13}"` +
        ` stroke="${free ? '#0E3B2E' : 'none'}" stroke-width="${free ? 2 : 0}" stroke-opacity="0.85"/>`
    )
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${parts.join('')}</svg>`
}

const SOLD = Object.keys(BOXES).length - AVAILABLE.length

module.exports = { CROP, BOXES, AVAILABLE, SOLD, availabilityOverlay }
