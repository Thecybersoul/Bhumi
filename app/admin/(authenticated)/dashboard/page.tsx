'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Property, Enquiry } from '@/lib/types'
import PropertyModal from '@/components/PropertyModal'
import styles from './dashboard.module.css'

type Tab = 'properties' | 'enquiries' | 'analytics'
type Stage = 'New' | 'Contacted' | 'Visit'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('properties')
  const [properties, setProperties] = useState<Property[]>([])
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProp, setEditProp] = useState<Property | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [leadFilter, setLeadFilter] = useState<Stage | ''>('')
  const [propFilter, setPropFilter] = useState('')
  const [delConfirm, setDelConfirm] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const loadData = useCallback(async () => {
    const [propsRes, enqRes] = await Promise.all([
      fetch('/api/properties?admin=1'),
      fetch('/api/enquiries')
    ])
    const [propsData, enqData] = await Promise.all([propsRes.json(), enqRes.json()])
    setProperties(propsData)
    setEnquiries(enqData)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const handleSave = async (data: Partial<Property>) => {
    const method = editProp ? 'PUT' : 'POST'
    const url = editProp ? `/api/properties/${editProp.id}` : '/api/properties'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) { showToast('Error saving property'); return }
    setShowModal(false)
    setEditProp(null)
    loadData()
    showToast(editProp ? 'Property updated' : 'Property added')
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Error deleting property'); return }
    setDelConfirm(null)
    loadData()
    showToast('Property deleted')
  }

  const handleAdvanceStage = async (enquiry: Enquiry) => {
    const STAGES: Stage[] = ['New', 'Contacted', 'Visit']
    const current = STAGES.indexOf(enquiry.stage as Stage)
    if (current === STAGES.length - 1) return
    const nextStage = STAGES[current + 1]
    await fetch(`/api/enquiries?id=${enquiry.id}&stage=${nextStage}`, { method: 'PATCH' })
    loadData()
    showToast(`Lead advanced to ${nextStage}`)
  }

  // Analytics
  const liveCount = properties.filter(p => p.status === 'Live').length
  const totalAcres = properties.reduce((s, p) => s + p.extent_acres, 0)
  const totalValue = properties.reduce((s, p) => s + p.extent_acres * p.price_per_acre_cr, 0)
  const newLeads = enquiries.filter(e => e.stage === 'New').length
  const filteredEnqs = leadFilter ? enquiries.filter(e => e.stage === leadFilter) : enquiries
  const filteredProps = propFilter
    ? properties.filter(p =>
        p.title.toLowerCase().includes(propFilter.toLowerCase()) ||
        p.code.toLowerCase().includes(propFilter.toLowerCase()) ||
        p.location.toLowerCase().includes(propFilter.toLowerCase()))
    : properties

  if (loading) return (
    <div className={styles.loadingState}>
      <div className={styles.spinner} />
      <p>Loading dashboard…</p>
    </div>
  )

  return (
    <>
      {/* Main */}
      <div className={styles.main}>
        {/* Stats bar */}
        <div className={styles.statsBar}>
          {[
            { label: 'Live Parcels', val: liveCount },
            { label: 'Total Acres', val: totalAcres.toFixed(0) },
            { label: 'Portfolio Value', val: `₹${totalValue.toFixed(0)} Cr` },
            { label: 'New Leads', val: newLeads },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statVal}>{s.val}</div>
              <div className={styles.statLbl}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          {([
            { id: 'properties', label: 'Properties' },
            { id: 'enquiries', label: 'Enquiries', badge: newLeads },
            { id: 'analytics', label: 'Analytics' },
          ] as { id: Tab; label: string; badge?: number }[]).map(item => (
            <button
              key={item.id}
              className={`${styles.tabBtn} ${tab === item.id ? styles.tabBtnActive : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.badge ? <span className={styles.tabBadge}>{item.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* Properties Tab */}
        {tab === 'properties' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Properties</h2>
                <p className={styles.sectionSub}>{properties.length} total parcels</p>
              </div>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <input
                  className={styles.searchInput}
                  placeholder="Search properties…"
                  value={propFilter}
                  onChange={e => setPropFilter(e.target.value)}
                />
                <button className="btn btn-primary" onClick={() => { setEditProp(null); setShowModal(true) }}>
                  + Add Property
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Zone</th>
                    <th>Acres</th>
                    <th>₹ Cr/ac</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProps.map(p => (
                    <tr key={p.id}>
                      <td><span className={styles.code}>{p.code}</span></td>
                      <td>
                        <div className={styles.propName}>{p.title}</div>
                        <div className={styles.propSub}>{p.use_cases.join(' · ')}</div>
                      </td>
                      <td>{p.location}</td>
                      <td>{p.zone}</td>
                      <td>{p.extent_acres}</td>
                      <td>₹{p.price_per_acre_cr}</td>
                      <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-sm btn-ghost btn-icon" title="Edit" onClick={() => { setEditProp(p); setShowModal(true) }}>✏️</button>
                          <a href="/marketplace" target="_blank" className="btn btn-sm btn-ghost btn-icon" title="View">↗</a>
                          {delConfirm === p.id ? (
                            <>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                              <button className="btn btn-sm btn-ghost" onClick={() => setDelConfirm(null)}>Cancel</button>
                            </>
                          ) : (
                            <button className="btn btn-sm btn-danger btn-icon" title="Delete" onClick={() => setDelConfirm(p.id)}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProps.length === 0 && (
                    <tr><td colSpan={8} style={{textAlign:'center',color:'var(--muted)',padding:40}}>No properties found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enquiries Tab */}
        {tab === 'enquiries' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Enquiries Pipeline</h2>
                <p className={styles.sectionSub}>{enquiries.length} total leads</p>
              </div>
              <div style={{display:'flex',gap:8}}>
                {(['', 'New', 'Contacted', 'Visit'] as (Stage | '')[]).map(s => (
                  <button
                    key={s || 'all'}
                    className={`btn btn-sm ${leadFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setLeadFilter(s)}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Property</th>
                    <th>Intent</th>
                    <th>Stage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnqs.map(e => {
                    const prop = properties.find(p => p.id === e.property_id)
                    const canAdvance = e.stage !== 'Visit'
                    return (
                      <tr key={e.id}>
                        <td style={{color:'var(--muted)',fontSize:'.78rem'}}>{new Date(e.created_at).toLocaleDateString('en-IN', {day:'2-digit',month:'short'})}</td>
                        <td>
                          <div className={styles.propName}>{e.name}</div>
                          <div className={styles.propSub}>{e.company}</div>
                        </td>
                        <td>
                          <div style={{fontSize:'.82rem'}}>{e.phone}</div>
                          <div style={{fontSize:'.76rem',color:'var(--muted)'}}>{e.email}</div>
                        </td>
                        <td>
                          {prop ? (
                            <>
                              <div style={{fontSize:'.82rem',fontWeight:500}}>{prop.title}</div>
                              <div style={{fontSize:'.72rem',color:'var(--muted)'}}>{prop.code}</div>
                            </>
                          ) : <span style={{color:'var(--muted)'}}>—</span>}
                        </td>
                        <td><span style={{fontSize:'.8rem'}}>{e.intent}</span></td>
                        <td><span className={`badge badge-${e.stage.toLowerCase()}`}>{e.stage}</span></td>
                        <td>
                          <button
                            className={`btn btn-sm ${canAdvance ? 'btn-ghost' : 'btn-ghost'}`}
                            disabled={!canAdvance}
                            onClick={() => handleAdvanceStage(e)}
                          >
                            {e.stage === 'New' ? 'Mark Contacted' : e.stage === 'Contacted' ? 'Mark Visit' : '✓ Done'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredEnqs.length === 0 && (
                    <tr><td colSpan={7} style={{textAlign:'center',color:'var(--muted)',padding:40}}>No enquiries yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Analytics Overview</h2>
                <p className={styles.sectionSub}>Portfolio & pipeline summary</p>
              </div>
            </div>

            <div className={styles.analyticsGrid}>
              {/* Properties by status */}
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsCardTitle}>Properties by Status</div>
                {(['Live', 'Reserved', 'Sold'] as const).map(s => {
                  const count = properties.filter(p => p.status === s).length
                  const pct = properties.length ? Math.round(count / properties.length * 100) : 0
                  return (
                    <div key={s} className={styles.barRow}>
                      <span className={styles.barLabel}>{s}</span>
                      <div className={styles.barTrack}>
                        <div className={`${styles.barFill} ${styles['barFill' + s]}`} style={{width: `${pct}%`}} />
                      </div>
                      <span className={styles.barVal}>{count}</span>
                    </div>
                  )
                })}
              </div>

              {/* Leads by stage */}
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsCardTitle}>Leads by Stage</div>
                {(['New', 'Contacted', 'Visit'] as const).map(s => {
                  const count = enquiries.filter(e => e.stage === s).length
                  const pct = enquiries.length ? Math.round(count / enquiries.length * 100) : 0
                  return (
                    <div key={s} className={styles.barRow}>
                      <span className={styles.barLabel}>{s}</span>
                      <div className={styles.barTrack}>
                        <div className={`${styles.barFill} ${styles['barFill' + s]}`} style={{width: `${pct}%`}} />
                      </div>
                      <span className={styles.barVal}>{count}</span>
                    </div>
                  )
                })}
              </div>

              {/* Properties by Zone */}
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsCardTitle}>Inventory by Zone</div>
                {['North', 'East', 'South', 'West'].map(z => {
                  const zoneProps = properties.filter(p => p.zone === z)
                  const acres = zoneProps.reduce((s, p) => s + p.extent_acres, 0)
                  return (
                    <div key={z} className={styles.barRow}>
                      <span className={styles.barLabel}>{z}</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{width: `${Math.min(100, acres / 3)}%`}} />
                      </div>
                      <span className={styles.barVal}>{acres} ac</span>
                    </div>
                  )
                })}
              </div>

              {/* Top properties by value */}
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsCardTitle}>Top Properties by Value</div>
                {[...properties]
                  .sort((a, b) => (b.extent_acres * b.price_per_acre_cr) - (a.extent_acres * a.price_per_acre_cr))
                  .slice(0, 5)
                  .map(p => (
                    <div key={p.id} className={styles.topRow}>
                      <div>
                        <div style={{fontSize:'.82rem',fontWeight:600}}>{p.code}</div>
                        <div style={{fontSize:'.74rem',color:'var(--muted)'}}>{p.location}</div>
                      </div>
                      <div style={{fontSize:'.88rem',fontWeight:700,color:'var(--green)',fontFamily:'var(--serif)'}}>
                        ₹{(p.extent_acres * p.price_per_acre_cr).toFixed(0)} Cr
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Modal */}
      {showModal && (
        <PropertyModal
          property={editProp}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditProp(null) }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-wrap">
          <div className="toast">✓ {toast}</div>
        </div>
      )}
    </>
  )
}
