import Link from 'next/link'
import Icon from '@/components/site/Icon'
import TransparencyDashboard from '@/components/site/TransparencyDashboard'
import { getTransparency } from '@/lib/db'
import { verificationStages } from '@/lib/content/verification'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Transparency figures · Admin' }

export default async function AdminTransparency() {
  const { data: published, recent, source } = await getTransparency()

  const publishedFlagPct = Math.round((published.parcels_flagged / published.parcels_reviewed) * 100)
  const liveFlagPct = recent.reviewed ? Math.round((recent.flagged / recent.reviewed) * 100) : 0

  /* The reconciliation view. Publishing a figure that the case
     record does not support is the one failure mode that would
     destroy the value of the whole exercise, so the drift is
     shown here explicitly rather than left to be noticed. */
  const rows = [
    { label: 'Parcels reviewed', published: published.parcels_reviewed, live: recent.reviewed },
    { label: 'Verified', published: published.parcels_verified, live: recent.verified },
    { label: 'Flagged', published: published.parcels_flagged, live: recent.flagged },
    { label: 'In progress', published: published.parcels_in_progress, live: recent.inProgress },
    { label: 'Median turnaround (days)', published: published.median_turnaround_days, live: recent.medianTurnaround },
    { label: 'Mean turnaround (days)', published: published.avg_turnaround_days, live: recent.avgTurnaround },
  ]

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Transparency figures</h1>
          <p>
            What the public dashboard publishes, and what the live case record currently supports. The two
            will differ — the published figures are lifetime and the case record here is the recent slice —
            but every published number has to be defensible against a record somewhere. Update monthly, and
            never restate a figure downward.
          </p>
        </div>
        <div className="row-wrap">
          <span className={`sourcePill ${source === 'live' ? 'is-live' : 'is-fallback'}`}>
            {source === 'live' ? 'Live database' : 'Seeded data'}
          </span>
          <Link href="/verification#transparency" target="_blank" className="btn btn-sm btn-ghost">
            View as the public sees it
          </Link>
        </div>
      </div>

      <div className="adminNote">
        <Icon name="flag" size={15} />
        <span>
          <strong>The one rule.</strong> The flag rate is the figure that makes this dashboard worth
          publishing. Do not smooth it, do not exclude withdrawn mandates from the denominator, and do not
          restate a previously published period downward. A diligence firm whose published flag rate falls
          toward zero has stopped being believable.
        </span>
      </div>

      <div className="adminGrid two">
        <div className="adminCard">
          <div className="adminCard__head">
            <div>
              <span className="adminCard__title">Reconciliation</span>
              <span className="adminCard__sub" style={{ display: 'block' }}>
                Published lifetime figures against what the case record currently holds.
              </span>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>Published</th>
                  <th>Case record</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td style={{ fontWeight: 500 }}>{r.label}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{r.published}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{r.live || '—'}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: 700 }}>Flag rate</td>
                  <td>
                    <span className="badge badge-flagged">{publishedFlagPct}%</span>
                  </td>
                  <td>
                    <span className={`badge badge-${Math.abs(liveFlagPct - publishedFlagPct) > 15 ? 'pending' : 'progress'}`}>
                      {liveFlagPct}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {Math.abs(liveFlagPct - publishedFlagPct) > 15 && (
            <p style={{ fontSize: '.82rem', color: 'var(--pending)', marginTop: 14, lineHeight: 1.6 }}>
              The recent flag rate diverges from the published lifetime figure by more than 15 points. That is
              not automatically wrong — a small recent sample moves sharply — but it should be understood
              before the next publication.
            </p>
          )}
        </div>

        <div className="adminCard">
          <div className="adminCard__head">
            <div>
              <span className="adminCard__title">Published flag reasons</span>
              <span className="adminCard__sub" style={{ display: 'block' }}>
                The reasons shown publicly, most common first.
              </span>
            </div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {published.flag_reasons.map((r) => {
              const max = Math.max(...published.flag_reasons.map((x) => x.count))
              return (
                <div key={r.reason}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.81rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ink-2)', maxWidth: '80%' }}>{r.reason}</span>
                    <strong style={{ color: 'var(--navy)' }}>{r.count}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(r.count / max) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--gold-deep), var(--gold))',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span className="adminCard__sub" style={{ display: 'block', marginBottom: 8 }}>
              Reasons currently recorded on live cases
            </span>
            {recent.flagReasons.length === 0 ? (
              <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>None recorded.</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recent.flagReasons.map((r) => (
                  <li key={r.reason} style={{ fontSize: '.81rem', color: 'var(--ink-2)' }}>
                    {r.reason} <strong>({r.count})</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="adminCard" style={{ marginTop: 18 }}>
        <div className="adminCard__head">
          <div>
            <span className="adminCard__title">Stage-level attrition, as published</span>
            <span className="adminCard__sub" style={{ display: 'block' }}>
              Where parcels fail. Stage 2 should be the biggest filter; if it is not, either the intake is
              unusually clean or the title work is not going deep enough.
            </span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Cleared</th>
                <th>Flagged</th>
                <th>Attrition</th>
                <th>Flags on live cases</th>
              </tr>
            </thead>
            <tbody>
              {published.by_stage.map((s) => {
                const def = verificationStages.find((v) => v.key === s.stage)
                const total = s.cleared + s.flagged
                return (
                  <tr key={s.stage}>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)', marginRight: 8 }}>{def?.number}</span>
                      {def?.title}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{s.cleared}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: s.flagged ? 'var(--flagged)' : 'var(--muted)' }}>
                      {s.flagged}
                    </td>
                    <td>{total ? `${Math.round((s.flagged / total) * 100)}%` : '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                      {recent.stageFlags.get(s.stage) ?? 0}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adminCard" style={{ marginTop: 18 }}>
        <div className="adminCard__head">
          <span className="adminCard__title">Published methodology</span>
        </div>
        <p style={{ fontSize: '.88rem', color: 'var(--ink-2)', lineHeight: 1.78, maxWidth: '92ch' }}>
          {published.methodology}
        </p>
        <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 14 }}>
          Stored in <code>transparency_stats.methodology</code>. Edit it there — a statistic published without
          a stated method is a claim, not evidence, and changing the method without changing this text is how
          a transparency dashboard quietly becomes marketing.
        </p>
      </div>

      <div style={{ marginTop: 30, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <span className="eyebrow">Preview — exactly what a visitor sees</span>
        <div style={{ marginTop: 18 }}>
          <TransparencyDashboard stats={published} recent={recent} />
        </div>
      </div>
    </>
  )
}
