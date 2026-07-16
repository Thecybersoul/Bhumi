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
  
  let variantName = variant
  if (variant === 'stacked') {
    variantName = 'primary' as any
  }

  const logoSrc = `/img/logos/bhumi-estates-${variantName}-${theme}.svg`

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
