import type { Metadata, Viewport } from 'next'
import './globals.css'
import './components.css'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { brand } from '@/lib/content/brand'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bhumiestates.in'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Bhumi Estates — Land verified before it is bought',
    template: '%s · Bhumi Estates',
  },
  description:
    'Bhumi Estates verifies land through a published six-stage protocol, structures the deal that follows, oversees construction, and takes the finished asset to market. Bengaluru and its growth corridors.',
  keywords: [
    'land verification Bengaluru',
    'title verification Karnataka',
    'outdoor advertising Bengaluru',
    'large land parcels Bengaluru',
    'warehouse Bengaluru',
    'growth corridors Bengaluru',
    'encumbrance certificate Karnataka',
  ],
  authors: [{ name: brand.name }],
  openGraph: {
    type: 'website',
    siteName: brand.name,
    title: 'Bhumi Estates — Land verified before it is bought',
    description:
      'A published six-stage verification protocol, real campaign numbers, and a transparency dashboard showing how many parcels we flag. Bengaluru land, verification and development advisory.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bhumi Estates — Land verified before it is bought',
    description: 'The verification protocol, published in full. And the numbers behind it.',
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
