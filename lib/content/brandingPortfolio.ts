/* ═══════════════════════════════════════════════════════════
   Branding portfolio: selected work for Prestige Group.

   From the Marketing & Branding Portfolio deck (Volume 01, 2026). Every
   project, scope area, placement and format below is as the deck states
   it; the photographs are the deck's own, from site. Shown on
   /branding-advertising.
   ═══════════════════════════════════════════════════════════ */

const IMG = '/img/branding/work'

export interface Shot {
  src: string
  alt: string
  /** Caption shown on the photo when a scope has more than one. */
  label?: string
  w: number
  h: number
}

export interface Scope {
  title: string
  body: string
  placement: string
  format: string
  shots: Shot[]
}

export interface Project {
  number: string
  name: string
  status?: string
  summary: string
  cover?: Shot
  scopes: Scope[]
}

const shot = (file: string, alt: string, w: number, h: number, label?: string): Shot => ({ src: `${IMG}/${file}.jpg`, alt, w, h, label })

export const portfolioIntro = {
  eyebrow: 'Selected work · Prestige Group',
  title: { before: 'Three Prestige projects,', italic: 'every moment finished.' },
  body: 'Experience centres, site arrivals and approach-road branding across three Prestige Group projects: from the reception logo and the master plan on the gallery wall, to the arch at the gate and the flags on every street-light pole.',
  image: shot('prestige-tower-render', 'A Prestige project render, lit at dusk', 968, 1162),
  banner: shot('approach-dusk', 'Approach-road branding at a Prestige project, at dusk', 1600, 338),
}

export const portfolioStats = [
  { value: '03', label: 'Projects', note: 'Delivered for Prestige Group' },
  { value: '18', label: 'Scope areas', note: 'Across experience centres, arrivals and approaches' },
  { value: '14', label: 'Formats', note: 'From backlit fabric to LED screens' },
]

export const capabilities = [
  {
    number: '01',
    title: 'Experience Centre & Interiors',
    body: 'Logo branding, backlit fabric boxes, master plans, render walls, photo booths, ACP frames and site-office interiors.',
    image: shot('cap-experience-centre', 'Backlit master plan in a Prestige experience centre', 748, 550),
  },
  {
    number: '02',
    title: 'Site Arrival',
    body: 'Entrance arches, directional signage and LED screens.',
    image: shot('cap-site-arrival', 'LED screen at a project entrance', 748, 550),
  },
  {
    number: '03',
    title: 'Approach & Perimeter',
    body: 'Road medians, pole flags, boundary-wall panels and hoardings.',
    image: shot('cap-approach', 'Large-format hoarding on the approach road', 748, 550),
  },
]

/* "One team, brief to upkeep." The deck names the five stages; the lines
   under them only restate what the deck shows, not new claims. */
export const processIntro = 'One team, brief to upkeep.'
export const process = [
  { number: '01', title: 'Brief & site recce', body: 'The approach, the gate and the sales gallery, seen the way a buyer sees them.' },
  { number: '02', title: 'Concept & design', body: 'Artwork for each position and format.' },
  { number: '03', title: 'Production', body: 'Backlit fabric, flex, reflective radium, ACP frames, hoardings and LED.' },
  { number: '04', title: 'Installation', body: 'From road medians and pole flags to experience-centre walls.' },
  { number: '05', title: 'Upkeep & refresh', body: 'Kept looking finished, and refreshed when the campaign changes.' },
]

