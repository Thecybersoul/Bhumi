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
    /* Each tile is declared twice. 'maskable' lets Android crop it to
       whatever shape the launcher uses instead of shrinking it into a
       white border; 'any' is what everything else wants. The manifest
       spec allows both purposes in one space-separated entry, but
       Next's type takes a single value, so they are listed separately.

       The mark covers 66% of the tile, so it clears the 80% safe
       circle a maskable icon is cropped to — see TILE_INK_COVERAGE in
       scripts/gen-share-assets.js before changing either number. */
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
