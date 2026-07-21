import styles from './page.module.css'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import Hero from '@/components/home/Hero'
import FeatureRow from '@/components/home/FeatureRow'
import TrustStrip from '@/components/home/TrustStrip'
import TestimonialGrid from '@/components/home/TestimonialGrid'
import Faq from '@/components/home/Faq'
import InsightTeaser from '@/components/home/InsightTeaser'
import { features } from '@/lib/copy/home'

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
      <Hero />

      {features.map((f, i) => (
        <FeatureRow key={f.title.italic} feature={f} index={i} />
      ))}

      <TrustStrip />

      {/* Featured parcels */}
      {featured && featured.length > 0 && (
        <section id="featured" className={styles.section} style={{ background: '#fdfbf7' }}>
          <div className="wrap">
            <span className={styles.secTag}>Live Inventory</span>
            <h2 className={styles.bigHeading}>This week's <em>verified parcels.</em></h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '1.04rem', maxWidth: '60ch', marginBottom: 40 }}>
              Hand-picked from across the verified parcels currently on the platform. New listings every Tuesday.
            </p>
            <div className={styles.featuredGrid}>
              {featured.map(p => (
                <div key={p.id} style={{ pointerEvents: 'none' }}>
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <Link className="btn btn-primary" href="/marketplace" style={{ marginRight: '16px' }}>View all parcels in the Marketplace →</Link>
              <a href="tel:+918123845749" className="btn btn-outline">Call a land expert</a>
            </div>
          </div>
        </section>
      )}

      <Faq />
      <InsightTeaser />
      <Footer />
    </>
  )
}
