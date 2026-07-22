import Link from 'next/link'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import styles from './Insights.module.css'

const reports = [
  {
    title: 'The Devanahalli Corridor: A 2026 Perspective',
    date: 'Jul 10, 2026',
    readTime: '6 min read',
    excerpt: 'An in-depth analysis of the northward growth vector. With the upcoming infrastructure upgrades, how is land value reacting along the airport corridor?',
    tag: 'Market Report'
  },
  {
    title: 'Sarjapur & The Lake-Effect Pricing',
    date: 'Jul 02, 2026',
    readTime: '4 min read',
    excerpt: 'How proximity to rejuvenated water bodies in East Bengaluru is creating micro-markets with outsized appreciation potentials.',
    tag: 'Valuation'
  },
  {
    title: 'Hoskote: The Logistics Gravity Shift',
    date: 'Jun 18, 2026',
    readTime: '5 min read',
    excerpt: 'Tracking the eastward migration of warehousing and industrial parks. A look at the key junctions driving the next wave of commercial land demand.',
    tag: 'Industrial'
  }
]

export default function InsightsPage() {
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
      
      <main style={{ flex: 1, padding: '100px 24px' }}>
        <div className="wrap">
          <div style={{ maxWidth: 720, marginBottom: 60 }}>
            <span className="secTag">Insights</span>
            <h1 className="bigHeading" style={{ margin: '16px 0 24px' }}>
              Market intel for <em>smarter land decisions.</em>
            </h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              Deep dives into Bengaluru's evolving micro-markets, infrastructure shifts, and valuation metrics.
            </p>
          </div>

          <div className={styles.grid}>
            {reports.map((report, idx) => (
              <div key={idx} className={styles.card}>
                <div className={styles.meta}>
                  <span className={styles.tag}>{report.tag}</span>
                  <span className={styles.time}>{report.date} · {report.readTime}</span>
                </div>
                <h3 className={styles.cardTitle}>{report.title}</h3>
                <p className={styles.cardExcerpt}>{report.excerpt}</p>
                <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                  <a href="#" className={styles.readMore}>Read Report →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
