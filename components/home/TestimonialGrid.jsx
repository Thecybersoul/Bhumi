import { testimonials } from '@/lib/copy/home'

export default function TestimonialGrid() {
  return (
    <section style={{ background: '#fff', padding: '80px 0' }}>
      <div className="wrap">
        <span className="secTag">{testimonials.eyebrow}</span>
        <h2 className="bigHeading">
          {testimonials.title.before} <em>{testimonials.title.italic}</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 36 }}>
          {testimonials.items.map((t) => (
            <figure
              key={t.name}
              style={{
                background: '#fdfbf7', border: '1px solid var(--line)', borderRadius: 16,
                padding: 28, display: 'flex', flexDirection: 'column', gap: 18,
              }}
            >
              <blockquote style={{ fontFamily: 'var(--serif)', fontSize: '1.08rem', lineHeight: 1.55, color: 'var(--ink)', margin: 0 }}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption style={{ fontSize: '.86rem', color: 'var(--ink-2)' }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.name}</div>
                <div>{t.role}</div>
                <div style={{ color: 'var(--muted)', marginTop: 2 }}>{t.meta}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
