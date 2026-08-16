'use client'

import { useMemo, useState } from 'react'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'

/* "Is Your Land JDA-Ready?" — Plan §7.
   A short qualifying quiz that engages and segments a visitor
   instead of asking for contact details cold. It returns a list
   of named blockers rather than a yes/no, because the blockers
   are the useful part. */

interface Q {
  id: string
  text: string
  options: { label: string; score: 0 | 1 | 2; blocker?: string; hint?: string }[]
}

const questions: Q[] = [
  {
    id: 'ownership',
    text: 'Who can legally convey the land?',
    options: [
      { label: 'A single recorded owner', score: 2 },
      {
        label: 'Co-owners, all traceable and willing',
        score: 1,
        blocker: 'Written consent from every co-owner, recorded before the agreement',
        hint: 'Workable, but every co-owner must sign. One unreachable heir stops the deal at the registration counter.',
      },
      {
        label: 'An agreement holder or power of attorney',
        score: 0,
        blocker: 'The seller does not hold title — the recorded owner must be brought to the table',
        hint: 'This is the single most common reason we flag a parcel. An agreement to sell is not ownership.',
      },
    ],
  },
  {
    id: 'access',
    text: 'Is there recorded access to a public road?',
    options: [
      { label: 'Yes, and the road width is on record', score: 2 },
      {
        label: 'There is a road, but I am not sure it is recorded',
        score: 1,
        blocker: 'Access needs to be traced to a recorded public road and the width confirmed',
        hint: 'A road that exists in practice but not on record disappears the day the neighbour sells.',
      },
      {
        label: 'Access is over adjoining land',
        score: 0,
        blocker: 'Parcel may be landlocked in law — an easement or access deed is needed first',
      },
    ],
  },
  {
    id: 'zoning',
    text: 'Does the master plan permit the development you have in mind?',
    options: [
      { label: 'Yes, confirmed with the planning authority', score: 2 },
      { label: 'I believe so, but have not confirmed', score: 1, blocker: 'Zoning confirmation with the governing authority' },
      { label: 'No, or the land is in a green belt', score: 0, blocker: 'Change of land use, which is a separate process from conversion' },
    ],
  },
  {
    id: 'conversion',
    text: 'What is the conversion position?',
    options: [
      { label: 'Converted for non-agricultural use', score: 2 },
      { label: 'Application filed, or deemed conversion applies', score: 1, blocker: 'Conversion order to be produced and dated' },
      { label: 'Agricultural, nothing filed', score: 0, blocker: 'DC conversion under Section 95, budgeted into the timeline' },
    ],
  },
  {
    id: 'encumbrance',
    text: 'Is there any mortgage, loan or charge against the land?',
    options: [
      { label: 'No — and I have pulled a recent EC myself', score: 2 },
      { label: 'A loan was repaid, but I am not sure a release was recorded', score: 1, blocker: 'Release deed to be located and recorded' },
      { label: 'Yes, there is a subsisting charge', score: 0, blocker: 'Charge must be discharged and the release recorded before any agreement' },
    ],
  },
  {
    id: 'litigation',
    text: 'Any dispute, claim or family disagreement over this land?',
    options: [
      { label: 'None, and no partition has ever been contested', score: 2 },
      { label: 'A past issue that was settled', score: 1, blocker: 'Settlement to be verified as recorded, not merely agreed' },
      { label: 'A live dispute or an unhappy family member', score: 0, blocker: 'Litigation position must be resolved — no developer will commence against a live claim' },
    ],
  },
  {
    id: 'records',
    text: 'Does the revenue record (RTC) show your name and the right extent?',
    options: [
      { label: 'Yes, and I have a digitally signed i-RTC', score: 2 },
      { label: 'Broadly yes, with a spelling or extent difference', score: 1, blocker: 'Revenue record reconciliation with the title deed' },
      { label: 'It shows a predecessor, or I have not checked', score: 0, blocker: 'Mutation to be completed before the parcel can be transacted' },
    ],
  },
  {
    id: 'extent',
    text: 'Has the boundary been measured by a licensed surveyor recently?',
    options: [
      { label: 'Yes, within the last two years', score: 2 },
      { label: 'Long ago, or by the neighbour', score: 1, blocker: 'Fresh licensed survey against the tippani' },
      { label: 'Never', score: 0, blocker: 'Licensed survey — extent shortfalls are common and material' },
    ],
  },
]

