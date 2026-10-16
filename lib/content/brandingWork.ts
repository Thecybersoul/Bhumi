/* ═══════════════════════════════════════════════════════════
   The branding vertical: work, capability and numbers.

   From the Bhumi Estates Branding Portfolio deck (2026). Every project,
   number, scope and caption below is as the deck states it, and the
   photographs are the deck's own, from site (exported to
   /img/branding/portfolio). Shown on /branding-advertising.
   ═══════════════════════════════════════════════════════════ */

const IMG = '/img/branding/portfolio'
const DIMS: Record<string, [number, number]> = {
  'hero-mast-lift': [1346, 1500],
  'cap-recce': [1130, 1500],
  'cap-design': [1130, 1500],
  'cap-engineering': [1130, 1500],
  'cap-fabrication': [1130, 1500],
  'cap-installation': [1130, 1500],
  'cap-upkeep': [1129, 1500],
  'evergreen-wall': [1500, 844],
  'courtyard-panels': [1500, 848],
  'courtyard-before': [1500, 714],
  'courtyard-night': [1500, 714],
  'siorai-sign': [1500, 848],
  'siorai-junction': [1500, 714],
  'siorai-storefront': [1500, 714],
  'evergreen-aerial': [1500, 849],
  'evergreen-board': [1500, 463],
  'evergreen-masterplan': [1500, 463],
  'evergreen-2500': [1500, 463],
  'glenbrook-arch': [1396, 1500],
  'glenbrook-arch-side': [1396, 1500],
  'somerville-flags': [1396, 1500],
  'conrad-fabric': [1500, 849],
  'conrad-install': [1500, 714],
  'conrad-second': [1500, 715],
  'city-podium': [1500, 849],
  'city-logo': [1500, 463],
  'city-fernvale-plan': [1500, 463],
  'city-eaton-plan': [1500, 463],
  'crystal-wall-dusk': [1500, 849],
  'crystal-wall-day': [1500, 463],
  'crystal-plans': [1500, 463],
  'crystal-wayfinding': [1500, 463],
  'gardenia-arch': [1500, 848],
  'gardenia-render': [1500, 462],
  'gardenia-plan': [1500, 463],
  'gardenia-sign': [1500, 463],
  'goldengrove-mast': [1384, 1500],
  'goldengrove-frontage': [1500, 849],
  'goldengrove-night': [1500, 709],
  'goldengrove-2000': [1500, 709],
  'fest-stalls': [1500, 1047],
  'fest-rangoli': [1500, 489],
  'fest-arch': [1500, 1183],
  'fest-food': [1500, 1357],
  'palmcourt-walkway': [1500, 849],
  'palmcourt-booth': [1500, 463],
  'palmcourt-reception': [1500, 462],
  'palmcourt-plan': [1500, 462],
  'breeze-forum': [1500, 1042],
  'breeze-flag': [995, 1500],
  'breeze-flag-2': [996, 1500],
  'breeze-led': [1500, 770],
  'breeze-wall': [1500, 814],
  'parklane-night': [1500, 844],
  'parklane-welcome': [1500, 636],
  'parklane-directional': [1500, 636],
  'springwoods-mural': [1500, 1000],
  'film-drone': [1500, 1055],
  'arch-avon': [1500, 525],
  'arch-pavilions': [1500, 525],
  'arch-hyderabad': [1500, 525],
  'arch-elevation': [1500, 525],
}

export interface Shot {
  src: string
  alt: string
  label?: string
  w: number
  h: number
}

const shot = (slug: string, alt: string, label?: string): Shot => {
  const [w, h] = DIMS[slug]
  return { src: `${IMG}/${slug}.jpg`, alt, label, w, h }
}

export const hero = {
  image: shot('hero-mast-lift', 'The illuminated 3D Prestige logo being lifted onto the 150-ft high mast at Golden Grove, Hyderabad'),
  caption: 'Prestige Golden Grove, Tellapur, Hyderabad · 150-ft high mast by Bhumi Estates',
}

export const glance = {
  eyebrow: 'At a glance',
  title: { before: 'We turn project sites into landmarks', italic: 'that sell.' },
  lede: 'From the first hoarding to a 150-ft mast.',
  points: [
    { n: '01', title: 'Who we are', body: 'The branding vertical of Bhumi Estates, Bengaluru. One team takes a site from recce and design through fabrication, installation, launch films and upkeep.' },
    { n: '02', title: "What we've delivered", body: '29 projects across Bengaluru, Hyderabad, Chennai and Mysore: 13 delivered, 13 live, 3 NCR sites in recce. Four high masts, including a 150-ft landmark at Golden Grove, Hyderabad.' },
    { n: '03', title: 'What we do', body: 'Site and wall branding, LED walls and pylons, high masts, signage, experience-centre interiors, event activations and launch films.' },
  ],
}

