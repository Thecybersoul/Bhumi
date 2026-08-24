import Link from 'next/link'
import Icon from '@/components/site/Icon'
import { practices } from '@/lib/content/services'
import { verificationStages } from '@/lib/content/verification'

export const metadata = { title: 'Business plan · Admin' }

/* ═══════════════════════════════════════════════════════════
   The operating plan.

   Written as the internal record of a firm that is starting,
   not one describing itself as finished. Anything not yet true
   is marked as not yet true — the point of keeping this in the
   admin rather than a slide deck is that it stays honest enough
   to actually run the business against.
   ═══════════════════════════════════════════════════════════ */

type Status = 'Done' | 'In progress' | 'Not started' | 'Blocked'

const positioning = {
  what: 'Two consultancies under one roof: Property Consultancy (sourcing, verification and legal, construction and development) and Branding Consultancy (project branding, outdoor advertising).',
  who: 'Developers and investors acquiring land in and around Bengaluru; landowners who need their own title examined before selling; projects whose site presence does not match the price being asked.',
  edge: 'Continuity across the two practices — the constraint found at diligence reaches the person designing the hoarding. Very few firms in this market run both, and the ones that do rarely connect them.',
  honest:
    'We have no completed-engagement record to publish yet. The site is built to say so rather than to imply otherwise, which is a positioning decision as much as an ethical one: the firms we compete with all claim numbers, and none of them show their working.',
}

/* Revenue model — ranges are the shape of the market, not quotes. */
const revenue: { line: string; model: string; cycle: string; note: string }[] = [
  {
    line: 'Land Sourcing',
    model: 'Success fee on completed transaction, percentage of consideration',
    cycle: '3–9 months from brief to close',
    note: 'Longest cycle and least predictable. Cannot be the first revenue line.',
  },
  {
    line: 'Verification & Legal',
    model: 'Fixed fee per parcel, quoted before work starts',
    cycle: '2–4 weeks per file',
    note: 'The wedge. Short cycle, clear deliverable, and it generates the trust the other lines need.',
  },
  {
    line: 'Construction & Development',
    model: 'Percentage of project cost, or a retained monthly management fee',
    cycle: '9 months to multiple years',
    note: 'Highest value per client, slowest to originate. Follows sourcing or verification work.',
  },
  {
    line: 'Project Branding',
    model: 'Project fee by scope, plus supervised fabrication at cost',
    cycle: '6–12 weeks',
    note: 'Fastest to a visible, referenceable outcome. Strong portfolio generator.',
  },
  {
    line: 'Outdoor Advertising',
    model: 'Commission on media, or a planning and management retainer',
    cycle: 'Monthly, recurring once a campaign runs',
    note: 'The only line with genuinely recurring revenue. Working-capital heavy if media is bought on our balance sheet — it should not be, at this stage.',
  },
]

