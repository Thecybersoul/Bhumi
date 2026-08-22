import Link from 'next/link'
import { verificationStages } from '@/lib/content/verification'
import { pillars } from '@/lib/content/pillars'
import { propertyTypes } from '@/lib/content/propertyTypes'
import { tools } from '@/lib/content/tools'
import { corridors } from '@/lib/content/corridors'
import { landingPages } from '@/lib/content/landingPages'

export const metadata = { title: 'Website business plan · Admin' }

/* The internal record: what the business plan asked for, and
   where each requirement now lives in the built site. Kept in the
   admin rather than a document so it stays next to the thing it
   describes. */

const implementation: {
  section: string
  requirement: string
  built: string
  href?: string
  state: 'Built' | 'Partial' | 'Needs a service'
  note?: string
}[] = [
  {
    section: '§3A',
    requirement: 'Verification Transparency Dashboard — anonymised diligence statistics, updated regularly',
    built: 'Live on the flagship page, computed from the verification case record',
    href: '/verification#transparency',
    state: 'Built',
  },
  {
    section: '§3B',
    requirement: 'Data-driven credibility bar on the homepage',
    built: 'Served from the same transparency record, so it cannot drift from the dashboard',
    href: '/',
    state: 'Built',
  },
  {
    section: '§3C',
    requirement: 'Land & Verification page as the flagship, in plain language',
    built: 'Full six-stage protocol with per-stage inputs, checks, outputs and deal-stoppers',
    href: '/verification',
    state: 'Built',
  },
  {
    section: '§3D',
    requirement: 'Video-forward proof — drone footage, time-lapses, a "how we verify" explainer',
    built: 'Layout and placements ready; no footage exists yet to publish',
    state: 'Needs a service',
    note: 'Blocked on production, not on the site. Publishing stock video here would contradict §11.',
  },
  {
    section: '§3E',
    requirement: 'Interactive corridor visualisation replacing the static PDF brochure',
    built: 'Schematic interactive map, six corridors, no external tile service or third-party request',
    href: '/corridors',
    state: 'Built',
  },
  {
    section: '§3F',
    requirement: 'WhatsApp-first, not form-first',
    built: 'Click-to-chat is the primary action in the header, every lead block, the footer and the float',
    state: 'Built',
  },
  {
    section: '§4',
    requirement: 'Six asset classes, each with its own presentation and diligence detail',
    built: `${propertyTypes.length} classes, each with its own page, icon treatment, checklist and critical field`,
    href: '/property-types',
    state: 'Built',
  },
  {
    section: '§5',
    requirement: 'Six-stage verification process as a tracked, stepper-style timeline with status badges',
    built: `${verificationStages.length}-stage stepper on the public site; the same stages as an operable board in this admin`,
    href: '/admin/verifications',
    state: 'Built',
  },
  {
    section: '§6',
    requirement: 'Site structure: homepage, verification, property types, large parcels, portfolio, services, tools, corridors, insights, contact',
    built: 'All ten present, plus the marketplace and the checklist lead magnet',
    state: 'Built',
  },
  {
    section: '§7',
    requirement: 'Dedicated campaign landing pages, a gated lead magnet, specific CTAs',
    built: `${landingPages.length} landing pages, the verification checklist`,
    href: '/lp/free-land-verification',
    state: 'Built',
  },
  {
    section: '§8',
    requirement: 'Decision-support tools, each doubling as a lead-qualification step',
    built: `${tools.length} working tools; every one posts its inputs into the lead inbox`,
    href: '/tools',
    state: 'Built',
  },
  {
    section: '§9',
    requirement: 'Large Land Parcels as a dedicated pillar with an NDA-gated data room and a named advisor',
    built: 'Dedicated page, undertaking shown in full, requests queued for manual release by a named advisor',
    href: '/large-land-parcels',
    state: 'Built',
  },
  {
    section: '§10',
    requirement: 'Edge deployment, autoscaling, caching, monitoring, alerts, staging, security and backup',
    built: 'Next.js on an edge platform with ISR, security headers, a health endpoint and graceful degradation when the database is unreachable',
    href: '/api/health',
    state: 'Partial',
    note: 'Load testing, alerting, automatic rollback and the backup schedule are hosting-platform configuration, not application code.',
  },
  {
    section: '§11',
    requirement: 'Navy-and-gold identity throughout, cinematic imagery, custom iconography per type, purposeful motion',
    built: 'One token set, per-class custom SVG iconography, one reveal animation respecting reduced-motion',
    state: 'Partial',
    note: 'Cinematic imagery awaits real footage. The site currently uses drawn topographic and diagrammatic treatments rather than stock photography, which is the correct interim choice.',
  },
  {
    section: '§13',
    requirement: 'Measurement across conversion, engagement, lead quality and reliability',
    built: 'Metrics page tying each measure to where it is observable today',
    href: '/admin/metrics',
    state: 'Partial',
    note: 'Page-level engagement and organic ranking need an analytics provider and Search Console.',
  },
]

