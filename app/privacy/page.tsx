import Link from 'next/link'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import { privacy } from '@/lib/copy/legal'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fdfbf7' }}>
      <header className="topbar">
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Logo theme="light" style={{ height: 40 }} />
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '80px 24px' }}>
        <div className="wrap" style={{ maxWidth: 800 }}>
          <span className="secTag">Legal</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', marginBottom: 16, color: 'var(--ink)' }}>{privacy.title}</h1>
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: 32 }}>{privacy.intro}</p>
          <div style={{ color: 'var(--ink-2)', lineHeight: 1.7, fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: 28 }}>
            {privacy.sections.map((s) => (
              <section key={s.heading}>
                <h2 style={{ color: 'var(--ink)', fontSize: '1.3rem', marginBottom: 8 }}>{s.heading}</h2>
                <p style={{ margin: 0 }}>{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
