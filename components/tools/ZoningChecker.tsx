'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { corridors } from '@/lib/content/corridors'
import { propertyTypes, getPropertyType } from '@/lib/content/propertyTypes'
import type { PropertyTypeSlug } from '@/lib/types'

/* Commercial vs Residential Zoning Checker — Plan §8.
   A corridor-level read that pre-empts the most common
   early-stage question, with the parcel-level caveat stated
   honestly rather than buried. */

type Verdict = 'Commonly permitted' | 'Possible, with conditions' | 'Usually not permitted'

function assess(corridorSlug: string, use: PropertyTypeSlug): { verdict: Verdict; reason: string; next: string[] } {
  const c = corridors.find((x) => x.slug === corridorSlug)!
  const suited = c.best_for.includes(use)

  if (suited) {
    return {
      verdict: 'Commonly permitted',
      reason: `${getPropertyType(use)?.name} is an established use in this corridor, and the master plan zoning across most of the belt supports it.`,
      next: [
        'Confirm the governing authority for your specific survey number — it changes across short distances',
        'Confirm the conversion position: converted, deemed under the 2025 rules, or agricultural',
        'Check buffer zones — rajakaluve, lake, HT line, highway and railway setbacks',
      ],
    }
  }

  const industrialish = use === 'warehouses'
  const greenBelt = corridorSlug === 'kanakapura-road'

  if (greenBelt && (use === 'commercial' || use === 'warehouses' || use === 'residential')) {
    return {
      verdict: 'Usually not permitted',
      reason:
        'Much of this corridor sits in the green belt, where non-agricultural and particularly commercial or industrial use faces the heaviest scrutiny. Conversion here is slow and frequently refused for these uses.',
      next: [
        'Establish whether your survey number is inside or outside the green belt boundary',
        'If outside, treat it as a standard conversion case; if inside, budget for a change of land use, not just conversion',
        'Do not pay an advance against an assumption that conversion will be granted',
      ],
    }
  }

  if (industrialish) {
    return {
      verdict: 'Possible, with conditions',
      reason:
        'Industrial use is not the primary character of this corridor. Pockets of industrial zoning exist, and adjacent survey numbers can differ, so it turns entirely on the specific parcel.',
      next: [
        'Confirm industrial zoning or KIADB position for the exact survey number',
        'Check sanctioned power availability — usually the binding constraint, not the land',
        'Confirm trailer access to the highway from the parcel\'s real access point',
      ],
    }
  }

  return {
    verdict: 'Possible, with conditions',
    reason: `${getPropertyType(use)?.name} is not the dominant use in this corridor, which usually means the zoning permits it in parts of the belt but not uniformly. Parcel-level confirmation matters more here than elsewhere.`,
    next: [
      'Confirm the master plan zone for the survey number with the governing authority',
      'Establish whether a change of land use under Section 14-A is needed in addition to conversion',
      'Model the approval timeline into your acquisition schedule before committing to a price',
    ],
  }
}

const verdictBadge: Record<Verdict, string> = {
  'Commonly permitted': 'verified',
  'Possible, with conditions': 'pending',
  'Usually not permitted': 'flagged',
}

export default function ZoningChecker() {
  const [corridor, setCorridor] = useState('devanahalli')
  const [use, setUse] = useState<PropertyTypeSlug>('residential')

  const result = useMemo(() => assess(corridor, use), [corridor, use])
  const c = corridors.find((x) => x.slug === corridor)!

  return (
    <div className="toolShell">
      <div className="toolPanel">
        <h2 className="h2">Where, and what for?</h2>
        <p className="toolPanel__sub">
          A corridor-level read in under a minute. Deliberately honest about the fact that zoning is decided
          at parcel level, not corridor level.
        </p>

        <div className="form-grid">
          <div className="form-group span2">
            <label htmlFor="c">Corridor</label>
            <select id="c" value={corridor} onChange={(e) => setCorridor(e.target.value)}>
              {corridors.map((x) => (
                <option key={x.slug} value={x.slug}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group span2">
            <label>What do you want to build?</label>
            <div className="optionRow">
              {propertyTypes.map((t) => (
                <button key={t.slug} type="button" aria-pressed={use === t.slug} onClick={() => setUse(t.slug)}>
                  {t.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="toolResult">
          <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="h3">
              {getPropertyType(use)?.shortName} in {c.name.split(/[&,]/)[0].trim()}
            </h3>
            <span className={`badge badge-${verdictBadge[result.verdict]}`}>{result.verdict}</span>
          </div>

          <p style={{ fontSize: '.96rem', color: 'var(--ink-2)', lineHeight: 1.75 }}>{result.reason}</p>

          <div className="panel" style={{ marginTop: 22 }}>
            <span className="eyebrow" style={{ marginBottom: 12 }}>
              What still needs checking at parcel level
            </span>
            <ul className="checkList">
              {result.next.map((n) => (
                <li key={n}>
                  <Icon name="check" size={15} stroke={2.4} />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="calloutBox" style={{ marginTop: 20 }}>
            <h3>Conversion and change of land use are two different things</h3>
            <p>
              DC conversion under Section 95 of the Karnataka Land Revenue Act changes the revenue record from
              agricultural to non-agricultural. Change of Land Use under Section 14-A of the Town and Country
              Planning Act changes what the planning authority permits. Having one does not give you the
              other, and a great many buyers discover this after paying.{' '}
              <Link href="/insights/karnataka-land-conversion-2025-rules" className="link-arrow">
                Read the 2025 rules explainer →
              </Link>
            </p>
          </div>

          <div className="toolDisclaimer">
            This is corridor-level guidance, not a zoning certificate. Zoning is decided per survey number
            against the applicable master plan, and adjacent parcels routinely differ. Nothing here should be
            relied on as the basis for a payment.
          </div>
        </div>
      </div>

      <aside>
        <LeadForm
          kind="Verification review"
          source="/tools/zoning-checker"
          corridor={corridor}
          compact
          heading="Get the parcel-level answer"
          blurb="Send the survey number. We confirm the governing authority, the master plan zone and the conversion position — free, in a couple of days."
          qualifier={{ name: 'survey_number', label: 'Survey number and village', placeholder: 'e.g. Sy. 44/2' }}
          payload={{ corridor, intended_use: use, corridor_verdict: result.verdict }}
          whatsappMessage={`Hi Bhumi Estates — can I build ${getPropertyType(use)?.shortName.toLowerCase()} in ${c.name}? My survey number is:`}
          submitLabel="Check my survey number"
        />
      </aside>
    </div>
  )
}
