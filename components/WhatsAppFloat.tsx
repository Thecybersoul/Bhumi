'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export default function WhatsAppFloat() {
  const pathname = usePathname()
  
  // Do not show on admin dashboard
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const phoneNumber = '918123845749'
  const message = 'Hello! I am interested in exploring properties with Bhumi Estates.'

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      /* .waFloat is the hook that hides this while the mobile nav
         drawer is open (see body.nav-open in components.css). */
      className="waFloat"
      /* Deep brand green with a gold hairline rather than WhatsApp's
         neon #25D366, which fights the palette on every page. */
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        width: '54px',
        height: '54px',
        backgroundColor: '#0E3B2E',
        color: '#E8D9B5',
        border: '1px solid rgba(194,151,74,.55)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 14px 30px -12px rgba(8, 26, 19, .7)',
        zIndex: 9999,
        cursor: 'pointer',
        transition: 'transform .25s ease, box-shadow .25s ease, background-color .25s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.backgroundColor = '#C2974A'
        e.currentTarget.style.color = '#0B2219'
        e.currentTarget.style.boxShadow = '0 18px 34px -12px rgba(8, 26, 19, .8)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.backgroundColor = '#0E3B2E'
        e.currentTarget.style.color = '#E8D9B5'
        e.currentTarget.style.boxShadow = '0 14px 30px -12px rgba(8, 26, 19, .7)'
      }}
      aria-label="Chat with us on WhatsApp"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413z" />
      </svg>
    </a>
  )
}
