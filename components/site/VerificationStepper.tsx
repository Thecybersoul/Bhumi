'use client'

import { useState } from 'react'
import Icon from './Icon'
import { verificationStages, whyDiscrete, totalTurnaround } from '@/lib/content/verification'
import type { StageStatus, VerificationStage } from '@/lib/types'

/* The signature visual asset (Plan §11).

   The interaction language is deliberately borrowed from
   shipment tracking — a numbered track, a status badge per
   stage, and a visibly stalled step. That is a pattern people
   already trust, applied to something they currently have no
   visibility into at all. */

const statusMeta: Record<StageStatus, { label: string; cls: string }> = {
  Verified: { label: 'Verified', cls: 'is-verified' },
  'In progress': { label: 'In progress', cls: 'is-progress' },
  Flagged: { label: 'Flagged', cls: 'is-flagged' },
  'Not started': { label: 'Not started', cls: 'is-idle' },
}

export default function VerificationStepper({
  /** Live stage states, when rendering a specific parcel. Omitted
      on the marketing page, where the protocol is shown neutrally. */
  live,
  compact = false,
  initialOpen = 0,
}: {
  live?: VerificationStage[]
  compact?: boolean
  initialOpen?: number | null
}) {
  const [open, setOpen] = useState<number | null>(initialOpen)

  const statusFor = (key: string): StageStatus | null =>
    live?.find((s) => s.key === key)?.status ?? null

  return (
    <div className={`stepper ${compact ? 'is-compact' : ''}`}>
      <ol className="stepper__track">
        {verificationStages.map((stage, i) => {
          const status = statusFor(stage.key)
          const meta = status ? statusMeta[status] : null
          const isOpen = open === i

          return (
            <li key={stage.key} className={`stepper__step ${meta?.cls ?? ''} ${isOpen ? 'is-open' : ''}`}>
              <button
                className="stepper__head"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`stage-${stage.key}`}
              >
                <span className="stepper__marker" aria-hidden="true">
                  {status === 'Verified' ? (
                    <Icon name="check" size={14} stroke={2.6} />
                  ) : status === 'Flagged' ? (
                    <Icon name="flag" size={13} stroke={2.2} />
                  ) : (
                    stage.number
                  )}
                </span>

                <span className="stepper__headText">
                  <span className="stepper__title">{stage.title}</span>
                  <span className="stepper__summary">{stage.summary}</span>
                </span>

                <span className="stepper__meta">
                  {meta ? (
                    <span className={`badge badge-${status === 'In progress' ? 'progress' : status === 'Verified' ? 'verified' : status === 'Flagged' ? 'flagged' : 'pending'}`}>
                      {meta.label}
                    </span>
                  ) : (
                    <span className="stepper__days">
                      {stage.typicalDays[0]}–{stage.typicalDays[1]} days
                    </span>
                  )}
                  <svg className="stepper__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="stepper__body" id={`stage-${stage.key}`}>
                  <p className="stepper__plain">{stage.plain}</p>

                  <div className="stepper__grid">
                    <div>
                      <h4>What we collect</h4>
                      <ul>
                        {stage.inputs.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>What we check</h4>
                      <ul>
                        {stage.checks.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="stepper__output">
                    <strong>What you get:</strong> {stage.output}
                  </div>

                  {stage.killers.length > 0 && (
                    <div className="stepper__killers">
                      <span className="stepper__killersLabel">
                        <Icon name="flag" size={13} /> Findings that stop a deal here
                      </span>
                      <ul>
                        {stage.killers.map((k) => (
                          <li key={k}>{k}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {!compact && (
        <div className="stepper__note">
          <h3 className="h3">{whyDiscrete.heading}</h3>
          <p>{whyDiscrete.body}</p>
          <p className="stepper__total">
            Typical end-to-end turnaround:{' '}
            <strong>
              {totalTurnaround.low}–{totalTurnaround.high} days
            </strong>{' '}
            — excluding time we spend waiting on a document only you can supply, which we exclude from our
            published averages rather than quietly absorbing into them.
          </p>
        </div>
      )}
    </div>
  )
}
