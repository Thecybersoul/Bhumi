'use client'
import { useEffect, useState, useCallback } from 'react'
import { Property } from '@/lib/types'
import PropertyCard from '@/components/PropertyCard'
import PropertyDrawer from '@/components/PropertyDrawer'
import SellFormModal from '@/components/SellFormModal'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import styles from './marketplace.module.css'

const SEGMENTS = ['Residential', 'Commercial', 'Industrial', 'Agricultural']
const USE_CASES = ['Township', 'Villa', 'Resort', 'Industrial', 'Agriculture', 'Land-banking']
const ZONES = ['North', 'East', 'South', 'West']

export default function MarketplacePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Property | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [sellModalOpen, setSellModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('')
  const [zone, setZone] = useState('')
  const [useCase, setUseCase] = useState('')
  const [minAcres, setMinAcres] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(data => { setProperties(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const openDrawer = (p: Property) => {
    setSelected(p)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelected(null), 300)
  }

  const filtered = properties.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.location.toLowerCase().includes(search.toLowerCase())) return false
    if (segment && p.land_use !== segment) return false
    if (zone && p.zone !== zone) return false
    if (useCase && !p.use_cases.includes(useCase)) return false
    if (minAcres && p.extent_acres < parseFloat(minAcres)) return false
    if (maxPrice && p.price_per_acre_cr > parseFloat(maxPrice)) return false
    return true
  })

  const clearFilters = () => {
    setSearch(''); setSegment(''); setZone(''); setUseCase(''); setMinAcres(''); setMaxPrice('')
  }

  let activeFilters = 0
  if (segment) activeFilters++
  if (zone) activeFilters++
  if (useCase) activeFilters++
  if (minAcres) activeFilters++
  if (maxPrice) activeFilters++

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className="topbar">
        <div className={`wrap topbar-inner`}>
          <Link href="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <Logo variant="icon" theme="light" style={{ transform: 'scale(0.8)' }} />
            <span>Bhumi Estates<small>BENGALURU LAND EXCHANGE</small></span>
          </Link>
          <nav className="topbar-nav">
            <button className="btn btn-ghost" onClick={() => setSellModalOpen(true)}>
              List Your Land
            </button>
          </nav>
          <button className="btn btn-gold" onClick={() => showToast('Our team will contact you shortly.')}>
            Talk to Expert
          </button>
        </div>
      </header>

      <div className={styles.shell}>
        {/* Mobile Filter Toggle */}
        <div className={styles.mobileFilterToggle} onClick={() => setMobileFilterOpen(true)}>
          <span>Filter Properties {activeFilters > 0 && `(${activeFilters})`}</span>
          <span>☰</span>
        </div>

        {/* Mobile Filter Overlay */}
        {mobileFilterOpen && (
          <div className="overlay" style={{ zIndex: 90 }} onClick={() => setMobileFilterOpen(false)} />
        )}

        {/* Sidebar Filters */}
        <aside className={`${styles.sidebar} ${mobileFilterOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.filterHead}>
            <span className={styles.filterTitle}>Filters</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {activeFilters > 0 && (
                <button className="btn btn-sm btn-ghost" onClick={clearFilters}>
                  Clear {activeFilters}
                </button>
              )}
              <button 
                className={`btn btn-sm btn-ghost ${styles.mobileOnly}`} 
                onClick={() => setMobileFilterOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <label className={styles.filterLabel}>Search</label>
            <input
              className={styles.filterInput}
              type="text"
              placeholder="Location or title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterSection}>
            <label className={styles.filterLabel}>Segment</label>
            <div className={styles.filterChips}>
              {SEGMENTS.map(s => (
                <button
                  key={s}
                  className={`${styles.filterChip} ${segment === s ? styles.filterChipActive : ''}`}
                  onClick={() => setSegment(segment === s ? '' : s)}
                >{s}</button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <label className={styles.filterLabel}>Zone</label>
            <div className={styles.filterChips}>
              {ZONES.map(z => (
                <button
                  key={z}
                  className={`${styles.filterChip} ${zone === z ? styles.filterChipActive : ''}`}
                  onClick={() => setZone(zone === z ? '' : z)}
                >{z}</button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <label className={styles.filterLabel}>Use Case</label>
            <div className={styles.filterChips}>
              {USE_CASES.map(u => (
                <button
                  key={u}
                  className={`${styles.filterChip} ${useCase === u ? styles.filterChipActive : ''}`}
                  onClick={() => setUseCase(useCase === u ? '' : u)}
                >{u}</button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <label className={styles.filterLabel}>Min. Extent (acres)</label>
            <input
              className={styles.filterInput}
              type="number"
              placeholder="e.g. 20"
              value={minAcres}
              onChange={e => setMinAcres(e.target.value)}
            />
          </div>

          <div className={styles.filterSection}>
            <label className={styles.filterLabel}>Max Price (₹ Cr/acre)</label>
            <input
              className={styles.filterInput}
              type="number"
              placeholder="e.g. 10"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
            />
          </div>

          <div className={styles.filterStats}>
            <span className={styles.resultCount}>{filtered.length} parcels</span>
          </div>
        </aside>

        {/* Main content */}
        <main className={styles.main}>
          <div className={styles.insightsBanner}>
            <div className={styles.insightsTitle}>Market Intelligence</div>
            <p><strong>78%</strong> of new large-scale developments in North Bengaluru are currently zoned for logistics and industrial parks. Prices in the Devanahalli corridor have appreciated 14% YoY.</p>
          </div>
          
          {loading ? (
            <div className={styles.loading}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No properties match your filters</h3>
              <p>Try adjusting or clearing your search criteria</p>
              <button className="btn btn-ghost" style={{marginTop: 16}} onClick={clearFilters}>Clear all filters</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(p => (
                <PropertyCard key={p.id} property={p} onClick={() => openDrawer(p)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Property Detail Drawer */}
      {drawerOpen && selected && (
        <>
          <div className="overlay" onClick={closeDrawer} />
          <PropertyDrawer
            property={selected}
            open={drawerOpen}
            onClose={closeDrawer}
            onEnquire={(intent) => {
              showToast(`${intent === 'Visit' ? 'Site visit' : 'Enquiry'} submitted — our team will reach out shortly.`)
            }}
          />
        </>
      )}

      {/* Sell Modal */}
      {sellModalOpen && (
        <SellFormModal 
          onClose={() => setSellModalOpen(false)}
          onSubmit={() => {
            setSellModalOpen(false)
            showToast('Listing request submitted. Our team will contact you for verification.')
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-wrap">
          <div className="toast">✓ {toast}</div>
        </div>
      )}

      <Footer />
    </div>
  )
}
