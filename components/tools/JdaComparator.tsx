'use client'

import { useMemo, useState } from 'react'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { corridors } from '@/lib/content/corridors'

/* JDA Structure Comparator — Plan §8.

   Deliberately transparent arithmetic rather than a black box:
   the assumptions are printed under the result, and every output
   is labelled illustrative. A landowner should be able to argue
   with this model, which is the point of showing it. */

const FSI_BY_ZONE: Record<string, number> = {
  devanahalli: 2.25,
  sarjapur: 2.5,
  hoskote: 1.75,
  'tumakuru-road': 1.75,
  'kanakapura-road': 1.75,
  doddaballapur: 1.75,
}

function crFormat(n: number) {
  if (n >= 100) return `₹${n.toFixed(0)} Cr`
  if (n >= 1) return `₹${n.toFixed(2)} Cr`
  return `₹${(n * 100).toFixed(0)} L`
}

export default function JdaComparator() {
  const [acres, setAcres] = useState(4)
  const [landValueCr, setLandValueCr] = useState(6)
  const [corridor, setCorridor] = useState('sarjapur')
  const [sellPsf, setSellPsf] = useState(9000)
  const [areaShare, setAreaShare] = useState(33)
  const [revenueShare, setRevenueShare] = useState(22)

  const model = useMemo(() => {
    const fsi = FSI_BY_ZONE[corridor] ?? 2
    const plotSqft = acres * 43560
    const saleableSqft = plotSqft * fsi
    const grossRevenueCr = (saleableSqft * sellPsf) / 1e7

    // Outright: land value today, no development exposure.
    const outright = landValueCr * acres

    // Area share: owner's share of saleable area, sold at market.
    const ownerSqft = saleableSqft * (areaShare / 100)
    const areaShareCr = (ownerSqft * sellPsf) / 1e7

    // Revenue share: percentage of gross sales as they occur.
    const revenueShareCr = grossRevenueCr * (revenueShare / 100)

    // Plotted development: no vertical build; lower yield per acre
    // but far shorter timeline and much lower execution risk.
    const plottedSaleableSqft = plotSqft * 0.6 // net of roads, parks, civic amenity
    const plottedCr = (plottedSaleableSqft * (sellPsf * 0.45)) / 1e7 * 0.55

    const options = [
      {
        key: 'outright',
        name: 'Outright sale',
        value: outright,
        horizon: '2–4 months',
        risk: 'None after registration',
        tax: 'Capital gains in the year of transfer',
        note: 'Cleanest and fastest. Gives up all development upside — right more often than the market admits.',
      },
      {
        key: 'area',
        name: `Area share (${areaShare}%)`,
        value: areaShareCr,
        horizon: '36–54 months',
        risk: 'Delivery risk, then inventory risk',
        tax: 'Sec 45(5A): gains taxed in the year the completion certificate is issued',
        note: 'You become a seller of built product. Suits an owner who can wait and wants exposure to the finished asset.',
      },
      {
        key: 'revenue',
        name: `Revenue share (${revenueShare}%)`,
        value: revenueShareCr,
        horizon: '24–48 months, staggered',
        risk: 'Exposed to the developer\'s pricing decisions',
        tax: 'GST on the revenue you receive; timing follows collections',
        note: 'Earlier cash flow, no inventory to carry. Negotiate a floor — a developer discounting to clear stock is discounting your share too.',
      },
      {
        key: 'plotted',
        name: 'Plotted development',
        value: plottedCr,
        horizon: '12–24 months',
        risk: 'Approval risk, minimal construction risk',
        tax: 'Depends on structure; typically simpler than a vertical JDA',
        note: 'Lower headline number, dramatically shorter timeline and less execution risk. Frequently the best risk-adjusted outcome on land outside a high-FSI zone.',
      },
    ].sort((a, b) => b.value - a.value)

    return { fsi, saleableSqft, grossRevenueCr, options }
  }, [acres, landValueCr, corridor, sellPsf, areaShare, revenueShare])

  const best = model.options[0]

  return (
    <div className="toolShell">
      <div className="toolPanel">
        <h2 className="h2">Your parcel</h2>
        <p className="toolPanel__sub">
          Four inputs. Change any of them and every structure re-models against the same parcel.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="acres">Extent (acres)</label>
            <input
              id="acres"
              type="number"
              min={0.25}
              step={0.25}
              value={acres}
              onChange={(e) => setAcres(Math.max(0.25, Number(e.target.value) || 0))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="lv">
              Land value <span className="hint">₹ Cr per acre</span>
            </label>
            <input
              id="lv"
              type="number"
              min={0.1}
              step={0.1}
              value={landValueCr}
              onChange={(e) => setLandValueCr(Math.max(0.1, Number(e.target.value) || 0))}
            />
          </div>
          <div className="form-group span2">
            <label htmlFor="corr">Corridor</label>
            <select id="corr" value={corridor} onChange={(e) => setCorridor(e.target.value)}>
              {corridors.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="hint">
              Sets the indicative FSI used in the model — currently {model.fsi} for this corridor.
            </span>
          </div>
          <div className="form-group span2">
            <label htmlFor="psf">
              Expected sale price <span className="hint">₹ per sq ft of built product</span>
            </label>
            <input
              id="psf"
              type="number"
              min={1000}
              step={250}
              value={sellPsf}
              onChange={(e) => setSellPsf(Math.max(1000, Number(e.target.value) || 0))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="as">Area share offered ({areaShare}%)</label>
            <input
              id="as"
              type="range"
              min={20}
              max={50}
              value={areaShare}
              onChange={(e) => setAreaShare(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="rs">Revenue share offered ({revenueShare}%)</label>
            <input
              id="rs"
              type="range"
              min={10}
              max={40}
              value={revenueShare}
              onChange={(e) => setRevenueShare(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="toolResult">
          <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 className="h3">Illustrative outcomes, ranked</h3>
            <span className="badge badge-gold">
              {model.saleableSqft.toLocaleString('en-IN', { maximumFractionDigits: 0 })} sq ft saleable
            </span>
          </div>

          <div className="stack">
            {model.options.map((o, i) => (
              <div
                key={o.key}
                className="card"
                style={{
                  padding: 20,
                  borderColor: i === 0 ? 'var(--gold)' : 'var(--line)',
                  background: i === 0 ? 'var(--gold-tint)' : '#fff',
                }}
              >
                <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <strong style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', color: 'var(--navy)' }}>
                    {o.name}
                  </strong>
                  <span className="numeral" style={{ fontSize: '1.35rem', color: i === 0 ? 'var(--gold-deep)' : 'var(--navy)' }}>
                    {crFormat(o.value)}
                  </span>
                </div>
                <div className="row-wrap" style={{ gap: 18, fontSize: '.78rem', color: 'var(--muted)', marginBottom: 8 }}>
                  <span>⏱ {o.horizon}</span>
                  <span>⚠ {o.risk}</span>
                </div>
                <p style={{ fontSize: '.85rem', color: 'var(--ink-2)', lineHeight: 1.62 }}>{o.note}</p>
                <p style={{ fontSize: '.78rem', color: 'var(--gold-deep)', marginTop: 8 }}>Tax: {o.tax}</p>
              </div>
            ))}
          </div>

          <p className="toolResult__note">
            <strong>Assumptions.</strong> Saleable area = extent × FSI for the selected corridor. Plotted
            development assumes 60% net saleable after roads, parks and civic amenity, priced at 45% of built
            rate with a 55% margin factor. No financing cost, marketing cost, GST or statutory outlay is
            modelled. The ranking changes materially with the sale price you enter — which is the single
            assumption most worth arguing about.
          </p>

          <div className="toolDisclaimer">
            This is an illustration, not a valuation or a tax opinion. Capital gains treatment under Section
            45(5A) is available to individual and HUF landowners on conditions, and GST treatment turns on how
            the agreement is drafted. Take the actual draft to your own tax counsel.
          </div>
        </div>
      </div>

      <aside className="stack" style={{ gap: 20 }}>
        <div className="panel">
          <span className="eyebrow" style={{ marginBottom: 10 }}>
            On this parcel
          </span>
          <h3 className="h3" style={{ marginBottom: 8 }}>
            {best.name} models highest.
          </h3>
          <p style={{ fontSize: '.87rem', color: 'var(--ink-2)', lineHeight: 1.68 }}>
            At {crFormat(best.value)} against an outright value of{' '}
            {crFormat(landValueCr * acres)}. Highest is not automatically best — the horizon on this structure
            is {best.horizon.toLowerCase()}, and you carry {best.risk.toLowerCase()}.
          </p>
          <ul className="checkList" style={{ marginTop: 16 }}>
            <li>
              <Icon name="check" size={15} stroke={2.4} />
              <span>Check the counterparty&rsquo;s delivery record against their declared RERA dates.</span>
            </li>
            <li>
              <Icon name="check" size={15} stroke={2.4} />
              <span>On a revenue share, negotiate a price floor before agreeing the percentage.</span>
            </li>
            <li>
              <Icon name="check" size={15} stroke={2.4} />
              <span>Verify title before structuring. A defect found later renegotiates everything.</span>
            </li>
          </ul>
        </div>

        <LeadForm
          kind="Tool result"
          source="/tools/jda-comparator"
          corridor={corridor}
          compact
          heading="Have this modelled properly"
          blurb="Send us the inputs and we will model it on your actual parcel, with the tax timing and the counterparty check included."
          payload={{
            acres,
            land_value_cr_per_acre: landValueCr,
            corridor,
            sale_psf: sellPsf,
            area_share_pct: areaShare,
            revenue_share_pct: revenueShare,
            best_structure: best.name,
          }}
          whatsappMessage={`Hi Bhumi Estates — I used the JDA comparator for ${acres} acres in ${corridor}. I'd like this modelled properly.`}
          submitLabel="Send my inputs to an advisor"
        />
      </aside>
    </div>
  )
}
