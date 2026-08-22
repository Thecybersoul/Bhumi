/* Brand-level constants. Single source of truth for identity,
   contact routes and navigation — Plan §2 ("one consistent,
   protectable brand identity across every page"). */

export const brand = {
  name: 'Bhumi Estates',
  legalName: 'Bhumi Estates',
  tagline: 'Land, verified before it is sold.',
  promise: 'Publish the proof, not the pitch.',
  city: 'Bengaluru',
  phone: '+91 81238 45749',
  phoneRaw: '918123845749',
  email: 'contact@bhumiestates.in',
  advisorEmail: 'advisory@bhumiestates.in',
  address: {
    line1: '7th Main, 4th Block, Jayanagar',
    line2: 'Bengaluru 560011, Karnataka, India',
  },
  social: {
    linkedin: 'https://www.linkedin.com/company/bhumiestates',
    youtube: 'https://www.youtube.com/@bhumiestates',
  },
  reraNote:
    'K-RERA agent registration number is displayed on every listing and in the footer of every advertisement, per Karnataka RERA advertising rules.',
  reraNumber: 'PRM/KA/RERA/1251/446/AG/—',
}

/** Build a click-to-chat link. WhatsApp-first is the primary
    conversion path across the site (Plan §3F). */
export function whatsapp(message: string): string {
  return `https://wa.me/${brand.phoneRaw}?text=${encodeURIComponent(message)}`
}

export const wa = {
  general: whatsapp("Hi Bhumi Estates — I'd like to speak to someone about a property."),
  verification: whatsapp(
    "Hi Bhumi Estates — I'd like a free land verification review. My parcel is in:"
  ),
  largeParcel: whatsapp(
    'Hi Bhumi Estates — I am enquiring about a large land parcel and would like to speak to an advisor.'
  ),
  sourcing: whatsapp('Hi Bhumi Estates — I am looking for land and would like to talk it through.'),
  development: whatsapp('Hi Bhumi Estates — I need a development partner for a project.'),
  branding: whatsapp('Hi Bhumi Estates — I need site branding: boundary wall, entrance or signage.'),
  outdoorAdvertising: whatsapp('Hi Bhumi Estates — I would like to plan an outdoor advertising campaign.'),
}

export type NavItem = { label: string; href: string; description?: string; children?: NavItem[] }

/* Five top-level destinations, not nine. Sourcing, Branding and
   Outdoor Advertising lead the Services menu; the two partner-network
   services sit below a divider rather than competing for the eye. */
export const primaryNav: NavItem[] = [
  {
    label: 'Services',
    href: '/services',
    description: 'Sourcing, branding and outdoor advertising',
    children: [
      { label: 'Land Sourcing', href: '/services/land-sourcing' },
      { label: 'Branding', href: '/services/branding' },
      { label: 'Outdoor Advertising', href: '/services/outdoor-advertising' },
      { label: 'Development', href: '/services/development' },
      { label: 'Verification', href: '/services/verification' },
    ],
  },
  {
    label: 'Property Types',
    href: '/property-types',
    description: 'Commercial, residential, villas, land, warehouses, large parcels',
    children: [
      { label: 'Commercial buildings', href: '/property-types/commercial' },
      { label: 'Residential / apartments', href: '/property-types/residential' },
      { label: 'Villas', href: '/property-types/villas' },
      { label: 'Land parcels', href: '/property-types/land-parcels' },
      { label: 'Warehouses / industrial', href: '/property-types/warehouses' },
      { label: 'Large land parcels', href: '/large-land-parcels' },
    ],
  },
  { label: 'Marketplace', href: '/marketplace', description: 'Parcels currently on the platform' },
  { label: 'Resources', href: '/resources', description: 'Work, corridors, tools and insights' },
  { label: 'Contact', href: '/contact', description: 'Talk to an advisor' },
]

export const utilityNav: NavItem[] = [
  { label: 'Verification checklist', href: '/checklist' },
]
