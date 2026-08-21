import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/site/Reveal'
import Icon from '@/components/site/Icon'
import DataRoomGate from '@/components/site/DataRoomGate'
import { getPropertiesByType } from '@/lib/db'
import { getPropertyType } from '@/lib/content/propertyTypes'
import { pillars } from '@/lib/content/pillars'
import { caseStudies } from '@/lib/content/caseStudies'
import { brand, wa } from '@/lib/content/brand'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Large land parcels — institutional scale, gated data room',
  description:
    'Bulk and institutional land in Bengaluru\'s growth corridors: acreage and contiguous-assembly status public, the full information memorandum released to verified buyers under NDA, and enquiries routed to a named advisor.',
  alternates: { canonical: '/large-land-parcels' },
}

export default async function LargeLandParcelsPage() {
  const type = getPropertyType('large-land-parcels')!
  const { data: parcels } = await getPropertiesByType('large-land-parcels')
  const totalAcres = parcels.reduce((s, p) => s + p.extent_acres, 0)
  const endToEnd = caseStudies.find((c) => c.slug === 'devanahalli-68-acre-assembly')

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="A dedicated pillar"
          title="Institutional land is not a bigger"
          italic="listing."
          lede="Bulk buyers, developers land-banking ahead of a corridor, and family offices decide differently from an individual buyer. This pillar is built for how those deals actually transact — aerial-first, assembly-aware, and gated."
          crumbs={[{ label: 'Large Land Parcels' }]}
          stats={[
            { value: String(parcels.length), label: 'Assemblies currently mandated' },
            { value: `${totalAcres.toFixed(0)} ac`, label: 'Under mandate' },
            { value: 'NDA', label: 'Gate on the memorandum' },
            { value: 'Named', label: 'Advisor, not a shared inbox' },
          ]}
          actions={[
            { label: 'Request data room access', href: '#data-room', variant: 'gold', icon: 'lock' },
            { label: 'Speak to an advisor', href: wa.largeParcel, variant: 'outline', external: true, icon: 'whatsapp' },
          ]}
        />

        {/* ── How this pillar differs ── */}
        <section className="section-tight">
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">How this differs from a land listing</span>
              <h2 className="h1">
                Five things we do <em>only</em> on this page.
              </h2>
            </div>

            <div className="grid g2">
              {[
                {
                  icon: 'large-land-parcels' as const,
                  title: 'Bulk presentation, aerial-first',
                  body: 'Acreage, contiguous-parcel assembly status, corridor growth data and construction feasibility notes — presented with full-parcel drone footage rather than ground-level photography. At 60 acres, a photo taken from the boundary tells you nothing.',
                },
                {
                  icon: 'lock' as const,
                  title: 'A gated data room',
                  body: 'Headline details are public. The full information memorandum — survey documents, the verification report and pricing — sits behind an NDA-style gate, released to verified buyers only. That is how large land actually transacts, and it filters serious buyers from browsers.',
                },
                {
                  icon: 'handshake' as const,
                  title: 'A named advisor, not a form',
                  body: 'Large-parcel enquiries route straight to an individual who owns the file, never a shared inbox. The scale of these deals demands it, and a shared inbox is where a ₹100 crore enquiry goes to wait three days.',
                },
                {
                  icon: 'structure' as const,
                  title: 'The full journey, shown end to end',
                  body: 'Sourcing through verification, development, and a finished asset that is branded and advertised — the one narrative a firm that only brokers, or only builds, cannot tell you.',
                },
              ].map((c, i) => (
                <Reveal key={c.title} delay={i * 60}>
                  <div className="listCard">
                    <span className="typeCard__icon" style={{ width: 44, height: 44 }}>
                      <Icon name={c.icon} size={21} />
                    </span>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                </Reveal>
              ))}

              <Reveal delay={240}>
                <div className="calloutBox" style={{ gridColumn: '1 / -1' }}>
                  <h3>Development, branding and advertising, offered as a package — here specifically</h3>
                  <p>
                    A large-parcel buyer is the audience most likely to want us involved from land through to
                    a finished, visible asset, so we make that offer explicit on this page rather than
                    implying it elsewhere. One accountable party across{' '}
                    {pillars.map((p, i) => (
                      <span key={p.slug}>
                        {i > 0 && (i === pillars.length - 1 ? ' and ' : ', ')}
                        <Link href={`/services/${p.slug}`} style={{ color: 'var(--navy)', fontWeight: 600 }}>
                          {p.name.toLowerCase()}
                        </Link>
                      </span>
                    ))}
                    .
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Available assemblies ── */}
        <section className="section" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sectionHead">
              <span className="eyebrow">Current mandates</span>
              <h2 className="h1">
                Headline details are <em>public.</em>
              </h2>
              <p>
                Everything below is disclosed openly. Survey documents, the verification report and pricing sit
                behind the gate.
              </p>
            </div>

            <div className="grid" style={{ gap: 20 }}>
              {parcels.map((p, i) => (
                <Reveal key={p.code} delay={i * 60}>
                  <article className="card" style={{ padding: 'clamp(24px, 3vw, 34px)' }}>
                    <div className="row-wrap" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                      <div className="row-wrap">
                        <span className="badge badge-navy">{p.code}</span>
                        {p.verified_stage === 'report' && (
                          <span className="badge badge-verified">
                            <Icon name="check" size={11} stroke={3} /> Six stages cleared
                          </span>
                        )}
                        {p.data_room_gated && (
                          <span className="badge badge-gold">
                            <Icon name="lock" size={11} /> Data room
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                        {p.location} · {p.zone} Bengaluru
                      </span>
                    </div>

                    <h3 className="h2" style={{ marginBottom: 12 }}>
                      {p.title}
                    </h3>
                    <p className="body-text" style={{ fontSize: '.92rem' }}>
                      {p.description}
                    </p>

                    <div className="factGrid" style={{ marginTop: 22 }}>
                      <div>
                        <span className="factGrid__label">Extent</span>
                        <span className="factGrid__value">{p.extent_acres} acres</span>
                      </div>
                      <div>
                        <span className="factGrid__label">Assembly</span>
                        <span className="factGrid__value" style={{ fontSize: '.94rem' }}>
                          {p.contiguous_status ?? p.ownership}
                        </span>
                      </div>
                      <div>
                        <span className="factGrid__label">Conversion</span>
                        <span className="factGrid__value" style={{ fontSize: '.94rem' }}>
                          {p.conversion}
                        </span>
                      </div>
                      <div>
                        <span className="factGrid__label">Indicative</span>
                        <span className="factGrid__value">
                          {p.price_type === 'On Request' ? 'On request' : `₹${p.price_per_acre_cr} Cr / acre`}
                        </span>
                      </div>
                      <div>
                        <span className="factGrid__label">Corridor</span>
                        <span className="factGrid__value" style={{ fontSize: '.94rem' }}>
                          {p.corridor
                            ? p.corridor.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                            : p.location}
                        </span>
                      </div>
                    </div>

                    <div className="row-wrap" style={{ marginTop: 20 }}>
                      <Link href={`#data-room`} className="btn btn-primary">
                        <Icon name="lock" size={15} /> Request the memorandum
                      </Link>
                      {p.corridor && (
                        <Link href={`/corridors/${p.corridor}`} className="btn btn-ghost">
                          Corridor note
                        </Link>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── End-to-end journey case study ── */}
        {endToEnd && (
          <section className="section">
            <div className="wrap">
              <div className="sectionHead--split sectionHead">
                <div>
                  <span className="eyebrow">The narrative competitors cannot tell</span>
                  <h2 className="h1">
                    A parcel&rsquo;s path, <em>end to end.</em>
                  </h2>
                  <p>{endToEnd.summary}</p>
                </div>
                <Link href={`/portfolio/${endToEnd.slug}`} className="btn btn-ghost">
                  Full case study
                </Link>
              </div>

              <ol className="journeyList">
                {endToEnd.journey.map((j) => (
                  <li key={j.stage}>
                    <strong>{j.stage}</strong>
                    <p>{j.detail}</p>
                  </li>
                ))}
              </ol>

              <div className="resultsRow" style={{ marginTop: 30 }}>
                {endToEnd.results.map((r) => (
                  <div key={r.label}>
                    <span className="numeral">{r.value}</span>
                    <small>{r.label}</small>
                    {r.note && <em>{r.note}</em>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── The gate ── */}
        <section className="section" id="data-room" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="splitRow" style={{ alignItems: 'start' }}>
              <Reveal>
                <div>
                  <span className="eyebrow">Verified buyers only</span>
                  <h2 className="h1">
                    The information memorandum, <em>on request.</em>
                  </h2>
                  <p className="body-text">
                    We gate it because it contains the seller&rsquo;s survey documents, our verification
                    findings and the pricing position. Publishing that openly would be a disservice to the
                    seller and an invitation to be front-run.
                  </p>
                  <p className="body-text">
                    Requests are reviewed by a named advisor, usually within one working day. If we decline,
                    we will tell you why rather than leaving the request unanswered.
                  </p>

                  <div className="advisorCard" style={{ marginTop: 26 }}>
                    <span className="advisorCard__avatar">AR</span>
                    <div>
                      <strong>Large-parcel advisory desk</strong>
                      <small>
                        Direct: <a href={`mailto:${brand.advisorEmail}`}>{brand.advisorEmail}</a> ·{' '}
                        <a href={`tel:${brand.phoneRaw}`}>{brand.phone}</a>
                      </small>
                    </div>
                  </div>

                  <ul className="checkList" style={{ marginTop: 24 }}>
                    {type.checklist.slice(0, 4).map((c) => (
                      <li key={c}>
                        <Icon name="check" size={16} stroke={2.4} />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <DataRoomGate parcels={parcels.map((p) => ({ code: p.code, label: p.title }))} />
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
