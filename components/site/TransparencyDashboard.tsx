import Icon from './Icon'
import { verificationStages } from '@/lib/content/verification'
import type { TransparencyStats } from '@/lib/types'

/* The Verification Transparency Dashboard — Plan §3A.

   "A live or regularly updated page showing anonymised diligence
   statistics — parcels reviewed, percentage carrying a
   disqualifying red flag, average verification turnaround. No
   competitor in this space publishes numbers like this."

   The flag rate is displayed as prominently as the pass rate on
   purpose. A verification service whose published flag rate is
   near zero is either extraordinarily lucky or not verifying. */

function pct(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0
}

export default function TransparencyDashboard({
  stats,
  recent,
}: {
  stats: TransparencyStats
  recent?: {
    reviewed: number
    verified: number
    flagged: number
    inProgress: number
    medianTurnaround: number
    acreage: number
  }
}) {
  const flagPct = pct(stats.parcels_flagged, stats.parcels_reviewed)
  const verifiedPct = pct(stats.parcels_verified, stats.parcels_reviewed)
  const maxStage = Math.max(...stats.by_stage.map((s) => s.cleared + s.flagged), 1)
  const maxReason = Math.max(...stats.flag_reasons.map((r) => r.count), 1)

  return (
    <div className="transparency">
      <div className="transparency__head">
        <div>
          <span className="eyebrow">
            <span className="dot-pulse" /> Verification transparency
          </span>
          <h2 className="h1">
            The numbers we would rather <em>not</em> publish.
          </h2>
          <p className="lede">
            Nearly a third of the parcels that reach us carry a finding serious enough that we tell the client
            to walk. Publishing that is uncomfortable and it is the point: a diligence firm that never flags
            anything is not doing diligence. Updated monthly, never restated downward.
          </p>
        </div>
        <div className="transparency__period">
          <span>{stats.period}</span>
          <time dateTime={stats.updated_at}>
            Updated{' '}
            {new Date(stats.updated_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        </div>
      </div>

      <div className="transparency__tiles">
        <div className="transparency__tile">
          <span className="transparency__value numeral">{stats.parcels_reviewed.toLocaleString('en-IN')}</span>
          <span className="transparency__label">Parcels put through diligence</span>
          <span className="transparency__note">{stats.acreage_reviewed.toLocaleString('en-IN')} acres reviewed</span>
        </div>
        <div className="transparency__tile is-flagged">
          <span className="transparency__value numeral">{flagPct}%</span>
          <span className="transparency__label">Carried a disqualifying red flag</span>
          <span className="transparency__note">{stats.parcels_flagged} parcels we told clients to walk from</span>
        </div>
        <div className="transparency__tile is-verified">
          <span className="transparency__value numeral">{verifiedPct}%</span>
          <span className="transparency__label">Cleared all six stages</span>
          <span className="transparency__note">{stats.parcels_verified} certificates issued</span>
        </div>
        <div className="transparency__tile">
          <span className="transparency__value numeral">{stats.median_turnaround_days}</span>
          <span className="transparency__label">Median days to a decision</span>
          <span className="transparency__note">Mean {stats.avg_turnaround_days} days · intake to certificate</span>
        </div>
      </div>

      <div className="transparency__charts">
        {/* Where parcels fail, by stage */}
        <div className="transparency__chart">
          <h3 className="h3">Where parcels fail</h3>
          <p className="transparency__chartSub">
            Findings by stage. Stage 2 is the single biggest filter — most parcels that fail, fail on the
            title chain or the encumbrance behind it.
          </p>
          <ul className="stageBars">
            {stats.by_stage.map((s) => {
              const def = verificationStages.find((v) => v.key === s.stage)
              const total = s.cleared + s.flagged
              return (
                <li key={s.stage}>
                  <div className="stageBars__label">
                    <span className="stageBars__num">{def?.number}</span>
                    <span>{def?.short ?? s.stage}</span>
                  </div>
                  <div className="stageBars__track" role="img" aria-label={`${def?.short}: ${s.cleared} cleared, ${s.flagged} flagged`}>
                    <div
                      className="stageBars__cleared"
                      style={{ width: `${(s.cleared / maxStage) * 100}%` }}
                    />
                    <div
                      className="stageBars__flagged"
                      style={{ width: `${(s.flagged / maxStage) * 100}%` }}
                    />
                  </div>
                  <div className="stageBars__values">
                    <span>{total}</span>
                    {s.flagged > 0 && <span className="stageBars__flagCount">−{s.flagged}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="transparency__legend">
            <span><i className="swatch is-cleared" /> Cleared the stage</span>
            <span><i className="swatch is-flagged" /> Flagged and stopped here</span>
          </div>
        </div>

        {/* Why parcels fail */}
        <div className="transparency__chart">
          <h3 className="h3">Why parcels fail</h3>
          <p className="transparency__chartSub">
            Disqualifying findings, most common first. Access and buffers together account for more failures
            than fraud does — the mundane problems are the expensive ones.
          </p>
          <ul className="reasonBars">
            {stats.flag_reasons.map((r) => (
              <li key={r.reason}>
                <span className="reasonBars__label">{r.reason}</span>
                <span className="reasonBars__track">
                  <span className="reasonBars__fill" style={{ width: `${(r.count / maxReason) * 100}%` }} />
                </span>
                <span className="reasonBars__count numeral">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {recent && (
        <div className="transparency__live">
          <span className="transparency__liveLabel">
            <span className="dot-pulse" /> Currently on the desk
          </span>
          <div className="transparency__liveStats">
            <span><strong>{recent.inProgress}</strong> in progress</span>
            <span><strong>{recent.verified}</strong> verified this period</span>
            <span><strong>{recent.flagged}</strong> flagged this period</span>
            <span><strong>{recent.acreage.toLocaleString('en-IN')}</strong> acres under review</span>
          </div>
        </div>
      )}

      <details className="transparency__method">
        <summary>
          <Icon name="checklist" size={15} />
          How these numbers are counted
          <span className="plus" aria-hidden="true">+</span>
        </summary>
        <p>{stats.methodology}</p>
      </details>
    </div>
  )
}
