'use client'

import { useMemo, useState } from 'react'
import LeadForm from '@/components/site/LeadForm'
import { constructionRates, statutoryCosts } from '@/lib/content/tools'

/* Construction Cost & Timeline Estimator — Plan §8.
   "Rough, clearly-labelled-as-illustrative ranges by city tier
   and property type, to set realistic expectations early." */

const finishes = ['basic', 'standard', 'premium'] as const
type Finish = (typeof finishes)[number]

const finishLabels: Record<Finish, string> = {
  basic: 'Basic / grey structure plus',
  standard: 'Standard finish',
  premium: 'Premium / luxury',
}

function lakh(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`
  return `₹${n.toFixed(1)} L`
}

export default function ConstructionEstimator() {
  const [type, setType] = useState<string>('residential')
  const [sqft, setSqft] = useState(2500)
  const [finish, setFinish] = useState<Finish>('standard')
  const [includeGst, setIncludeGst] = useState(true)

  const result = useMemo(() => {
    const rate = constructionRates[type]
    const [low, high] = rate[finish]
    const baseLow = (low * sqft) / 1e5
    const baseHigh = (high * sqft) / 1e5
    const gstLow = includeGst ? baseLow * 0.18 : 0
    const gstHigh = includeGst ? baseHigh * 0.18 : 0
    const months = Math.max(4, Math.round((sqft / 1000) * rate.monthsPer1000sqft * 10) / 10)

    return {
      label: rate.label,
      low,
      high,
      baseLow,
      baseHigh,
      totalLow: baseLow + gstLow,
      totalHigh: baseHigh + gstHigh,
      months,
      monthsHigh: Math.round(months * 1.35 * 10) / 10,
    }
  }, [type, sqft, finish, includeGst])

  return (
    <div className="toolShell">
      <div className="toolPanel">
        <h2 className="h2">What are you building?</h2>
        <p className="toolPanel__sub">
          Bengaluru rates as of August 2026. Excludes land, statutory approvals and interiors unless the
          premium band is selected.
        </p>

        <div className="form-grid">
          <div className="form-group span2">
            <label>Property type</label>
            <div className="optionRow">
              {Object.entries(constructionRates).map(([k, v]) => (
                <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sqft">Built-up area (sq ft)</label>
            <input
              id="sqft"
              type="number"
              min={200}
              step={100}
              value={sqft}
              onChange={(e) => setSqft(Math.max(200, Number(e.target.value) || 0))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gst">GST</label>
            <select id="gst" value={includeGst ? 'yes' : 'no'} onChange={(e) => setIncludeGst(e.target.value === 'yes')}>
              <option value="yes">Include GST at 18%</option>
              <option value="no">Exclude GST</option>
            </select>
          </div>

          <div className="form-group span2">
            <label>Finish level</label>
            <div className="optionRow">
              {finishes.map((f) => (
                <button key={f} type="button" aria-pressed={finish === f} onClick={() => setFinish(f)}>
                  {finishLabels[f]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="toolResult">
          <h3 className="h3" style={{ marginBottom: 16 }}>
            Illustrative range
          </h3>

          <div className="toolResult__grid">
            <div className="toolResult__tile is-primary">
              <span className="toolResult__value">
                {lakh(result.totalLow)} – {lakh(result.totalHigh)}
              </span>
              <span className="toolResult__label">
                Total construction cost{includeGst ? ', GST included' : ', before GST'}
              </span>
            </div>
            <div className="toolResult__tile">
              <span className="toolResult__value">
                ₹{result.low.toLocaleString('en-IN')}–{result.high.toLocaleString('en-IN')}
              </span>
              <span className="toolResult__label">Per sq ft, {finishLabels[finish].toLowerCase()}</span>
            </div>
            <div className="toolResult__tile">
              <span className="toolResult__value">
                {result.months}–{result.monthsHigh}
              </span>
              <span className="toolResult__label">Months to completion, typical</span>
            </div>
            <div className="toolResult__tile">
              <span className="toolResult__value">{sqft.toLocaleString('en-IN')}</span>
              <span className="toolResult__label">Sq ft built-up</span>
            </div>
          </div>

          <p className="toolResult__note">
            <strong>What this excludes.</strong> Land, plan sanction and approval fees, betterment charges,
            compound wall and landscaping, and interiors beyond the selected finish level. On a joint
            development, none of the developer&rsquo;s marketing or financing cost is here either — which is
            why a developer&rsquo;s number for the same building is usually higher than this one.
          </p>

          <div className="panel" style={{ marginTop: 22 }}>
            <span className="eyebrow" style={{ marginBottom: 10 }}>
              And the statutory cost, if you are buying
            </span>
            <p style={{ fontSize: '.86rem', color: 'var(--ink-2)', lineHeight: 1.7 }}>
              {statutoryCosts.note}
            </p>
          </div>

          <div className="toolDisclaimer">
            Illustrative planning ranges, not a quotation. Actual cost depends on soil and foundation
            requirement, structural design, specification, contractor and market conditions at the time you
            build. Use this to sense-check a number you have been given, not to replace a detailed estimate.
          </div>
        </div>
      </div>

      <aside>
        <LeadForm
          kind="Tool result"
          source="/tools/construction-estimator"
          compact
          heading="Sense-check a builder's quote"
          blurb="Send us your numbers. If a quote is materially outside this range in either direction, that is worth understanding before you sign."
          payload={{
            property_type: type,
            sqft,
            finish,
            estimate_low_lakh: Math.round(result.totalLow),
            estimate_high_lakh: Math.round(result.totalHigh),
          }}
          whatsappMessage={`Hi Bhumi Estates — I estimated ${sqft} sq ft (${finishLabels[finish]}) and would like to sense-check a builder's quote.`}
          submitLabel="Send my estimate"
        />
      </aside>
    </div>
  )
}
