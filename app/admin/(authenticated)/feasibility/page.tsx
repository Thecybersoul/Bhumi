
import React from 'react';
import './feasibility.css';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function FeasibilityPage() {
  return (
    <div className="doc-wrapper">

<header className="topbar">
  <div className="wrap row">
    <a href="/" className="brand" style={{display: 'inline-flex', alignItems: 'center'}}>
      <Logo theme="light" style={{ height: '40px' }} />
    </a>
    <div className="cta">
      <Link className="btn btn-ghost" href="/admin/blueprint">Blueprint →</Link>
      <a className="btn btn-primary" href="/marketplace" target="_blank">See Prototype</a>
    </div>
  </div>
</header>


<div className="cover" id="top">
  <div className="wrap">
    <span className="eyebrow"><span className="dot"></span> Comprehensive Feasibility Plan · v2.0</span>
    <h1>India's most trusted <em>spatial-intelligence-first</em> land platform.</h1>
    <p className="lead">Bhumi Estates combines the verified land marketplace model of 1acre.in with the spatial intelligence depth of TalkingLands — creating a unified platform that lets buyers discover, analyze, and own land with complete clarity. Launching in Bengaluru, scaling pan-India.</p>
    <div className="meta">
      <div><div className="k">4</div><div className="v">Product Suite</div></div>
      <div><div className="k">7</div><div className="v">Revenue Streams</div></div>
      <div><div className="k">150+</div><div className="v">Data Layers</div></div>
      <div><div className="k">3-Tier</div><div className="v">Verification</div></div>
    </div>
  </div>
</div>


{/* ═══════════════ SECTION 01 ═══════════════ */}
<section id="summary">
  <div className="wrap">
    <span className="sec-tag">01 · Executive Summary</span>
    <h2 className="big">The <em>best of both worlds</em> — marketplace reach meets spatial depth.</h2>
    <p className="body">Today, India's land market is fragmented between two kinds of platforms: <strong>marketplaces</strong> (like 1acre.in) that have inventory but limited intelligence, and <strong>spatial tools</strong> (like TalkingLands) that have deep data but no public marketplace. Bhumi Estates unifies both into a single platform — verified land you can trust, spatial intelligence you can act on.</p>
    <div style={{ margin: '34px 0' }}>
      <p className="lede">Discover. Analyze. Own — with full spatial intelligence.</p>
    </div>

    <div className="grid g3">
      <div className="card">
        <div className="ico">◆</div>
        <h3>The Problem</h3>
        <p>Large-parcel buyers waste weeks hunting across agents, WhatsApp groups, and vague listings. 90%+ of India's $300B annual land transactions happen offline with zero data transparency.</p>
      </div>
      <div className="card">
        <div className="ico">✦</div>
        <h3>The Solution</h3>
        <p>A curated, 3-tier verified inventory where every parcel ships with 70+ data fields, 150+ spatial intelligence layers, AI-powered reports, and direct seller access — all in one platform.</p>
      </div>
      <div className="card">
        <div className="ico">▲</div>
        <h3>The Edge</h3>
        <p>No other platform combines marketplace liquidity with spatial intelligence depth. 1acre.in has reach but thin data. TalkingLands has depth but no inventory. We have both.</p>
      </div>
    </div>

    <div className="stats">
      <div className="stat"><div className="k">$1.3–2.9B</div><div className="l">Indian proptech market size (2025)</div></div>
      <div className="stat"><div className="k">12–20%</div><div className="l">CAGR through 2032</div></div>
      <div className="stat"><div className="k">$300B+</div><div className="l">Annual land transactions in India</div></div>
      <div className="stat"><div className="k">90%+</div><div className="l">Transactions still happen offline</div></div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 02 ═══════════════ */}
<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">02 · Market Opportunity</span>
    <h2 className="big">A <em>$300 billion</em> market waiting to be organized.</h2>
    <p className="body">India's land market is one of the largest unorganized markets in the world. While residential real estate has been transformed by platforms like MagicBricks, 99acres, and Noagents — the raw land segment remains stuck in the agents-and-WhatsApp era.</p>

    <div className="grid g2" style={{ marginTop: '28px' }}>
      <div className="card">
        <div className="emoji">📈</div>
        <h3>Proptech Market Surge</h3>
        <p>Indian proptech market valued at $1.3–2.9B in 2025, growing at 12–20% CAGR through 2032. Government digitization of land records (GIS mapping, digital registries) is creating unprecedented opportunities for land-tech platforms.</p>
      </div>
      <div className="card">
        <div className="emoji">🌾</div>
        <h3>Managed Farmland Boom</h3>
        <p>Peri-urban farmland near metros seeing 15–20% annual appreciation. HNWIs, tech founders, and NRIs are actively diversifying into agricultural land as a tangible, inflation-hedged asset class.</p>
      </div>
      <div className="card">
        <div className="emoji">🏙</div>
        <h3>Urban Expansion</h3>
        <p>Bengaluru alone has 9 active growth corridors. With new metro lines, ring roads, airports, and industrial corridors — land on the periphery is the most sought-after asset class in Indian real estate.</p>
      </div>
      <div className="card">
        <div className="emoji">🌏</div>
        <h3>NRI Diaspora Demand</h3>
        <p>~32 million NRIs globally, with India receiving $125B in annual remittances. Land and farmland investments are among the top 3 asset classes for NRI wealth deployment back home.</p>
      </div>
    </div>

    <div style={{ margin: '28px 0' }}>
      <p className="quote">There is no trusted, verified, intelligence-rich platform for raw land in India. This is our wide-open lane.</p>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 03 ═══════════════ */}