const phases: {
  phase: string
  window: string
  goal: string
  items: { task: string; status: Status }[]
}[] = [
  {
    phase: 'Phase 1 — Foundation',
    window: 'Months 0–3',
    goal: 'Be findable, be credible without a portfolio, and be able to take an engagement properly.',
    items: [
      { task: 'Public site live: homepage plus the two practice pages', status: 'Done' },
      { task: 'Verification protocol documented and published in plain language', status: 'Done' },
      { task: 'Buyer checklist published as a free, ungated resource', status: 'Done' },
      { task: 'Lead capture, WhatsApp routing and the admin inbox working end to end', status: 'Done' },
      { task: 'K-RERA agent registration confirmed and displayed', status: 'In progress' },
      { task: 'Standard engagement letter and fee schedule per service line', status: 'Not started' },
      { task: 'Panel appointed: advocate for title opinions, licensed surveyor', status: 'Not started' },
      { task: 'Professional indemnity cover appropriate to advisory work', status: 'Not started' },
      { task: 'Google Business Profile and basic local SEO', status: 'Not started' },
    ],
  },
  {
    phase: 'Phase 2 — First engagements',
    window: 'Months 3–9',
    goal: 'Convert the verification wedge into paid files, and turn the first completed work into evidence.',
    items: [
      { task: 'First ten paid verification files completed', status: 'Not started' },
      { task: 'Turnaround measured per file, so the published range is real', status: 'Not started' },
      { task: 'Written client consent process for naming work publicly', status: 'Not started' },
      { task: 'First two branding projects delivered and photographed', status: 'Not started' },
      { task: 'Replace generic industry context on the homepage with our own dated figures', status: 'Blocked' },
      { task: 'Publish the first three case studies, including one deal we walked away from', status: 'Blocked' },
      { task: 'Marketplace: first verified parcels listed', status: 'Blocked' },
    ],
  },
  {
    phase: 'Phase 3 — Compounding',
    window: 'Months 9–24',
    goal: 'Move from project work to retained relationships, and from paid attention to earned.',
    items: [
      { task: 'Media owner relationships direct, so outdoor is bought at rate rather than resold', status: 'Not started' },
      { task: 'One retained outdoor client, giving predictable monthly revenue', status: 'Not started' },
      { task: 'Insight publishing at a steady cadence, targeting real search intent', status: 'In progress' },
      { task: 'Referral loop from verification clients into sourcing and development', status: 'Not started' },
      { task: 'Second advisor hired; founder stops being the delivery bottleneck', status: 'Not started' },
      { task: 'Transparency dashboard published from real completed files', status: 'Blocked' },
    ],
  },
]

const risks: { risk: string; likelihood: string; response: string }[] = [
  {
    risk: 'No track record, so early clients have nothing to judge us on',
    likelihood: 'Certain — it is the defining constraint right now',
    response:
      'Compete on published method rather than claimed outcomes. The protocol, the checklist and the insight pieces are all doing this job. Price the first files to win them, and treat the resulting record as the real return.',
  },
  {
    risk: 'A verification misses something and a client relies on it',
    likelihood: 'Low per file, severe if it happens',
    response:
      'Scope limitations stated in every report. Advocate-signed title opinion for anything material. Professional indemnity cover in place before volume grows — this is the single most important unstarted item on the Phase 1 list.',
  },
  {
    risk: 'Founder is the bottleneck across five service lines',
    likelihood: 'High by month six if origination works',
    response:
      'Verification is the line to systematise first: it has the most repeatable file structure. Panel out survey and legal opinion early rather than at breaking point.',
  },
  {
    risk: 'Outdoor media bought on our own balance sheet',
    likelihood: 'Moderate — clients will ask for it',
    response:
      'Act as buyer and manager, not principal, until there is working capital to absorb a client defaulting. Say no to the first request that requires fronting media cost.',
  },
  {
    risk: 'Sourcing revenue is lumpy and can be zero for a quarter',
    likelihood: 'High',
    response:
      'Do not model sourcing as base revenue. Verification and branding fees cover fixed cost; sourcing success fees are upside.',
  },
  {
    risk: 'Regulatory change in conversion, e-Khata or RERA advertising rules',
    likelihood: 'Moderate and continuous',
    response:
      'Insight publishing doubles as the monitoring mechanism — writing the explainer forces the reading. Review the protocol against current rules quarterly.',
  },
]

const metrics: { metric: string; why: string; target: string }[] = [
  {
    metric: 'Qualified enquiries per month',
    why: 'The top of everything. Distinguishes real demand from site traffic.',
    target: 'Track from month 1; no target until there is a baseline',
  },
  {
    metric: 'Enquiry → paid file conversion',
    why: 'Tells us whether the pricing or the pitch is wrong when volume does not convert.',
    target: 'Establish baseline over the first 20 enquiries',
  },
  {
    metric: 'Verification turnaround, per file',
    why: 'The published range must be measured, not asserted. This is what makes it publishable.',
    target: `Within the ${verificationStages.reduce((s, v) => s + v.typicalDays[0], 0)}–${verificationStages.reduce((s, v) => s + v.typicalDays[1], 0)} working-day band`,
  },
  {
    metric: 'Flag rate',
    why: 'A verification practice that never flags anything is not doing verification.',
    target: 'Report it whatever it turns out to be',
  },
  {
    metric: 'Revenue concentration',
    why: 'One client above half of revenue is a structural risk, not a success.',
    target: 'No client above 40% after month 12',
  },
  {
    metric: 'Cash runway in months',
    why: 'Given lumpy sourcing revenue, this governs how much risk the other lines can take.',
    target: 'Never below 6 months',
  },
]

