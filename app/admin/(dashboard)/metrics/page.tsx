import Link from 'next/link'
import { getLeads, getVerificationCases, getDataRoomRequests } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'What to measure · Admin' }

/* Plan §13 — What to Measure.
   Each metric states what it tells you and where it is currently
   observable, so the list is an operating instrument rather than
   a page from a strategy document. */

export default async function MetricsPage() {
  const [{ data: leads }, { data: cases }, { data: dataRoom }] = await Promise.all([
    getLeads(),
    getVerificationCases(),
    getDataRoomRequests(),
  ])

  const whatsappLeads = leads.filter((l) => l.channel === 'WhatsApp')
  const propertyLeads = leads.filter((l) => l.source.startsWith('/property-consultancy'))
  const brandingLeads = leads.filter((l) => l.source.startsWith('/branding-advertising'))

  const metrics = [
    {
      metric: 'Split between the two practices',
      tells: 'Which practice the site is actually generating demand for. If one is near zero, either its page is not working or the market is telling us something.',
      observable: `${propertyLeads.length} property · ${brandingLeads.length} branding`,
      where: 'Lead inbox, filtered by source',
      href: '/admin/leads',
      status: leads.length > 0 ? 'Tracking' : 'No leads yet',
    },
    {
      metric: 'WhatsApp click-through rate',
      tells: 'Whether the primary conversion path matches how visitors actually want to engage.',
      observable: `${whatsappLeads.length} of ${leads.length} leads arrived by WhatsApp (${
        leads.length ? Math.round((whatsappLeads.length / leads.length) * 100) : 0
      }%)`,
      where: 'Lead inbox, channel column',
      href: '/admin/leads',
      status: 'Tracking',
    },
    {
      metric: 'Time on the Property Consultancy page',
      tells: 'Whether the protocol and checklist sections are doing their trust-building job in the absence of a portfolio.',
      observable: 'Requires an analytics provider — not yet wired',
      where: 'Analytics, once connected',
      href: '/property-consultancy',
      status: 'Needs analytics',
    },
    {
      metric: 'Data-room / document requests',
      tells: 'Whether larger enquiries are reaching the point of asking for detail.',
      observable: `${dataRoom.length} requests · ${dataRoom.filter((d) => d.status === 'Approved').length} approved`,
      where: 'Data room queue',
      href: '/admin/data-room',
      status: dataRoom.length > 0 ? 'Tracking' : 'No requests yet',
    },
    {
      metric: 'Organic ranking for land and diligence search terms',
      tells: 'Whether the insight content is building real discovery rather than just traffic.',
      observable: 'Insight pieces published with canonical URLs and structured data',
      where: 'Search Console, once verified',
      href: '/insights',
      status: 'Needs Search Console',
    },
    {
      metric: 'Uptime and average page load time',
      tells: 'Whether the site is meeting the reliability standard the plan sets.',
      observable: '/api/health reports serving status, database reachability and read latency',
      where: 'Uptime monitor pointed at /api/health',
      href: '/api/health',
      status: 'Endpoint live · monitor to be pointed at it',
    },
  ]

  /* Not in §13, but the plan's own logic implies it: the
     transparency dashboard only works if the flag rate is real. */
  const additional = [
    {
      metric: 'Published flag rate vs case-record flag rate',
      tells: 'Whether the transparency dashboard is still supported by the underlying record. This is the integrity check on the site\'s single biggest differentiator.',
      observable: `${cases.filter((c) => c.outcome === 'Flagged').length} of ${cases.length} cases on record are flagged`,
      where: 'Transparency figures — reconciliation table',
      href: '/admin/transparency',
      status: 'Reconcile monthly',
    },
    {
      metric: 'Stage-level stall time',
      tells: 'Where cases are actually getting stuck — the operational reason turnaround slips, and the thing a client notices first.',
      observable: `${cases.filter((c) => c.outcome === 'In progress').length} cases currently open`,
      where: 'Verification pipeline — overview flags cases past twice their stage duration',
      href: '/admin/verifications',
      status: 'Tracking',
    },
    {
      metric: 'Enquiry to paid engagement',
      tells: 'The one that decides whether any of the rest matters. If enquiries are healthy and this is not, the problem is pricing or the pitch, not traffic.',
      observable: `${leads.filter((l) => l.stage === 'Closed').length} of ${leads.length} leads converted`,
      where: 'Lead inbox, stage column',
      href: '/admin/leads',
      status: leads.length > 0 ? 'Tracking' : 'No leads yet',
    },
  ]

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>What to measure</h1>
          <p>
            The measurement list from the business plan, with each metric tied to where it is actually
            observable in this system today — and what is still missing to observe it properly.
          </p>
        </div>
      </div>

      <div className="adminCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>What it tells you</th>
                <th>Currently</th>
                <th>Where</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.metric}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)', maxWidth: 220 }}>{m.metric}</td>
                  <td style={{ fontSize: '.84rem', color: 'var(--ink-2)', maxWidth: 320 }}>{m.tells}</td>
                  <td style={{ fontSize: '.83rem' }}>{m.observable}</td>
                  <td style={{ fontSize: '.8rem' }}>
                    <Link href={m.href} className="link-arrow">
                      {m.where}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${m.status === 'Tracking' ? 'verified' : 'pending'}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCard__head">
          <div>
            <span className="adminCard__title">Three the plan implies but does not list</span>
            <span className="adminCard__sub" style={{ display: 'block' }}>
              Added because the plan&rsquo;s own logic requires them — particularly the first, which is the
              integrity check on the whole transparency proposition.
            </span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>What it tells you</th>
                <th>Currently</th>
                <th>Where</th>
              </tr>
            </thead>
            <tbody>
              {additional.map((m) => (
                <tr key={m.metric}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)', maxWidth: 220 }}>{m.metric}</td>
                  <td style={{ fontSize: '.84rem', color: 'var(--ink-2)', maxWidth: 340 }}>{m.tells}</td>
                  <td style={{ fontSize: '.83rem' }}>{m.observable}</td>
                  <td style={{ fontSize: '.8rem' }}>
                    <Link href={m.href} className="link-arrow">
                      {m.where}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adminNote" style={{ marginTop: 22, background: 'var(--navy-tint)', color: 'var(--navy-700)' }}>
        <span>ℹ</span>
        <span>
          Two metrics need a third-party service before they can be read: page-level engagement (an analytics
          provider) and organic ranking (Search Console). Everything else is observable from this admin
          today. The uptime metric needs a monitor pointed at <code>/api/health</code>, which already reports
          serving status, database reachability and read latency.
        </span>
      </div>
    </>
  )
}
