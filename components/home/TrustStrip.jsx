'use client'

import { trustStrip } from '@/lib/copy/home'

export default function TrustStrip() {
  return (
    <section style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '32px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
          {trustStrip.items.map((t) => (
            <span
              key={t}
              style={{
                fontSize: '.82rem', fontWeight: 600, padding: '8px 14px', borderRadius: 100,
                background: 'rgba(14,59,46,0.06)', color: 'var(--green-700)',
                border: '1px solid rgba(14,59,46,0.12)',
              }}
            >
              ✓ {t}
            </span>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem', marginTop: 14 }}>
          {trustStrip.caption}
        </p>
      </div>
    </section>
  )
}
