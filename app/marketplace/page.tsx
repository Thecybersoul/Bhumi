import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Icon from '@/components/site/Icon'
import MarketplaceBrowser from '@/components/site/MarketplaceBrowser'
import { getProperties } from '@/lib/db'
import { wa } from '@/lib/content/brand'
import { verificationStages } from '@/lib/content/verification'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Marketplace — land and property listings',
  description:
    'Listings that state their own verification position. Parcels appear here once they have been through the four-stage verification protocol, not before.',
  alternates: { canonical: '/marketplace' },
}

export default async function MarketplacePage() {
  const { data: properties, source } = await getProperties()
  const isEmpty = properties.length === 0

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Marketplace"
          title="Listings that state their own"
          italic="findings."
          lede="A parcel is listed here only after it has been through verification. Where something is flagged, the listing says so and stays visible rather than quietly disappearing."
          crumbs={[{ label: 'Property Consultancy', href: '/property-consultancy' }, { label: 'Marketplace' }]}
          tone="cream"
        />

        <section className="section-tight">
          <div className="wrap">
            {isEmpty ? (
              <div className="emptyState">
                <div className="emptyState__icon">
                  <Icon name="land" size={34} />
                </div>
                <h2 className="h2">No listings published yet.</h2>
                <p className="lede">
                  We are onboarding inventory now. Rather than fill this page with illustrative parcels, it
                  stays empty until there is something real to show — a listing here is a representation
                  about actual land, and a placeholder would be a poor way to start.
                </p>

                <div className="emptyState__pathways">
                  <a
                    href={wa.sourcing}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="emptyState__card"
                  >
                    <Icon name="whatsapp" size={22} />
                    <h3>Looking for land?</h3>
                    <p>
                      Tell us the use, the corridor and the extent band. Sourcing works from a written brief,
                      so nothing gets shown to you just because it happens to be available.
                    </p>
                    <span className="emptyState__go">
                      Send a brief <Icon name="arrow" size={13} />
                    </span>
                  </a>

                  <a
                    href={wa.verification}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="emptyState__card"
                  >
                    <Icon name="shield" size={22} />
                    <h3>Have a parcel to list?</h3>
                    <p>
                      Send the survey number and what you hold. We will tell you what is missing from the
                      file before you commit to anything, and what it would take to list it here.
                    </p>
                    <span className="emptyState__go">
                      Start a review <Icon name="arrow" size={13} />
                    </span>
                  </a>
                </div>

                <div className="emptyState__protocol">
                  <h3>What a listing has to clear first</h3>
                  <ol>
                    {verificationStages.map((s) => (
                      <li key={s.key}>
                        <span>{s.number}</span>
                        <div>
                          <strong>{s.title}</strong>
                          <small>{s.question}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Link href="/property-consultancy#verification" className="btn btn-outline">
                    How verification works <Icon name="arrow" size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <MarketplaceBrowser properties={properties} source={source} />
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
