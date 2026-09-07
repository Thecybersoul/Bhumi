import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Icon from '@/components/site/Icon'
import LeadForm from '@/components/site/LeadForm'
import { getProperty, getProperties } from '@/lib/db'
import { getPropertyType } from '@/lib/content/propertyTypes'
import { whatsapp } from '@/lib/content/brand'
import { facts, size, price } from '@/lib/listing'

/* One page per listing.

   The marketplace used to hold everything in a drawer, which meant a
   listing had no address of its own: it could not be linked to from
   the homepage, sent to one buyer on WhatsApp, or indexed. Cards now
   point here, and the drawer is gone rather than duplicated.

   Because it is a real page it also carries its own Open Graph image
   — the listing photograph — so a pasted link to one property shows
   that property rather than the site's generic card. */

export const revalidate = 120

export async function generateStaticParams() {
  const { data } = await getProperties()
  return data.map((p) => ({ code: p.code }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  const { data: p } = await getProperty(code)
  if (!p) return { title: 'Listing not found' }

  const line = [size(p), price(p)].filter(Boolean).join(' · ')
  return {
    title: p.title,
    description: p.description?.slice(0, 180) || line,
    alternates: { canonical: `/marketplace/${p.code}` },
    openGraph: {
      title: p.title,
      description: line || undefined,
      images: p.img_url ? [{ url: p.img_url }] : undefined,
    },
  }
}

export default async function ListingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { data: p } = await getProperty(code)
  if (!p || p.status !== 'Live') notFound()

  const type = getPropertyType(p.property_type)
  const enquiry = whatsapp(`Hi Bhumi Estates — I'm interested in ${p.code} (${p.title}).`)

  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="section-tight">
          <div className="wrap">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/marketplace">Marketplace</Link>
              <span aria-hidden="true">/</span>
              <span>{p.code}</span>
            </nav>

            <div className="listing">
              <div className="listing__main">
                {p.img_url && (
                  <img
                    src={p.img_url}
                    alt=""
                    className="listing__photo"
                    width={1200}
                    height={800}
                  />
                )}

                <span className="listing__meta">
                  {[type?.shortName, p.location].filter(Boolean).join(' · ')}
                </span>
                <h1 className="h1 listing__title">{p.title}</h1>

                {(size(p) || price(p)) && (
                  <p className="listing__figures">
                    {[size(p), price(p)].filter(Boolean).join(' · ')}
                  </p>
                )}

                {p.engagement && (
                  <p className="mkDetail__engagement">
                    <Icon name="shield" size={14} /> {p.engagement}
                  </p>
                )}

                {p.description && <p className="body-text">{p.description}</p>}

                <div className="factGrid listing__facts">
                  {facts(p, 10).map(([label, value]) => (
                    <div key={label}>
                      <span className="factGrid__label">{label}</span>
                      <span className="factGrid__value" style={{ fontSize: '.92rem' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {p.amenities && (
                  <p className="listing__amenities">
                    <strong>Also on site.</strong> {p.amenities}
                  </p>
                )}
              </div>

              {/* Sticky on desktop: the way to start a conversation should
                  not scroll away behind a long record. */}
              <aside className="listing__aside">
                <div className="listing__cta">
                  <span className="badge badge-navy">{p.code}</span>
                  {price(p) && <p className="listing__price">{price(p)}</p>}

                  <a
                    href={enquiry}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-block btn-lg"
                  >
                    <Icon name="whatsapp" size={17} /> Ask about this listing
                  </a>

                  <LeadForm
                    kind="Site visit"
                    source={`/marketplace/${p.code}`}
                    propertyCode={p.code}
                    corridor={p.corridor}
                    compact
                    heading="Or request a site visit"
                    blurb="We walk the boundary with you and bring the file."
                    whatsappMessage={`Hi Bhumi Estates — I'm interested in ${p.code} (${p.title}).`}
                    submitLabel="Request a visit"
                  />
                </div>
              </aside>
            </div>

            <Link href="/marketplace" className="link-arrow listing__back">
              ← All listings
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
