import { checkHealth } from './cms'
import { getProperties, getTransactions, getVerificationCases, getDataRoomRequests, getLeads, deriveFromCases, dealValueCr } from './db'
import type { Property, PropertyStatus, PropertyTransaction, TransactionStage } from './types'

/* The dashboard's numbers, computed once and shared by the web
   page and the mobile app's /api/dashboard — one place that knows
   what "active pipeline value" or "win rate" means, so the two
   surfaces can never quietly disagree. */

export const TXN_STAGES: TransactionStage[] = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']
export const PROPERTY_STATUSES: PropertyStatus[] = ['Live', 'Reserved', 'Sold']

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

/** Count of `items` opened per week, oldest to newest, over the last
    `weeks` seven-day windows ending today. */
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

export async function computeDashboard() {
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

  const pipelineByStage = TXN_STAGES.map((s) => ({ stage: s, count: active.filter((t) => t.stage === s).length }))
  const inventoryByStatus = PROPERTY_STATUSES.map((s) => ({
    status: s,
    count: props.filter((p) => p.status === s).length,
    value: valueByStatus(props, s),
  }))

  const recentTxns = txns.slice(0, 6)
  const upcomingMeetings = txns
    .flatMap((t) => t.meetings.map((m) => ({ ...m, txnRef: t.reference, txnId: t.id })))
    .filter((m) => m.status === 'Scheduled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)

  const pendingDataRoom = dataRoom.filter((d) => d.status === 'Pending').length

  const advisorNames = Array.from(new Set(txns.map((t) => t.advisor?.trim()).filter((a): a is string => Boolean(a))))
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
  const leadsByChannel = channels.map((c) => ({ channel: c, count: leads.filter((l) => l.channel === c).length }))

  return {
    source: (propsRes.source === 'live' && txnsRes.source === 'live' ? 'live' : 'fallback') as 'live' | 'fallback',
    health: { state: health.state, headline: health.headline },
    kpi: {
      activeValue,
      activeCount: active.length,
      closedValue,
      closedCount: closed.length,
      lostCount: lost.length,
      commissionCollected,
      commissionPending,
      winRatePct,
      verificationsInReview: aggregate.inProgress,
      medianTurnaroundDays: aggregate.medianTurnaround,
    },
    weeklyDeals: weeklyCounts(txns, 10),
    pipelineByStage,
    inventoryByStatus,
    advisorStats,
    leadsByChannel,
    recentTransactions: recentTxns,
    upcomingMeetings,
    pendingDataRoom,
  }
}

export type DashboardData = Awaited<ReturnType<typeof computeDashboard>>