export const numbers = [
  { value: '29', label: 'Projects', note: '13 delivered, 13 live under monthly review, 3 NCR sites in high-mast recce' },
  { value: '6', label: 'Cities', note: 'Bengaluru, Hyderabad, Chennai and Mysore; design for Mumbai; recce in Delhi NCR' },
  { value: '150 ft', label: 'High mast', note: 'Golden Grove, Hyderabad, seen from the Outer Ring Road and the highway' },
  { value: '4', label: 'High masts', note: '1 delivered and 3 ordered: Park Lane and Olive Oak (150 ft), Pavilions (110 ft)' },
  { value: '1,670', label: 'Running ft of lit boundary wall', note: 'Golden Grove (870 ft) and Garden Breeze (2 × 400 ft)' },
  { value: '3', label: 'Cities with our own teams', note: 'Bengaluru (home base), plus local teams in Hyderabad and Chennai' },
]

export const capabilitiesIntro = 'One team owns every step, so clients have a single point of accountability from recce to upkeep.'
export const capabilities = [
  { n: '01', title: 'Recce & survey', body: 'Drone and Google Earth surveys; every frontage measured.', image: shot('cap-recce', 'Drone survey of a project site') },
  { n: '02', title: 'Design', body: 'In-house architect: day and night renders, options.', image: shot('cap-design', 'Render of the Prestige Park Lane entrance arch') },
  { n: '03', title: 'Engineering', body: 'Working drawings, structural and civil details.', image: shot('cap-engineering', 'Reinforcement cage for a mast foundation') },
  { n: '04', title: 'Fabrication', body: 'MS and SS frames, backlit boxes, 3D logos, LED.', image: shot('cap-fabrication', 'Fabricated panels in the workshop') },
  { n: '05', title: 'Installation', body: 'Cranes, foundations, wiring and commissioning.', image: shot('cap-installation', 'Crew installing a boundary-wall panel') },
  { n: '06', title: 'Upkeep & review', body: 'Creative changes, maintenance, monthly reviews.', image: shot('cap-upkeep', 'Branded boundary wall in upkeep') },
]
export const teams = 'Execution teams · Bengaluru (home base) · Hyderabad · Chennai'

export const why = {
  title: { before: 'Speed, craft, ownership', italic: 'and accountability.' },
  lede: 'Each one proven on site.',
  image: shot('evergreen-wall', 'Five LED screens set into one architect-designed wall at Evergreen, Prestige Raintree Park, Whitefield'),
  caption: 'Evergreen, Prestige Raintree Park, Whitefield · five LED screens set into one architect-designed wall.',
  items: [
    { title: 'Speed', body: '45 days from our factory in Pune to a standing 150-ft mast in Hyderabad. A 2000+ Happy Families cut-out built from scratch and shipped in under 3 days.' },
    { title: 'Craft', body: 'An in-house architect designs every frontage: renders, working drawings and specs.' },
    { title: 'Ownership', body: 'Civil, fabrication, electrical and installation under one order, with local teams in Hyderabad and Chennai.' },
    { title: 'Accountability', body: 'A monthly management review of every live project with the client: status, issues and support needed.' },
  ],
}

export interface Work {
  id: string
  name: string
  place: string
  status?: string
  line: string
  shots: Shot[]
  facts?: { label: string; value: string }[]
}

export const crownJewel = {
  title: 'The crown jewel',
  heading: "Golden Grove's 150-ft high mast, now a landmark seen from the Outer Ring Road and the highway.",
  image: shot('goldengrove-mast', 'The illuminated 3D Prestige logo being lifted into place', 'The illuminated 3D logo being lifted into place'),
  facts: [
    { label: 'Height', value: 'Around 150 ft from the ground: 40 m mast with a 3 m signage frame' },
    { label: 'Visibility', value: 'Seen from the Outer Ring Road and the 5-lane highway; the landmark of the area' },
    { label: 'Brand', value: 'Illuminated 3D Prestige logo, lit every night' },
    { label: 'Delivery', value: '45 days from our factory in Pune to the site in Hyderabad' },
    { label: 'Location', value: 'Prestige Golden Grove, Tellapur, Hyderabad' },
  ],
}

