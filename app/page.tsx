import styles from './page.module.css'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'
import Footer from '@/components/Footer'

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
            <span className="mark">ಭೂ</span>
            <span>Bhūmī<small>BENGALURU LAND EXCHANGE</small></span>
          </Link>
          <nav className={styles.quickLinks}>
            <Link href="#featured">Featured</Link>
            <Link href="/marketplace">Marketplace</Link>
          </nav>
        </div>
      </div>

      <div className={styles.hero} id="top">
        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <Link href="/" className="brand">
            <span className="mark">ಭೂ</span><span style={{ color: '#fff' }}>Bhūmī</span>
          </Link>
          <div className={styles.eyebrow}>
            <span className={styles.dot}></span> World-Class Land Marketplace · Bengaluru
          </div>
          <h1 className={styles.heroTitle}>Stop searching land. <em>Start selecting</em> it.</h1>
          <p className={styles.heroDesc}>
            Bengaluru's premium marketplace for large land parcels — for villa & apartment townships, industries,
            resorts, agriculture & land-banking. Every parcel verified, documented, and intelligence-rich.
          </p>
          <div className={styles.cta}>
            <Link className="btn btn-gold" href="/marketplace">Explore the Marketplace →</Link>
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
          <h2 className={styles.bigHeading}>One platform. Every large parcel. <em>Total transparency.</em></h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: '40px' }}>
            Bhūmī consolidates Bengaluru's fragmented large-parcel land market into a single, trustworthy, intelligence-rich marketplace.
          </p>

          <div className={styles.bpGrid}>
            <div className={styles.bpCard}>
              <div className={styles.bpIcon}>◆</div>
              <h3>The Problem</h3>
              <p>Large-parcel buyers (developers, investors, industries) waste weeks hunting across brokers, WhatsApp groups, and vague listings with missing legal, zoning, and spatial data. Trust is low; diligence is slow.</p>
            </div>
            <div className={styles.bpCard}>
              <div className={styles.bpIcon}>✦</div>
              <h3>The Solution</h3>
              <p>A curated, verified inventory where every parcel ships with the 70+ facts that actually decide a deal — extent, title, conversion, zoning, frontage, risk flags, pricing, and suitability for each use-case.</p>
            </div>
            <div className={styles.bpCard}>
              <div className={styles.bpIcon}>▲</div>
              <h3>The Edge</h3>
              <p>A spatial-intelligence layer (growth corridors, upcoming infra, flood & drain buffers) layered on top of listings — so buyers don't just see land, they understand it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className={styles.section} style={{ background: '#0e1511', color: '#fff' }}>
        <div className="wrap">
          <span className={styles.secTag} style={{ color: 'var(--gold-soft)' }}>Market Intelligence</span>
          <h2 className={styles.bigHeading} style={{ color: '#fff' }}>By the <em>numbers.</em></h2>
          <div className={styles.heroStats} style={{ marginTop: '30px' }}>
            <div><div className={styles.heroStatK}>₹4 Lakh Cr+</div><div className={styles.heroStatV}>Projected Market Growth</div></div>
            <div><div className={styles.heroStatK}>14%</div><div className={styles.heroStatV}>Avg YoY Appreciation</div></div>
            <div><div className={styles.heroStatK}>#1</div><div className={styles.heroStatV}>Fastest Growing Tech Hub</div></div>
            <div><div className={styles.heroStatK}>60%</div><div className={styles.heroStatV}>Surge in Logistics Demand</div></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section} style={{ background: 'var(--cream)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="wrap">
          <span className={styles.secTag}>The Bhūmī Standard</span>
          <h2 className={styles.bigHeading}>Built for <em>institutional</em> trust.</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: '48px' }}>
            We've removed the friction, opacity, and risk from large land transactions through technology and rigorous human diligence.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🛡</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '12px', color: 'var(--ink)' }}>100% Verified Inventory</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.6 }}>Every parcel on our exchange ships with a 9-point human-verified legal and physical diligence checklist.</p>
            </div>
            
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🤝</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '12px', color: 'var(--ink)' }}>Direct to Seller</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.6 }}>We eliminate the chain of brokers. We connect institutional buyers directly with genuine landowners.</p>
            </div>
            
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🗺</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '12px', color: 'var(--ink)' }}>Spatial Intelligence</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.6 }}>Our analysts overlay flood zones, upcoming infrastructure, and environmental buffers so you understand the land's true potential.</p>
            </div>
            
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>💎</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '12px', color: 'var(--ink)' }}>Curated Quality</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.6 }}>We reject 80% of submitted properties. Only clear-titled, premium parcels that pass our stringent criteria make it to the exchange.</p>
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
              <Link className="btn btn-primary" href="/marketplace">View all properties in Marketplace →</Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}
