'use client'

import { faq } from '@/lib/copy/home'

export default function Faq() {
  return (
    <section style={{ background: 'var(--cream)', padding: '80px 0' }}>
      <div className="wrap" style={{ maxWidth: 880 }}>
        <span className="secTag">{faq.eyebrow}</span>
        <h2 className="bigHeading">
          {faq.title.before} <em>{faq.title.italic}</em>
        </h2>
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faq.items.map((item) => (
            <details
              key={item.q}
              style={{
                background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
                padding: '18px 22px', transition: '.15s',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer', fontWeight: 600, color: 'var(--ink)',
                  fontSize: '1rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                }}
              >
                {item.q}
                <span style={{ color: 'var(--gold)', fontSize: '1.2rem', flexShrink: 0 }}>+</span>
              </summary>
              <p style={{ color: 'var(--ink-2)', fontSize: '.95rem', lineHeight: 1.7, marginTop: 14 }}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
