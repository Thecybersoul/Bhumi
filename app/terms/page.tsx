import Link from 'next/link'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fdfbf7' }}>
      <header className="topbar">
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderBottom: '1px solid var(--line)' }}>
          <Link href="/" className="brand" style={{display: 'inline-flex', alignItems: 'center'}}>
            <Logo theme="light" style={{ height: '40px' }} />
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '80px 24px' }}>
        <div className="wrap" style={{ maxWidth: 800 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', marginBottom: 32, color: 'var(--ink)' }}>Terms & Conditions</h1>
          <div style={{ color: 'var(--ink-2)', lineHeight: 1.7, fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p>Welcome to Bhūmī. By accessing or using our platform, you agree to comply with and be bound by the following terms and conditions.</p>
            
            <h2 style={{ color: 'var(--ink)', fontSize: '1.4rem', marginTop: 16 }}>1. Use of the Platform</h2>
            <p>Bhūmī is a premium marketplace for large land parcels. The information provided on this platform is for illustrative and informational purposes only. It does not constitute a legal, financial, or binding offer. Users must conduct their own due diligence before entering into any transactions.</p>
            
            <h2 style={{ color: 'var(--ink)', fontSize: '1.4rem', marginTop: 16 }}>2. Verification & Accuracy</h2>
            <p>While we strive to provide accurate information regarding land extent, zoning, and title status, Bhūmī does not guarantee the absolute accuracy or completeness of the data. Spatial intelligence and risk flags are indicative.</p>
            
            <h2 style={{ color: 'var(--ink)', fontSize: '1.4rem', marginTop: 16 }}>3. Enquiries & Transactions</h2>
            <p>Submitting an enquiry or scheduling a site visit through the platform does not create a binding contract. All transactions are subject to formal legal documentation, verification, and offline execution.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
