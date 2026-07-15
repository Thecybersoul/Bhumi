'use client'

import React from 'react'

export type LogoVariant = 'icon' | 'horizontal' | 'stacked'

interface LogoProps {
  variant?: LogoVariant
  className?: string
  style?: React.CSSProperties
  theme?: 'dark' | 'light'
}

export default function Logo({ variant = 'horizontal', className = '', style, theme = 'light' }: LogoProps) {
  const isDark = theme === 'dark'
  
  // Use the cropped high-res images we generated with Pillow
  const logoSrc = isDark ? "/img/logos/logo_dark_cropped.png" : "/img/logos/logo_light_cropped.png"

  // Since the user's PDF contains the entire logo (icon + text), we just render the image itself.
  // We don't render HTML text next to it because it would look duplicated and ridiculous.
  return (
    <div className={`logo-wrapper ${className}`} style={{ display: 'inline-flex', alignItems: 'center', height: '48px', ...style }}>
      <img 
        src={logoSrc} 
        alt="Bhumi Estates Logo" 
        style={{ width: 'auto', height: '100%', objectFit: 'contain' }} 
      />
    </div>
  )
}