<section>
  <div className="wrap">
    <span className="sec-tag">03 · Competitive Analysis</span>
    <h2 className="big">We've studied the best — and built <em>something better</em>.</h2>
    <p className="body">Our platform incorporates the proven concepts from India's two leading land-tech companies, 1acre.in and TalkingLands, while addressing the gaps in each.</p>

    <table className="comp-table">
      <thead>
        <tr>
          <th>Capability</th>
          <th>1acre.in</th>
          <th>TalkingLands</th>
          <th className="us">Bhumi Estates</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Public land marketplace</td>
          <td>✓ 16,000+ listings</td>
          <td>✕ No public inventory</td>
          <td className="us win">✓ Curated, verified inventory</td>
        </tr>
        <tr>
          <td>Verification process</td>
          <td>Preliminary (90% filter)</td>
          <td>AI-powered due diligence</td>
          <td className="us win">3-tier: Preliminary → Verified → Certified™</td>
        </tr>
        <tr>
          <td>Spatial data layers</td>
          <td>300+ layers (breadth)</td>
          <td>40+ layers (deep AI analysis)</td>
          <td className="us win">150+ layers with AI reports</td>
        </tr>
        <tr>
          <td>Seller onboarding</td>
          <td>WhatsApp-first, free listings</td>
          <td>Enterprise only</td>
          <td className="us win">WhatsApp + self-serve + enterprise</td>
        </tr>
        <tr>
          <td>Consumer pricing</td>
          <td>₹2K–5K subscription</td>
          <td>₹100/report + enterprise SaaS</td>
          <td className="us win">Freemium + reports + premium tiers</td>
        </tr>
        <tr>
          <td>Developer tools</td>
          <td>JD Calculator, Dashboard</td>
          <td>Realm (pipeline management)</td>
          <td className="us win">Full suite: Pipeline + JD tools + OS</td>
        </tr>
        <tr>
          <td>Enterprise product</td>
          <td>Corporate land acquisition</td>
          <td>Realm + Reos SaaS</td>
          <td className="us win">Bhumi Realm + Bhumi Reos</td>
        </tr>
        <tr>
          <td>Geographic coverage</td>
          <td>Pan-India (20+ states)</td>
          <td>Bangalore focused</td>
          <td className="us">Bengaluru → pan-India expansion</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 04 ═══════════════ */}
