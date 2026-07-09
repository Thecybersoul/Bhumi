import styles from './page.module.css'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'

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
            <Link href="/admin/login">Admin</Link>
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

      {featured && featured.length > 0 && (
        <section id="featured" className={styles.section}>
          <div className="wrap">
            <span className={styles.secTag}>Live Inventory</span>
            <h2 className={styles.bigHeading}>Featured <em>Parcels</em>.</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: 40 }}>
              Discover our highly sought-after properties currently available on the market.
            </p>
            
            <div className={styles.featuredGrid}>
              {featured.map(p => (
                <div key={p.id} style={{ pointerEvents: 'none' }}>
                  <PropertyCard property={p} onClick={() => {}} />
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <Link className="btn btn-primary" href="/marketplace">View all properties in Marketplace →</Link>
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <div className="wrap">
          <div className={styles.footerRow}>
            <div>
              <Link href="/" className="brand">
                <span className="mark">ಭೂ</span>
                <span style={{ color: '#fff' }}>Bhūmī<small style={{ color: 'var(--gold-soft)' }}>BENGALURU LAND EXCHANGE</small></span>
              </Link>
              <p style={{ marginTop: 8 }}>Conceptual platform & prototype. Information is illustrative and not a legal or financial offer.</p>
            </div>
            <div style={{ fontSize: '.78rem', color: '#7f8a73' }}>Bengaluru · India · 2026</div>
          </div>
          <div className={styles.fbot}>
            <span>© 2026 Bhūmī</span><span>v1.0</span>
          </div>
        </div>
      </footer>
    </>
  )
}