const statusClass: Record<Status, string> = {
  Done: 'is-done',
  'In progress': 'is-progress',
  'Not started': 'is-todo',
  Blocked: 'is-blocked',
}

export default function PlanPage() {
  const all = phases.flatMap((p) => p.items)
  const done = all.filter((i) => i.status === 'Done').length
  const blocked = all.filter((i) => i.status === 'Blocked').length

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Business plan</h1>
          <p>
            The operating record: what the business is, how it makes money, what is genuinely done, and what
            is still only a sentence. Items marked <strong>Blocked</strong> are waiting on real completed
            work rather than on effort — they cannot be unblocked by building anything.
          </p>
        </div>
        <div className="row-wrap">
          <span className="sourcePill is-live">
            {done} of {all.length} done
          </span>
          {blocked > 0 && <span className="sourcePill is-fallback">{blocked} blocked on real work</span>}
        </div>
      </div>

      {/* ── Positioning ── */}
      <section className="adminSection">
        <h2>Positioning</h2>
        <div className="adminGrid two">
          <div className="panel">
            <h3>What the business is</h3>
            <p>{positioning.what}</p>
            <h3>Who it is for</h3>
            <p>{positioning.who}</p>
          </div>
          <div className="panel">
            <h3>Where the edge is</h3>
            <p>{positioning.edge}</p>
            <h3>What we do not have yet</h3>
            <p>{positioning.honest}</p>
          </div>
        </div>
      </section>

      {/* ── Service lines ── */}
      <section className="adminSection">
        <h2>Service lines</h2>
        <div className="row-wrap" style={{ marginBottom: 16 }}>
          {practices.map((p) => (
            <Link key={p.slug} href={p.href} target="_blank" className="btn btn-sm btn-ghost">
              {p.name} <Icon name="arrow" size={12} />
            </Link>
          ))}
        </div>
        <div className="tableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Line</th>
                <th>How it earns</th>
                <th>Cycle</th>
                <th>Reality check</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((r) => (
                <tr key={r.line}>
                  <td>
                    <strong>{r.line}</strong>
                  </td>
                  <td>{r.model}</td>
                  <td className="mono">{r.cycle}</td>
                  <td className="muted">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section className="adminSection">
        <h2>Roadmap</h2>
        {phases.map((ph) => (
          <div key={ph.phase} className="panel planPhase">
            <header className="planPhase__head">
              <div>
                <h3>{ph.phase}</h3>
                <p className="muted">{ph.goal}</p>
              </div>
              <span className="planPhase__window mono">{ph.window}</span>
            </header>
            <ul className="planPhase__items">
              {ph.items.map((it) => (
                <li key={it.task}>
                  <span className={`planStatus ${statusClass[it.status]}`}>{it.status}</span>
                  <span>{it.task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* ── Risks ── */}
      <section className="adminSection">
        <h2>Risks, and what we do about them</h2>
        <div className="adminGrid two">
          {risks.map((r) => (
            <div key={r.risk} className="panel riskCard">
              <h3>{r.risk}</h3>
              <p className="riskCard__likelihood">
                <Icon name="flag" size={13} /> {r.likelihood}
              </p>
              <p>{r.response}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className="adminSection">
        <h2>What we measure</h2>
        <div className="tableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Why it matters</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.metric}>
                  <td>
                    <strong>{m.metric}</strong>
                  </td>
                  <td className="muted">{m.why}</td>
                  <td>{m.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
