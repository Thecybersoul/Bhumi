'use client'

import { useId, useState } from 'react'

/* Single-series weekly trend — a line, not a bar chart, because the
   job is "is momentum up or down", which is what a line answers.
   Kept to one series (no legend needed) and one hue: navy for the
   line, gold only on the current point, matching how gold already
   means "the one thing to look at" everywhere else in the admin. */

export interface TrendPoint {
  label: string
  value: number
}

const W = 640
const H = 140
const PAD_L = 8
const PAD_R = 36
const PAD_T = 16
const PAD_B = 28

export default function TrendChart({
  data,
  title,
  unit = '',
}: {
  data: TrendPoint[]
  title: string
  unit?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId()

  const max = Math.max(...data.map((d) => d.value), 1)
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const x = (i: number) => PAD_L + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2)
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PAD_T + plotH} L ${x(0)} ${PAD_T + plotH} Z`

  const last = data[data.length - 1]
  const active = hover != null ? data[hover] : null

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    const idx = Math.round(frac * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const showEveryNth = Math.ceil(data.length / 6)

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={`${title}: trend over ${data.length} weeks, ending at ${last?.value ?? 0}${unit}`}
      >
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--navy-600)" stopOpacity=".12" />
            <stop offset="100%" stopColor="var(--navy-600)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline gridline */}
        <line x1={PAD_L} y1={PAD_T + plotH} x2={W - PAD_R} y2={PAD_T + plotH} stroke="var(--line)" strokeWidth="1" />

        <path d={areaPath} fill={`url(#${gid}-area)`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--navy-600)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* end point + direct label — the one value worth reading without hovering */}
        {last && (
          <>
            <circle cx={x(data.length - 1)} cy={y(last.value)} r="5" fill="var(--gold)" stroke="var(--paper)" strokeWidth="2" />
            <text x={x(data.length - 1) + 9} y={y(last.value)} dy="4" fontSize="12" fontWeight="700" fill="var(--navy)">
              {last.value}
              {unit}
            </text>
          </>
        )}

        {/* sparse x-axis labels */}
        {data.map((d, i) =>
          i % showEveryNth === 0 || i === data.length - 1 ? (
            <text key={i} x={x(i)} y={H - 8} fontSize="10" fill="var(--muted)" textAnchor="middle">
              {d.label}
            </text>
          ) : null
        )}

        {/* crosshair */}
        {active && (
          <>
            <line x1={x(hover!)} y1={PAD_T} x2={x(hover!)} y2={PAD_T + plotH} stroke="var(--line)" strokeWidth="1" />
            <circle cx={x(hover!)} cy={y(active.value)} r="4" fill="var(--navy-600)" stroke="var(--paper)" strokeWidth="2" />
          </>
        )}

        {/* hover hit layer — bigger than the line, covers the whole plot */}
        <rect
          x={PAD_L}
          y={0}
          width={plotW}
          height={H}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {active && (
        <div
          style={{
            fontSize: '.78rem',
            color: 'var(--ink-2)',
            marginTop: 2,
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: 220,
          }}
        >
          <span>{active.label}</span>
          <strong style={{ color: 'var(--navy)' }}>
            {active.value}
            {unit}
          </strong>
        </div>
      )}

      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: '.76rem', color: 'var(--muted)', cursor: 'pointer' }}>View as table</summary>
        <table className="data-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Week</th>
              <th>{title}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td>{d.label}</td>
                <td>
                  {d.value}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
