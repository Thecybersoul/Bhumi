'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import LeadForm from '@/components/site/LeadForm'
import { corridors } from '@/lib/content/corridors'
import { propertyTypes, getPropertyType } from '@/lib/content/propertyTypes'
import type { PropertyTypeSlug } from '@/lib/types'

/* Price-per-acre Corridor Comparison — Plan §8.
   Reinforces the Corridors pillar rather than duplicating it:
   this filters by what you intend to build and by budget. */

export default function CorridorComparison() {
  const [use, setUse] = useState<PropertyTypeSlug | 'all'>('all')
  const [budgetCr, setBudgetCr] = useState(20)
  const [acres, setAcres] = useState(5)

  const rows = useMemo(() => {
    const filtered = use === 'all' ? corridors : corridors.filter((c) => c.best_for.includes(use))
    const maxHigh = Math.max(...corridors.map((c) => c.price_high))

    return filtered
      .map((c) => {
        const midpoint = (c.price_low + c.price_high) / 2
        const acresAffordable = budgetCr / midpoint
        const costForAcres = midpoint * acres
        return {
          ...c,
          midpoint,
          acresAffordable,
          costForAcres,
          withinBudget: costForAcres <= budgetCr,
          widthLow: (c.price_low / maxHigh) * 100,
          widthHigh: (c.price_high / maxHigh) * 100,
        }
      })
      .sort((a, b) => a.midpoint - b.midpoint)
  }, [use, budgetCr, acres])

  const reachable = rows.filter((r) => r.withinBudget)

  return (
    <div className="toolShell">
      <div className="toolPanel">
        <h2 className="h2">Compare corridors</h2>
        <p className="toolPanel__sub">
          Indicative land bands side by side. Filter by what you intend to build, then see where your budget
          actually reaches.
        </p>

        <div className="form-grid">
          <div className="form-group span2">
            <label>Intended use</label>
            <div className="optionRow">
              <button type="button" aria-pressed={use === 'all'} onClick={() => setUse('all')}>
                Any use
              </button>
              {propertyTypes.map((t) => (
                <button key={t.slug} type="button" aria-pressed={use === t.slug} onClick={() => setUse(t.slug)}>
                  {t.shortName}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="b">Budget (₹ Cr)</label>
            <input
              id="b"
              type="number"
              min={0.5}
              step={0.5}
              value={budgetCr}
              onChange={(e) => setBudgetCr(Math.max(0.5, Number(e.target.value) || 0))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ac">Extent you want (acres)</label>
            <input
              id="ac"
              type="number"
              min={0.25}
              step={0.25}
              value={acres}
              onChange={(e) => setAcres(Math.max(0.25, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        <div className="toolResult">
          <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 className="h3">
              {rows.length} corridor{rows.length === 1 ? '' : 's'}
              {use !== 'all' && ` suited to ${getPropertyType(use)?.shortName.toLowerCase()}`}
            </h3>
            <span className={`badge badge-${reachable.length ? 'verified' : 'flagged'}`}>
              {reachable.length} within ₹{budgetCr} Cr for {acres} acres
            </span>
          </div>

          <div className="stack" style={{ gap: 14 }}>
            {rows.map((r) => (
              <div
                key={r.slug}
                className="card"
                style={{
                  padding: 18,
                  opacity: r.withinBudget ? 1 : 0.62,
                  borderColor: r.withinBudget ? 'rgba(194,151,74,.4)' : 'var(--line)',
                }}
              >
                <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <Link href={`/corridors/${r.slug}`} style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '.95rem' }}>
                    {r.name}
                  </Link>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--ink-2)' }}>
                    ₹{r.price_low}–{r.price_high} Cr/ac
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    height: 10,
                    background: 'var(--line-2)',
                    borderRadius: 100,
                    overflow: 'hidden',
                    marginBottom: 10,
                  }}
                  role="img"
                  aria-label={`Indicative band ₹${r.price_low} to ₹${r.price_high} crore per acre`}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: `${r.widthLow}%`,
                      width: `${Math.max(2, r.widthHigh - r.widthLow)}%`,
                      top: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, var(--gold-deep), var(--gold-soft))',
                      borderRadius: 100,
                    }}
                  />
                </div>

                <div className="row-wrap" style={{ gap: 20, fontSize: '.8rem', color: 'var(--muted)' }}>
                  <span>
                    <strong style={{ color: r.withinBudget ? 'var(--verified)' : 'var(--flagged)' }}>
                      ₹{r.costForAcres.toFixed(1)} Cr
                    </strong>{' '}
                    for {acres} acres
                  </span>
                  <span>
                    or <strong style={{ color: 'var(--navy)' }}>{r.acresAffordable.toFixed(1)} acres</strong> for your budget
                  </span>
                  <span>YoY {r.yoy_pct}%</span>
                </div>

                <p style={{ fontSize: '.82rem', color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--flagged)' }}>Watch:</strong> {r.watch_outs[0]}
                </p>
              </div>
            ))}
          </div>

          <div className="toolDisclaimer">
            Bands are indicative ranges compiled from publicly reported transactions, listing data and our own
            transaction history. A specific parcel can sit outside its corridor band in either direction for good
            reasons — frontage, access, conversion status and assembly all move it.
          </div>
        </div>
      </div>

      <aside>
        <LeadForm
          kind="Tool result"
          source="/tools/corridor-comparison"
          compact
          heading="Where should you actually be looking?"
          blurb="Send us the brief and we will tell you which corridor fits it, and which parcels are currently available in that band."
          payload={{ intended_use: use, budget_cr: budgetCr, acres, reachable: reachable.map((r) => r.slug).join(', ') }}
          whatsappMessage={`Hi Bhumi Estates — I'm looking for about ${acres} acres with a budget of ₹${budgetCr} Cr. Which corridor fits?`}
          submitLabel="Send my brief"
        />
      </aside>
    </div>
  )
}