export const work: Work[] = [
  {
    id: 'courtyard',
    name: 'The Courtyard by Sublime',
    place: 'Prestige Trade Tower, Bengaluru',
    line: 'Four large-format backlit panels on the construction barricade, keeping the brand lit while renovation went on behind them.',
    shots: [
      shot('courtyard-panels', 'The Courtyard by Sublime: backlit barricade panels', 'Backlit barricade panels'),
      shot('courtyard-before', 'Bare blue barricade sheets before branding', 'Before: bare blue barricade sheets'),
      shot('courtyard-night', 'The Courtyard panels lit after dark', 'After dark'),
    ],
  },
  {
    id: 'siorai',
    name: 'SIORAI',
    place: 'UB City Road and Lavelle Road junction, Bengaluru',
    line: 'A luxury brand: signage in a gold-bronze finish to match its look.',
    shots: [
      shot('siorai-sign', 'SIORAI illuminated sign in a gold-bronze finish', 'Illuminated sign, gold-bronze finish'),
      shot('siorai-junction', 'SIORAI sign at the UB City Road and Lavelle Road junction', 'UB City Road and Lavelle Road junction'),
      shot('siorai-storefront', 'SIORAI storefront signage', 'Storefront signage'),
    ],
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    place: 'Prestige Raintree Park, Whitefield, Bengaluru',
    line: 'Five LED screens set into one architect-designed wall, laser-cut to match the render exactly.',
    shots: [
      shot('evergreen-aerial', 'Evergreen LED wall from the air', 'LED wall · drone aerial'),
      shot('evergreen-board', 'Outdoor large-scale backlit box at Evergreen', 'Outdoor large-scale backlit box'),
      shot('evergreen-masterplan', 'Interior backlit fabric box showing the master plan', 'Interior backlit fabric boxes: master plan and renders'),
      shot('evergreen-2500', 'A 2500+ Happy Families cut-out made backlit', '2500+ Happy Families: static cut-out made backlit'),
    ],
  },
  {
    id: 'glenbrook-somerville',
    name: 'Prestige Glenbrook and Prestige Somerville',
    place: 'Bengaluru',
    line: 'A backlit entrance arch and 24 street-light flags, finished to the same standard as our flagship sites.',
    shots: [
      shot('glenbrook-arch', 'Prestige Glenbrook backlit box arch', 'Prestige Glenbrook · backlit box arch'),
      shot('glenbrook-arch-side', 'Glenbrook arch from the side', 'Glenbrook arch, side view'),
      shot('somerville-flags', 'Flags on street-light poles at Prestige Somerville', 'Prestige Somerville · 24 flags on street-light poles'),
    ],
  },
  {
    id: 'conrad',
    name: 'Conrad Bengaluru',
    place: "Sublime's private dining room",
    line: 'Gold glass framing for two large handwoven fabrics.',
    shots: [
      shot('conrad-fabric', 'Handwoven fabric in gold glass framing', 'Handwoven fabric in gold glass framing'),
      shot('conrad-install', 'Installing the framed fabric in the private dining space', 'Installation in the private dining space'),
      shot('conrad-second', 'The second framed fabric', 'The second framed fabric'),
    ],
  },
  {
    id: 'prestige-city',
    name: 'The Prestige City',
    place: 'Sarjapur, Bengaluru',
    line: 'Buying a home deserves a celebration: the congratulations podium customers now queue to be photographed at.',
    shots: [
      shot('city-podium', 'The congratulations podium as installed', 'The congratulations podium, as installed'),
      shot('city-logo', 'Backlit Prestige logo', 'Backlit Prestige logo'),
      shot('city-fernvale-plan', 'Backlit master numbering plan for Fernvale', 'Backlit master numbering plan'),
      shot('city-eaton-plan', 'Eaton Park master plan', 'Eaton Park master plan'),
    ],
  },
  {
    id: 'crystal-lawns',
    name: 'Prestige Crystal Lawns',
    place: 'Devanahalli, Bengaluru',
    line: 'Wall branding that holds the eye after dark, and interior branding inside.',
    shots: [
      shot('crystal-wall-dusk', 'Lit campaign wall at dusk', 'Lit campaign wall at dusk'),
      shot('crystal-wall-day', 'The campaign wall by day', 'The wall by day'),
      shot('crystal-plans', 'Backlit master plans inside the sales office', 'Backlit master plans inside'),
      shot('crystal-wayfinding', 'Lit wayfinding to the sales office', 'Lit wayfinding to the sales office'),
    ],
  },
  {
    id: 'gardenia',
    name: 'Prestige Gardenia Estate',
    place: 'Bengaluru',
    line: 'Complete site branding, from the entrance arch to the backlit renders and location map.',
    shots: [
      shot('gardenia-arch', 'Backlit entrance arch at Prestige Gardenia Estate', 'Backlit entrance arch'),
      shot('gardenia-render', 'Backlit project render', 'Backlit project render'),
      shot('gardenia-plan', 'Backlit master plan', 'Master plan'),
      shot('gardenia-sign', 'Lit site signage', 'Lit site signage'),
    ],
  },
  {
    id: 'golden-grove',
    name: 'Prestige Golden Grove',
    place: 'Tellapur, Hyderabad',
    line: 'Beyond the mast: an 870-ft lit frontage, and a cut-out built from scratch in under three days.',
    shots: [
      shot('goldengrove-frontage', 'The 870-ft lit, landscaped frontage from the air', '870-ft lit, landscaped frontage · drone aerial'),
      shot('goldengrove-night', 'The frontage after dark', 'The frontage after dark'),
      shot('goldengrove-2000', 'The 2000+ Happy Families cut-out', '2000+ Happy Families · built from scratch in under 3 days'),
    ],
  },
  {
    id: 'palm-court',
    name: 'Prestige Palm Court',
    place: 'Madhavaram, Chennai',
    line: 'Backlit renders, master plans and an eye-catching backlit photo booth for the grand hall.',
    shots: [
      shot('palmcourt-walkway', 'Walkway render wall', 'Walkway render wall'),
      shot('palmcourt-booth', 'Backlit photo booth in the grand hall', 'Backlit photo booth, grand hall'),
      shot('palmcourt-reception', 'Reception and project logo', 'Reception and project logo'),
      shot('palmcourt-plan', 'Backlit master plan', 'Backlit master plan'),
    ],
  },
  {
    id: 'spring-woods',
    name: 'Prestige Spring Woods',
    place: 'Yerthiganahalli, Bengaluru',
    status: 'In progress',
    line: 'A 15,000 sq ft mural for the Yerthiganahalli railway underpass.',
    shots: [shot('springwoods-mural', 'Design board: approach walls, underpass entrance and road-safety details', 'Design board: approach walls, underpass entrance and road-safety details')],
    facts: [
      { label: 'Scope', value: 'A 15,000 sq ft mural across the approach walls and the underpass entrance, turning a dark crossing into a neighbourhood landmark.' },
      { label: 'Road safety', value: 'Solar LED lighting, convex mirrors and high-visibility corner guards, designed into the scheme.' },
      { label: 'Status', value: 'Execution in progress on site.' },
    ],
  },
]