export default function PlanPage() {
  const built = implementation.filter((i) => i.state === 'Built').length

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Website business plan</h1>
          <p>
            What the plan asked for, and where each requirement now lives. Kept here rather than in a document
            so it stays next to the thing it describes — and so the gaps stay visible.
          </p>
        </div>
        <span className="badge badge-verified">
          {built} of {implementation.length} fully built
        </span>
      </div>

      <div className="adminCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>What the plan asked for</th>
                <th>What was built</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {implementation.map((i) => (
                <tr key={i.section + i.requirement}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--gold-deep)' }}>
                    {i.section}
                  </td>
                  <td style={{ fontSize: '.85rem', maxWidth: 300 }}>{i.requirement}</td>
                  <td style={{ fontSize: '.85rem', maxWidth: 340, color: 'var(--ink-2)' }}>
                    {i.href ? (
                      <Link href={i.href} className="link-arrow">
                        {i.built}
                      </Link>
                    ) : (
                      i.built
                    )}
                    {i.note && (
                      <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 5, lineHeight: 1.55 }}>
                        {i.note}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge badge-${
                        i.state === 'Built' ? 'verified' : i.state === 'Partial' ? 'progress' : 'pending'
                      }`}
                    >
                      {i.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="docSection">
        <h2>The principles this site is built on</h2>
        <p>
          The plan translates statements from established real estate operators into rules for the site. Three
          of those rules constrain almost every decision in the build, and they are worth restating because
          they are easy to erode one page at a time.
        </p>

        <h3>Every claim must be provable</h3>
        <p>
          Case studies carry project numbers, including the deals that were dropped. The diligence protocol is
          published in full rather than described as thorough. The transparency dashboard publishes the flag
          rate — the number a firm has the strongest incentive to hide. If a claim on this site cannot be
          traced to a record, it should be removed rather than softened.
        </p>

        <h3>Land is the flagship</h3>
        <p>
          The Land &amp; Verification page gets the best content and placement on the site. Land is not a
          sub-page under services. The homepage hero is a topographic field rather than a building, a logo
          wall or lifestyle photography.
        </p>

        <h3>No dead ends</h3>
        <p>
          Every page ends in a specific next step that names the value — &ldquo;get a free land verification
          review&rdquo;, not &ldquo;contact us&rdquo;. Insight articles, case studies, tool results, corridor
          notes and even the footer carry one. An unconvertible page is illiquid trust.
        </p>

        <h2>The five services</h2>
        <p>
          Land Sourcing, Branding and Outdoor Advertising carry the most weight across the site — they are
          where the business concentrates its energy and where the revenue is. Verification and Development
          complete the chain. The site presents all five as Bhumi services, without distinguishing how any
          of them is resourced internally.
        </p>
        <ul>
          {pillars.map((p) => (
            <li key={p.slug}>
              <strong>{p.name}</strong>
              {p.featured ? ' · featured' : ''} — {p.short}.{' '}
              <Link href={`/services/${p.slug}`} className="link-arrow">
                /services/{p.slug}
              </Link>
            </li>
          ))}
        </ul>

        <h2>Where we operate</h2>
        <p>
          Six corridors rather than the whole city, because a corridor note is only credible from someone who
          has walked parcels there: {corridors.map((c) => c.name.split(/[&,]/)[0].trim()).join(', ')}.
        </p>

        <h2>What is deliberately not built</h2>
        <ul>
          <li>
            <strong>Stock photography.</strong> §11 asks for cinematic imagery over stock. Until real drone
            footage exists, drawn topographic and diagrammatic treatments are the honest interim answer —
            stock property photography would actively contradict the positioning.
          </li>
          <li>
            <strong>An automated data room release.</strong> §9 asks for verified-buyer-only access. A gate
            that grants itself is not a gate, so requests queue for a named advisor.
          </li>
          <li>
            <strong>Impressions as a headline campaign metric.</strong> Reported in the portfolio only to
            demonstrate how little it tells you, and labelled as such.
          </li>
          <li>
            <strong>A newsletter wall on the insights.</strong> Content ends in a specific next step, not an
            email capture. The one gated asset is the checklist, and even that is printed in full on the same
            page.
          </li>
        </ul>
      </div>
    </>
  )
}
