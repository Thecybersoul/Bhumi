import Link from 'next/link'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

export default function PrivacyPage() {
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
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', marginBottom: 32, color: 'var(--ink)' }}>Privacy Policy</h1>
          <div style={{ color: 'var(--ink-2)', lineHeight: 1.7, fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p>At Bhūmī, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.</p>
            
            <h2 style={{ color: 'var(--ink)', fontSize: '1.4rem', marginTop: 16 }}>1. Information We Collect</h2>
            <p>When you submit an enquiry, schedule a site visit, or sign up for our newsletter, we collect personal details such as your name, email address, phone number, and any specific requirements or preferences you provide.</p>
            
            <h2 style={{ color: 'var(--ink)', fontSize: '1.4rem', marginTop: 16 }}>2. How We Use Your Information</h2>
            <p>Your information is primarily used to process your enquiries, connect you with our land experts, and provide tailored property recommendations. We may also use your contact details to send updates regarding the Bengaluru land market, which you can opt-out of at any time.</p>
            
            <h2 style={{ color: 'var(--ink)', fontSize: '1.4rem', marginTop: 16 }}>3. Data Protection</h2>
            <p>We implement robust security measures to ensure your data is protected against unauthorized access, alteration, or disclosure. We do not sell your personal data to third parties.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