export interface CaseStudy {
  id: string
  title: string
  heading: string
  sections: { label: string; body: string }[]
  shots: Shot[]
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'two-good-fest',
    title: 'The Two Good Fest · Evergreen at Prestige Raintree Park',
    heading: 'Four Prestige projects under one roof, with one partner delivering everything across two editions.',
    sections: [
      { label: 'Brief', body: 'One fest to boost sales of four projects at one venue: Eaton Park, Southern Star, Crystal Lawns and Glenbrook, at Evergreen, Whitefield.' },
      { label: 'Delivered', body: 'Backlit arches and entrance pillars, drop-down flags, four project stalls, a grand arch, food and kids’ zones, an Onam rangoli and festival lighting.' },
      { label: 'Why it matters', body: "One accountable partner across fabrication, décor, F&B, activation and power: fewer vendors for the client's team to manage." },
    ],
    shots: [
      shot('fest-stalls', 'Four project stalls at The Two Good Fest'),
      shot('fest-arch', 'The grand arch at The Two Good Fest'),
      shot('fest-food', 'Food stalls at the fest'),
      shot('fest-rangoli', 'Onam rangoli'),
    ],
  },
  {
    id: 'garden-breeze',
    title: 'Garden Breeze · The Prestige City, Sarjapur',
    heading: 'Two 400-ft walls, two hoardings, the medians and the entire forum wall at The Prestige City.',
    sections: [
      { label: 'Brief', body: 'Build presence for Garden Breeze inside The Prestige City, from the estate gate to the experience centre.' },
      { label: 'Challenge', body: 'A long internal approach, fragmented LED panels and patchwork construction sheets competing for attention.' },
      { label: 'Solution', body: 'Two walls of 400 ft each, two hoardings, centre-road median branding across The Prestige City, the entire forum wall in backlit panels, pole flags and an entrance arch.' },
    ],
    shots: [
      shot('breeze-forum', 'The entire forum wall in backlit panels'),
      shot('breeze-wall', 'A 400-ft branded wall along the internal road'),
      shot('breeze-led', 'LED screen at The Prestige City'),
      shot('breeze-flag', 'Pole flag on the centre-road median'),
    ],
  },
  {
    id: 'park-lane',
    title: 'Prestige Park Lane · Devanahalli',
    heading: 'Wall and office branding for the launch, a large site hoarding, and a 150-ft mast on order.',
    sections: [
      { label: 'Brief', body: 'Make a greenfield site near STRR findable and premium before launch.' },
      { label: 'Delivered', body: 'Wall branding, office interiors, backlit fabric boxes, directional signage and vertical flags, ready ahead of launch.' },
      { label: 'Now', body: 'A large site hoarding, and a 150-ft high mast on order.' },
    ],
    shots: [
      shot('parklane-night', 'Backlit wall panels along the Park Lane property, at night'),
      shot('parklane-welcome', 'Welcome banner at the Park Lane sales gallery'),
      shot('parklane-directional', 'Directional sign to the sales gallery'),
    ],
  },
]

