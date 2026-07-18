'use client'

import Link from 'next/link'
import Logo from '../Logo'
import { hero } from '@/lib/copy/home'

export default function Hero() {
  const h = hero
  return (
    <div className="hero">
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div className="navstrip" style={{ position: 'absolute', left: 0, right: 0, top: -16 }}>
          <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" className="brand" style={{ color: '#fff' }}>
              <Logo theme="dark" style={{ height: 38 }} />
            </Link>
            <nav style={{ display: 'flex', gap: 6 }}>
              <Link href="/marketplace" style={{ color: 'rgba(255,255,255,.85)', fontSize: '.85rem', fontWeight: 500, padding: '8px 12px' }}>
                Marketplace
              </Link>
              <Link href="/insights" style={{ color: 'rgba(255,255,255,.85)', fontSize: '.85rem', fontWeight: 500, padding: '8px 12px' }}>
                Insights
              </Link>
              <a href={h.primaryCta.href} target="_blank" rel="noopener" style={{ color: 'var(--gold-soft)', fontSize: '.85rem', fontWeight: 600, padding: '8px 12px' }}>
                WhatsApp →
              </a>
            </nav>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <span className="eyebrow"><span className="dot" /> {h.eyebrow}</span>
          <h1 className="heroTitle">
            {h.title.before} <em>{h.title.italic}</em>{h.title.after}
          </h1>
          <p className="heroDesc">{h.subhead}</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
            <a className="btn btn-gold" href={h.primaryCta.href} target="_blank" rel="noopener">
              💬 {h.primaryCta.label}
            </a>
            <Link className="btn btn-outline-light" href={h.secondaryCta.href}>
              {h.secondaryCta.label} →
            </Link>
            <a className="btn btn-outline-light" href={h.callCta.href}>
              📞 {h.callCta.label}
            </a>
          </div>

          <div className="heroStats">
            <div>
              <div className="heroStatK">120+</div>
              <div className="heroStatV">Verified parcels</div>
            </div>
            <div>
              <div className="heroStatK">9</div>
              <div className="heroStatV">Verification points</div>
            </div>
            <div>
              <div className="heroStatK">0</div>
              <div className="heroStatV">Brokered listings</div>
            </div>
            <div>
              <div className="heroStatK">4 hrs</div>
              <div className="heroStatV">Avg. enquiry reply</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