<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">04 · Product Suite</span>
    <h2 className="big">Four products, <em>one unified</em> platform.</h2>
    <p className="body">Inspired by TalkingLands' multi-product architecture and enhanced with 1acre.in's marketplace model, Bhumi Estates offers a complete ecosystem for every stakeholder in the land market.</p>

    <div className="grid g2" style={{ marginTop: '28px' }}>
      <div className="product-card" style={{ borderTop: '5px solid var(--green)' }}>
        <span className="badge" style={{ background: '#e6f4ec', color: '#1d7a4d' }}>B2C · PUBLIC MARKETPLACE</span>
        <h3>Bhumi Discover</h3>
        <p className="sub">Map-based marketplace for buyers — find, filter, and shortlist verified land parcels</p>
        <ul>
          <li><span className="c" style={{ color: 'var(--green)' }}>→</span>Interactive map with colour-coded pins by use-case</li>
          <li><span className="c" style={{ color: 'var(--green)' }}>→</span>Smart filters: zone, size, price, land-use, road frontage</li>
          <li><span className="c" style={{ color: 'var(--green)' }}>→</span>Immersive detail pages with 70+ data fields</li>
          <li><span className="c" style={{ color: 'var(--green)' }}>→</span>Drone gallery, 360° tours, document downloads</li>
          <li><span className="c" style={{ color: 'var(--green)' }}>→</span>Direct seller contact (like 1acre) — free for verified lands</li>
          <li><span className="c" style={{ color: 'var(--green)' }}>→</span>WhatsApp lead capture + site-visit booking</li>
        </ul>
      </div>

      <div className="product-card" style={{ borderTop: '5px solid var(--teal)' }}>
        <span className="badge" style={{ background: '#e6f5f0', color: 'var(--teal)' }}>B2C/B2B · SPATIAL INTELLIGENCE</span>
        <h3>Bhumi Insights</h3>
        <p className="sub">AI-powered spatial intelligence reports on any location in India</p>
        <ul>
          <li><span className="c" style={{ color: 'var(--teal)' }}>→</span>Drop a pin, get an AI-generated location intelligence report</li>
          <li><span className="c" style={{ color: 'var(--teal)' }}>→</span>150+ data layers: zoning, risk, connectivity, growth signals</li>
          <li><span className="c" style={{ color: 'var(--teal)' }}>→</span>Flood/drainage buffers, CRZ, air funnel, eco-sensitive zones</li>
          <li><span className="c" style={{ color: 'var(--teal)' }}>→</span>Historical price trends & appreciation forecasts</li>
          <li><span className="c" style={{ color: 'var(--teal)' }}>→</span>Pay-per-report from ₹100 (like TalkingLands coin model)</li>
          <li><span className="c" style={{ color: 'var(--teal)' }}>→</span>Downloadable PDF reports for due diligence</li>
        </ul>
      </div>

      <div className="product-card" style={{ borderTop: '5px solid var(--gold)' }}>
        <span className="badge" style={{ background: '#f6efdd', color: 'var(--gold)' }}>B2B · ENTERPRISE</span>
        <h3>Bhumi Realm</h3>
        <p className="sub">AI-powered land acquisition pipeline for institutional developers</p>
        <ul>
          <li><span className="c" style={{ color: 'var(--gold)' }}>→</span>Spatial pipeline management with GeoJSON tracking</li>
          <li><span className="c" style={{ color: 'var(--gold)' }}>→</span>Duplicate detection using spatial polygon matching</li>
          <li><span className="c" style={{ color: 'var(--gold)' }}>→</span>Automated risk screening (rajakaluve, flood, eco-sensitive)</li>
          <li><span className="c" style={{ color: 'var(--gold)' }}>→</span>JD vs Outright sale calculator (like 1acre developer tools)</li>
          <li><span className="c" style={{ color: 'var(--gold)' }}>→</span>Team collaboration with role-based access</li>
          <li><span className="c" style={{ color: 'var(--gold)' }}>→</span>Document vault for legal & revenue records</li>
        </ul>
      </div>

      <div className="product-card" style={{ borderTop: '5px solid var(--moss)' }}>
        <span className="badge" style={{ background: '#eef3ef', color: 'var(--moss)' }}>B2B · DEVELOPER OS</span>
        <h3>Bhumi Reos</h3>
        <p className="sub">Real estate operating system for developers — sales, projects, microsites</p>
        <ul>
          <li><span className="c" style={{ color: 'var(--moss)' }}>→</span>Live booking dashboard & transaction ledger</li>
          <li><span className="c" style={{ color: 'var(--moss)' }}>→</span>Auto-generated project microsites with map integration</li>
          <li><span className="c" style={{ color: 'var(--moss)' }}>→</span>Inventory management with unit-level tracking</li>
          <li><span className="c" style={{ color: 'var(--moss)' }}>→</span>CRM for agents channel management</li>
          <li><span className="c" style={{ color: 'var(--moss)' }}>→</span>Payment gateway integration (Razorpay)</li>
          <li><span className="c" style={{ color: 'var(--moss)' }}>→</span>Analytics: views, enquiries, conversion, inventory health</li>
        </ul>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 05 ═══════════════ */}