export const masts = {
  title: 'High masts',
  heading: 'One delivered, three ordered, and four more in design or recce.',
  note: 'Heights are from the ground.',
  rows: [
    { height: '150 ft', name: 'Golden Grove', place: 'Hyderabad', status: 'Delivered', extra: '' },
    { height: '150 ft', name: 'Park Lane', place: 'Devanahalli', status: 'Ordered', extra: '3-sided logo' },
    { height: '150 ft', name: 'Olive Oak', place: 'Devanahalli', status: 'Ordered', extra: '+ project-name board' },
    { height: '110 ft', name: 'Pavilions', place: 'Mysore', status: 'Ordered', extra: '+ 30 × 20 ft hoarding' },
    { height: '140 ft', name: 'Prestige × CCD', place: 'Chikmagalur', status: 'Designed', extra: '+ 30 × 30 ft V hoarding' },
    { height: '150 ft', name: 'Bougainvillea', place: 'Sector 150, Noida', status: 'Recce', extra: '' },
    { height: '150 ft', name: 'Meadows', place: 'Sector 92, NCR', status: 'Recce', extra: '' },
    { height: '150 ft', name: 'Falcon City', place: 'Sector 109, NCR', status: 'Recce', extra: '' },
  ],
}

export const led = {
  title: { before: 'Our LED network puts launches on', italic: "Bengaluru's busiest corridors." },
  stats: [
    { value: '6', label: 'LED billboards in our network across key Bengaluru junctions' },
    { value: '12', label: 'large-format DOOH screens on our media list, from Bellandur ORR to Mysore Road' },
    { value: '591 sq ft', label: 'P5 L-shaped corner screen ordered for Sony World Junction' },
  ],
  places: ['Bellandur ORR', 'Marathahalli ORR', 'Sony World Jn', 'Jakkasandra', 'Indiranagar 100 ft Rd', 'Hennur Rd', 'Madiwala', 'Museum Rd', 'BTM–Ragigudda', 'Mysore Rd flyover', 'Town Hall'],
}

export const films = {
  title: { before: 'Launch films:', italic: 'script, shoot, deliver.' },
  lede: 'We script, shoot and deliver route and walkthrough films for project launches.',
  image: shot('film-drone', '4K drone aerial from a site recce', '4K drone aerial from a site recce'),
  items: [
    { name: 'Route film', project: 'Prestige Palm Court, Chennai', body: 'Guides buyers from the main road to the experience centre, shot on the approach the customer actually drives.' },
    { name: 'Showcase, walkthrough and lifestyle film', project: 'Prestige Avon, Thanisandra', body: 'Story-led script with model walkthroughs of interiors and amenities, façade and landscape, drone aerials, unit details, CTA and RERA information, with voice-over.' },
  ],
  kit: ['4K drone', 'DSLR and mirrorless', 'Models and VO', 'Premiere and After Effects', 'Script to delivery in 8 days'],
}

export const architecture = {
  title: { before: 'Our in-house architect', italic: 'designs every frontage.' },
  lede: 'Most of these designs are already in production or on site.',
  note: 'Design · working drawings · material specs · production, all under one roof.',
  shots: [
    shot('arch-avon', 'Avon, Thanisandra: monolith wall', 'Avon, Thanisandra · monolith wall'),
    shot('arch-pavilions', 'Pavilions, Mysore: corten-fin wall at night', 'Pavilions, Mysore · corten-fin wall, night'),
    shot('arch-hyderabad', 'Hyderabad: joint wall with Oberoi, Vaishnaoi and TGIIC', 'Hyderabad · joint wall with Oberoi, Vaishnaoi, TGIIC'),
    shot('arch-elevation', 'Wall elevation, perforated panels and LED frame', 'Wall elevation, perforated panels and LED frame'),
  ],
}
