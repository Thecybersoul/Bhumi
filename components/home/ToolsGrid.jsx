import Link from 'next/link'
import { tools } from '@/lib/copy/home'

export default function ToolsGrid() {
  return (
    <section style={{ background: 'var(--cream)', padding: '80px 0' }}>
      <div className="wrap">
        <span className="secTag">{tools.eyebrow}</span>
        <h2 className="bigHeading">
          {tools.title.before} <em>{tools.title.italic}</em>
        </h2>
        <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: 40 }}>
          Three free tools that turn Bengaluru land research from a 3-week slog into a 3-minute read.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {tools.cards.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              style={{
                display: 'block', background: '#fff', borderRadius: 18, padding: 32,
                border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)',
                transition: '.2s',
              }}
              className="tool-card"
            >
              <div style={{ fontSize: '2rem', marginBottom: 14 }}>{t.icon}</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: 10, color: 'var(--ink)' }}>{t.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.92rem', lineHeight: 1.6 }}>{t.desc}</p>
              <div style={{ marginTop: 18, color: 'var(--green-700)', fontWeight: 600, fontSize: '.88rem' }}>
                {t.cta} →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