<section>
  <div className="wrap">
    <span className="sec-tag">05 · Revenue Model</span>
    <h2 className="big">Seven streams — <em>multiple, reinforcing</em> revenue engines.</h2>
    <p className="body">We combine 1acre.in's subscription model with TalkingLands' report + enterprise SaaS model, plus traditional agency — creating a diversified, resilient revenue architecture.</p>

    <div className="grid" style={{ gap: '14px', marginTop: '24px' }}>
      <div className="stream">
        <span className="n">01</span>
        <div>
          <h4>Freemium → Premium Subscription</h4>
          <p>Free browse + limited contacts. Premium unlocks unlimited seller contacts, 150+ data layers, instant alerts, advanced filters, and satellite maps.</p>
          <span className="pricing">₹2,000/quarter · ₹5,000/year</span>
          <span className="pill core">CORE · DAY ONE</span>
        </div>
      </div>
      <div className="stream">
        <span className="n">02</span>
        <div>
          <h4>AI Property Reports</h4>
          <p>Pay-per-report spatial intelligence on any location — growth signals, risk flags, connectivity scores, price trends, zoning analysis.</p>
          <span className="pricing">₹100–₹2,500 per report</span>
          <span className="pill core">CORE · DAY ONE</span>
        </div>
      </div>
      <div className="stream">
        <span className="n">03</span>
        <div>
          <h4>Transaction Commission</h4>
          <p>1–2% commission on facilitated deals — sales, joint ventures, leases. Hand-holding service for complex transactions with legal and due-diligence support.</p>
          <span className="pricing">1–2% of deal value</span>
          <span className="pill core">CORE · DAY ONE</span>
        </div>
      </div>
      <div className="stream">
        <span className="n">04</span>
        <div>
          <h4>Featured Listings & Promoted Placement</h4>
          <p>Paid premium placement for sellers and developers who want their parcels shown first, highlighted with "Featured" badge, and included in curated email digests.</p>
          <span className="pricing">₹5,000–₹25,000/month</span>
          <span className="pill premium">PREMIUM · MONTH 3</span>
        </div>
      </div>
      <div className="stream">
        <span className="n">05</span>
        <div>
          <h4>Enterprise SaaS (Realm + Reos)</h4>
          <p>Monthly subscriptions for Bhumi Realm (land acquisition pipeline) and Bhumi Reos (developer OS). Custom pricing based on team size, parcel volume, and features.</p>
          <span className="pricing">₹50,000–₹5,00,000/month</span>
          <span className="pill later">LATER · MONTH 6</span>
        </div>
      </div>
      <div className="stream">
        <span className="n">06</span>
        <div>
          <h4>Bhumi Certified™ Verification</h4>
          <p>Paid premium verification service — full 30-year title search, EC report, survey matching, on-ground boundary verification, legal opinion, and certification badge.</p>
          <span className="pricing">₹5,000–₹25,000 per parcel</span>
          <span className="pill premium">PREMIUM · MONTH 3</span>
        </div>
      </div>
      <div className="stream">
        <span className="n">07</span>
        <div>
          <h4>Financing & Legal Referrals</h4>
          <p>Referral commissions from bank/NBFC partners for land and project loans, plus legal service partnerships for title opinions and registration support.</p>
          <span className="pricing">Referral fees</span>
          <span className="pill later">LATER · MONTH 10</span>
        </div>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 06 ═══════════════ */}
<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">06 · Data & Spatial Intelligence</span>
    <h2 className="big">150+ map layers — the <em>intelligence backbone</em> of every decision.</h2>
    <p className="body">Inspired by 1acre.in's 300+ layer breadth and TalkingLands' deep AI analysis, we curate 150+ high-value layers with AI-powered interpretation.</p>

    <div className="layers-grid">
      <div className="layer-card"><div className="count">100+</div><div className="lbl">City masterplans across 60+ cities</div></div>
      <div className="layer-card"><div className="count">20+</div><div className="lbl">States with survey number overlays</div></div>
      <div className="layer-card"><div className="count">100+</div><div className="lbl">Road networks (existing + upcoming)</div></div>
      <div className="layer-card"><div className="count">14+</div><div className="lbl">States with CRZ boundaries</div></div>
      <div className="layer-card"><div className="count">25+</div><div className="lbl">Cities with air funnel zone mapping</div></div>
      <div className="layer-card"><div className="count">AI</div><div className="lbl">Growth corridor detection & scoring</div></div>
      <div className="layer-card"><div className="count">50+</div><div className="lbl">Flood & drainage (Rajakaluve) buffers</div></div>
      <div className="layer-card"><div className="count">Live</div><div className="lbl">Metro, Ring Road, Highway alignments</div></div>
      <div className="layer-card"><div className="count">Hist</div><div className="lbl">Satellite imagery change detection</div></div>
    </div>

    <div className="grid g2" style={{ marginTop: '28px' }}>
      <div className="card">
        <h3>AI Property Report Engine</h3>
        <p>Drop a pin on any location in India and receive an AI-generated spatial intelligence report — growth potential, risk flags, connectivity scores, price trends, nearby amenities, and investment thesis. Reports start at ₹100, with premium deep-analysis reports at ₹2,500.</p>
      </div>
      <div className="card">
        <h3>Data Acquisition Strategy</h3>
        <p>Government open data (CDP/RMP masterplans, revenue records), ISRO satellite imagery, OpenStreetMap, proprietary drone surveys, crowd-sourced agents data, and partnerships with municipal authorities for zoning and buffer data.</p>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 07 ═══════════════ */}
