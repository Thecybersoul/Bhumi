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
  const textColor = isDark ? '#FFFFFF' : '#0E3B2E' // Forest Green
  const goldColor = '#C2974A'
  const mossColor = isDark ? '#FFFFFF' : '#0E3B2E' 

  const IconMark = (
    <img 
      src="/img/logos/logo_extracted_0.jpeg" 
      alt="Bhumi Estates Logo" 
      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
    />
  )

  if (variant === 'icon') {
    return (
      <div className={`logo-icon ${className}`} style={{ width: '40px', height: '40px', display: 'inline-block', ...style }}>
        {IconMark}
      </div>
    )
  }

  if (variant === 'stacked') {
    return (
      <div className={`logo-stacked ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>
        <div style={{ width: '64px', height: '64px', marginBottom: '8px' }}>
          {IconMark}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '0.2em', color: textColor, lineHeight: 1.2 }}>
            BHUMI
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.65rem', letterSpacing: '0.3em', color: goldColor, marginTop: '2px' }}>
            &mdash; ESTATES &mdash;
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.5rem', letterSpacing: '0.15em', color: textColor, marginTop: '6px', opacity: 0.8 }}>
            WHERE VISION MEETS VALUE
          </span>
        </div>
      </div>
    )
  }

  // Horizontal variant (default)
  return (
    <div className={`logo-horizontal ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', ...style }}>
      <div style={{ width: '48px', height: '48px', flexShrink: 0 }}>
        {IconMark}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '0.18em', color: textColor, lineHeight: 1.1 }}>
          BHUMI
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.55rem', letterSpacing: '0.35em', color: goldColor, marginTop: '2px' }}>
          &mdash; ESTATES &mdash;
        </span>
      </div>
    </div>
  )
}
