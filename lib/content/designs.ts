/* ═══════════════════════════════════════════════════════════
   Design and build work, by the construction partner.

   These renders are the work of the design-and-build practice we
   engage for construction, who operate as part of the Bhumi
   Estates team on a client project rather than as a subcontractor
   handed off to. They are shown as a capability reference — what
   this team designs and builds — not as Bhumi's own completed
   portfolio, and the page says so.

   Captions describe only what is visible in each render. Nothing
   here asserts a location, a completion date or a client name.
   ═══════════════════════════════════════════════════════════ */

export type DesignKind = 'Exterior' | 'Interior'

export interface Design {
  id: string
  image: string
  kind: DesignKind
  /** Short label on the card. */
  title: string
  /** One line describing what the render shows. */
  note: string
}

export const designs: Design[] = [
  {
    id: 'facade-contemporary-01',
    image: '/img/designs/facade-contemporary-01.jpg',
    kind: 'Exterior',
    title: 'Contemporary residence',
    note: 'Stacked cantilevers, timber-screen shading and planted terraces across three levels.',
  },
  {
    id: 'elevation-corner-plot',
    image: '/img/designs/elevation-corner-plot.jpg',
    kind: 'Exterior',
    title: 'Corner-plot elevation',
    note: 'Wrapped frame lines and a lit boundary treatment turning the long side into the address.',
  },
  {
    id: 'facade-contemporary-02',
    image: '/img/designs/facade-contemporary-02.jpg',
    kind: 'Exterior',
    title: 'Street-facing facade',
    note: 'Deep balconies and vertical louvres handling west light without closing the elevation.',
  },
  {
    id: 'entrance-courtyard',
    image: '/img/designs/entrance-courtyard.jpg',
    kind: 'Exterior',
    title: 'Entrance and courtyard',
    note: 'Stone-clad entry wall, carved door and a screened seating pavilion in the side setback.',
  },
  {
    id: 'traditional-residence-01',
    image: '/img/designs/traditional-residence-01.jpg',
    kind: 'Exterior',
    title: 'Traditional residence',
    note: 'Pitched clay-tile roof, turned columns and a fretwork eaves band over a deep verandah.',
  },
  {
    id: 'traditional-residence-02',
    image: '/img/designs/traditional-residence-02.jpg',
    kind: 'Exterior',
    title: 'Verandah elevation',
    note: 'The same house read from the side, showing the wrap of the verandah and roof line.',
  },
  {
    id: 'apartment-facade',
    image: '/img/designs/apartment-facade.jpg',
    kind: 'Exterior',
    title: 'Apartment facade',
    note: 'Banded glazing with a framed roof canopy, designed to read cleanly from the road.',
  },
  {
    id: 'street-elevation',
    image: '/img/designs/street-elevation.jpg',
    kind: 'Exterior',
    title: 'Multi-level elevation',
    note: 'Louvred bays and recessed floors breaking the mass down across four levels.',
  },
  {
    id: 'interior-living-dining',
    image: '/img/designs/interior-living-dining.jpg',
    kind: 'Interior',
    title: 'Living and dining',
    note: 'Open plan run to a fitted kitchen, with the stair kept as an open edge to the room.',
  },
  {
    id: 'interior-foyer',
    image: '/img/designs/interior-foyer.jpg',
    kind: 'Interior',
    title: 'Entrance foyer',
    note: 'Console, screen and a lit niche framing the arrival view from the front door.',
  },
  {
    id: 'interior-bedroom-01',
    image: '/img/designs/interior-bedroom-01.jpg',
    kind: 'Interior',
    title: 'Principal bedroom',
    note: 'Panelled headboard wall with integrated lighting and full-height fitted wardrobes.',
  },
  {
    id: 'interior-bedroom-02',
    image: '/img/designs/interior-bedroom-02.jpg',
    kind: 'Interior',
    title: 'Bedroom',
    note: 'Upholstered headboard against a patterned wall, with a fluted ceiling detail above.',
  },
]

export const designIntro = {
  eyebrow: 'Design and build',
  title: { before: 'What the construction team', italic: 'actually builds.' },
  body: 'Construction and interiors are delivered by a design-and-build practice we work with directly. They operate as part of the Bhumi Estates team on your project rather than as a subcontractor you never meet, which is what keeps a drawing decision and a site decision in the same conversation.',
  /* Said plainly, because it would be easy to imply otherwise. */
  attribution:
    'These are the construction partner\'s renders, shown as a reference for what the team designs and builds. They are not presented as Bhumi Estates\' own completed projects.',
}

export const designCounts = {
  total: designs.length,
  exterior: designs.filter((d) => d.kind === 'Exterior').length,
  interior: designs.filter((d) => d.kind === 'Interior').length,
}