export default function JdaReadiness() {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const result = useMemo(() => {
    const answered = questions.filter((q) => answers[q.id] !== undefined)
    const score = answered.reduce((s, q) => s + questions.find((x) => x.id === q.id)!.options[answers[q.id]].score, 0)
    const max = questions.length * 2
    const blockers = answered
      .map((q) => q.options[answers[q.id]].blocker)
      .filter((b): b is string => Boolean(b))
    const pct = max ? Math.round((score / max) * 100) : 0

    let verdict = 'Not yet assessed'
    let tone = 'is-idle'
    if (answered.length === questions.length) {
      if (blockers.length === 0) {
        verdict = 'JDA-ready'
        tone = 'is-verified'
      } else if (score >= max * 0.7) {
        verdict = 'Close — fixable blockers'
        tone = 'is-progress'
      } else if (score >= max * 0.45) {
        verdict = 'Work needed first'
        tone = 'is-pending'
      } else {
        verdict = 'Not ready — structural issues'
        tone = 'is-flagged'
      }
    }

    return { score, max, pct, blockers, verdict, tone, complete: answered.length === questions.length, answered: answered.length }
  }, [answers])

  return (
    <div className="toolShell">
      <div className="toolPanel">
        <h2 className="h2">Eight questions</h2>
        <p className="toolPanel__sub">
          Answer honestly — a flattering answer here only moves the problem to a point where it costs more.
          Nothing is submitted unless you choose to send it.
        </p>

        {questions.map((q, qi) => (
          <div key={q.id} className="quizQuestion">
            <p className="quizQuestion__text">
              {qi + 1}. {q.text}
            </p>
            <div className="optionRow">
              {q.options.map((o, oi) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={answers[q.id] === oi}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {answers[q.id] !== undefined && q.options[answers[q.id]].hint && (
              <p className="quizQuestion__hint">{q.options[answers[q.id]].hint}</p>
            )}
          </div>
        ))}

        <div className="toolResult">
          <div className="scoreRing">
            <div
              className="scoreRing__circle"
              style={{
                background: `conic-gradient(var(--gold) ${result.pct * 3.6}deg, var(--line-2) 0deg)`,
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: 8,
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {result.score}/{result.max}
              </span>
            </div>
            <div>
              <span
                className={`badge badge-${
                  result.tone === 'is-verified'
                    ? 'verified'
                    : result.tone === 'is-progress'
                      ? 'progress'
                      : result.tone === 'is-flagged'
                        ? 'flagged'
                        : 'pending'
                }`}
              >
                {result.verdict}
              </span>
              <h3 className="h3" style={{ marginTop: 8 }}>
                {result.complete
                  ? result.blockers.length === 0
                    ? 'Nothing is blocking a joint development.'
                    : `${result.blockers.length} ${result.blockers.length === 1 ? 'blocker' : 'blockers'} to clear first.`
                  : `${result.answered} of ${questions.length} answered.`}
              </h3>
            </div>
          </div>

          {result.blockers.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <span className="eyebrow" style={{ marginBottom: 12 }}>
                What would need fixing
              </span>
              <ul className="checkList">
                {result.blockers.map((b) => (
                  <li key={b}>
                    <Icon name="flag" size={15} stroke={2.2} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="toolDisclaimer">
            This is a screening check, not diligence. It tests the six things that most commonly stop a joint
            development — it cannot see a court record, a buffer zone, or an heir nobody mentioned. Those come
            out of the full six-stage protocol.
          </div>
        </div>
      </div>

      <aside>
        <LeadForm
          kind="Tool result"
          source="/tools/jda-readiness"
          compact
          heading={result.complete ? `Score ${result.score}/${result.max} — get the blockers checked` : 'Get a free readiness review'}
          blurb="Send your answers and a survey number. We will confirm which blockers are real and what each costs to clear."
          qualifier={{ name: 'survey_number', label: 'Survey number and village', placeholder: 'e.g. Sy. 96/3, Sarjapur' }}
          payload={{
            score: result.score,
            max: result.max,
            verdict: result.verdict,
            blockers: result.blockers.join('; ') || 'none',
          }}
          whatsappMessage={`Hi Bhumi Estates — I scored ${result.score}/${result.max} on the JDA readiness check. My parcel is at:`}
          submitLabel="Send my answers"
        />
      </aside>
    </div>
  )
}
