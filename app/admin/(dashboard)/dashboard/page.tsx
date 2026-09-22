import Link from 'next/link'
import { checkHealth } from '@/lib/cms'
import {
  getProperties,
  getTransactions,
  getVerificationCases,
  getDataRoomRequests,
  getLeads,
  deriveFromCases,
  dealValueCr,
} from '@/lib/db'
import type { Property, PropertyStatus, PropertyTransaction, TransactionStage } from '@/lib/types'
import TrendChart from '@/components/admin/TrendChart'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard · Admin' }

const TXN_STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
const PROPERTY_STATUSES: PropertyStatus[] = ['Live', 'Reserved', 'Sold']

function cr(n: number) {
  return n >= 100 ? `₹${Math.round(n)} Cr` : `₹${n.toFixed(n >= 10 ? 0 : 1)} Cr`
}

function valueByStatus(props: Property[], status: PropertyStatus) {
  return props.filter((p) => p.status === status).reduce((sum, p) => sum + (dealValueCr(p) ?? 0), 0)
}

/** Commission actually earned on a deal, in ₹ crore — a percentage
    of the deal value, or a flat fee stated in lakhs. */
function commissionCr(t: PropertyTransaction): number {
  if (t.commission_value == null) return 0
  return t.commission_type === 'Percentage'
    ? ((t.deal_value_cr ?? 0) * t.commission_value) / 100
    : t.commission_value / 100
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Count of `items` opened per week, oldest to newest, over the last
    `weeks` seven-day windows ending today. Used for the one trend
    line the dashboard leads with — momentum, not a snapshot. */
function weeklyCounts(items: { opened_at: string }[], weeks: number) {
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const to = new Date(todayEnd)
    to.setDate(to.getDate() - (weeks - 1 - i) * 7)
    const from = new Date(to)
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)
    return { label: from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), from: from.getTime(), to: to.getTime(), value: 0 }
  })
  for (const it of items) {
    const t = new Date(it.opened_at).getTime()
    const bucket = buckets.find((b) => t >= b.from && t <= b.to)
    if (bucket) bucket.value += 1
  }
  return buckets.map(({ label, value }) => ({ label, value }))
}

