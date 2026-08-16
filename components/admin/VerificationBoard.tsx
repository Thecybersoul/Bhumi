'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/site/Icon'
import { verificationStages } from '@/lib/content/verification'
import type { VerificationCase, StageStatus, VerificationStageKey } from '@/lib/types'

/* The internal side of the six-stage protocol.

   Clicking a stage cycles its status. That single interaction is
   what keeps the public transparency dashboard honest: the
   published figures are derived from these records, so the only
   way to change what the public sees is to change what actually
   happened on a case. */

const CYCLE: StageStatus[] = ['Not started', 'In progress', 'Verified', 'Flagged']

const toneFor = (s: StageStatus) =>
  s === 'Verified' ? 'is-verified' : s === 'In progress' ? 'is-progress' : s === 'Flagged' ? 'is-flagged' : ''

export default function VerificationBoard({
  cases: initial,
  source,
  aggregate,
}: {
  cases: VerificationCase[]
  source: 'live' | 'fallback'
  aggregate: ReturnType<typeof import('@/lib/db').deriveFromCases>
}) {
  const router = useRouter()
  const [cases, setCases] = useState(initial)
  const [filter, setFilter] = useState<'all' | 'In progress' | 'Verified' | 'Flagged'>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const shown = filter === 'all' ? cases : cases.filter((c) => c.outcome === filter)

  function say(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  async function cycleStage(caseId: string, stageKey: VerificationStageKey) {
    const record = cases.find((c) => c.id === caseId)
    if (!record) return
    const current = record.stages.find((s) => s.key === stageKey)?.status ?? 'Not started'
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]

    let flagReason = ''
    if (next === 'Flagged') {
      flagReason = window.prompt('What is the disqualifying finding? This appears in the published flag reasons.') ?? ''
      if (!flagReason.trim()) return
    }

    setBusy(`${caseId}:${stageKey}`)

    // Optimistic: recompute the case exactly the way the API will.
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c
        const stages = c.stages.map((s) => (s.key === stageKey ? { ...s, status: next } : s))
        const flagged = stages.find((s) => s.status === 'Flagged')
        const allVerified = stages.every((s) => s.status === 'Verified')
        return {
          ...c,
          stages,
          outcome: flagged ? 'Flagged' : allVerified ? 'Verified' : 'In progress',
          flag_reason: flagged ? flagReason || c.flag_reason : '',
        }
      })
    )

    try {
      const res = await fetch('/api/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseId, stage: stageKey, status: next, flag_reason: flagReason }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Update failed')
      say(body.persisted ? `Stage set to ${next}` : `Stage set to ${next} (not persisted — no database)`)
      if (body.persisted) router.refresh()
    } catch (e) {
      say((e as Error).message)
      setCases(initial)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Verification pipeline</h1>
          <p>
            Six stages per case, each separately tracked. Click a stage to cycle it: not started → in progress
            → verified → flagged. A flag anywhere closes the case; all six verified issues the certificate.
            These records are what the public transparency dashboard is computed from.
          </p>
        </div>
        <span className={`sourcePill ${source === 'live' ? 'is-live' : 'is-fallback'}`}>
          {source === 'live' ? 'Live database' : 'Seeded data'}
        </span>
      </div>

      <div className="statRow">
        <div className="statTile">
          <span className="statTile__value">{aggregate.reviewed}</span>
          <span className="statTile__label">Cases on record</span>
          <span className="statTile__note">{aggregate.acreage.toLocaleString('en-IN')} acres</span>
        </div>
        <div className="statTile is-progress" style={{ borderTopColor: 'var(--progress)' }}>
          <span className="statTile__value">{aggregate.inProgress}</span>
          <span className="statTile__label">In progress</span>
          <span className="statTile__note">Currently on the desk</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{aggregate.verified}</span>
          <span className="statTile__label">Verified</span>
          <span className="statTile__note">Median {aggregate.medianTurnaround || '—'} days to certificate</span>
        </div>
        <div className="statTile is-flagged">
          <span className="statTile__value">{aggregate.flagged}</span>
          <span className="statTile__label">Flagged</span>
          <span className="statTile__note">
            {aggregate.reviewed ? Math.round((aggregate.flagged / aggregate.reviewed) * 100) : 0}% of cases on record
          </span>
        </div>
      </div>

      <div className="row-wrap" style={{ marginBottom: 18 }}>
        {(['all', 'In progress', 'Verified', 'Flagged'] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? 'selected' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${cases.length})` : `${f} (${cases.filter((c) => c.outcome === f).length})`}
          </button>
        ))}
      </div>

      <div className="pipeline">
        {shown.map((c) => (
          <article
            key={c.id}
            className={`pipelineCase ${
              c.outcome === 'Flagged' ? 'is-flagged' : c.outcome === 'Verified' ? 'is-verified' : 'is-progress'
            }`}
          >
            <div className="pipelineCase__head">
              <div>
                <span className="pipelineCase__ref">{c.reference}</span>
                <div className="pipelineCase__label">{c.parcel_label}</div>
                <div className="pipelineCase__meta">
                  {c.location}
                  {c.survey_number && ` · ${c.survey_number}`}
                  {c.extent_acres ? ` · ${c.extent_acres} acres` : ''}
                  {c.advisor && ` · ${c.advisor}`}
                </div>
              </div>
              <div className="row-wrap">
                <span
                  className={`badge badge-${
                    c.outcome === 'Verified' ? 'verified' : c.outcome === 'Flagged' ? 'flagged' : 'progress'
                  }`}
                >
                  {c.outcome}
                </span>
                {c.turnaround_days ? (
                  <span style={{ fontSize: '.76rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                    {c.turnaround_days}d
                  </span>
                ) : null}
              </div>
            </div>

            <div className="pipelineTrack">
              {verificationStages.map((def) => {
                const stage = c.stages.find((s) => s.key === def.key)
                const status = stage?.status ?? 'Not started'
                const key = `${c.id}:${def.key}`
                return (
                  <button
                    key={def.key}
                    className={`pipelineStage ${toneFor(status)}`}
                    onClick={() => cycleStage(c.id, def.key)}
                    disabled={busy === key}
                    title={`${def.title} — ${status}. Click to advance.`}
                  >
                    <span className="pipelineStage__num">
                      {def.number} · {status === 'Not started' ? '—' : status}
                    </span>
                    <span className="pipelineStage__name">{def.short}</span>
                  </button>
                )
              })}
            </div>

            {c.flag_reason && (
              <p style={{ fontSize: '.83rem', color: 'var(--flagged)', marginTop: 12, lineHeight: 1.6 }}>
                <Icon name="flag" size={13} /> {c.flag_reason}
              </p>
            )}
          </article>
        ))}
      </div>

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </>
  )
}
