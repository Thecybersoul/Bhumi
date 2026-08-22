import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import ChecklistGate from '@/components/site/ChecklistGate'
import Icon from '@/components/site/Icon'
import { verificationStages } from '@/lib/content/verification'

export const metadata: Metadata = {
  title: 'The Land Verification Checklist',
  description:
    'A free, printable checklist built directly from our six-stage verification protocol: every document to collect and every check to run before you pay for land in Karnataka.',
  alternates: { canonical: '/checklist' },
}

export default function ChecklistPage() {
  const totalChecks = verificationStages.reduce((s, v) => s + v.checks.length + v.inputs.length, 0)

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Free resource"
          title="The Land Verification"
          italic="Checklist."
          lede="Built directly from the six-stage protocol we run on paid engagements. Every document to collect, every check to run, and the findings that should stop you from paying. Useful, self-contained, and genuinely free."
          crumbs={[{ label: 'Verification checklist' }]}
          stats={[
            { value: '6', label: 'Stages' },
            { value: String(totalChecks), label: 'Documents and checks' },
            { value: 'Printable', label: 'Take it to a site visit' },
            { value: 'Free', label: 'No payment, ever' },
          ]}
        />

        <section className="section">
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <div>
                <span className="eyebrow">What is in it</span>
                <h2 className="h1">
                  The same protocol, in a form you can <em>carry.</em>
                </h2>
                <p className="body-text">
                  We publish the protocol openly on the verification page. This is the working version — laid
                  out as a checklist so you can print it, take it to a site visit, and tick things off against
                  the documents actually in front of you.
                </p>
                <p className="body-text">
                  There is no catch and no drip campaign. We give it away because a landowner who has run
                  these checks themselves is a better client, not a lost one — they arrive knowing which
                  questions matter.
                </p>

                <div className="stack" style={{ marginTop: 28, gap: 10 }}>
                  {verificationStages.map((s) => (
                    <div key={s.key} className="advisorCard" style={{ padding: 16 }}>
                      <span className="advisorCard__avatar" style={{ width: 38, height: 38, fontSize: '.9rem' }}>
                        {s.number}
                      </span>
                      <div>
                        <strong style={{ fontSize: '.92rem' }}>{s.title}</strong>
                        <small>
                          {s.inputs.length} documents · {s.checks.length} checks
                          {s.killers.length > 0 && ` · ${s.killers.length} deal-stoppers`}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="calloutBox" style={{ marginTop: 26 }}>
                  <h3>Prefer to just read it?</h3>
                  <p>
                    The full protocol is published on the{' '}
                    <Link href="/verification" className="link-arrow">
                      Land &amp; Verification page
                    </Link>{' '}
                    with no gate at all. The checklist is the printable working version, not a paywalled
                    version of the same thing.
                  </p>
                </div>
              </div>

              <ChecklistGate />
            </div>
          </div>
        </section>

        {/* The checklist itself, printable */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }} id="checklist">
          <div className="wrap">
            <div className="sectionHead--split sectionHead no-print">
              <div>
                <span className="eyebrow">Read it here</span>
                <h2 className="h1">
                  Or work through it <em>on this page.</em>
                </h2>
                <p>
                  Nothing is hidden behind the form. Use the browser&rsquo;s print function for a clean paper
                  copy — this page is styled for it.
                </p>
              </div>
            </div>

            <div className="stack" style={{ gap: 22 }}>
              {verificationStages.map((s) => (
                <div key={s.key} className="card" style={{ padding: 'clamp(22px, 3vw, 32px)' }}>
                  <div className="row" style={{ marginBottom: 14 }}>
                    <span className="stepper__marker">{s.number}</span>
                    <div>
                      <h3 className="h3">{s.title}</h3>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                        Typically {s.typicalDays[0]}–{s.typicalDays[1]} days
                      </span>
                    </div>
                  </div>

                  <div className="stepper__grid">
                    <div>
                      <h4>Documents to collect</h4>
                      <ul>
                        {s.inputs.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Checks to run</h4>
                      <ul>
                        {s.checks.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {s.killers.length > 0 && (
                    <div className="stepper__killers" style={{ marginTop: 18 }}>
                      <span className="stepper__killersLabel">
                        <Icon name="flag" size={13} /> Stop and reassess if you find
                      </span>
                      <ul>
                        {s.killers.map((k) => (
                          <li key={k}>{k}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
