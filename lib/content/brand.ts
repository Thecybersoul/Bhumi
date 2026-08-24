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
  email: 'estatesbhumi@gmail.com',
  address: {
    line1: '7th Main, 4th Block, Jayanagar',
    line2: 'Bengaluru 560011, Karnataka, India',
  },
  social: {
    linkedin: 'https://www.linkedin.com/company/bhumiestates',
    youtube: 'https://www.youtube.com/@bhumiestates',
  },
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
  sourcing: whatsapp('Hi Bhumi Estates — I am looking for land and would like to talk it through.'),
  development: whatsapp('Hi Bhumi Estates — I need a development partner for a project.'),
  branding: whatsapp('Hi Bhumi Estates — I need site branding: boundary wall, entrance or signage.'),
  outdoorAdvertising: whatsapp('Hi Bhumi Estates — I would like to plan an outdoor advertising campaign.'),
}

export type NavItem = { label: string; href: string; description?: string; children?: NavItem[] }

/* Three destinations. The site is the homepage plus one page per
   practice; the marketplace and insights sit inside Property
   Consultancy rather than competing with it at the top level. */
export const primaryNav: NavItem[] = [
  {
    label: 'Property Consultancy',
    href: '/property-consultancy',
    description: 'Land sourcing, verification and legal, construction and development',
    children: [
      { label: 'Land Sourcing', href: '/property-consultancy#land-sourcing' },
      { label: 'Verification & Legal', href: '/property-consultancy#verification-legal' },
      { label: 'Construction & Development', href: '/property-consultancy#construction-development' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Insights', href: '/insights' },
    ],
  },
  {
    label: 'Branding & Advertising',
    href: '/branding-advertising',
    description: 'Project branding and outdoor advertising',
    children: [
      { label: 'Project Branding', href: '/branding-advertising#project-branding' },
      { label: 'Outdoor Advertising', href: '/branding-advertising#outdoor-advertising' },
    ],
  },
  { label: 'Contact', href: '/contact', description: 'Talk to an advisor' },
]

export const utilityNav: NavItem[] = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Insights', href: '/insights' },
]
