'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Property } from '@/lib/types'
import { VerificationRecord, VerificationItem, VerificationStatus } from '@/app/api/verifications/route'

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [property, setProperty] = useState<Property | null>(null)
  const [record, setRecord] = useState<VerificationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch property details and verification record in parallel
    Promise.all([
      fetch('/api/properties?admin=1').then(r => r.json()),
      fetch(`/api/verifications?propertyId=${id}`).then(r => r.json())
    ]).then(([propsData, verifData]) => {
      const p = propsData.find((p: Property) => p.id === id)
      if (!p) {
        setError('Property not found')
      } else {
        setProperty(p)
        setRecord(verifData)
      }
      setLoading(false)
    }).catch(() => {
      setError('Error loading data')
      setLoading(false)
    })
  }, [id])

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
      router.push('/admin/dashboard')
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading verification data...</div>
  if (error || !property) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      <button 
        onClick={() => router.push('/admin/dashboard')} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.9rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', margin: '0 0 8px 0', color: 'var(--ink)' }}>
            Verification Record
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--muted)', margin: 0 }}>
            <strong style={{ color: 'var(--ink)' }}>{property.title}</strong> ({property.code})
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/admin/dashboard')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(244,191,79,.1)', padding: 16, borderRadius: 8, marginBottom: 32, fontSize: '.9rem', color: '#8a681c' }}>
        <strong>Note:</strong> Verification status recorded here reflects internal human review and appears on the live public detail page. It resets on cold starts in this demo environment.
      </div>

      {record && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--line)', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--paper)' }}>
                <th style={{ width: '25%', padding: '16px 20px' }}>Checklist Item</th>
                <th style={{ width: '15%', padding: '16px 20px' }}>Status</th>
                <th style={{ width: '15%', padding: '16px 20px' }}>Date</th>
                <th style={{ width: '15%', padding: '16px 20px' }}>Reviewer</th>
                <th style={{ width: '30%', padding: '16px 20px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((item, i) => (
                <tr key={item.key}>
                  <td style={{ fontWeight: 500, padding: '16px 20px' }}>{item.label}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <select 
                      value={item.status} 
                      onChange={e => handleUpdate(i, 'status', e.target.value)}
                      style={{ padding: '8px', width: '100%', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--paper)' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Flagged">Flagged</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input 
                      type="date" 
                      value={item.date} 
                      onChange={e => handleUpdate(i, 'date', e.target.value)}
                      style={{ padding: '8px', width: '100%', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--paper)' }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input 
                      type="text" 
                      placeholder="Name" 
                      value={item.reviewer} 
                      onChange={e => handleUpdate(i, 'reviewer', e.target.value)}
                      style={{ padding: '8px', width: '100%', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--paper)' }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input 
                      type="text" 
                      placeholder="Scope notes..." 
                      value={item.note} 
                      onChange={e => handleUpdate(i, 'note', e.target.value)}
                      style={{ padding: '8px', width: '100%', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--paper)' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