<section>
  <div className="wrap">
    <span className="sec-tag">07 · Verification Process</span>
    <h2 className="big">Three tiers of trust — our <em>defining edge</em>.</h2>
    <p className="body">1acre.in's preliminary verification filters out 90% of bad listings. TalkingLands offers AI-powered due diligence. We combine both approaches into a progressive 3-tier system that becomes our strongest brand differentiator.</p>

    <div className="grid g3" style={{ marginTop: '24px' }}>
      <div className="tier" style={{ borderTop: '4px solid #a0b2a8' }}>
        <span className="tier-badge" style={{ background: '#eef3ef', color: 'var(--moss)' }}>TIER 1</span>
        <h3>Preliminary</h3>
        <p>Automated checks before any listing goes live. Filters out 90% of problematic listings.</p>
        <ul>
          <li><span style={{ color: 'var(--moss)' }}>✓</span> Basic title check (ownership match)</li>
          <li><span style={{ color: 'var(--moss)' }}>✓</span> Encumbrance status screening</li>
          <li><span style={{ color: 'var(--moss)' }}>✓</span> Zoning & land-use classification</li>
          <li><span style={{ color: 'var(--moss)' }}>✓</span> Satellite image verification</li>
          <li><span style={{ color: 'var(--moss)' }}>✓</span> Duplicate listing detection</li>
        </ul>
        <div style={{ marginTop: '14px' }}><span className="pill">FREE · Every listing</span></div>
      </div>

      <div className="tier" style={{ borderTop: '4px solid var(--teal)' }}>
        <span className="tier-badge" style={{ background: '#e6f5f0', color: 'var(--teal)' }}>TIER 2</span>
        <h3>Verified</h3>
        <p>On-ground verification by our field team. Physical confirmation of key claims.</p>
        <ul>
          <li><span style={{ color: 'var(--teal)' }}>✓</span> Physical site visit & photo documentation</li>
          <li><span style={{ color: 'var(--teal)' }}>✓</span> Survey number to GPS matching</li>
          <li><span style={{ color: 'var(--teal)' }}>✓</span> Boundary walk & measurement</li>
          <li><span style={{ color: 'var(--teal)' }}>✓</span> Road access & connectivity confirmation</li>
          <li><span style={{ color: 'var(--teal)' }}>✓</span> Drone aerial photography</li>
        </ul>
        <div style={{ marginTop: '14px' }}><span className="pill" style={{ background: '#e6f5f0', color: 'var(--teal)' }}>₹5,000 · Per parcel</span></div>
      </div>

      <div className="tier" style={{ borderTop: '4px solid var(--gold)' }}>
        <span className="tier-badge" style={{ background: '#f6efdd', color: 'var(--gold)' }}>TIER 3</span>
        <h3>Bhumi Certified™</h3>
        <p>Full legal due diligence. The gold standard — investors can act with confidence.</p>
        <ul>
          <li><span style={{ color: 'var(--gold)' }}>✓</span> 30-year title search & legal opinion</li>
          <li><span style={{ color: 'var(--gold)' }}>✓</span> Full EC report (15 years)</li>
          <li><span style={{ color: 'var(--gold)' }}>✓</span> Revenue record verification (RTC/MR)</li>
          <li><span style={{ color: 'var(--gold)' }}>✓</span> Risk assessment report (floods, buffers, acquisition)</li>
          <li><span style={{ color: 'var(--gold)' }}>✓</span> Independent valuation estimate</li>
        </ul>
        <div style={{ marginTop: '14px' }}><span className="pill" style={{ background: '#f6efdd', color: 'var(--gold)' }}>₹15,000–₹25,000 · Premium</span></div>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 08 ═══════════════ */}
<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">08 · Technology Stack</span>
    <h2 className="big">Modern, scalable, <em>AI-native</em> architecture.</h2>
    <p className="body">Building on our existing Next.js + Supabase foundation, enhanced with spatial intelligence capabilities and AI-powered analysis engines.</p>

    <div className="grid g4" style={{ marginTop: '20px' }}>
      <div className="card"><div className="ico">⚛</div><h3>Frontend</h3><p>Next.js 15 + TypeScript. SSG/ISR for marketplace speed; SPA for admin & enterprise dashboards.</p><span className="tag">UI</span></div>
      <div className="card"><div className="ico">🗄</div><h3>Database</h3><p>Supabase (PostgreSQL + PostGIS) for geo queries, polygons, radius search. Redis for caching.</p><span className="tag">DATA</span></div>
      <div className="card"><div className="ico">🗺</div><h3>Maps & Geo</h3><p>Mapbox GL JS + India-specific layers. Draw-to-search, clusters, polygon boundaries, survey overlays.</p><span className="tag">GEO</span></div>
      <div className="card"><div className="ico">🤖</div><h3>AI Engine</h3><p>Gemini/OpenAI for spatial report generation, growth analysis, risk scoring, and price forecasting.</p><span className="tag">AI</span></div>
      <div className="card"><div className="ico">🖼</div><h3>Media</h3><p>Cloudinary + S3 for image optimization, drone footage hosting, 360° tour embedding.</p><span className="tag">FILES</span></div>
      <div className="card"><div className="ico">🔐</div><h3>Auth</h3><p>Supabase Auth with RLS. RBAC for admin roles. OAuth social login for consumers.</p><span className="tag">SEC</span></div>
      <div className="card"><div className="ico">📱</div><h3>Mobile</h3><p>React Native app (Phase 3) with offline map support, push notifications for new listings.</p><span className="tag">APP</span></div>
      <div className="card"><div className="ico">📨</div><h3>Integrations</h3><p>WhatsApp Business API, Razorpay, Resend email, Calendly, PostHog analytics, Sentry.</p><span className="tag">EXT</span></div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 09 ═══════════════ */}
