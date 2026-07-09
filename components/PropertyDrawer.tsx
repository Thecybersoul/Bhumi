'use client'
import { useState } from 'react'
import { Property } from '@/lib/types'
import VerificationPanel from '@/components/VerificationPanel'
import styles from './PropertyDrawer.module.css'

interface Props {
  property: Property
  open: boolean
  onClose: () => void
  onEnquire: (intent: 'Enquire' | 'Visit') => void
}

export default function PropertyDrawer({ property: p, open, onClose, onEnquire }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [intent, setIntent] = useState<'Enquire' | 'Visit'>('Enquire')
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, property_id: p.id, intent, source: 'Website' })
    })
    setSubmitting(false)
    setShowForm(false)
    onEnquire(intent)
  }

  const totalCr = (p.extent_acres * p.price_per_acre_cr).toFixed(1)

  const rows = [
    { label: 'Land Use', val: p.land_use },
    { label: 'Use Cases', val: p.use_cases.join(', ') },
    { label: 'Road Access', val: p.road_type || '—' },
    { label: 'Topography', val: p.topo },
    { label: 'Soil Type', val: p.soil || '—' },
    { label: 'Water', val: p.water || '—' },
    { label: 'DC Conversion', val: p.conversion },
    { label: 'Ownership', val: p.ownership },
    { label: 'Title', val: p.title_clear ? '✓ Clear' : 'Under review' },
    { label: 'Risk', val: p.risk },
    { label: 'Distance to Airport', val: `${p.dist_airport_km} km` },
    { label: 'Distance to City', val: `${p.dist_city_km} km` },
  ]

  return (
    <div className={`drawer ${open ? 'open' : ''}`}>
      <div className="drawer-head">
        <span className={styles.code}>{p.code}</span>
        <button className="btn btn-icon btn-ghost" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="drawer-body">
        {/* Hero image */}
        <div className={styles.hero} style={{
          background: `linear-gradient(180deg, transparent 40%, rgba(8,28,22,.8)), url(${p.img_url}) center/cover`
        }}>
          <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
        </div>

        <div className={styles.content}>
          {/* Header */}
          <div className={styles.head}>
            <div className={styles.zone}>{p.zone} Bengaluru · {p.location}</div>
            <h2 className={styles.title}>{p.title}</h2>
            <div className={styles.priceRow}>
              <div>
                <div className={styles.priceMain}>₹{p.price_per_acre_cr} Cr <span>/ acre</span></div>
                <div className={styles.priceSub}>₹{totalCr} Cr total · {p.price_type}</div>
              </div>
              <div className={styles.extentBadge}>{p.extent_acres} acres</div>
            </div>
          </div>

          {/* Quick stats */}
          <div className={styles.quickStats}>
            {[
              { k: p.extent_acres, u: 'ac', l: 'Extent' },
              { k: `${p.dist_airport_km}km`, u: '', l: 'Airport' },
              { k: p.conn_score, u: '/100', l: 'Connectivity' },
              { k: p.risk, u: '', l: 'Risk' },
            ].map(s => (
              <div key={s.l} className={styles.quickStat}>
                <div className={styles.quickStatVal}>{s.k}<small>{s.u}</small></div>
                <div className={styles.quickStatLbl}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {p.description && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Overview</div>
              <p className={styles.desc}>{p.description}</p>
            </div>
          )}

          {/* Amenities */}
          {p.amenities && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Nearby Landmarks</div>
              <p className={styles.desc}>{p.amenities}</p>
            </div>
          )}

          {/* Details table */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Property Details</div>
            <div className={styles.detailsTable}>
              {rows.map(r => (
                <div key={r.label} className={styles.detailRow}>
                  <span className={styles.detailKey}>{r.label}</span>
                  <span className={styles.detailVal}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk notes */}
          {p.risk_notes && (
            <div className={styles.riskBox}>
              <span className={styles.riskIcon}>⚠</span>
              <span>{p.risk_notes}</span>
            </div>
          )}

          {/* Verification Panel */}
          <VerificationPanel propertyId={p.id} />
        </div>
      </div>

      {/* Bottom CTA bar */}
      <div className={styles.ctas}>
        {!showForm ? (
          <>
            <button className="btn btn-ghost" style={{flex:1}} onClick={() => { setIntent('Visit'); setShowForm(true) }}>
              📍 Request Site Visit
            </button>
            <button className="btn btn-primary" style={{flex:1}} onClick={() => { setIntent('Enquire'); setShowForm(true) }}>
              Enquire Now →
            </button>
          </>
        ) : (
          <form className={styles.enquiryForm} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className="form-group">
                <label>Full Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="Organisation" />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className="form-group">
                <label>Phone *</label>
                <input required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 " />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" />
              </div>
            </div>
            {intent === 'Enquire' ? (
              <div className="form-group">
                <label>Message</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="What would you like to know?" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }} />
              </div>
            ) : (
              <div className="form-group">
                <label>Preferred Date & Time</label>
                <input type="datetime-local" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }} />
              </div>
            )}
            <div className={styles.formActions}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : intent === 'Visit' ? 'Request Site Visit' : 'Submit Enquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
