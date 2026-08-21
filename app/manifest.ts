import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bhumi Estates',
    short_name: 'Bhumi Estates',
    description: 'Land, verified. Sourcing, verification, development and outdoor advertising in Bengaluru.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F3EC',
    theme_color: '#0E3B2E',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
