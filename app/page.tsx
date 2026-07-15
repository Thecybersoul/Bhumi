import styles from './page.module.css'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

// Force dynamic so we get live featured properties
export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createServiceClient()
  
  // Fetch up to 3 featured live properties
  const { data: featured } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'Live')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <>
      <div className={styles.navstrip}>
        <div className={`wrap ${styles.navstripRow}`}>
          <Link href="/" className="brand">
            <Logo theme="light" style={{ height: '40px' }} />
          </Link>
          <nav className={styles.quickLinks}>
            <Link href="#featured">Featured</Link>
            <Link href="/marketplace">Marketplace</Link>
          </nav>
        </div>
      </div>

      <div className={styles.hero} id="top">
        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '100px', backdropFilter: 'blur(10px)', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Logo theme="dark" style={{ height: '28px' }} />
            </div>
          <div className={styles.eyebrow} style={{ marginTop: '24px' }}>
            <span className={styles.dot}></span> Premium Land Marketplace · Bengaluru
          </div>
          <h1 className={styles.heroTitle}>Stop searching land. <em>Start selecting</em> it.</h1>
          <p className={styles.heroDesc}>
            Bengaluru's top marketplace for large land parcels. Perfect for villa townships, industries,
            resorts, and land-banking. Every property is fully verified and documented.
          </p>
          <div className={styles.cta}>
            <Link className="btn btn-gold" href="/marketplace">Explore the Marketplace →</Link>
            <a href="tel:+918123845749" className="btn btn-outline" style={{ background: '#fff', marginLeft: '12px' }}>Call expert</a>
          </div>
          
          <div className={styles.heroStats}>
            <div>
              <div className={styles.heroStatK}>120+</div>
              <div className={styles.heroStatV}>Verified parcels</div>
            </div>
            <div>
              <div className={styles.heroStatK}>9</div>
              <div className={styles.heroStatV}>Use-case segments</div>
            </div>
            <div>
              <div className={styles.heroStatK}>70+</div>
              <div className={styles.heroStatV}>Facts per parcel</div>
            </div>
            <div>
              <div className={styles.heroStatK}>1</div>
              <div className={styles.heroStatV}>Central exchange</div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition from Blueprint */}
      <section className={styles.section} style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="wrap">
          <span className={styles.secTag}>Why Bhūmī</span>
          <h2 className={styles.bigHeading}>One platform. Clear properties. <em>Total transparency.</em></h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: '40px' }}>
            Bhūmī brings Bengaluru's scattered land market into one trusted place.
          </p>

          <div className={styles.bpGrid}>
            <div className={styles.bpCard}>
              <div className={styles.bpIcon}>◆</div>
              <h3>The Problem</h3>
              <p>Buyers waste weeks dealing with brokers, WhatsApp groups, and incomplete listings missing legal or zoning data. Finding good land is slow and risky.</p>
            </div>
            <div className={styles.bpCard}>
              <div className={styles.bpIcon}>✦</div>
              <h3>The Solution</h3>
              <p>A trusted marketplace where every property comes with the facts you need to make a decision — title, conversion, zoning, pricing, and risk flags.</p>
            </div>
            <div className={styles.bpCard}>
              <div className={styles.bpIcon}>▲</div>
              <h3>The Edge</h3>
              <p>We provide deep insights on every property, showing you growth corridors and upcoming infrastructure so you make the best investment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className={styles.section} style={{ background: '#0e1511', color: '#fff' }}>
        <div className="wrap">
          <span className={styles.secTag} style={{ color: 'var(--gold-soft)' }}>Market Intelligence</span>
          <h2 className={styles.bigHeading} style={{ color: '#fff' }}>Bengaluru by the <em>numbers.</em></h2>
          <div className={styles.heroStats} style={{ marginTop: '30px' }}>
            <div><div className={styles.heroStatK}>₹60K Cr+</div><div className={styles.heroStatV}>Investments in North Bengaluru</div></div>
            <div><div className={styles.heroStatK}>12-15%</div><div className={styles.heroStatV}>Avg YoY Land Appreciation</div></div>
            <div><div className={styles.heroStatK}>400+</div><div className={styles.heroStatV}>Global GCCs driving demand</div></div>
            <div><div className={styles.heroStatK}>280 km</div><div className={styles.heroStatV}>STRR connecting growth corridors</div></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section} style={{ background: 'var(--cream)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="wrap">
          <span className={styles.secTag}>The Bhūmī Standard</span>
          <h2 className={styles.bigHeading}>Built for <em>trust.</em></h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: '48px' }}>
            We've removed the friction and risk from large land transactions through rigorous human diligence.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🛡</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '12px', color: 'var(--ink)' }}>100% Verified Inventory</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.6 }}>Every property comes with a 9-point physical and legal checklist checked by our experts.</p>
            </div>
            
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🤝</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '12px', color: 'var(--ink)' }}>Direct to Seller</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.6 }}>No middle brokers. We connect buyers directly with genuine landowners.</p>
            </div>
            
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>💎</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '12px', color: 'var(--ink)' }}>Curated Quality</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.6 }}>We reject 80% of submitted properties. Only premium, clear-titled lands make it to our platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section id="featured" className={styles.section} style={{ background: '#fdfbf7' }}>
          <div className="wrap">
            <span className={styles.secTag}>Live Inventory</span>
            <h2 className={styles.bigHeading}>Featured <em>Parcels</em>.</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: 40 }}>
              Discover our highly sought-after properties currently available on the market.
            </p>
            
            <div className={styles.featuredGrid}>
              {featured.map(p => (
                <div key={p.id} style={{ pointerEvents: 'none' }}>
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <Link className="btn btn-primary" href="/marketplace" style={{ marginRight: '16px' }}>View all properties in Marketplace →</Link>
              <a href="tel:+918123845749" className="btn btn-outline">Call expert</a>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}
