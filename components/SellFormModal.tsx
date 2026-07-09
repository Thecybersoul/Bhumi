import { useState } from 'react'

interface Props {
  onClose: () => void
  onSubmit: () => void
}

export default function SellFormModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', extent: '', useCase: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Format the data into the notes field so the admin can see it easily
    const notes = `Location: ${form.location}\nExtent: ${form.extent} acres\nProposed Use Case: ${form.useCase}`

    await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: form.name, 
        phone: form.phone, 
        email: form.email,
        company: '',
        intent: 'Enquire', // Must be 'Enquire' to pass DB check constraint
        source: 'Sell',    // We use source = 'Sell' to identify it in the admin UI
        notes 
      })
    })
    setSubmitting(false)
    onSubmit()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem' }}>List Your Land</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginTop: 4 }}>
              Submit your parcel for our team to review. We do not automatically publish listings.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px 12px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Full Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your name" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Phone *</label>
              <input required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 " style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }} />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Location / Micro-market *</label>
              <input required value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Devanahalli" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Extent (Acres) *</label>
              <input required type="number" step="0.1" value={form.extent} onChange={e => setForm(f => ({...f, extent: e.target.value}))} placeholder="e.g. 5.5" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Proposed Best Use Case</label>
            <select value={form.useCase} onChange={e => setForm(f => ({...f, useCase: e.target.value}))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }}>
              <option value="">Select a primary use case</option>
              <option value="Township">Township / Plotted Development</option>
              <option value="Villa">Premium Villa</option>
              <option value="Resort">Resort / Hospitality</option>
              <option value="Industrial">Industrial / Warehouse</option>
              <option value="Agriculture">Agriculture / Farm</option>
              <option value="Land-banking">Strategic Land-banking</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
