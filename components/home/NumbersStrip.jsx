'use client'

import { numbersStrip } from '@/lib/copy/home'

export default function NumbersStrip() {
  const n = numbersStrip
  return (
    <section style={{ background: '#0e1511', color: '#fff', padding: '72px 0' }}>
      <div className="wrap">
        <span className="secTag" style={{ color: 'var(--gold-soft)' }}>{n.eyebrow}</span>
        <h2 className="bigHeading" style={{ color: '#fff' }}>
          {n.title.before} <em style={{ color: 'var(--gold-soft)' }}>{n.title.italic}</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginTop: 36 }}>
          {n.items.map((it) => (
            <div key={it.key} style={{ borderLeft: '1px solid rgba(255,255,255,.18)', paddingLeft: 18 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', fontWeight: 600, lineHeight: 1 }}>{it.key}</div>
              <div style={{ color: '#b9c4bd', fontSize: '.88rem', marginTop: 8, lineHeight: 1.5 }}>{it.value}</div>
            </div>
          ))}
        </div>
        <p style={{ color: '#7d8a82', fontSize: '.78rem', marginTop: 28 }}>{n.source}</p>
      </div>
    </section>
  )
}
