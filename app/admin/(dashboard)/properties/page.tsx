import Link from 'next/link'
import { getProperties } from '@/lib/db'
import { propertyTypes, getPropertyType } from '@/lib/content/propertyTypes'
import { verificationStages } from '@/lib/content/verification'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Listings · Admin' }

export default async function AdminProperties() {
  const { data, source } = await getProperties({ admin: true })

  const byType = propertyTypes.map((t) => ({
    ...t,
    count: data.filter((p) => p.property_type === t.slug).length,
  }))

  const missingCritical = data.filter((p) => {
    // Each asset class has one field it must not ship without (Plan §4).
    switch (p.property_type) {
      case 'residential':
        return !p.rera_number
      case 'commercial':
        return p.occupancy_certificate === undefined || p.occupancy_certificate === null
      case 'warehouses':
        return !p.ceiling_height_m
      case 'land-parcels':
      case 'large-land-parcels':
        return !p.conversion
      default:
        return false
    }
  })

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Listings</h1>
          <p>
            Every asset class carries one field it must not publish without — the RERA number on an
            apartment, the occupancy certificate on a commercial building, clear height on a warehouse,
            conversion status on land. Listings missing theirs are flagged below rather than published quietly.
          </p>
        </div>
        <span className={`sourcePill ${source === 'live' ? 'is-live' : 'is-fallback'}`}>
          {source === 'live' ? 'Live database' : 'Seeded data'}
        </span>
      </div>

      <div className="statRow">
        <div className="statTile">
          <span className="statTile__value">{data.length}</span>
          <span className="statTile__label">Total listings</span>
          <span className="statTile__note">{data.filter((p) => p.status === 'Live').length} live</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{data.filter((p) => p.verified_stage === 'report').length}</span>
          <span className="statTile__label">Cleared all four stages</span>
          <span className="statTile__note">Certificate issued</span>
        </div>
        <div className="statTile is-flagged">
          <span className="statTile__value">{missingCritical.length}</span>
          <span className="statTile__label">Missing a critical field</span>
          <span className="statTile__note">Should not be published as-is</span>
        </div>
        <div className="statTile is-gold">
          <span className="statTile__value">{data.filter((p) => p.data_room_gated).length}</span>
          <span className="statTile__label">Behind the data room gate</span>
          <span className="statTile__note">Large-parcel pillar</span>
        </div>
      </div>

      {missingCritical.length > 0 && (
        <div className="adminNote">
          <span>⚠</span>
          <span>
            {missingCritical.length} listing{missingCritical.length === 1 ? '' : 's'} missing the field that
            decides its asset class: {missingCritical.map((p) => p.code).join(', ')}. Publishing without it
            contradicts the standard on the public property-type pages.
          </span>
        </div>
      )}

      <div className="adminGrid two" style={{ marginBottom: 20 }}>
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Inventory by asset class</span>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {byType.map((t) => {
              const max = Math.max(...byType.map((x) => x.count), 1)
              return (
                <div key={t.slug}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <Link href={t.href} target="_blank" style={{ color: 'var(--ink-2)' }}>
                      {t.name}
                    </Link>
                    <strong style={{ color: 'var(--navy)' }}>{t.count}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ width: `${(t.count / max) * 100}%`, height: '100%', background: 'var(--navy-600)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Verification position across inventory</span>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {verificationStages.map((s) => {
              const count = data.filter((p) => p.verified_stage === s.key).length
              return (
                <div key={s.key} className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.83rem' }}>
                  <span style={{ color: 'var(--ink-2)' }}>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)', marginRight: 8 }}>{s.number}</span>
                    {s.title}
                  </span>
                  <strong style={{ color: count ? 'var(--navy)' : 'var(--muted)' }}>{count}</strong>
                </div>
              )
            })}
            <div
              className="row-wrap"
              style={{ justifyContent: 'space-between', fontSize: '.83rem', paddingTop: 10, borderTop: '1px solid var(--line)' }}
            >
              <span style={{ color: 'var(--muted)' }}>Not yet in verification</span>
              <strong style={{ color: 'var(--muted)' }}>{data.filter((p) => !p.verified_stage).length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="adminCard" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Listing</th>
                <th>Class</th>
                <th>Corridor</th>
                <th>Headline measure</th>
                <th>Critical field</th>
                <th>Verification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => {
                const type = getPropertyType(p.property_type)
                const critical =
                  p.property_type === 'residential'
                    ? { label: 'K-RERA', value: p.rera_number }
                    : p.property_type === 'commercial'
                      ? { label: 'OC', value: p.occupancy_certificate ? 'In hand' : undefined }
                      : p.property_type === 'warehouses'
                        ? { label: 'Clear height', value: p.ceiling_height_m ? `${p.ceiling_height_m} m` : undefined }
                        : { label: 'Conversion', value: p.conversion }
                const stage = verificationStages.find((s) => s.key === p.verified_stage)

                return (
                  <tr key={p.code}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '.76rem' }}>{p.code}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.title}</div>
                      <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{p.location}</div>
                    </td>
                    <td style={{ fontSize: '.8rem' }}>{type?.shortName}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                      {p.corridor?.replace(/-/g, ' ') ?? '—'}
                    </td>
                    <td style={{ fontSize: '.8rem', whiteSpace: 'nowrap' }}>
                      {p.built_up_sqft
                        ? `${p.built_up_sqft.toLocaleString('en-IN')} sq ft`
                        : `${p.extent_acres} acres`}
                    </td>
                    <td style={{ fontSize: '.78rem' }}>
                      <span style={{ color: 'var(--muted)' }}>{critical.label}: </span>
                      {critical.value ? (
                        <span style={{ color: 'var(--ink)' }}>{String(critical.value).slice(0, 28)}</span>
                      ) : (
                        <span className="badge badge-flagged">Missing</span>
                      )}
                    </td>
                    <td>
                      {stage ? (
                        <span className={`badge badge-${stage.key === 'report' ? 'verified' : 'progress'}`}>
                          {stage.key === 'report' ? 'Certified' : stage.short}
                        </span>
                      ) : (
                        <span className="badge badge-pending">Not started</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adminNote" style={{ marginTop: 22, background: 'var(--navy-tint)', color: 'var(--navy-700)' }}>
        <span>ℹ</span>
        <span>
          Listing create and edit run through <code>POST /api/properties</code> and{' '}
          <code>PUT /api/properties/[id]</code>, both admin-guarded. With no database attached those calls are
          accepted and logged but not persisted, which is why this view is read-only in seeded mode.
        </span>
      </div>
    </>
  )
}