export const projects: Project[] = [
  {
    number: '01',
    name: 'Prestige Palm Court',
    summary: 'The customer experience centre, from the reception to the show-flat walkway.',
    scopes: [
      {
        title: 'Project Logo Branding',
        body: 'Project logos installed at the reception and on a feature wall.',
        placement: 'Reception · Feature wall',
        format: 'Project logo branding',
        shots: [
          shot('palm-court-logo-reception', 'Prestige Palm Court logo at the reception', 1214, 836, 'Reception'),
          shot('palm-court-logo-feature-wall', 'Prestige Palm Court logo on a feature wall', 1214, 836, 'Feature wall'),
        ],
      },
      {
        title: 'Office Cabins & Conference Rooms',
        body: 'Backlit fabric boxes, and non-lit master numbering plans and project renders, in every office cabin and conference room.',
        placement: 'All office cabins · Conference rooms',
        format: 'Backlit fabric boxes · Non-lit panels',
        shots: [
          shot('palm-court-cabin-numbering-plan', 'Master numbering plan panel in an office cabin', 1600, 876),
          shot('palm-court-cabin-backlit-box', 'Backlit fabric box with a project render', 821, 880),
        ],
      },
      {
        title: 'Large-Scale Photo Booth',
        body: 'A large-scale photo booth set up in the main hall.',
        placement: 'Main hall',
        format: 'Large-scale photo booth',
        shots: [shot('palm-court-photo-booth', 'Prestige Palm Court photo booth in the main hall', 1600, 1159)],
      },
      {
        title: 'Walkway Render Wall',
        body: 'Large-scale renders of the project along the wall of the walkway leading to the show flats.',
        placement: 'Walkway to the show flats',
        format: 'Large-format project renders',
        shots: [shot('palm-court-walkway-renders', 'Project renders along the show-flat walkway', 1600, 557)],
      },
      {
        title: 'Master Plan Display',
        body: 'A large-scale master plan on the wall of the main hall, presenting the project to customers.',
        placement: 'Main hall',
        format: 'Large-format master plan',
        shots: [shot('palm-court-master-plan', 'Large-format master numbering plan in the main hall', 1600, 1159)],
      },
    ],
  },
  {
    number: '02',
    name: 'Garden Breeze @ The Prestige City',
    summary: 'From the road median inside The Prestige City to the entrance and the experience centre.',
    scopes: [
      {
        title: 'Road Median Branding',
        body: 'Reflective radium printing, the material used on highway road signs, along the centre divider inside The Prestige City, up to the customer experience centre.',
        placement: 'Centre divider, up to the experience centre',
        format: 'Reflective radium print',
        shots: [shot('garden-breeze-road-median', 'Reflective road-median branding at dusk', 1600, 557)],
      },
      {
        title: 'Street-Light Pole Flags',
        body: 'Vertical flex flags fixed on every street-light pole, facing both directions.',
        placement: 'Every street-light pole',
        format: 'Double-sided flex flags',
        shots: [
          shot('garden-breeze-pole-flag-1', 'Vertical flex flag on a street-light pole', 840, 1236),
          shot('garden-breeze-pole-flag-2', 'Vertical flex flag, the other face', 840, 1236),
        ],
      },
      {
        title: 'Backlit Entrance Arch',
        body: 'A backlit flex arch at the entrance.',
        placement: 'Entrance',
        format: 'Backlit flex arch',
        shots: [shot('garden-breeze-entrance-arch', 'Backlit entrance arch', 1600, 1159)],
      },
      {
        title: 'Luxury ACP Feature Frame',
        body: 'An entirely new frame in a luxury-finish ACP, built to blend with the experience centre interiors and hold the master numbering plan and project render.',
        placement: 'Customer experience centre',
        format: 'Luxury-finish ACP frame',
        shots: [
          shot('garden-breeze-acp-frame', 'Luxury-finish ACP frame holding the project render', 1600, 876),
          shot('garden-breeze-acp-frame-2', 'ACP frame holding the master numbering plan', 821, 880),
        ],
      },
      {
        title: 'Corporate Campaign Walls',
        body: 'Two entire walls branded with backlit panels carrying the corporate campaign.',
        placement: 'Two feature walls',
        format: 'Backlit panels',
        shots: [
          shot('garden-breeze-campaign-wall-1', 'Corporate campaign wall, first wall', 1214, 836, 'Wall 01'),
          shot('garden-breeze-campaign-wall-2', 'Corporate campaign wall, second wall', 1214, 836, 'Wall 02'),
        ],
      },
      {
        title: 'Forum Wall Panels',
        body: 'The entire forum wall branded with backlit panels.',
        placement: 'Forum wall',
        format: 'Backlit panels',
        shots: [shot('garden-breeze-forum-wall', 'Forum wall branded with backlit panels', 1600, 1159)],
      },
      {
        title: 'Property Hoardings',
        body: 'Two new large-format hoardings at the property.',
        placement: 'At the property',
        format: 'Large-format hoardings',
        shots: [
          shot('garden-breeze-hoarding-1', 'Large-format hoarding at the property', 1214, 836, 'Hoarding 01'),
          shot('garden-breeze-hoarding-2', 'Second large-format hoarding at the property', 1214, 836, 'Hoarding 02'),
        ],
      },
      {
        title: 'Entrance LED Screen',
        body: 'A large-format LED screen at the property entrance.',
        placement: 'Property entrance',
        format: 'LED screen',
        shots: [shot('garden-breeze-led-screen', 'Large-format LED screen at the entrance', 1600, 557)],
      },
      {
        title: 'Master Numbering Plan',
        body: 'The project’s master numbering plan, presented in the customer experience centre.',
        placement: 'Customer experience centre',
        format: 'Master numbering plan',
        shots: [],
      },
    ],
  },
  {
    number: '03',
    name: 'Prestige Parklane',
    status: 'Recently launched',
    summary: 'Four scope areas delivered for the launch.',
    scopes: [
      { title: 'Container Office Interiors', body: 'Interior branding for the site container office, including the Prestige reception logo.', placement: 'Site container office', format: 'Interior branding', shots: [] },
      { title: 'Directional Signage', body: 'Directional signage to guide visitors.', placement: 'On site', format: 'Directional signage', shots: [] },
      { title: 'Backlit Wall Panels', body: 'Backlit wall panels on site.', placement: 'On site', format: 'Backlit panels', shots: [] },
      { title: 'Vertical Flags', body: 'Vertical flex flags on site.', placement: 'On site', format: 'Vertical flex flags', shots: [] },
    ],
  },
]

/** What was delivered, by project: the deck's scope matrix. */
export const scopeMatrix = {
  projects: ['Prestige Palm Court', 'Garden Breeze @ The Prestige City', 'Prestige Parklane'],
  rows: [
    { scope: 'Prestige & project logo branding', on: [true, false, true] },
    { scope: 'Master numbering plans & project renders', on: [true, true, false] },
    { scope: 'Backlit fabric boxes', on: [true, true, false] },
    { scope: 'Large-format render walls', on: [true, false, false] },
    { scope: 'Large-scale photo booth', on: [true, false, false] },
    { scope: 'Backlit wall panels', on: [false, true, true] },
    { scope: 'Vertical flex flags', on: [false, true, true] },
    { scope: 'Reflective road median branding', on: [false, true, false] },
    { scope: 'Backlit entrance arch', on: [false, true, false] },
    { scope: 'Luxury ACP feature frame', on: [false, true, false] },
    { scope: 'Large-format hoardings', on: [false, true, false] },
    { scope: 'LED screen', on: [false, true, false] },
    { scope: 'Directional signage', on: [false, false, true] },
    { scope: 'Container office interiors', on: [false, false, true] },
  ],
}
