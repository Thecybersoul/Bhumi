import Link from 'next/link'
import Icon from './Icon'
import { getPropertyType } from '@/lib/content/propertyTypes'
import type { Property } from '@/lib/types'

/* One card, six presentations. The headline metrics change with
   the asset class (Plan §4) — a warehouse leads with clear height
   and power, an apartment leads with carpet area and its RERA
   number, a land parcel leads with extent and conversion status. */

function money(cr: number) {
  return cr >= 1 ? `₹${cr.toFixed(cr < 10 ? 1 : 0)} Cr` : `₹${Math.round(cr * 100)} L`
}

export function headlineMetrics(p: Property): { value: string; label: string }[] {
  switch (p.property_type) {
    case 'warehouses':
      return [
        p.ceiling_height_m
          ? { value: `${p.ceiling_height_m}m`, label: 'Clear height' }
          : { value: `${p.extent_acres} ac`, label: 'Extent' },
        p.floor_load_t_sqm
          ? { value: `${p.floor_load_t_sqm} T/m²`, label: 'Floor load' }
          : { value: p.zoning ?? 'Industrial', label: 'Zoning' },
        p.dock_count ? { value: String(p.dock_count), label: 'Docks' } : { value: p.topo, label: 'Terrain' },
        p.power_load_kva ? { value: `${p.power_load_kva} KVA`, label: 'Sanctioned power' } : { value: p.road_type.split(',')[0], label: 'Access' },
      ]
    case 'commercial':
      return [
        { value: `${(p.built_up_sqft ?? 0).toLocaleString('en-IN')}`, label: 'Sq ft built-up' },
        { value: p.occupancy_certificate ? 'In hand' : 'Not issued', label: 'Occupancy certificate' },
        { value: p.fire_noc ? 'Current' : 'Pending', label: 'Fire NOC' },
        { value: p.price_per_sqft ? `₹${p.price_per_sqft.toLocaleString('en-IN')}` : 'On request', label: 'Per sq ft' },
      ]
    case 'residential':
      return [
        { value: `${(p.carpet_sqft ?? 0).toLocaleString('en-IN')}`, label: 'Sq ft carpet' },
        { value: `${(p.built_up_sqft ?? 0).toLocaleString('en-IN')}`, label: 'Sq ft super built-up' },
        { value: p.price_per_sqft ? `₹${p.price_per_sqft.toLocaleString('en-IN')}` : 'On request', label: 'Per sq ft' },
        { value: p.rera_number ? 'Registered' : 'Check', label: 'K-RERA' },
      ]
    case 'villas':
      return [
        { value: `${(p.plot_area_sqft ?? 0).toLocaleString('en-IN')}`, label: 'Sq ft plot' },
        { value: `${(p.built_up_sqft ?? 0).toLocaleString('en-IN')}`, label: 'Sq ft built' },
        { value: p.price_per_sqft ? `₹${p.price_per_sqft.toLocaleString('en-IN')}` : 'On request', label: 'Per sq ft' },
        { value: p.gated_community ? 'Gated' : 'Standalone', label: 'Layout' },
      ]
    default:
      return [
        { value: `${p.extent_acres}`, label: 'Acres' },
        { value: money(p.price_per_acre_cr), label: 'Per acre' },
        { value: money(p.extent_acres * p.price_per_acre_cr), label: 'Total value' },
        { value: `${p.dist_airport_km} km`, label: 'To airport' },
      ]
  }
}

export default function PropertyTypeCard({ property: p }: { property: Property }) {
  const type = getPropertyType(p.property_type)
  const metrics = headlineMetrics(p)
  const verified = p.verified_stage === 'report'

  return (
    <Link href={`/marketplace?code=${p.code}`} className="listCard" style={{ height: '100%' }}>
      <div className="listCard__meta">
        <span className="badge badge-navy">{p.code}</span>
        {verified ? (
          <span className="badge badge-verified">
            <Icon name="check" size={11} stroke={3} /> Verified
          </span>
        ) : (
          <span className="badge badge-pending">In verification</span>
        )}
        {p.status !== 'Live' && <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>}
      </div>

      <h3>{p.title}</h3>
      <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
        {p.location} · {p.zone} Bengaluru · {type?.shortName}
      </span>

      {/* K-RERA number inline, not buried (Plan §4) */}
      {p.rera_number && (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '.7rem',
            color: 'var(--gold-deep)',
            background: 'var(--gold-tint)',
            padding: '4px 9px',
            borderRadius: 6,
            alignSelf: 'flex-start',
          }}
        >
          K-RERA {p.rera_number}
        </span>
      )}

      <div className="resultsRow" style={{ marginTop: 6 }}>
        {metrics.map((m) => (
          <div key={m.label}>
            <span className="numeral" style={{ fontSize: '1.05rem' }}>
              {m.value}
            </span>
            <small>{m.label}</small>
          </div>
        ))}
      </div>

      {p.risk !== 'Low' && (
        <p style={{ fontSize: '.8rem', color: 'var(--flagged)', lineHeight: 1.55 }}>
          <strong>{p.risk} risk:</strong> {p.risk_notes}
        </p>
      )}

      <div className="listCard__foot">
        <span className="link-arrow">View details →</span>
      </div>
    </Link>
  )
}
