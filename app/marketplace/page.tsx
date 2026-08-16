import type { Metadata } from 'next'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import MarketplaceBrowser from '@/components/site/MarketplaceBrowser'
import { getProperties, getTransparency } from '@/lib/db'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Marketplace — verified land and property across Bengaluru',
  description:
    'Every listing states its verification stage, its risk findings and the number that decides its asset class. Filter by property type, corridor, extent and price.',
  alternates: { canonical: '/marketplace' },
}

export default async function MarketplacePage() {
  const [{ data: properties, source }, { data: stats }] = await Promise.all([
    getProperties(),
    getTransparency(),
  ])

  const verified = properties.filter((p) => p.verified_stage === 'report').length
  const acres = properties.reduce((s, p) => s + p.extent_acres, 0)

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow="Marketplace"
          title="Inventory that states its own"
          italic="findings."
          lede="Including the parcels we have flagged. A listing that has been held because the seller turned out to be an agreement holder rather than the owner stays visible, marked, rather than quietly disappearing."
          crumbs={[{ label: 'Marketplace' }]}
          tone="cream"
          stats={[
            { value: String(properties.length), label: 'Live listings' },
            { value: String(verified), label: 'Cleared all six stages' },
            { value: `${acres.toFixed(0)}`, label: 'Acres listed' },
            { value: `${stats.median_turnaround_days}d`, label: 'Median verification turnaround' },
          ]}
        />

        <section className="section-tight">
          <div className="wrap">
            <MarketplaceBrowser properties={properties} source={source} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