<section>
  <div className="wrap">
    <span className="sec-tag">09 · Go-to-Market Strategy</span>
    <h2 className="big">Launch in Bengaluru, <em>scale to India</em>.</h2>
    <p className="body">We follow 1acre.in's playbook of deep geographic penetration before expansion, combined with TalkingLands' enterprise-first approach for developer partnerships.</p>

    <div className="grid g2" style={{ marginTop: '20px' }}>
      <div>
        <h3 className="serif" style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Launch Markets (Priority Order)</h3>
        <div className="grid" style={{ gap: '10px' }}>
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>🥇</span>
            <div><strong>Bengaluru</strong><br /><span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>9 corridors · Devanahalli, Sarjapur, Hoskote, Anekal...</span></div>
          </div>
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>🥈</span>
            <div><strong>Hyderabad</strong><br /><span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Pharma city, IT corridors, ORR expansion</span></div>
          </div>
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>🥉</span>
            <div><strong>Pune</strong><br /><span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Mumbai-Pune corridor, Hinjewadi, Chakan industrial</span></div>
          </div>
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>4️⃣</span>
            <div><strong>Chennai</strong><br /><span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>OMR corridor, Oragadam industrial, ECR coastline</span></div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="serif" style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Growth Channels</h3>
        <div className="gtm-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="gtm-card"><div className="emoji">💬</div><div><h4>WhatsApp-First Seller Onboarding</h4><p>Like 1acre.in — sellers list via WhatsApp. Zero friction. We call back, verify, and publish.</p></div></div>
          <div className="gtm-card"><div className="emoji">🤝</div><div><h4>Developer Partnerships</h4><p>Onboard 5 institutional developers on Bhumi Realm. Each brings 20-50 parcels into pipeline.</p></div></div>
          <div className="gtm-card"><div className="emoji">📝</div><div><h4>Content & SEO</h4><p>Corridor analysis reports, investment guides, market trend blogs. SEO for "land near [location]" queries.</p></div></div>
          <div className="gtm-card"><div className="emoji">🌐</div><div><h4>NRI Targeting</h4><p>Digital campaigns targeting Indian diaspora in US, UAE, Singapore. Virtual site tours + hand-holding service.</p></div></div>
          <div className="gtm-card"><div className="emoji">🏘</div><div><h4>agents Network Activation</h4><p>Onboard top 50 land agents per city. Free listing tools + commission structure for facilitated deals.</p></div></div>
          <div className="gtm-card"><div className="emoji">📺</div><div><h4>YouTube & Social</h4><p>Land investment education content, drone tours, corridor deep-dives. Build authority and trust.</p></div></div>
        </div>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 10 ═══════════════ */}
<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">10 · Financial Projections</span>
    <h2 className="big">Conservative path to <em>₹15 Crore ARR</em> in 3 years.</h2>
    <p className="body">Revenue projections based on comparable metrics from 1acre.in's premium model and TalkingLands' enterprise SaaS — adjusted for our multi-stream approach.</p>

    <div className="fin-grid">
      <div className="fin-card">
        <div className="year">Year 1</div>
        <div className="revenue">₹50L</div>
        <div className="sub">Foundation & seed growth</div>
        <div className="metrics">
          <div className="metric"><span>Listings</span><strong>500</strong></div>
          <div className="metric"><span>Premium users</span><strong>50</strong></div>
          <div className="metric"><span>AI reports sold</span><strong>2,000</strong></div>
          <div className="metric"><span>Enterprise clients</span><strong>5</strong></div>
          <div className="metric"><span>Deals facilitated</span><strong>3</strong></div>
        </div>
      </div>

      <div className="fin-card" style={{ borderColor: 'var(--teal)' }}>
        <div className="year">Year 2</div>
        <div className="revenue">₹3 Cr</div>
        <div className="sub">Scale & monetization</div>
        <div className="metrics">
          <div className="metric"><span>Listings</span><strong>2,000</strong></div>
          <div className="metric"><span>Premium users</span><strong>500</strong></div>
          <div className="metric"><span>AI reports sold</span><strong>15,000</strong></div>
          <div className="metric"><span>Enterprise clients</span><strong>30</strong></div>
          <div className="metric"><span>Deals facilitated</span><strong>15</strong></div>
        </div>
      </div>

      <div className="fin-card" style={{ borderColor: 'var(--gold)' }}>
        <div className="year">Year 3</div>
        <div className="revenue">₹15 Cr</div>
        <div className="sub">Multi-city dominance</div>
        <div className="metrics">
          <div className="metric"><span>Listings</span><strong>5,000+</strong></div>
          <div className="metric"><span>Premium users</span><strong>2,000</strong></div>
          <div className="metric"><span>AI reports sold</span><strong>50,000</strong></div>
          <div className="metric"><span>Enterprise clients</span><strong>100</strong></div>
          <div className="metric"><span>Deals facilitated</span><strong>50+</strong></div>
        </div>
      </div>
    </div>

    <p className="body" style={{ marginTop: '20px' }}><strong>Breakeven target: Month 18–20.</strong> Initial investment focus on technology, data acquisition, and seed inventory. Revenue ramps with premium subscriptions and enterprise SaaS from Month 6.</p>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 11 ═══════════════ */}
