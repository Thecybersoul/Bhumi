import type { Metadata, Viewport } from 'next'
import './globals.css'
import './components.css'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { brand } from '@/lib/content/brand'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bhumiestates.in'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Bhumi Estates — Land sourcing, branding and outdoor advertising',
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
  openGraph: {
    type: 'website',
    siteName: brand.name,
    title: 'Bhumi Estates — Land sourcing, branding and outdoor advertising',
    description:
      'We find the parcel worth buying, build the identity a project is judged by, and make it impossible to miss. Bengaluru land, branding and outdoor advertising.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bhumi Estates — Land sourcing, branding and outdoor advertising',
    description: 'We find the land, and make it impossible to miss.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#0B2239',
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
  sameAs: [brand.social.linkedin, brand.social.youtube],
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
