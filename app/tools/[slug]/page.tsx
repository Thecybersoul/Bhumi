import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import Icon from '@/components/site/Icon'
import { tools, getTool } from '@/lib/content/tools'
import JdaComparator from '@/components/tools/JdaComparator'
import JdaReadiness from '@/components/tools/JdaReadiness'
import ConstructionEstimator from '@/components/tools/ConstructionEstimator'
import WarehouseChecklist from '@/components/tools/WarehouseChecklist'
import CorridorComparison from '@/components/tools/CorridorComparison'
import ZoningChecker from '@/components/tools/ZoningChecker'
import BuyVsJda from '@/components/tools/BuyVsJda'

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tool = getTool(slug)
  if (!tool) return {}
  return {
    title: tool.name,
    description: tool.description.slice(0, 180),
    alternates: { canonical: `/tools/${tool.slug}` },
  }
}

const registry: Record<string, React.ComponentType> = {
  'jda-comparator': JdaComparator,
  'jda-readiness': JdaReadiness,
  'construction-estimator': ConstructionEstimator,
  'warehouse-checklist': WarehouseChecklist,
  'corridor-comparison': CorridorComparison,
  'zoning-checker': ZoningChecker,
  'buy-vs-jda': BuyVsJda,
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = getTool(slug)
  const Tool = registry[slug]
  if (!tool || !Tool) notFound()

  const others = tools.filter((t) => t.slug !== slug).slice(0, 3)

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          eyebrow={`Decision tool · ${tool.minutes} min`}
          title={tool.name}
          lede={tool.description}
          crumbs={[{ label: 'Tools', href: '/tools' }, { label: tool.name }]}
          tone="cream"
          stats={[
            { value: `${tool.minutes} min`, label: 'To a result' },
            { value: 'Free', label: 'No signup wall' },
            { value: '2026', label: 'Rates current to' },
          ]}
        />

        <section className="section">
          <div className="wrap">
            <Tool />
          </div>
        </section>

        <section className="section-tight" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap">
            <span className="eyebrow">Other tools</span>
            <div className="grid g3" style={{ marginTop: 18 }}>
              {others.map((t) => (
                <Link key={t.slug} href={`/tools/${t.slug}`} className="listCard">
                  <span className="typeCard__icon" style={{ width: 42, height: 42 }}>
                    <Icon name={t.icon} size={20} />
                  </span>
                  <h3>{t.name}</h3>
                  <p>{t.outcome}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