export default async function AdminDashboard() {
  const [health, propsRes, txnsRes, casesRes, dataRoomRes, leadsRes] = await Promise.all([
    checkHealth(),
    getProperties({ admin: true }),
    getTransactions(),
    getVerificationCases(),
    getDataRoomRequests(),
    getLeads(),
  ])

  const props = propsRes.data
  const txns = txnsRes.data
  const cases = casesRes.data
  const dataRoom = dataRoomRes.data
  const leads = leadsRes.data
  const aggregate = deriveFromCases(cases)

  const active = txns.filter((t) => t.outcome === 'In progress')
  const closed = txns.filter((t) => t.outcome === 'Closed')
  const lost = txns.filter((t) => t.outcome === 'Lost')

  const activeValue = active.reduce((sum, t) => sum + (t.deal_value_cr ?? 0), 0)
  const closedValue = closed.reduce((sum, t) => sum + (t.deal_value_cr ?? 0), 0)
  const commissionCollected = txns.filter((t) => t.commission_collected).reduce((sum, t) => sum + commissionCr(t), 0)
  const commissionPending = txns.filter((t) => !t.commission_collected).reduce((sum, t) => sum + commissionCr(t), 0)
  const decided = closed.length + lost.length
  const winRatePct = decided ? Math.round((closed.length / decided) * 100) : 0

  const stageMax = Math.max(...TXN_STAGES.map((s) => active.filter((t) => t.stage === s).length), 1)
  const statusMax = Math.max(...PROPERTY_STATUSES.map((s) => props.filter((p) => p.status === s).length), 1)

  const recentTxns = txns.slice(0, 6)
  const upcomingMeetings = txns
    .flatMap((t) => t.meetings.map((m) => ({ ...m, txnRef: t.reference, txnId: t.id })))
    .filter((m) => m.status === 'Scheduled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)

  const pendingDataRoom = dataRoom.filter((d) => d.status === 'Pending').length
  const anySource = propsRes.source === 'live' && txnsRes.source === 'live'

  const weeklyDeals = weeklyCounts(txns, 10)

  const advisorNames = Array.from(
    new Set(txns.map((t) => t.advisor?.trim()).filter((a): a is string => Boolean(a)))
  )
  const advisorStats = advisorNames
    .map((name) => {
      const mine = txns.filter((t) => t.advisor?.trim() === name)
      const mineClosed = mine.filter((t) => t.outcome === 'Closed')
      const mineDecided = mineClosed.length + mine.filter((t) => t.outcome === 'Lost').length
      return {
        name,
        total: mine.length,
        active: mine.filter((t) => t.outcome === 'In progress').length,
        closedValue: mineClosed.reduce((sum, t) => sum + (t.deal_value_cr ?? 0), 0),
        winRate: mineDecided ? Math.round((mineClosed.length / mineDecided) * 100) : null,
      }
    })
    .sort((a, b) => b.closedValue - a.closedValue || b.total - a.total)

  const channels = Array.from(new Set(leads.map((l) => l.channel)))
  const channelMax = Math.max(...channels.map((c) => leads.filter((l) => l.channel === c).length), 1)

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Dashboard</h1>
          <p>Deal pipeline, closed value and verification throughput, at a glance.</p>
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
          <span className="statTile__value">{cr(activeValue)}</span>
          <span className="statTile__label">Active pipeline value</span>
          <span className="statTile__note">{active.length} deals in progress</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{cr(closedValue)}</span>
          <span className="statTile__label">Closed value</span>
          <span className="statTile__note">{closed.length} closed</span>
        </div>
        <div className="statTile is-gold">
          <span className="statTile__value">{cr(commissionCollected)}</span>
          <span className="statTile__label">Commission collected</span>
          <span className="statTile__note">{cr(commissionPending)} pending</span>
        </div>
        <div className="statTile">
          <span className="statTile__value">{winRatePct}%</span>
          <span className="statTile__label">Win rate</span>
          <span className="statTile__note">{closed.length} closed · {lost.length} lost</span>
        </div>
        <div className="statTile is-progress" style={{ borderTopColor: 'var(--progress)' }}>
          <span className="statTile__value">{aggregate.inProgress}</span>
          <span className="statTile__label">Verifications in review</span>
          <span className="statTile__note">Median {aggregate.medianTurnaround || '—'}d to certificate</span>
        </div>
      </div>

      <div className="adminCard" style={{ marginBottom: 18 }}>
        <div className="adminCard__head">
          <div>
            <span className="adminCard__title">New deals, last 10 weeks</span>
            <span className="adminCard__sub" style={{ display: 'block' }}>Momentum, not a snapshot — hover a week for its count.</span>
          </div>
        </div>
        <TrendChart data={weeklyDeals} title="New deals" />
      </div>

      <div className="adminGrid two" style={{ marginBottom: 18 }}>
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Transaction pipeline</span>
            <Link href="/admin/transactions" className="link-arrow">View board</Link>
          </div>
          {active.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>No deals in progress.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {TXN_STAGES.map((s) => {
                const count = active.filter((t) => t.stage === s).length
                return (
                  <div key={s}>
                    <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--ink-2)' }}>{s}</span>
                      <strong style={{ color: 'var(--navy)' }}>{count}</strong>
                    </div>
                    <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(count / stageMax) * 100}%`,
                          height: '100%',
                          background: 'var(--navy-600)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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

      <div className="adminGrid two" style={{ marginBottom: 18 }}>
        <div className="adminCard" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="adminCard__head" style={{ padding: '24px 24px 0' }}>
            <span className="adminCard__title">Advisor performance</span>
          </div>
          {advisorStats.length === 0 ? (
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
                  {advisorStats.map((a) => (
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
            <Link href="/admin/leads" className="link-arrow">View inbox</Link>
          </div>
          {channels.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>No leads yet.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {channels.map((c) => {
                const count = leads.filter((l) => l.channel === c).length
                return (
                  <div key={c}>
                    <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--ink-2)' }}>{c}</span>
                      <strong style={{ color: 'var(--navy)' }}>{count}</strong>
                    </div>
                    <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ width: `${(count / channelMax) * 100}%`, height: '100%', background: 'var(--navy-600)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="adminGrid two">
        <div className="adminCard">
          <div className="adminCard__head">
            <span className="adminCard__title">Recent transactions</span>
            <Link href="/admin/transactions" className="link-arrow">View all</Link>
          </div>
          {recentTxns.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>No transactions yet.</p>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {recentTxns.map((t) => (
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
            <Link href="/admin/verifications" className="link-arrow">Verification board</Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Nothing scheduled.</p>
          ) : (
            <div className="stack" style={{ gap: 12, marginBottom: 16 }}>
              {upcomingMeetings.map((m) => (
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
            <Link href="/admin/data-room" className="link-arrow">
              <strong style={{ color: pendingDataRoom ? 'var(--navy)' : 'var(--muted)' }}>{pendingDataRoom}</strong>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
