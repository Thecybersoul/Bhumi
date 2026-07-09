import { useEffect, useState } from 'react'
import { VerificationRecord, VerificationStatus } from '@/app/api/verifications/route'

export default function VerificationPanel({ propertyId }: { propertyId: string }) {
  const [record, setRecord] = useState<VerificationRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/verifications?propertyId=${propertyId}`)
      .then(r => r.json())
      .then(data => { setRecord(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [propertyId])

  if (loading) return <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '.85rem' }}>Loading verification data…</div>
  if (!record) return null

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'Verified': return 'var(--green)'
      case 'Flagged': return 'var(--red)'
      case 'N/A': return 'var(--muted)'
      case 'Pending': default: return 'var(--yellow)'
    }
  }

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid var(--line)', paddingTop: 24 }}>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: 8, color: 'var(--ink)' }}>
        Diligence & Verification
      </h3>
      
      <div style={{ background: 'rgba(244,191,79,.1)', padding: 16, borderRadius: 8, marginBottom: 16, fontSize: '.85rem', color: '#8a681c', lineHeight: 1.5 }}>
        <strong>Important:</strong> This verification checklist reflects our team's internal human review of this parcel as of the stated dates. It does not replace independent legal diligence. Buyers must conduct their own legal verification before completing any transaction.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {record.items.map(item => (
          <div key={item.key} style={{ 
            background: 'var(--paper)', 
            border: '1px solid var(--line)', 
            borderRadius: 8, 
            padding: 12 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontWeight: 500, fontSize: '.9rem', color: 'var(--ink)' }}>{item.label}</div>
              <div style={{ 
                fontSize: '.75rem', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '.5px',
                color: getStatusColor(item.status),
                background: `${getStatusColor(item.status)}15`,
                padding: '4px 8px',
                borderRadius: 4
              }}>
                {item.status}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, fontSize: '.75rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
              {item.date && <span>📅 {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              {item.reviewer && <span>👤 {item.reviewer}</span>}
            </div>
            
            {item.note && (
              <div style={{ marginTop: 8, fontSize: '.85rem', color: 'var(--ink)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 4, borderLeft: `3px solid ${getStatusColor(item.status)}` }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
