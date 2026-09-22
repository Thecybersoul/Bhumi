import Link from 'next/link'
import { checkHealth } from '@/lib/cms'
import { getProperties, getLeads, getVerificationCases, getDataRoomRequests, deriveFromCases, dealValueCr } from '@/lib/db'
import type { Lead, LeadStage, Property, PropertyStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard · Admin' }

const LEAD_STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Visit', 'Closed']
const PROPERTY_STATUSES: PropertyStatus[] = ['Live', 'Reserved', 'Sold']

function cr(n: number) {
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}

function valueByStatus(props: Property[], status: PropertyStatus) {
  return props
    .filter((p) => p.status === status)
    .reduce((sum, p) => sum + (dealValueCr(p) ?? 0), 0)
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default async function AdminDashboard() {
  const [health, propsRes, leadsRes, casesRes, dataRoomRes] = await Promise.all([
    checkHealth(),
    getProperties({ admin: true }),
    getLeads(),
    getVerificationCases(),
    getDataRoomRequests(),
  ])

  const props = propsRes.data
  const leads = leadsRes.data
  const cases = casesRes.data
  const dataRoom = dataRoomRes.data
  const aggregate = deriveFromCases(cases)

  const live = props.filter((p) => p.status === 'Live').length
  const reserved = props.filter((p) => p.status === 'Reserved').length
  const sold = props.filter((p) => p.status === 'Sold').length
  const pipelineValue = valueByStatus(props, 'Live') + valueByStatus(props, 'Reserved')
  const closedValue = valueByStatus(props, 'Sold')

  const newLeads30d = leads.filter((l) => Date.now() - new Date(l.created_at).getTime() < 30 * 86_400_000)
  const closedLeads = leads.filter((l) => l.stage === 'Closed')
  const conversionPct = leads.length ? Math.round((closedLeads.length / leads.length) * 100) : 0

  const leadStageMax = Math.max(...LEAD_STAGES.map((s) => leads.filter((l) => l.stage === s).length), 1)
  const statusMax = Math.max(...PROPERTY_STATUSES.map((s) => props.filter((p) => p.status === s).length), 1)

  const recentLeads = leads.slice(0, 6)
  const pendingDataRoom = dataRoom.filter((d) => d.status === 'Pending').length

  const anySource = propsRes.source === 'live' && leadsRes.source === 'live'

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Dashboard</h1>
          <p>Portfolio value, lead pipeline and verification throughput, at a glance.</p>
        </div>
        <div className="row-wrap">
          <span className={`sourcePill ${anySource ? 'is-live' : 'is-fallback'}`}>
            {anySource ? 'Live database' : 'Seeded data'}
          </span>
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
            View site
          </a>
        </div>
      </div>

      {health.state !== 'live' && health.state !== 'empty' && (
        <div className="adminNote" style={{ marginBottom: 22 }}>
          <span>⚠</span>
          <span>
            {health.headline}. <Link href="/admin/setup">Open Setup</Link> to fix it — the figures below are
            reading from seeded fallback data until it is.
          </span>
        </div>
      )}

      <div className="statRow">
        <div className="statTile">
          <span className="statTile__value">{cr(pipelineValue)}</span>
          <span className="statTile__label">Active pipeline value</span>
          <span className="statTile__note">{live} live · {reserved} reserved</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{cr(closedValue)}</span>
          <span className="statTile__label">Closed value</span>
          <span className="statTile__note">{sold} sold</span>
        </div>
        <div className="statTile is-gold">
          <span className="statTile__value">{newLeads30d.length}</span>
          <span className="statTile__label">New leads (30d)</span>
          <span className="statTile__note">{leads.length} all-time</span>
        </div>
        <div className="statTile">
          <span className="statTile__value">{conversionPct}%</span>
          <span className="statTile__label">Lead conversion</span>
          <span className="statTile__note">{closedLeads.length} of {leads.length} closed</span>
        </div>
        <div className="statTile is-progress" style={{ borderTopColor: 'var(--progress)' }}>
          <span className="statTile__value">{aggregate.inProgress}</span>
          <span className="statTile__label">Verifications in review</span>
          <span className="statTile__note">Median {aggregate.medianTurnaround || '—'}d to certificate</span>
        </div>
      </div>

      <div className="adminGrid two" style={{ marginBottom: 18 }}>
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Lead pipeline</span>
            <Link href="/admin/leads" className="link-arrow">View inbox</Link>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {LEAD_STAGES.map((s) => {
              const count = leads.filter((l) => l.stage === s).length
              return (
                <div key={s}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{s}</span>
                    <strong style={{ color: 'var(--navy)' }}>{count}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(count / leadStageMax) * 100}%`,
                        height: '100%',
                        background: s === 'Closed' ? 'var(--verified)' : 'var(--navy-600)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Inventory by status</span>
            <Link href="/admin/properties" className="link-arrow">View listings</Link>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {PROPERTY_STATUSES.map((s) => {
              const count = props.filter((p) => p.status === s).length
              const value = valueByStatus(props, s)
              return (
                <div key={s}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{s}</span>
                    <strong style={{ color: 'var(--navy)' }}>
                      {count} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {cr(value)}</span>
                    </strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(count / statusMax) * 100}%`,
                        height: '100%',
                        background:
                          s === 'Sold' ? 'var(--flagged)' : s === 'Reserved' ? 'var(--progress)' : 'var(--verified)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="adminGrid two">
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Recent leads</span>
            <Link href="/admin/leads" className="link-arrow">View all</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>No leads yet.</p>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {recentLeads.map((l: Lead) => (
                <div key={l.id} className="row-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '.87rem' }}>{l.name}</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>
                      {l.kind} · {l.channel} · {timeAgo(l.created_at)}
                    </div>
                  </div>
                  <span
                    className={`badge badge-${
                      l.stage === 'New' ? 'pending' : l.stage === 'Closed' ? 'sold' : l.stage === 'Visit' ? 'verified' : 'progress'
                    }`}
                  >
                    {l.stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Verification & documents</span>
            <Link href="/admin/verifications" className="link-arrow">Open board</Link>
          </div>
          <div className="statRow" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 16 }}>
            <div className="statTile" style={{ padding: 14 }}>
              <span className="statTile__value" style={{ fontSize: '1.3rem' }}>{aggregate.verified}</span>
              <span className="statTile__label">Verified</span>
            </div>
            <div className="statTile is-flagged" style={{ padding: 14 }}>
              <span className="statTile__value" style={{ fontSize: '1.3rem' }}>{aggregate.flagged}</span>
              <span className="statTile__label">Flagged</span>
            </div>
          </div>
          <div
            className="row-wrap"
            style={{ justifyContent: 'space-between', fontSize: '.85rem', paddingTop: 14, borderTop: '1px solid var(--line)' }}
          >
            <span style={{ color: 'var(--ink-2)' }}>Pending document requests</span>
            <Link href="/admin/data-room" className="link-arrow">
              <strong style={{ color: pendingDataRoom ? 'var(--navy)' : 'var(--muted)' }}>{pendingDataRoom}</strong>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
