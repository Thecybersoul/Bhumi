'use client'

import React from 'react'

/* `wordmark` is the mark + BHUMI ESTATES without the tagline — used
   wherever the logo renders below ~60px, where the tagline would be
   an illegible smear. `horizontal` and `stacked` keep the full lockup. */
export type LogoVariant = 'icon' | 'horizontal' | 'stacked' | 'wordmark'

interface LogoProps {
  variant?: LogoVariant
  className?: string
  style?: React.CSSProperties
  theme?: 'dark' | 'light'
}

// Bump this whenever the underlying artwork in public/img/logos changes.
// /img/:path* is served with a one-year immutable Cache-Control, so a
// content change under the same filename is invisible to every browser
// and CDN that already cached it — the query string forces a new URL.
const LOGO_ARTWORK_VERSION = 3

export default function Logo({ variant = 'horizontal', className = '', style, theme = 'light' }: LogoProps) {
  const isDark = theme === 'dark'

  let variantName = variant
  if (variant === 'stacked') {
    variantName = 'primary' as any
  }

  const logoSrc = `/img/logos/bhumi-estates-${variantName}-${theme}.svg?v=${LOGO_ARTWORK_VERSION}`

  return (
    <div className={`logo-wrapper logo-${variant} ${className}`} style={{ display: 'inline-flex', alignItems: 'center', height: '100%', ...style }}>
      <img 
        src={logoSrc} 
        alt="Bhumi Estates Logo" 
        style={{ width: 'auto', height: '100%', objectFit: 'contain' }} 
      />
    </div>
  )
}
