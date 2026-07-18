import Link from 'next/link'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

export default function InsightsPlaceholder() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fdfbf7' }}>
      <header className="topbar">
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Logo theme="light" style={{ height: 40 }} />
          </Link>
          <Link href="/marketplace" className="btn btn-ghost btn-sm">Browse Marketplace</Link>
        </div>
      </header>
      <main style={{ flex: 1, padding: '120px 24px' }}>
        <div className="wrap" style={{ maxWidth: 720, textAlign: 'center' }}>
          <span className="secTag">Insights</span>
          <h1 className="bigHeading" style={{ margin: '16px auto 24px' }}>
            The first report lands <em>in two weeks.</em>
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: '1.1rem', lineHeight: 1.7 }}>
            We're writing up the Devanahalli corridor, Sarjapur lake-effect pricing, and Hoskote's industrial gravity shift.
            Sign up via the marketplace intel banner — it's the fastest way to get notified.
          </p>
          <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/marketplace">See live inventory →</Link>
            <a className="btn btn-gold" href="https://wa.me/918123845749">Get notified on WhatsApp</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
