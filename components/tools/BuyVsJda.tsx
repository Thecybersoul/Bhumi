'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'

/* Buy vs JDA Decision Guide — Plan §8.
   Weighs the owner's position rather than the parcel's. The
   output is a reasoned recommendation with the trade-off stated,
   not a score. */

const dimensions = [
  {
    id: 'capital',
    question: 'Do you need the capital in the next 18 months?',
    options: [
      { label: 'Yes, for a specific commitment', sell: 3, jda: 0 },
      { label: 'It would be useful, not essential', sell: 1, jda: 1 },
      { label: 'No — this is long-horizon money', sell: 0, jda: 3 },
    ],
  },
  {
    id: 'horizon',
    question: 'How long can you leave this parcel alone?',
    options: [
      { label: 'Under 2 years', sell: 3, jda: 0 },
      { label: '2–4 years', sell: 1, jda: 2 },
      { label: '5 years or more', sell: 0, jda: 3 },
    ],
  },
  {
    id: 'risk',
    question: 'If the developer delivers two years late, what happens to you?',
    options: [
      { label: 'Serious problem — I cannot absorb that', sell: 3, jda: 0 },
      { label: 'Frustrating, but survivable', sell: 1, jda: 2 },
      { label: 'Largely irrelevant to my plans', sell: 0, jda: 3 },
    ],
  },
  {
    id: 'appetite',
    question: 'Are you willing to become a seller of apartments or plots?',
    options: [
      { label: 'No — I want a clean exit', sell: 3, jda: 0 },
      { label: 'With help, yes', sell: 1, jda: 2 },
      { label: 'Yes, that is part of the appeal', sell: 0, jda: 3 },
    ],
  },
  {
    id: 'corridor',
    question: 'Is the corridor already developed, or still waiting on infrastructure?',
    options: [
      { label: 'Still waiting — the story is years out', sell: 2, jda: 1 },
      { label: 'Under construction, timelines announced', sell: 1, jda: 2 },
      { label: 'Already built out, demand is here now', sell: 0, jda: 3 },
    ],
  },
  {
    id: 'ownership',
    question: 'How many people have to agree to any decision?',
    options: [
      { label: 'Just me', sell: 0, jda: 2 },
      { label: 'Two or three of us, and we agree', sell: 1, jda: 1 },
      { label: 'Several, and we do not always agree', sell: 3, jda: 0 },
    ],
  },
]

