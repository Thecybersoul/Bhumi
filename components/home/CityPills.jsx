'use client'

import Link from 'next/link'
import { cityPills } from '@/lib/copy/home'

export default function CityPills() {
  return (
    <section style={{ background: '#fdfbf7', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '32px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
          {cityPills.items.map((c) => (
            <Link
              key={c.label}
              href={`/marketplace?zone=${c.zone}`}
              style={{
                fontSize: '.85rem', fontWeight: 500, padding: '8px 16px', borderRadius: 100,
                background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-2)',
                transition: '.15s',
              }}
              className="city-pill"
            >
              📍 {c.label}
            </Link>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.82rem', marginTop: 16 }}>
          {cityPills.caption}
        </p>
      </div>
    </section>
  )
}
