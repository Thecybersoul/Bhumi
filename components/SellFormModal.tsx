'use client'
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
    
    const notes = `Location: ${form.location}\nExtent: ${form.extent} acres\nProposed Use Case: ${form.useCase}`

    await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: form.name, 
        phone: form.phone, 
        email: form.email,
        company: '',
        intent: 'Enquire',
        source: 'Sell',
        notes 
      })
    })
    setSubmitting(false)
    onSubmit()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: 4 }}>List Your Land</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>
              Submit your parcel for our team to review. We will not publish automatically.
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ flexShrink: 0, marginLeft: 16 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 " />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" />
          </div>

          <div className="form-grid cols3" style={{ marginBottom: 16 }}>
            <div className="form-group span2">
              <label>Location / Micro-market *</label>
              <input required value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Devanahalli" />
            </div>
            <div className="form-group">
              <label>Extent (Acres) *</label>
              <input required type="number" step="0.1" value={form.extent} onChange={e => setForm(f => ({...f, extent: e.target.value}))} placeholder="e.g. 5.5" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>Proposed Best Use Case</label>
            <select value={form.useCase} onChange={e => setForm(f => ({...f, useCase: e.target.value}))}>
              <option value="">Select a primary use case</option>
              <option value="Township">Township / Plotted Development</option>
              <option value="Villa">Premium Villa</option>
              <option value="Resort">Resort / Hospitality</option>
              <option value="Industrial">Industrial / Warehouse</option>
              <option value="Agriculture">Agriculture / Farm</option>
              <option value="Land-banking">Strategic Land-banking</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
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