export default function BuyVsJda() {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const result = useMemo(() => {
    const answered = dimensions.filter((d) => answers[d.id] !== undefined)
    const sell = answered.reduce((s, d) => s + d.options[answers[d.id]].sell, 0)
    const jda = answered.reduce((s, d) => s + d.options[answers[d.id]].jda, 0)
    const total = sell + jda || 1
    const complete = answered.length === dimensions.length

    let lean: 'sell' | 'jda' | 'balanced' = 'balanced'
    if (sell > jda * 1.4) lean = 'sell'
    else if (jda > sell * 1.4) lean = 'jda'

    return { sell, jda, sellPct: Math.round((sell / total) * 100), complete, lean, answered: answered.length }
  }, [answers])

  const guidance = {
    sell: {
      title: 'Your position points to an outright sale.',
      body: 'Your answers describe someone who needs certainty more than upside — a defined capital need, a shorter horizon, limited tolerance for a developer\'s delay, or a decision that has to survive several people agreeing. An outright sale converts a slow, contested asset into a clean number in a few months. It gives up the development premium, and on your answers that is the right trade.',
      watch: 'Before you sell, get the parcel verified anyway. A clean title materially improves what a buyer will pay, and it removes the discount a cautious buyer applies to uncertainty.',
    },
    jda: {
      title: 'A joint development fits your position.',
      body: 'You can wait, you can absorb a delay, and you are willing to be involved in the finished product. That combination is what a joint development actually requires — it is a multi-year relationship with a counterparty, not a transaction. On the right corridor and with the right developer, it is where the meaningful upside is.',
      watch: 'The structure you are offered first is rarely the one that suits you best. Model area share against revenue share against plotted development on your own parcel before agreeing a percentage.',
    },
    balanced: {
      title: 'It is genuinely close — which usually means a third option.',
      body: 'Your answers do not point strongly either way. In practice this is where plotted development or a staged sale often beats both: a shorter timeline than a vertical JDA, far less execution risk, and more upside than an outright sale. It is worth modelling before you accept the binary.',
      watch: 'Do not let the developer in front of you define the choice as two options. There are usually four, and one of them is doing nothing for eighteen months.',
    },
  }[result.lean]

  return (
    <div className="toolShell">
      <div className="toolPanel">
        <h2 className="h2">Six questions about you, not the land</h2>
        <p className="toolPanel__sub">
          The parcel matters, but the decision between selling and developing is mostly about your position —
          your horizon, your capital needs, and how many people have to agree.
        </p>

        {dimensions.map((d, i) => (
          <div key={d.id} className="quizQuestion">
            <p className="quizQuestion__text">
              {i + 1}. {d.question}
            </p>
            <div className="optionRow">
              {d.options.map((o, oi) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={answers[d.id] === oi}
                  onClick={() => setAnswers((a) => ({ ...a, [d.id]: oi }))}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="toolResult">
          {!result.complete ? (
            <p style={{ fontSize: '.9rem', color: 'var(--muted)' }}>
              {result.answered} of {dimensions.length} answered. The guidance appears once all six are in.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  height: 14,
                  borderRadius: 100,
                  overflow: 'hidden',
                  marginBottom: 8,
                  background: 'var(--line-2)',
                }}
                role="img"
                aria-label={`Leaning ${result.sellPct}% toward outright sale`}
              >
                <span style={{ width: `${result.sellPct}%`, background: 'var(--navy-600)' }} />
                <span style={{ width: `${100 - result.sellPct}%`, background: 'var(--gold)' }} />
              </div>
              <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.76rem', color: 'var(--muted)', marginBottom: 22 }}>
                <span>Outright sale {result.sellPct}%</span>
                <span>Joint development {100 - result.sellPct}%</span>
              </div>

              <h3 className="h3" style={{ marginBottom: 10 }}>
                {guidance.title}
              </h3>
              <p style={{ fontSize: '.96rem', color: 'var(--ink-2)', lineHeight: 1.78 }}>{guidance.body}</p>

              <div className="calloutBox" style={{ marginTop: 20 }}>
                <span className="eyebrow" style={{ marginBottom: 8 }}>
                  Whichever way you go
                </span>
                <p>{guidance.watch}</p>
              </div>

              <div className="row-wrap" style={{ marginTop: 22 }}>
                <Link href="/tools/jda-comparator" className="btn btn-primary">
                  <Icon name="balance" size={16} /> Model the three structures
                </Link>
                <Link href="/tools/jda-readiness" className="btn btn-ghost">
                  Check JDA readiness
                </Link>
              </div>
            </>
          )}

          <div className="toolDisclaimer">
            A guide, not advice. It weighs six factors that matter in most cases; yours may turn on a seventh
            we have not asked about — a tax position, a family settlement, or a pending acquisition
            notification.
          </div>
        </div>
      </div>

      <aside>
        <LeadForm
          kind="Tool result"
          source="/tools/buy-vs-jda"
          compact
          heading="Talk it through with an advisor"
          blurb="Half an hour on a call is usually enough to know which path fits. No obligation, and we will tell you if the answer is to do nothing yet."
          payload={{
            lean: result.lean,
            sell_score: result.sell,
            jda_score: result.jda,
          }}
          whatsappMessage="Hi Bhumi Estates — I used the buy vs JDA guide and would like to talk through my options."
          submitLabel="Request a call"
        />
      </aside>
    </div>
  )
}
