'use client'

import Link from 'next/link'

const ICONS = {
  shield: (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 17l-4 4-3-3 4-4M11 17l3-3 4 4-3 3M11 17l3-3M8 14l3-3 3 3" />
      <path d="M16 7l4 4M19 4l-3 3" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 12l10 5 10-5M2 17l10 5 10-5" />
    </svg>
  ),
}

export default function FeatureRow({ feature, index }) {
  const reversed = index % 2 === 1
  return (
    <section
      style={{
        background: index === 0 ? '#fff' : '#fdfbf7',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '80px 0',
      }}
    >
      <div className="wrap">
        <div
          className="feature-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 56,
            alignItems: 'center',
            flexDirection: reversed ? 'row-reverse' : 'row',
          }}
        >
          <div>
            <span className="secTag">{feature.eyebrow}</span>
            <h2 className="bigHeading">
              {feature.title.before} <em>{feature.title.italic}</em>
            </h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', lineHeight: 1.7, maxWidth: '52ch' }}>
              {feature.body}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 28px', display: 'grid', gap: 10 }}>
              {feature.bullets.map((b) => (
                <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--ink-2)', fontSize: '.96rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, lineHeight: 1.4 }}>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Link href={feature.cta.href} style={{ color: 'var(--green-700)', fontWeight: 600, fontSize: '.95rem' }}>
              {feature.cta.label}
            </Link>
          </div>

          <div
            style={{
              aspectRatio: '4 / 3',
              borderRadius: 20,
              background: 'linear-gradient(150deg, rgba(14,59,46,0.04), rgba(194,151,74,0.08))',
              border: '1px solid var(--line)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--green-700)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {feature.image ? (
              <img src={feature.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ padding: 40 }}>{ICONS[feature.icon] || ICONS.shield}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
