'use client'

import { useMemo, useState } from 'react'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { warehouseThresholds as T } from '@/lib/content/tools'

/* Warehouse Suitability Checklist — Plan §8.
   Checks a specific building against the buyer's own operating
   requirement, not against a generic Grade A definition. */

export default function WarehouseChecklist() {
  // What the building offers
  const [height, setHeight] = useState(9.5)
  const [load, setLoad] = useState(5)
  const [docks, setDocks] = useState(12)
  const [area, setArea] = useState(120000)
  const [power, setPower] = useState(500)
  const [apron, setApron] = useState(24)

  // What the occupier needs
  const [needHeight, setNeedHeight] = useState(10)
  const [needPower, setNeedPower] = useState(750)
  const [vna, setVna] = useState(false)

  const checks = useMemo(() => {
    const requiredDocks = Math.ceil(area / T.dockPerSqft)
    const requiredLoad = vna ? T.floorLoadTSqm.vna : T.floorLoadTSqm.gradeA

    return [
      {
        label: 'Clear height at eaves',
        actual: `${height} m`,
        required: `${needHeight} m`,
        pass: height >= needHeight,
        note:
          height >= needHeight
            ? `Clears your requirement. Grade A convention is ${T.clearHeightM.gradeA}m minimum, ${T.clearHeightM.typical[0]}–${T.clearHeightM.typical[1]}m typical.`
            : `Short by ${(needHeight - height).toFixed(2)}m. At roughly 1.5m per racking level, that is likely a full level of storage volume.`,
      },
      {
        label: 'Floor load (UDL)',
        actual: `${load} T/m²`,
        required: `${requiredLoad} T/m²`,
        pass: load >= requiredLoad,
        note: vna
          ? `Very narrow aisle racking needs around ${T.floorLoadTSqm.vna} T/m² and ${T.flatness} flatness. Confirm the flatness certificate, not just the load rating.`
          : `Grade A convention is around ${T.floorLoadTSqm.gradeA} T/m² with ${T.flatness} flatness in trimix or VDF concrete.`,
      },
      {
        label: 'Dock doors',
        actual: String(docks),
        required: `${requiredDocks} for ${area.toLocaleString('en-IN')} sq ft`,
        pass: docks >= requiredDocks,
        note:
          docks >= requiredDocks
            ? `Meets the roughly one-per-${T.dockPerSqft.toLocaleString('en-IN')}-sq-ft convention, at ~${T.dockHeightM}m dock height.`
            : `Short by ${requiredDocks - docks} docks. Under-docking shows up as trailer queuing, not as a line in the lease.`,
      },
      {
        label: 'Sanctioned power',
        actual: `${power} KVA`,
        required: `${needPower} KVA`,
        pass: power >= needPower,
        note:
          power >= needPower
            ? 'Confirm the sanction with the utility directly, not from the seller\'s documentation.'
            : `Short by ${needPower - power} KVA. Upgrading sanctioned load after signing is slow and occasionally not possible at scale.`,
      },
      {
        label: 'Apron depth',
        actual: `${apron} m`,
        required: `${T.apronM} m`,
        pass: apron >= T.apronM,
        note:
          apron >= T.apronM
            ? 'Sufficient for 40-foot trailer movement. Also test the internal turning circle on site.'
            : `Short by ${(T.apronM - apron).toFixed(1)}m for 40-foot trailers. Excellent docks with an inadequate apron means trailers queue on the road.`,
      },
      {
        label: 'Grade A on the market convention',
        actual: height >= T.clearHeightM.gradeA && load >= T.floorLoadTSqm.gradeA ? 'Meets' : 'Does not meet',
        required: `≥${T.clearHeightM.gradeA}m and ≥${T.floorLoadTSqm.gradeA} T/m²`,
        pass: height >= T.clearHeightM.gradeA && load >= T.floorLoadTSqm.gradeA,
        note: '"Grade A" is a market convention, not a certified standard. If a building does not meet it, it should be priced as Grade B regardless of how it is marketed.',
      },
    ]
  }, [height, load, docks, area, power, apron, needHeight, needPower, vna])

  const passed = checks.filter((c) => c.pass).length
  const failed = checks.filter((c) => !c.pass)

  return (
    <div className="toolShell">
      <div className="toolPanel">
        <h2 className="h2">The building</h2>
        <p className="toolPanel__sub">
          Enter what the marketing pack claims. Then measure it yourself on site and enter that instead — the
          gap between the two is frequently the finding.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="h">Clear height at eaves (m)</label>
            <input id="h" type="number" step={0.1} min={3} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label htmlFor="l">Floor load, UDL (T/m²)</label>
            <input id="l" type="number" step={0.5} min={1} value={load} onChange={(e) => setLoad(Number(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label htmlFor="a">Built-up area (sq ft)</label>
            <input id="a" type="number" step={1000} min={1000} value={area} onChange={(e) => setArea(Number(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label htmlFor="d">Dock doors</label>
            <input id="d" type="number" min={0} value={docks} onChange={(e) => setDocks(Number(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label htmlFor="p">Sanctioned power (KVA)</label>
            <input id="p" type="number" step={50} min={0} value={power} onChange={(e) => setPower(Number(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label htmlFor="ap">Apron depth (m)</label>
            <input id="ap" type="number" step={0.5} min={0} value={apron} onChange={(e) => setApron(Number(e.target.value) || 0)} />
          </div>
        </div>

        <p className="form-section-title">Your operating requirement</p>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="nh">Clear height you need (m)</label>
            <input id="nh" type="number" step={0.5} min={3} value={needHeight} onChange={(e) => setNeedHeight(Number(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label htmlFor="np">Power you need (KVA)</label>
            <input id="np" type="number" step={50} min={0} value={needPower} onChange={(e) => setNeedPower(Number(e.target.value) || 0)} />
          </div>
          <div className="form-group span2">
            <label>Racking</label>
            <div className="optionRow">
              <button type="button" aria-pressed={!vna} onClick={() => setVna(false)}>
                Conventional racking
              </button>
              <button type="button" aria-pressed={vna} onClick={() => setVna(true)}>
                Very narrow aisle (VNA)
              </button>
            </div>
          </div>
        </div>

        <div className="toolResult">
          <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 className="h3">
              {passed} of {checks.length} checks pass
            </h3>
            <span className={`badge badge-${failed.length === 0 ? 'verified' : failed.length <= 2 ? 'pending' : 'flagged'}`}>
              {failed.length === 0 ? 'Suitable' : failed.length <= 2 ? 'Conditionally suitable' : 'Not suitable as specified'}
            </span>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            {checks.map((c) => (
              <div
                key={c.label}
                className="card"
                style={{
                  padding: 16,
                  borderLeft: `3px solid ${c.pass ? 'var(--verified)' : 'var(--flagged)'}`,
                }}
              >
                <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: '.92rem', color: 'var(--navy)' }}>
                    <span style={{ color: c.pass ? 'var(--verified)' : 'var(--flagged)', marginRight: 8 }}>
                      {c.pass ? '✓' : '×'}
                    </span>
                    {c.label}
                  </strong>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--ink-2)' }}>
                    {c.actual} <span style={{ color: 'var(--muted)' }}>vs {c.required}</span>
                  </span>
                </div>
                <p style={{ fontSize: '.83rem', color: 'var(--ink-2)', lineHeight: 1.6 }}>{c.note}</p>
              </div>
            ))}
          </div>

          <div className="panel" style={{ marginTop: 22 }}>
            <span className="eyebrow" style={{ marginBottom: 10 }}>
              Also confirm before shortlisting
            </span>
            <ul className="checkList">
              <li>
                <Icon name="check" size={15} stroke={2.4} />
                <span>Fire NOC covering your actual storage category, not a generic one</span>
              </li>
              <li>
                <Icon name="check" size={15} stroke={2.4} />
                <span>Industrial zoning or KIADB position, and change-of-use exposure</span>
              </li>
              <li>
                <Icon name="check" size={15} stroke={2.4} />
                <span>Highway access measured from the parcel&rsquo;s real access point</span>
              </li>
              <li>
                <Icon name="check" size={15} stroke={2.4} />
                <span>Floor flatness certificate ({T.flatness}), separately from the load rating</span>
              </li>
            </ul>
          </div>

          <div className="toolDisclaimer">
            Thresholds reflect prevailing Grade A market convention in India, not a statutory standard.
            Measure clear height at eaves at several points yourself — a 620mm variance from a marketing pack
            is a real finding we have made on a live project.
          </div>
        </div>
      </div>

      <aside>
        <LeadForm
          kind="Tool result"
          source="/tools/warehouse-checklist"
          compact
          heading={failed.length > 0 ? `${failed.length} specification gaps found` : 'Have the specification audited'}
          blurb="We measure the building against your requirement and issue the findings in writing — which is what renegotiates a rent."
          payload={{
            height_m: height,
            load_t_sqm: load,
            docks,
            area_sqft: area,
            power_kva: power,
            apron_m: apron,
            passed: `${passed}/${checks.length}`,
            failures: failed.map((f) => f.label).join('; ') || 'none',
          }}
          whatsappMessage={`Hi Bhumi Estates — I ran the warehouse checklist (${passed}/${checks.length} passing) and would like a specification audit.`}
          submitLabel="Request a specification audit"
        />
      </aside>
    </div>
  )
}
