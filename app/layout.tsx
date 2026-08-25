import type { Metadata, Viewport } from 'next'
import './globals.css'
import './components.css'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { brand } from '@/lib/content/brand'

/* www, because that is where the site actually answers — the bare
   domain 308s to it. Every absolute url built from this is one a
   crawler fetches directly: og:image above all, which some scrapers
   will not follow a redirect for. Keep NEXT_PUBLIC_SITE_URL, if it is
   set at all, on the same host. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bhumiestates.in'

/* The one line that names the firm: the browser tab, og:title and
   twitter:title all show it, and they should never disagree. */
const SITE_TITLE = 'Bhumi Estates - Property and Branding Consultants.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE,
    template: '%s · Bhumi Estates',
  },
  description:
    'Bhumi Estates sources the parcel worth buying, builds the site identity a project is judged by, and runs the outdoor campaigns that put it in front of the right buyers. Bengaluru and its growth corridors.',
  keywords: [
    'land sourcing Bengaluru',
    'site branding Bengaluru',
    'outdoor advertising Bengaluru',
    'billboards hoardings Bengaluru',
    'large land parcels Bengaluru',
    'warehouse Bengaluru',
    'growth corridors Bengaluru',
  ],
  authors: [{ name: brand.name }],
  /* The image for both cards is app/opengraph-image.png and
     app/twitter-image.png — Next picks those up by file convention and
     writes the url, type and dimensions itself. Setting `images` here
     as well would override them with values nothing keeps in sync. */
  openGraph: {
    type: 'website',
    siteName: brand.name,
    url: siteUrl,
    title: SITE_TITLE,
    description:
      'We find the parcel worth buying, build the identity a project is judged by, and make it impossible to miss. Bengaluru land, branding and outdoor advertising.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: 'We find the land, and make it impossible to miss.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#0E3B2E',
  width: 'device-width',
  initialScale: 1,
}

const organisationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: brand.name,
  description:
    'Land sourcing, verification, development, branding and outdoor advertising for land and property in Bengaluru.',
  url: siteUrl,
  /* The mark Google may show beside the listing. Absolute, because a
     crawler resolving structured data has no page to resolve against. */
  logo: `${siteUrl}/icons/icon-512.png`,
  image: `${siteUrl}/opengraph-image.png`,
  telephone: brand.phone,
  email: brand.email,
  areaServed: 'Bengaluru, Karnataka, India',
  address: {
    '@type': 'PostalAddress',
    streetAddress: brand.address.line1,
    addressLocality: 'Bengaluru',
    addressRegion: 'Karnataka',
    postalCode: '560011',
    addressCountry: 'IN',
  },
  sameAs: [brand.social.linkedin, brand.social.instagram],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <WhatsAppFloat />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }}
        />
      </body>
    </html>
  )
}
