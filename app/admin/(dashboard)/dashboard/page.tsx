import Link from 'next/link'
import { computeDashboard } from '@/lib/dashboard'
import TrendChart from '@/components/admin/TrendChart'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard · Admin' }

function cr(n: number) {
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default async function AdminDashboard() {
  const d = await computeDashboard()

  const stageMax = Math.max(...d.pipelineByStage.map((s) => s.count), 1)
  const statusMax = Math.max(...d.inventoryByStatus.map((s) => s.count), 1)
  const channelMax = Math.max(...d.leadsByChannel.map((c) => c.count), 1)

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Dashboard</h1>
          <p>Deal pipeline, closed value and verification throughput, at a glance.</p>
        </div>
        <div className="row-wrap">
          <span className={`sourcePill ${d.source === 'live' ? 'is-live' : 'is-fallback'}`}>
            {d.source === 'live' ? 'Live database' : 'Seeded data'}
          </span>
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
            View site
          </a>
        </div>
      </div>

      {d.health.state !== 'live' && d.health.state !== 'empty' && (
        <div className="adminNote" style={{ marginBottom: 22 }}>
          <span>⚠</span>
          <span>
            {d.health.headline}. <Link href="/admin/setup">Open Setup</Link> to fix it — the figures below are
            reading from seeded fallback data until it is.
          </span>
        </div>
      )}

      <div className="statRow">
        <div className="statTile">
          <span className="statTile__value">{cr(d.kpi.activeValue)}</span>
          <span className="statTile__label">Active pipeline value</span>
          <span className="statTile__note">{d.kpi.activeCount} deals in progress</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{cr(d.kpi.closedValue)}</span>
          <span className="statTile__label">Closed value</span>
          <span className="statTile__note">{d.kpi.closedCount} closed</span>
        </div>
        <div className="statTile is-gold">
          <span className="statTile__value">{cr(d.kpi.commissionCollected)}</span>
          <span className="statTile__label">Commission collected</span>
          <span className="statTile__note">{cr(d.kpi.commissionPending)} pending</span>
        </div>
        <div className="statTile">
          <span className="statTile__value">{d.kpi.winRatePct}%</span>
          <span className="statTile__label">Win rate</span>
          <span className="statTile__note">{d.kpi.closedCount} closed · {d.kpi.lostCount} lost</span>
        </div>
        <div className="statTile is-progress" style={{ borderTopColor: 'var(--progress)' }}>
          <span className="statTile__value">{d.kpi.verificationsInReview}</span>
          <span className="statTile__label">Verifications in review</span>
          <span className="statTile__note">Median {d.kpi.medianTurnaroundDays || '—'}d to certificate</span>
        </div>
      </div>

      <div className="adminCard" style={{ marginBottom: 18 }}>
        <div className="adminCard__head">
          <div>
            <span className="adminCard__title">New deals, last 10 weeks</span>
            <span className="adminCard__sub" style={{ display: 'block' }}>Momentum, not a snapshot — hover a week for its count.</span>
          </div>
        </div>
        <TrendChart data={d.weeklyDeals} title="New deals" />
      </div>

      <div className="adminGrid two" style={{ marginBottom: 18 }}>
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Transaction pipeline</span>
            <Link href="/admin/deals" className="link-arrow">View board</Link>
          </div>
          {d.kpi.activeCount === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>No deals in progress.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {d.pipelineByStage.map((s) => (
                <div key={s.stage}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{s.stage}</span>
                    <strong style={{ color: 'var(--navy)' }}>{s.count}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.count / stageMax) * 100}%`, height: '100%', background: 'var(--navy-600)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Inventory by status</span>
            <Link href="/admin/properties" className="link-arrow">View listings</Link>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {d.inventoryByStatus.map((s) => (
              <div key={s.status}>
                <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink-2)' }}>{s.status}</span>
                  <strong style={{ color: 'var(--navy)' }}>
                    {s.count} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {cr(s.value)}</span>
                  </strong>
                </div>
                <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(s.count / statusMax) * 100}%`,
                      height: '100%',
                      background:
                        s.status === 'Sold' ? 'var(--flagged)' : s.status === 'Reserved' ? 'var(--progress)' : 'var(--verified)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adminGrid two" style={{ marginBottom: 18 }}>
        <div className="adminCard" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="adminCard__head" style={{ padding: '24px 24px 0' }}>
            <span className="adminCard__title">Advisor performance</span>
          </div>
          {d.advisorStats.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', padding: '0 24px 24px' }}>
              No transactions have an advisor assigned yet.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Advisor</th>
                    <th>Deals</th>
                    <th>Active</th>
                    <th>Closed value</th>
                    <th>Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {d.advisorStats.map((a) => (
                    <tr key={a.name}>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{a.name}</td>
                      <td>{a.total}</td>
                      <td>{a.active}</td>
                      <td>{cr(a.closedValue)}</td>
                      <td>{a.winRate == null ? '—' : `${a.winRate}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Leads by channel</span>
            <Link href="/admin/deals?tab=leads" className="link-arrow">View inbox</Link>
          </div>
          {d.leadsByChannel.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>No leads yet.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {d.leadsByChannel.map((c) => (
                <div key={c.channel}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{c.channel}</span>
                    <strong style={{ color: 'var(--navy)' }}>{c.count}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ width: `${(c.count / channelMax) * 100}%`, height: '100%', background: 'var(--navy-600)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adminGrid two">
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Recent transactions</span>
            <Link href="/admin/deals" className="link-arrow">View all</Link>
          </div>
          {d.recentTransactions.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>No transactions yet.</p>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {d.recentTransactions.map((t) => (
                <div key={t.id} className="row-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '.87rem' }}>{t.property_label}</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>
                      {t.reference} · {t.deal_value_cr ? cr(t.deal_value_cr) : 'Value TBD'} · {fmtDate(t.opened_at)}
                    </div>
                  </div>
                  <span
                    className={`badge badge-${
                      t.outcome === 'Closed' ? 'verified' : t.outcome === 'Lost' ? 'flagged' : 'progress'
                    }`}
                  >
                    {t.outcome === 'In progress' ? t.stage : t.outcome}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Upcoming meetings</span>
            <Link href="/admin/deals" className="link-arrow">View pipeline</Link>
          </div>
          {d.upcomingMeetings.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Nothing scheduled.</p>
          ) : (
            <div className="stack" style={{ gap: 12, marginBottom: 16 }}>
              {d.upcomingMeetings.map((m) => (
                <div key={m.id} className="row-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '.87rem' }}>{m.title}</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>
                      {m.with} · {m.txnRef}
                    </div>
                  </div>
                  <span style={{ fontSize: '.76rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmtDateTime(m.scheduled_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div
            className="row-wrap"
            style={{ justifyContent: 'space-between', fontSize: '.85rem', paddingTop: 14, borderTop: '1px solid var(--line)' }}
          >
            <span style={{ color: 'var(--ink-2)' }}>Pending document requests</span>
            <Link href="/admin/deals?tab=documents" className="link-arrow">
              <strong style={{ color: d.pendingDataRoom ? 'var(--navy)' : 'var(--muted)' }}>{d.pendingDataRoom}</strong>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