<section>
  <div className="wrap">
    <span className="sec-tag">11 · Execution Roadmap</span>
    <h2 className="big">Five phases — from MVP to <em>market leader</em>.</h2>
    <p className="body">Ship a credible MVP fast, then layer intelligence, enterprise tools, and geographic expansion.</p>

    <div className="timeline" style={{ marginTop: '24px' }}>
      <div className="phase">
        <div className="when">PHASE 1 · MONTHS 0–3</div>
        <h4>Foundation MVP</h4>
        <p>Launch Bhumi Discover with verified marketplace, admin CRUD dashboard, basic map view, and lead capture. Seed 50 verified parcels across 4 Bengaluru corridors. WhatsApp seller onboarding. Premium subscription launch.</p>
        <div className="deliver"><span>Marketplace</span><span>Admin CRUD</span><span>Auth</span><span>Map View</span><span>50 listings</span><span>Premium tier</span></div>
      </div>
      <div className="phase">
        <div className="when">PHASE 2 · MONTHS 3–6</div>
        <h4>Intelligence Layer + Bhumi Insights</h4>
        <p>Launch Bhumi Insights with AI-powered property reports. 50+ data layers. Drone/360° media embedding. Featured listings. Grow to 200+ parcels. Bhumi Certified™ verification service launch.</p>
        <div className="deliver"><span>Bhumi Insights</span><span>AI Reports</span><span>50+ layers</span><span>Drone tours</span><span>Certified™</span><span>200 listings</span></div>
      </div>
      <div className="phase">
        <div className="when">PHASE 3 · MONTHS 6–10</div>
        <h4>Enterprise Suite + Mobile</h4>
        <p>Launch Bhumi Realm for institutional developers. Mobile app with offline maps. Expand to 150+ data layers. Developer tools (JD calculator, pipeline management). Hyderabad expansion begins.</p>
        <div className="deliver"><span>Bhumi Realm</span><span>Mobile App</span><span>150+ layers</span><span>JD tools</span><span>Hyderabad</span></div>
      </div>
      <div className="phase">
        <div className="when">PHASE 4 · MONTHS 10–15</div>
        <h4>Multi-city + Bhumi Reos</h4>
        <p>Launch Bhumi Reos (developer OS). Expand to Pune and Chennai. Financing partnerships with banks/NBFCs. agents network platform. API marketplace for data layers.</p>
        <div className="deliver"><span>Bhumi Reos</span><span>Pune</span><span>Chennai</span><span>Financing</span><span>API</span></div>
      </div>
      <div className="phase">
        <div className="when">PHASE 5 · MONTHS 15–24</div>
        <h4>Pan-India + Ecosystem</h4>
        <p>Expand to 10+ cities. Managed farmland marketplace vertical. AI-powered land valuation tool. Strategic partnerships with institutional REITs and family offices. Series A fundraise.</p>
        <div className="deliver"><span>10+ cities</span><span>Farmland vertical</span><span>AI valuation</span><span>REIT partnerships</span><span>Series A</span></div>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 12 ═══════════════ */}
