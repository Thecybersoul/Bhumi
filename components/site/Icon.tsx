import React from 'react'

/* Custom iconography per property type and per pillar (Plan §11):
   "a warehouse shown with a technical cutaway diagram, a villa
   with lifestyle photography, a land parcel with an aerial /
   topographic view — never one generic icon set applied to
   everything." Each glyph below is drawn for its own subject. */

export type IconName =
  // property types
  | 'commercial'
  | 'residential'
  | 'villas'
  | 'land-parcels'
  | 'warehouses'
  | 'large-land-parcels'
  // pillars
  | 'land'
  | 'shield'
  | 'structure'
  | 'crane'
  | 'megaphone'
  | 'handshake'
  // tools
  | 'balance'
  | 'fork'
  | 'calculator'
  | 'checklist'
  | 'compare'
  | 'map'
  | 'gauge'
  // ui
  | 'whatsapp'
  | 'phone'
  | 'arrow'
  | 'check'
  | 'flag'
  | 'lock'
  | 'download'
  | 'play'

const paths: Record<IconName, React.ReactNode> = {
  /* Commercial — floor plates in section, core shown */
  commercial: (
    <>
      <path d="M4 21h16" />
      <path d="M6 21V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15" />
      <path d="M6 10h12M6 14h12M6 18h12" />
      <path d="M11 5v16" />
    </>
  ),
  /* Residential — unit plan grid with a carpet/built distinction */
  residential: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v11h14V10" />
      <path d="M10 21v-6h4v6" />
      <path d="M5 15h5M14 15h5" />
    </>
  ),
  /* Villa — plot boundary with a house set inside it */
  villas: (
    <>
      <path d="M3 20h18V7l-4-3H3z" strokeDasharray="3 2" />
      <path d="M8 20v-6h5v6" />
      <path d="M6.5 12 10.5 9l4 3" />
      <path d="M14.5 12V20" />
    </>
  ),
  /* Land parcel — aerial boundary with survey pins */
  'land-parcels': (
    <>
      <path d="M4 6.5 10 4l4.5 2.5L20 4v13.5L14.5 20 10 17.5 4 20z" />
      <path d="M10 4v13.5M14.5 6.5V20" />
      <circle cx="7" cy="9" r="1" />
      <circle cx="17.5" cy="14" r="1" />
    </>
  ),
  /* Warehouse — technical cutaway: eaves height, racking, dock */
  warehouses: (
    <>
      <path d="M3 21V9.5L12 5l9 4.5V21" />
      <path d="M3 21h18" />
      <path d="M7 21v-6h4v6" />
      <path d="M14 12h4M14 15h4M14 18h4" />
      <path d="M2 9.5v11" strokeDasharray="2 2" />
    </>
  ),
  /* Large parcel — topographic contours across an assembly */
  'large-land-parcels': (
    <>
      <path d="M2 17c3-3 6-3 9 0s7 3 11-1" />
      <path d="M2 12c3-3 6-3 9 0s7 3 11-1" />
      <path d="M2 7c3-3 6-3 9 0s7 3 11-1" />
      <circle cx="15" cy="13" r="1.4" />
    </>
  ),

  land: (
    <>
      <path d="M3 18h18" />
      <path d="M4 18V9l8-5 8 5v9" />
      <path d="M9 18v-5h6v5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  structure: (
    <>
      <rect x="3" y="4" width="7" height="7" rx="1" />
      <rect x="14" y="4" width="7" height="7" rx="1" />
      <rect x="8.5" y="14" width="7" height="7" rx="1" />
      <path d="M6.5 11v1.5h11V11" />
      <path d="M12 12.5V14" />
    </>
  ),
  crane: (
    <>
      <path d="M4 21h16" />
      <path d="M6 21V4h13" />
      <path d="M19 4v5" />
      <path d="M6 8h8" />
      <rect x="15.5" y="9" width="7" height="4" rx="1" transform="translate(-3 0)" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z" />
      <path d="M18 8.5a5 5 0 0 1 0 7" />
      <path d="M7 15v4" />
    </>
  ),
  handshake: (
    <>
      <path d="m3 12 4-4 3 3 4-4 3 3 4-4" />
      <path d="M7 8v5a2 2 0 0 0 2 2h1l3 3 2-2" />
      <path d="M21 10v4a2 2 0 0 1-2 2h-2" />
    </>
  ),

  balance: (
    <>
      <path d="M12 3v18M6 21h12" />
      <path d="M3 8h18" />
      <path d="m6 8-3 6h6zM18 8l-3 6h6z" />
    </>
  ),
  fork: (
    <>
      <path d="M12 21V12" />
      <path d="M12 12 5 5M12 12l7-7" />
      <circle cx="4" cy="4" r="2" />
      <circle cx="20" cy="4" r="2" />
      <circle cx="12" cy="21" r="1.5" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </>
  ),
  checklist: (
    <>
      <path d="M9 5h11M9 12h11M9 19h11" />
      <path d="m3 5 1.5 1.5L7 4" />
      <path d="m3 12 1.5 1.5L7 11" />
      <path d="M3.5 18.5h3v3h-3z" />
    </>
  ),
  compare: (
    <>
      <path d="M5 21V11M12 21V6M19 21v-7" />
      <path d="M3 21h18" />
      <path d="M5 8 12 3l7 5" strokeDasharray="3 2" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a9 9 0 1 1 16 0" />
      <path d="m12 14 4-4" />
      <circle cx="12" cy="14" r="1.5" />
    </>
  ),

  whatsapp: (
    <>
      <path d="M3 21l1.7-5A8.4 8.4 0 1 1 8 19.4z" />
      <path d="M8.8 9.2c.2 1.6 2.4 3.8 4 4l.9-1.2 1.8.8c-.2 1-1.2 1.6-2.2 1.5-2.8-.3-5.4-2.9-5.7-5.7-.1-1 .5-2 1.5-2.2l.8 1.8z" />
    </>
  ),
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  check: <path d="m4 12 5 5L20 6" />,
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 5h11l-2 3 2 3H5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5z" />,
}

export default function Icon({
  name,
  size = 24,
  stroke = 1.5,
  className = '',
  filled = false,
}: {
  name: IconName
  size?: number
  stroke?: number
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}
