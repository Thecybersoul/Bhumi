'use client'
import { useState, useEffect } from 'react'
import { Property } from '@/lib/types'
import styles from './PropertyModal.module.css'

const USE_CASE_OPTIONS = ['Township', 'Villa', 'Resort', 'Industrial', 'Agriculture', 'Land-banking', 'Commercial', 'IT/Tech Park']

interface Props {
  property: Property | null
  onSave: (data: Partial<Property>) => Promise<void>
  onClose: () => void
}

const DEFAULTS: Partial<Property> = {
  code: '', title: '', location: '', zone: 'North', status: 'Live', price_type: 'Negotiable',
  extent_acres: 20, price_per_acre_cr: 5, land_use: 'Residential', use_cases: [],
  road_type: '', dist_airport_km: 30, dist_city_km: 30, topo: 'Flat', soil: '',
  water: '', conversion: 'Not converted', ownership: 'Single owner', title_clear: true,
  risk: 'Low', risk_notes: '', description: '', amenities: '', img_url: '/img/p1.jpg',
  featured: false, conn_score: 70
}

export default function PropertyModal({ property, onSave, onClose }: Props) {
  const [form, setForm] = useState<Partial<Property>>({ ...DEFAULTS, ...(property || {}) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({ ...DEFAULTS, ...(property || {}) })
  }, [property])

  const set = (key: keyof Property, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const toggleUseCase = (uc: string) => {
    const current = form.use_cases || []
    set('use_cases', current.includes(uc) ? current.filter(u => u !== uc) : [...current, uc])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.code || !form.title || !form.location) {
      setError('Code, Title and Location are required.'); return
    }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal">
        <div className="modal-box">
          <div className="modal-head">
            <h2>{property ? 'Edit Property' : 'Add New Property'}</h2>
            <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
          </div>

          <form className="modal-body" onSubmit={handleSubmit}>
            {/* Identity */}
            <div className="form-grid cols3">
              <div className="form-section-title">Identity</div>
              <div className="form-group">
                <label>Property Code *</label>
                <input placeholder="BLR-1000" value={form.code || ''} onChange={e => set('code', e.target.value)} required />
              </div>
              <div className="form-group span2">
                <label>Property Title *</label>
                <input placeholder="68 Acres NH-44 Frontage Land" value={form.title || ''} onChange={e => set('title', e.target.value)} required />
              </div>
            </div>

            {/* Location */}
            <div className="form-grid cols3" style={{marginTop: 8}}>
              <div className="form-section-title">Location</div>
              <div className="form-group span2">
                <label>Location *</label>
                <input placeholder="Devanahalli" value={form.location || ''} onChange={e => set('location', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Zone</label>
                <select value={form.zone || 'North'} onChange={e => set('zone', e.target.value)}>
                  {['North', 'East', 'South', 'West'].map(z => <option key={z}>{z}</option>)}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="form-grid" style={{marginTop: 8}}>
              <div className="form-section-title">Pricing & Status</div>
              <div className="form-group">
                <label>Extent (acres)</label>
                <input type="number" step="0.01" min="0" value={form.extent_acres || ''} onChange={e => set('extent_acres', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Price (₹ Cr / acre)</label>
                <input type="number" step="0.001" min="0" value={form.price_per_acre_cr || ''} onChange={e => set('price_per_acre_cr', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Price Type</label>
                <select value={form.price_type || 'Negotiable'} onChange={e => set('price_type', e.target.value)}>
                  {['Fixed', 'Negotiable', 'On Request'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status || 'Live'} onChange={e => set('status', e.target.value)}>
                  {['Live', 'Reserved', 'Sold'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Use */}
            <div className="form-grid cols1" style={{marginTop: 8}}>
              <div className="form-section-title">Land Use & Use Cases</div>
              <div className="form-group">
                <label>Land Use</label>
                <input placeholder="Residential / Mixed" value={form.land_use || ''} onChange={e => set('land_use', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Use Cases</label>
                <div className="chips">
                  {USE_CASE_OPTIONS.map(uc => (
                    <button
                      type="button" key={uc}
                      className={`chip ${(form.use_cases || []).includes(uc) ? 'selected' : ''}`}
                      onClick={() => toggleUseCase(uc)}
                    >{uc}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Physical */}
            <div className="form-grid cols3" style={{marginTop: 8}}>
              <div className="form-section-title">Physical Characteristics</div>
              <div className="form-group">
                <label>Road Type</label>
                <input placeholder="NH frontage, 60ft road…" value={form.road_type || ''} onChange={e => set('road_type', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Topography</label>
                <input placeholder="Flat / Gently sloping…" value={form.topo || ''} onChange={e => set('topo', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Soil Type</label>
                <input placeholder="Red loam, Rocky…" value={form.soil || ''} onChange={e => set('soil', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Water Source</label>
                <input placeholder="Borewell, Canal…" value={form.water || ''} onChange={e => set('water', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Dist. Airport (km)</label>
                <input type="number" value={form.dist_airport_km || ''} onChange={e => set('dist_airport_km', parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Dist. City Centre (km)</label>
                <input type="number" value={form.dist_city_km || ''} onChange={e => set('dist_city_km', parseInt(e.target.value))} />
              </div>
            </div>

            {/* Legal */}
            <div className="form-grid" style={{marginTop: 8}}>
              <div className="form-section-title">Legal & Ownership</div>
              <div className="form-group">
                <label>DC Conversion</label>
                <input placeholder="Converted / Not converted" value={form.conversion || ''} onChange={e => set('conversion', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Ownership Type</label>
                <input placeholder="Single owner, Agreement holder…" value={form.ownership || ''} onChange={e => set('ownership', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Risk Level</label>
                <select value={form.risk || 'Low'} onChange={e => set('risk', e.target.value)}>
                  {['Low', 'Moderate', 'High'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Title Status</label>
                <select value={form.title_clear ? 'Clear' : 'Under review'} onChange={e => set('title_clear', e.target.value === 'Clear')}>
                  <option>Clear</option>
                  <option>Under review</option>
                </select>
              </div>
              <div className="form-group span2">
                <label>Risk Notes</label>
                <input placeholder="Any buffers, disputes, notes…" value={form.risk_notes || ''} onChange={e => set('risk_notes', e.target.value)} />
              </div>
            </div>

            {/* Details */}
            <div className="form-grid cols1" style={{marginTop: 8}}>
              <div className="form-section-title">Description & Media</div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="Property overview…" value={form.description || ''} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nearby Landmarks / Amenities</label>
                <textarea rows={2} placeholder="Airport 15km · Metro planned · IT parks…" value={form.amenities || ''} onChange={e => set('amenities', e.target.value)} />
              </div>
            </div>

            <div className="form-grid cols3" style={{marginTop: 8}}>
              <div className="form-group">
                <label>Image URL</label>
                <input placeholder="/img/p1.jpg" value={form.img_url || ''} onChange={e => set('img_url', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Connectivity Score (/100)</label>
                <input type="number" min="0" max="100" value={form.conn_score || 70} onChange={e => set('conn_score', parseInt(e.target.value))} />
              </div>
              <div className="form-group" style={{justifyContent: 'flex-end'}}>
                <label>Featured</label>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </div>

            {error && <div className={styles.formError}>{error}</div>}
          </form>

          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : property ? 'Save Changes' : 'Add Property'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
