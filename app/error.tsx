'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { brand, wa } from '@/lib/content/brand'

/* Plan §10 treats reliability as a design requirement. When
   something does fail, the failure should still give a visitor a
   working route to a person — a dead error page on a site asking
   to be trusted with a land transaction is its own message. */

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced to the platform's log drain / monitoring.
    console.error('[bhumi] unhandled error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main
      id="main"
      style={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 20px',
        background: 'var(--cream)',
      }}
    >
      <div className="wrap-narrow" style={{ textAlign: 'center' }}>
        <span className="eyebrow" style={{ justifyContent: 'center' }}>
          Something broke
        </span>
        <h1 className="h1">
          That is on <em>us.</em>
        </h1>
        <p className="lede" style={{ margin: '0 auto' }}>
          The page failed to render. It has been logged. In the meantime, the advisory desk is reachable
          directly — nothing about your enquiry depends on this page working.
        </p>

        <div className="row-wrap" style={{ justifyContent: 'center', marginTop: 30 }}>
          <button className="btn btn-primary btn-lg" onClick={reset}>
            Try again
          </button>
          <a href={wa.general} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
            WhatsApp us
          </a>
          <a href={`tel:${brand.phoneRaw}`} className="btn btn-ghost btn-lg">
            {brand.phone}
          </a>
        </div>

        <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 26 }}>
          <Link href="/" className="link-arrow">
            Back to the homepage
          </Link>
          {error.digest && ` · reference ${error.digest}`}
        </p>
      </div>
    </main>
  )
}
