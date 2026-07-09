import { useState, useEffect } from 'react'
import { Property } from '@/lib/types'
import { VerificationRecord, VerificationItem, VerificationStatus } from '@/app/api/verifications/route'

export default function VerificationEditor({ property, onClose }: { property: Property, onClose: () => void }) {
  const [record, setRecord] = useState<VerificationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/verifications?propertyId=${property.id}`)
      .then(r => r.json())
      .then(data => { setRecord(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [property.id])

  const handleUpdate = (index: number, field: keyof VerificationItem, value: string) => {
    if (!record) return
    const updated = { ...record }
    updated.items[index] = { ...updated.items[index], [field]: value }
    setRecord(updated)
  }

  const handleSave = async () => {
    if (!record) return
    setSaving(true)
    try {
      await fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      })
      onClose()
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 900, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem' }}>Verification Editor</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginTop: 4 }}>
              Internal verification records for <strong style={{ color: 'var(--ink)' }}>{property.title}</strong> ({property.code})
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px 12px' }}>✕</button>
        </div>

        <div style={{ background: 'rgba(244,191,79,.1)', padding: 16, borderRadius: 8, marginBottom: 24, fontSize: '.85rem', color: '#8a681c' }}>
          <strong>Note:</strong> Verification status recorded here reflects internal human review and appears on the live public detail page. It resets on cold starts in this demo environment.
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : record ? (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 12 }}>
            <table className="data-table" style={{ width: '100%', fontSize: '.85rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Checklist Item</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%' }}>Date</th>
                  <th style={{ width: '15%' }}>Reviewer</th>
                  <th style={{ width: '30%' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {record.items.map((item, i) => (
                  <tr key={item.key}>
                    <td style={{ fontWeight: 500 }}>{item.label}</td>
                    <td>
                      <select 
                        value={item.status} 
                        onChange={e => handleUpdate(i, 'status', e.target.value)}
                        style={{ padding: '6px', width: '100%', borderRadius: 4, border: '1px solid var(--line)' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Flagged">Flagged</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="date" 
                        value={item.date} 
                        onChange={e => handleUpdate(i, 'date', e.target.value)}
                        style={{ padding: '6px', width: '100%', borderRadius: 4, border: '1px solid var(--line)' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Name" 
                        value={item.reviewer} 
                        onChange={e => handleUpdate(i, 'reviewer', e.target.value)}
                        style={{ padding: '6px', width: '100%', borderRadius: 4, border: '1px solid var(--line)' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Scope notes..." 
                        value={item.note} 
                        onChange={e => handleUpdate(i, 'note', e.target.value)}
                        style={{ padding: '6px', width: '100%', borderRadius: 4, border: '1px solid var(--line)' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>Error loading record</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Verifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
