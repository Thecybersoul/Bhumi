import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import VerificationStepper from '@/components/site/VerificationStepper'
import TransparencyDashboard from '@/components/site/TransparencyDashboard'
import LeadForm from '@/components/site/LeadForm'
import { getTransparency } from '@/lib/db'
import { verificationStages, totalTurnaround } from '@/lib/content/verification'
import { corridors } from '@/lib/content/corridors'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Land & Verification — the six-stage protocol, published in full',
  description:
    'The complete Bhumi Estates land verification protocol: intake, title chain and encumbrance, revenue record and zoning, litigation search, physical survey, and a dated certificate. Plus the transparency dashboard showing how many parcels we flag.',
  alternates: { canonical: '/verification' },
}

export default async function VerificationPage() {
  const { data: stats, recent } = await getTransparency()
  const flagPct = Math.round((stats.parcels_flagged / stats.parcels_reviewed) * 100)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Land verification protocol',
    description: 'The six-stage land verification protocol used by Bhumi Estates in Karnataka.',
    totalTime: `P${totalTurnaround.low}D`,
    step: verificationStages.map((s) => ({
      '@type': 'HowToStep',
      position: s.number,
      name: s.title,
      text: s.summary,
    })),
  }

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="The flagship"
          title="Diligence should be"
          italic="shown,"
          after=" not claimed."
          lede="Six discrete stages, each separately tracked, each with a status you can see. This is the page our competitors are least likely to publish, because most do not have a process to show."
          crumbs={[{ label: 'Land & Verification' }]}
          stats={[
            { value: '6', label: 'Tracked stages' },
            { value: '30 yrs', label: 'Title chain verified back' },
            { value: `${totalTurnaround.low}–${totalTurnaround.high}`, label: 'Typical days end to end' },
            { value: `${flagPct}%`, label: 'Of parcels we flag' },
          ]}
          actions={[
            { label: 'Get a free verification review', href: '#review', variant: 'gold', icon: 'arrow' },
            { label: 'See the numbers', href: '#transparency', variant: 'outline' },
          ]}
        />

        {/* ── Why this page exists ── */}
        <section className="section-tight">
          <div className="wrap">
            <div className="splitRow">
              <Reveal>
                <div>
                  <span className="eyebrow">Written for a landowner, not a lawyer</span>
                  <h2 className="h1">
                    Two-thirds of civil litigation in India is about <em>property.</em>
                  </h2>
                  <p className="body-text">
                    That figure — cited by the Supreme Court and by NITI Aayog — is the entire reason this
                    business exists. A land dispute takes years to resolve, and it almost always begins with
                    something that was checkable before the money moved: a break in the chain, a missing
                    release deed, an access route that existed by tolerance rather than by record.
                  </p>
                  <p className="body-text">
                    Diligence is not complicated work. It is patient work, done in a specific order, by
                    someone with no incentive to find nothing. What follows is exactly how we do it — the
                    documents we collect, the checks we run, and the findings that make us tell a client to
                    walk away.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <div className="panel">
                  <h3 className="h3" style={{ marginBottom: 14 }}>
                    Three rules we do not bend
                  </h3>
                  <ul className="checkList">
                    <li>
                      <Icon name="check" size={16} stroke={2.4} />
                      <span>
                        <strong>We pull the records ourselves.</strong> The encumbrance certificate comes from
                        Kaveri 2.0 and the RTC from Bhoomi, obtained by us. A seller&rsquo;s printout is
                        evidence of nothing — it can be altered in minutes.
                      </span>
                    </li>
                    <li>
                      <Icon name="check" size={16} stroke={2.4} />
                      <span>
                        <strong>We state what we could not check.</strong> Scope limitations go in the report
                        body, not a footnote. A diligence report that reads as though everything was verified
                        is usually a report where something was not.
                      </span>
                    </li>
                    <li>
                      <Icon name="check" size={16} stroke={2.4} />
                      <span>
                        <strong>We do not soften a finding to save a deal.</strong> The report is written to
                        be forwarded to your bank or your partner. That only works if it says the same thing
                        to them as it says to you.
                      </span>
                    </li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── The stepper: signature asset ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">The protocol</span>
              <h2 className="h1">
                Six stages. Open any one to see <em>exactly</em> what happens in it.
              </h2>
              <p>
                Each stage has its own inputs, its own checks, its own output document, and its own typical
                duration. The findings listed under each stage are the ones that end a deal there.
              </p>
            </div>

            <VerificationStepper />
          </div>
        </section>

        {/* ── Transparency dashboard (Plan §3A) ── */}
        <section className="section" id="transparency">
          <div className="wrap">
            <TransparencyDashboard stats={stats} recent={recent} />
          </div>
        </section>

        {/* ── What you receive ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">The deliverable</span>
              <h2 className="h1">
                A dated certificate you can <em>forward.</em>
              </h2>
              <p>
                Not a phone call, not a verbal comfort, not a WhatsApp message saying it looks fine. A
                document with a reference number, a decision, the evidence behind it, and a validity period.
              </p>
            </div>

            <div className="grid g4">
              {[
                { icon: 'checklist' as const, title: 'A single decision', body: 'Verified, or Flagged with the specific reason. No third category, and no hedging language that leaves you to interpret it.' },
                { icon: 'shield' as const, title: 'Evidence, traced', body: 'Every finding tied to a registered document number or a dated site observation. You can check our work.' },
                { icon: 'flag' as const, title: 'Stated scope limits', body: 'What we could not verify and why — the pre-2004 gap, a document only a court can produce, a co-owner we could not reach.' },
                { icon: 'download' as const, title: 'Shareable and dated', body: 'Issued with a reference number and a defined validity period, so a lender or a JDA partner can rely on it.' },
              ].map((c, i) => (
                <Reveal key={c.title} delay={i * 60}>
                  <div className="listCard">
                    <span className="typeCard__icon" style={{ width: 42, height: 42 }}>
                      <Icon name={c.icon} size={20} />
                    </span>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Review request (Plan §7 — the specific CTA) ── */}
        <section className="section" id="review">
          <div className="wrap">
            <div className="splitRow">
              <Reveal>
                <div>
                  <span className="eyebrow">Start here</span>
                  <h2 className="h1">
                    Send a survey number. Get a <em>preliminary read.</em>
                  </h2>
                  <p className="body-text">
                    The first review is free and takes a couple of days. We look at what you have, tell you
                    what is missing, and tell you honestly whether the parcel is worth the cost of full
                    diligence. Roughly a third of the time, our answer is that it is not.
                  </p>
                  <p className="body-text">
                    If you would rather work through the checks yourself first, the same protocol is available
                    as a printable checklist —{' '}
                    <Link href="/checklist" className="link-arrow">
                      download the verification checklist →
                    </Link>
                  </p>

                  <div className="factGrid" style={{ marginTop: 28 }}>
                    <div>
                      <span className="factGrid__label">Preliminary read</span>
                      <span className="factGrid__value">Free · 2–3 days</span>
                    </div>
                    <div>
                      <span className="factGrid__label">Full six-stage protocol</span>
                      <span className="factGrid__value">Quoted before we start</span>
                    </div>
                    <div>
                      <span className="factGrid__label">Corridors covered</span>
                      <span className="factGrid__value">{corridors.length} active</span>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <LeadForm
                  kind="Verification review"
                  source="/verification"
                  heading="Request a free verification review"
                  blurb="Survey number and location is enough to start. Everything else we can pull ourselves."
                  qualifier={{
                    name: 'survey_number',
                    label: 'Survey number and village / location',
                    placeholder: 'e.g. Sy. 44/2, Devanahalli',
                  }}
                  whatsappMessage="Hi Bhumi Estates — I'd like a free land verification review. My parcel is at:"
                  whatsappLabel="Send the survey number on WhatsApp"
                  submitLabel="Request the review"
                />
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
