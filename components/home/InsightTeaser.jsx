import Link from 'next/link'
import { insightsTeaser } from '@/lib/copy/home'

const PLACEHOLDER = [
  { slug: 'devanahalli-corridor', title: 'Devanahalli corridor: 14% YoY appreciation, driven by KIADB aerospace SEZ and STRR', tag: 'Micro-market' },
  { slug: 'sarjapur-the-lake-effect', title: 'Sarjapur: how lake-adjacent parcels command 18–25% premiums over dry-land equivalents', tag: 'Pricing' },
  { slug: 'hoskote-the-logistics-belt', title: "Hoskote is Bengaluru's next industrial gravity well", tag: 'Infrastructure' },
]

export default function InsightTeaser() {
  return (
    <section style={{ background: '#fff', padding: '80px 0' }}>
      <div className="wrap">
        <span className="secTag">{insightsTeaser.eyebrow}</span>
        <h2 className="bigHeading">
          {insightsTeaser.title.before} <em>{insightsTeaser.title.italic}</em>
        </h2>
        <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: 40 }}>
          {insightsTeaser.subhead}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {PLACEHOLDER.map((p) => (
            <Link
              key={p.slug}
              href={`/insights/${p.slug}`}
              style={{
                display: 'block', padding: 28, background: '#fdfbf7', border: '1px solid var(--line)',
                borderRadius: 16, transition: '.2s',
              }}
            >
              <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                {p.tag}
              </div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', color: 'var(--ink)', marginTop: 10, lineHeight: 1.35 }}>
                {p.title}
              </h3>
              <div style={{ color: 'var(--green-700)', fontWeight: 600, fontSize: '.88rem', marginTop: 16 }}>Read report →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