<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">12 · Risk Analysis & Mitigation</span>
    <h2 className="big">Eyes open on every <em>risk vector</em>.</h2>

    <div className="risk-grid">
      <div className="risk-row">
        <div><h4>Inventory cold-start</h4></div>
        <div><p>Mitigate with own/known inventory first, WhatsApp-first seller onboarding (zero friction), and agents network partnerships for immediate liquidity.</p></div>
        <div><span className="risk-level risk-med">Medium</span></div>
      </div>
      <div className="risk-row">
        <div><h4>Data accuracy liability</h4></div>
        <div><p>Clear "informational only" disclaimers. 3-tier verification with explicit confidence levels. Insurance for Bhumi Certified™ reports. Legal counsel retained.</p></div>
        <div><span className="risk-level risk-high">High</span></div>
      </div>
      <div className="risk-row">
        <div><h4>Competitor response</h4></div>
        <div><p>1acre.in and TalkingLands have different focus areas. Our unified model is defensible. Speed of execution and brand trust create switching costs.</p></div>
        <div><span className="risk-level risk-med">Medium</span></div>
      </div>
      <div className="risk-row">
        <div><h4>Regulatory changes</h4></div>
        <div><p>RERA-aware messaging from day one. DPDP Act compliance baked into architecture. Proactive engagement with state-level land digitization initiatives.</p></div>
        <div><span className="risk-level risk-low">Low</span></div>
      </div>
      <div className="risk-row">
        <div><h4>Technology scalability</h4></div>
        <div><p>Supabase + Next.js is proven at scale. PostGIS handles spatial queries natively. Incremental layer addition without architecture changes.</p></div>
        <div><span className="risk-level risk-low">Low</span></div>
      </div>
      <div className="risk-row">
        <div><h4>Revenue concentration</h4></div>
        <div><p>7-stream revenue model prevents over-reliance on any single source. Subscription + SaaS provide predictable MRR alongside transactional revenue.</p></div>
        <div><span className="risk-level risk-low">Low</span></div>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


{/* ═══════════════ SECTION 13 ═══════════════ */}
<section>
  <div className="wrap">
    <span className="sec-tag">13 · Team & Organization</span>
    <h2 className="big">Lean, expert, <em>execution-focused</em>.</h2>
    <p className="body">Phase 1 team of 6–8 people. Expand to 15–20 by Phase 3. Hiring prioritizes domain expertise in land transactions and spatial data over pure tech skills.</p>

    <div className="team-grid">
      <div className="team-card"><div className="emoji">👨‍💼</div><h4>Founder / CEO</h4><p>Vision, strategy, fundraise, key partnerships</p></div>
      <div className="team-card"><div className="emoji">👨‍💻</div><h4>CTO / Lead Engineer</h4><p>Platform architecture, AI/ML, spatial data pipeline</p></div>
      <div className="team-card"><div className="emoji">🗺</div><h4>GIS / Data Lead</h4><p>Spatial data acquisition, layer curation, PostGIS</p></div>
      <div className="team-card"><div className="emoji">📞</div><h4>Sales / BD (×2)</h4><p>Seller onboarding, developer partnerships, NRI outreach</p></div>
      <div className="team-card"><div className="emoji">✅</div><h4>Verification Lead</h4><p>On-ground verification, legal coordination, quality</p></div>
      <div className="team-card"><div className="emoji">🎨</div><h4>Product Designer</h4><p>UI/UX, design system, marketplace & enterprise UX</p></div>
      <div className="team-card"><div className="emoji">📈</div><h4>Growth / Marketing</h4><p>SEO, content, social, NRI campaigns, brand</p></div>
      <div className="team-card"><div className="emoji">🤝</div><h4>Field Operations</h4><p>Site visits, drone shoots, agents network management</p></div>
      <div className="team-card"><div className="emoji">⚖</div><h4>Legal Advisor</h4><p>Title opinions, RERA compliance, DPDP, contracts</p></div>
    </div>
  </div>
</section>


{/* ═══════════════ CLOSING CTA ═══════════════ */}
<section style={{ paddingTop: '20px' }}>
  <div className="wrap">
    <div className="callout">
      <h2>The land market is waiting to be organized. Bhumi Estates will lead that transformation.</h2>
      <p>Combining the marketplace reach of 1acre.in, the spatial intelligence of TalkingLands, and our own 3-tier verification — Bhumi Estates is positioned to become India's most trusted land platform.</p>
      <div style={{ marginTop: '26px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className="btn btn-gold" href="/marketplace" target="_blank">See the Marketplace</a>
        <Link className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }} href="/admin/blueprint">Read the Blueprint</Link>
      </div>
    </div>
  </div>
</section>


<footer>
  <div className="wrap">
    <div className="row">
      <div>
        <a href="/" className="brand" style={{display: 'inline-flex', alignItems: 'center'}}>
          <Logo theme="dark" style={{ height: '40px' }} />
        </a>
        <p style={{ marginTop: '8px' }}>A comprehensive feasibility plan for India's most trusted spatial-intelligence-first land marketplace. Incorporating best practices from 1acre.in and TalkingLands.</p>
      </div>
      <div style={{ fontSize: '.78rem', color: '#7f8a73' }}>bhumiestates.in · India · 2026</div>
    </div>
    <div className="fbot">
      <span>Feasibility plan for the founding team. Not legal or financial advice.</span>
      <span>Bhumi Estates · v2.0</span>
    </div>
  </div>
</footer>


    </div>
  );
}
