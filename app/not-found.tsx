import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import { primaryNav } from '@/lib/content/brand'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section" style={{ minHeight: '58vh' }}>
        <div className="wrap-narrow">
          <span className="eyebrow">404</span>
          <h1 className="h1">
            That page does not <em>exist.</em>
          </h1>
          <p className="lede">
            The site was restructured recently, so an older link may have moved. Everything is one of these:
          </p>

          <div className="chips" style={{ marginTop: 26 }}>
            {primaryNav.map((n) => (
              <Link key={n.href} href={n.href} className="chip">
                {n.label}
              </Link>
            ))}
            <Link href="/marketplace" className="chip">
              Marketplace
            </Link>
            <Link href="/contact" className="chip">
              Contact
            </Link>
          </div>

          <div className="row-wrap" style={{ marginTop: 34 }}>
            <Link href="/verification" className="btn btn-primary">
              Start with the verification protocol
            </Link>
            <Link href="/" className="btn btn-ghost">
              Back to the homepage
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
