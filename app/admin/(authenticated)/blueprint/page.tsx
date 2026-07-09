
import React from 'react';
import './blueprint.css';
import Link from 'next/link';
import AdminLayout from '../layout';

export default function BlueprintPage() {
  return (
    <div className="doc-wrapper">
      


<header className="topbar">
  <div className="wrap row">
    <a href="/" className="brand">
      <span className="mark">ಭೂ</span>
      <span>Bhūmī<small>Bengaluru Land Exchange</small></span>
    </a>
    <nav className="nav-links">
      <a href="#summary">Summary</a>
      <a href="#brand">Brand</a>
      <a href="#design">Design</a>
      <a href="#market">Marketplace</a>
      <a href="#admin">Admin</a>
      <a href="#data">Data</a>
      <a href="#stack">Tech</a>
      <a href="#roadmap">Roadmap</a>
    </nav>
    <div className="nav-cta">
      <a className="btn btn-primary" href="/marketplace" target="_blank">Live Prototype →</a>
    </div>
    <button className="menu-btn"  aria-label="Toggle navigation">☰</button>
  </div>
  <div className="mobile-nav" id="mobileNav">
    <a href="#summary" >Summary</a>
    <a href="#brand" >Brand</a>
    <a href="#design" >Design</a>
    <a href="#market" >Marketplace</a>
    <a href="#admin" >Admin</a>
    <a href="#data" >Data</a>
    <a href="#stack" >Tech</a>
    <a href="#roadmap" >Roadmap</a>
    <hr style={{ border: '0', borderTop: '1px solid var(--line)', margin: '8px 0' }} />
    <a href="/marketplace" target="_blank">Live Prototype →</a>
  </div>
</header>


<div className="cover" id="top">
  <div className="wrap">
    <span className="eyebrow"><span className="dot"></span> World-Class Platform Blueprint · v1.0</span>
    <h1>The definitive land exchange for <em>Bengaluru's</em> next decade of growth.</h1>
    <p className="lead">A blueprint for a premium real-estate platform focused on large land parcels in and around Bengaluru — purpose-built for villa & apartment townships, industries, resorts, agriculture, and strategic land-banking. Featuring a world-class public marketplace and a powerful admin dashboard.</p>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <a className="btn btn-gold" href="/marketplace" target="_blank">Explore Marketplace Prototype</a>
      <a className="btn btn-ghost" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }} href="#summary">Read the Blueprint</a>
    </div>
    <div className="meta">
      <div><div className="k">2</div><div className="v">Core Products</div></div>
      <div><div className="k">9</div><div className="v">Use-Case Segments</div></div>
      <div><div className="k">70+</div><div className="v">Data Fields / Parcel</div></div>
      <div><div className="k">150+</div><div className="v">Spatial Intelligence Layers</div></div>
    </div>
  </div>
  <div className="badge-float">
    <div className="t">Bhūmī Architecture</div>
    <div className="s">Designed for scale, transaction safety, and spatial intelligence.</div>
  </div>
</div>


<section id="summary">
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">01 — EXECUTIVE SUMMARY</div>
        <h2 className="sec-title serif">One platform. Every large parcel. Total transparency.</h2>
      </div>
      <p className="sec-sub">Bhūmī consolidates Bengaluru's fragmented large-parcel land market into a single, trustworthy, intelligence-rich marketplace — paired with an admin console that lets the team publish, verify, and manage inventory in minutes.</p>
    </div>

    <div className="grid g3">
      <div className="card">
        <div className="ico">◆</div>
        <h3>The Problem</h3>
        <p>Large-parcel buyers (developers, investors, industries) waste weeks hunting across brokers, WhatsApp groups, and vague listings with missing legal, zoning, and spatial data. Trust is low; diligence is slow.</p>
      </div>
      <div className="card">
        <div className="ico">✦</div>
        <h3>The Solution</h3>
        <p>A curated, verified inventory where every parcel ships with the 70+ facts that actually decide a deal — extent, title, conversion, zoning, frontage, risk flags, pricing, and suitability for each use-case.</p>
      </div>
      <div className="card">
        <div className="ico">▲</div>
        <h3>The Edge</h3>
        <p>A spatial-intelligence layer (growth corridors, upcoming infra, flood &amp; drain buffers) layered on top of listings — so buyers don't just <em>see</em> land, they <em>understand</em> it. Plus a frictionless admin that keeps it all current.</p>
      </div>
    </div>

    <div className="grid g4" style={{ marginTop: '30px' }}>
      <div><div className="kpi">Efficient</div><div className="kpi-l">Shortlist from screen, visit only the shortlist.</div></div>
      <div><div className="kpi">Transparent</div><div className="kpi-l">Verified title, zoning &amp; pricing on every parcel.</div></div>
      <div><div className="kpi">Intelligent</div><div className="kpi-l">Growth, risk &amp; connectivity decoded per location.</div></div>
      <div><div className="kpi">Trusted</div><div className="kpi-l">Curated inventory, expert consultation, clean UX.</div></div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="brand">
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">02 — BRAND &amp; POSITIONING</div>
        <h2 className="sec-title serif">A name rooted in the land it serves.</h2>
      </div>
      <p className="sec-sub">Working brand “Bhūmī” (Sanskrit/Kannada for <em>earth/land</em>) signals rootedness, trust, and scale — appropriate for a serious land platform. Alternatives provided below.</p>
    </div>

    <div className="split">
      <div>
        <span className="pill">Brand essence</span>
        <h3 className="serif" style={{ fontSize: '1.7rem', margin: '16px 0 8px' }}>“Find it. Understand it. Own it — with full clarity.”</h3>
        <p className="lead-p">Bhūmī is positioned as Bengaluru's most trustworthy large-parcel land marketplace — the place serious buyers go first. Premium but not flashy; data-rich but human; local expertise delivered through world-class product design.</p>
        <ul className="check">
          <li><span className="c">✓</span><div><b>Voice:</b> Confident, precise, advisory. No hype, no spam, no inflated promises.</div></li>
          <li><span className="c">✓</span><div><b>Audience:</b> Developers, REITs/land bankers, industries, institutional investors, HNI/NRI buyers, hospitality &amp; agri groups.</div></li>
          <li><span className="c">✓</span><div><b>Promise:</b> Every listing is real, verified, and richly documented — diligence-ready.</div></li>
        </ul>
      </div>
      <div>
        <div className="card" style={{ background: 'var(--paper)' }}>
          <div className="mono" style={{ color: 'var(--gold)' }}>NAMING OPTIONS</div>
          <div style={{ marginTop: '14px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <span className="serif" style={{ fontSize: '1.15rem' }}>Bhūmī</span><span className="tag">RECOMMENDED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <span className="serif" style={{ fontSize: '1.15rem' }}>TerraBengaluru</span><span className="note">descriptive</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <span className="serif" style={{ fontSize: '1.15rem' }}>Acreage</span><span className="note">modern</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <span className="serif" style={{ fontSize: '1.15rem' }}>Bengaluru Land Co.</span><span className="note">institutional</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <span className="serif" style={{ fontSize: '1.15rem' }}>Prithvi Lands</span><span className="note">heritage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="design">
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">03 — DESIGN SYSTEM</div>
        <h2 className="sec-title serif">A visual language of earth, growth &amp; gold.</h2>
      </div>
      <p className="sec-sub">A token-based system ensuring pixel consistency across the public marketplace, the admin dashboard, and all future surfaces.</p>
    </div>

    <h4 className="serif" style={{ marginBottom: '14px' }}>Color palette</h4>
    <div className="swatches">
      <div className="sw"><div className="blk" style={{ background: '#0E3B2E' }}></div><div className="lab"><b>Forest</b><code>#0E3B2E</code></div></div>
      <div className="sw"><div className="blk" style={{ background: '#1F7A6D' }}></div><div className="lab"><b>Teal</b><code>#1F7A6D</code></div></div>
      <div className="sw"><div className="blk" style={{ background: '#27684E' }}></div><div className="lab"><b>Moss</b><code>#27684E</code></div></div>
      <div className="sw"><div className="blk" style={{ background: '#C2974A' }}></div><div className="lab"><b>Brass / Gold</b><code>#C2974A</code></div></div>
      <div className="sw"><div className="blk" style={{ background: '#F6F3EC' }}></div><div className="lab"><b>Cream</b><code>#F6F3EC</code></div></div>
      <div className="sw"><div className="blk" style={{ background: '#10231B' }}></div><div className="lab"><b>Ink</b><code>#10231B</code></div></div>
    </div>

    <div className="grid g2" style={{ marginTop: '34px' }}>
      <div>
        <h4 className="serif" style={{ marginBottom: '6px' }}>Typography</h4>
        <p className="note">A high-contrast serif for gravitas + a clean grotesque for data clarity.</p>
        <div className="type-row"><div className="lbl">DISPLAY · Fraunces</div><div className="specimen" style={{ fontSize: '2.1rem' }}>Land, decoded.</div></div>
        <div className="type-row"><div className="lbl">HEADING · Fraunces</div><div className="specimen" style={{ fontSize: '1.4rem' }}>Prime parcels, verified</div></div>
        <div className="type-row"><div className="lbl">BODY · Inter</div><div style={{ fontSize: '1rem' }}>Every parcel ships with the 70+ facts that decide a deal — extent, title, conversion, zoning, frontage and risk.</div></div>
        <div className="type-row"><div className="lbl">DATA · JetBrains Mono</div><div className="mono">BLR-1042 · 68 AC · ₹9.5 Cr/AC</div></div>
      </div>
      <div>
        <h4 className="serif" style={{ marginBottom: '6px' }}>Foundations</h4>
        <div className="grid g2" style={{ gap: '14px' }}>
          <div className="card" style={{ padding: '18px' }}><div className="ico" style={{ marginBottom: '10px' }}>◐</div><h3 style={{ fontSize: '1rem' }}>Radii</h3><p>12 / 18 / 24px — soft, modern, premium.</p></div>
          <div className="card" style={{ padding: '18px' }}><div className="ico" style={{ marginBottom: '10px' }}>▤</div><h3 style={{ fontSize: '1rem' }}>Elevation</h3><p>3 shadow tiers; restraint over heaviness.</p></div>
          <div className="card" style={{ padding: '18px' }}><div className="ico" style={{ marginBottom: '10px' }}>⤢</div><h3 style={{ fontSize: '1rem' }}>Spacing</h3><p>4px base scale; generous whitespace.</p></div>
          <div className="card" style={{ padding: '18px' }}><div className="ico" style={{ marginBottom: '10px' }}>◉</div><h3 style={{ fontSize: '1rem' }}>Motion</h3><p>180–300ms ease; purposeful, never decorative.</p></div>
        </div>
      </div>
    </div>

    <div className="grid g4" style={{ marginTop: '30px' }}>
      <div className="card" style={{ padding: '18px' }}><div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: '600', letterSpacing: '.08em' }}>BUTTONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          <button className="btn btn-primary" style={{ justifyContent: 'center' }}>Enquire Now</button>
          <button className="btn btn-gold" style={{ justifyContent: 'center' }}>Book Visit</button>
          <button className="btn btn-ghost" style={{ justifyContent: 'center' }}>View Detail</button>
        </div>
      </div>
      <div className="card" style={{ padding: '18px' }}><div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: '600', letterSpacing: '.08em' }}>STATUS PILLS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '12px' }}>
          <span className="pill" style={{ background: '#e6f4ec', color: '#1d7a4d' }}>Verified</span>
          <span className="pill" style={{ background: '#fff4e3', color: '#9a6a12' }}>Negotiable</span>
          <span className="pill" style={{ background: '#fde9e4', color: '#b7462f' }}>Sold</span>
          <span className="pill" style={{ background: '#eef3ef', color: 'var(--green)' }}>Featured</span>
        </div>
      </div>
      <div className="card" style={{ padding: '18px' }}><div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: '600', letterSpacing: '.08em' }}>INPUTS</div>
        <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
          <input style={{ border: '1px solid var(--line)', borderRadius: '9px', padding: '9px 11px', fontSize: '.8rem', fontFamily: 'inherit' }} placeholder="Location…" />
          <select style={{ border: '1px solid var(--line)', borderRadius: '9px', padding: '9px 11px', fontSize: '.8rem', fontFamily: 'inherit', color: 'var(--muted)' }}><option>Use-case…</option></select>
        </div>
      </div>
      <div className="card" style={{ padding: '18px' }}><div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: '600', letterSpacing: '.08em' }}>ICONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginTop: '12px', textAlign: 'center', color: 'var(--green)' }}>
          <div style={{ fontSize: '1.2rem' }}>🏚</div><div style={{ fontSize: '1.2rem' }}>🏗</div><div style={{ fontSize: '1.2rem' }}>🌾</div><div style={{ fontSize: '1.2rem' }}>🏭</div>
          <div style={{ fontSize: '1.2rem' }}>🏝</div><div style={{ fontSize: '1.2rem' }}>📐</div><div style={{ fontSize: '1.2rem' }}>📍</div><div style={{ fontSize: '1.2rem' }}>📄</div>
        </div>
        <p className="note" style={{ marginTop: '10px', fontSize: '.74rem' }}>Line-icon set, 1.5px stroke, 24px grid.</p>
      </div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="products">
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">04 — PRODUCT ARCHITECTURE</div>
        <h2 className="sec-title serif">Two products, one platform.</h2>
      </div>
      <p className="sec-sub">A public-facing marketplace for buyers &amp; investors, and a private admin console for the team. They share one design system, one data model, and one source of truth.</p>
    </div>

    <div className="grid g2">
      <div className="card" style={{ borderTop: '4px solid var(--green)' }}>
        <span className="pill">Public · Marketing site</span>
        <h3 className="serif" style={{ fontSize: '1.5rem', margin: '14px 0 8px' }}>Marketplace</h3>
        <p className="lead-p">Where buyers discover, shortlist, and enquire. Built for conversion, trust, and speed — search, map, filter, and immersive detail pages.</p>
        <ul className="check">
          <li><span className="c">→</span><div>Hero search + smart filters by zone, use-case, size &amp; price</div></li>
          <li><span className="c">→</span><div>Card grid &amp; interactive map toggle</div></li>
          <li><span className="c">→</span><div>Deep property detail with 70+ fields + spatial intel</div></li>
          <li><span className="c">→</span><div>Drone gallery, 360° tours, documents &amp; layout plans</div></li>
          <li><span className="c">→</span><div>Enquiry, site-visit booking &amp; WhatsApp lead capture</div></li>
        </ul>
      </div>
      <div className="card" style={{ borderTop: '4px solid var(--gold)' }}>
        <span className="pill" style={{ background: '#f6efdd', color: 'var(--gold)' }}>Private · Authenticated</span>
        <h3 className="serif" style={{ fontSize: '1.5rem', margin: '14px 0 8px' }}>Admin Dashboard</h3>
        <p className="lead-p">Where the team runs the business — add &amp; edit inventory, manage leads, and watch performance in real time. Login-protected, role-based.</p>
        <ul className="check">
          <li><span className="c">→</span><div>Secure login + role-based access (Admin, Editor, Sales)</div></li>
          <li><span className="c">→</span><div>Full CRUD property editor with live preview</div></li>
          <li><span className="c">→</span><div>Drag-drop media manager (images, drone, docs)</div></li>
          <li><span className="c">→</span><div>Enquiry &amp; site-visit pipeline (Kanban + table)</div></li>
          <li><span className="c">→</span><div>Analytics: views, enquiries, conversion, inventory health</div></li>
        </ul>
      </div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="market" style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">05 — PRODUCT 1 · MARKETPLACE</div>
        <h2 className="sec-title serif">Designed to shortlist from the screen.</h2>
      </div>
      <p className="sec-sub">The guiding principle: buyers should be able to confidently shortlist 3–5 parcels from their phone before ever visiting a site.</p>
    </div>

    <div className="grid g3" style={{ marginBottom: '34px' }}>
      <div className="card"><div className="ico">⌕</div><h3>Smart Search &amp; Filters</h3><p>Filter by micro-market zone (Devanahalli, Sarjapur, Doddaballapur, Hoskote, Nelamangala, Anekal…), extent range, price band, land-use type, road frontage, title status, and intended use-case.</p><span className="tag">CORE</span></div>
      <div className="card"><div className="ico">🗪</div><h3>Grid ↔ Map Toggle</h3><p>Switch between a dense card grid and an interactive map with colour-coded pins by use-case. Draw a polygon to search within an area; see clusters at scale.</p><span className="tag">CORE</span></div>
      <div className="card"><div className="ico">↗</div><h3>Deep Detail Page</h3><p>The heart of the platform: every key fact surfaced in scannable, well-grouped sections — location, extent, legal/title, pricing, suitability, media, and spatial intelligence.</p><span className="tag">CORE</span></div>
      <div className="card"><div className="ico">◎</div><h3>Immersive Media</h3><p>Hero gallery, drone footage, 360° site tours, downloadable brochure, cadastral/boundary map, and approved layout/master-plan where available.</p><span className="tag">DELIGHT</span></div>
      <div className="card"><div className="ico">⚑</div><h3>Spatial Intelligence</h3><p>Growth-corridor designation, upcoming infrastructure within radius, flood/rajakaluve risk flags, connectivity scores, and nearby price trends — the TalkingLands-inspired layer.</p><span className="tag">DIFFERENTIATOR</span></div>
      <div className="card"><div className="ico">✆</div><h3>Lead Capture</h3><p>Enquire, request a site visit, or jump to WhatsApp — with preferred slots. Leads route instantly to the assigned agent in the admin pipeline.</p><span className="tag">CORE</span></div>
    </div>

    <div className="split">
      <div className="mock">
        <div className="browser"><i style={{ background: '#ed6a5e' }}></i><i style={{ background: '#f4bf4f' }}></i><i style={{ background: '#61c554' }}></i><span className="url">bhumi.land / properties</span></div>
        <div className="body">
          <div className="mk-nav"><span className="l">Bhūmī</span><div className="r"><span>Properties</span><span>Map</span><span>Insights</span><span>Enquire</span></div></div>
          <div className="mk-hero"><b>Prime parcels, verified.</b><div className="srch">⌕  Search location, extent, use-case…</div></div>
          <div className="mk-cards">
            <div className="mk-card"><div className="ph" style={{ background: 'linear-gradient(135deg,#cdd9d2,#8fae9d)' }}></div><div className="bx"><b>68 Ac · Devanahalli</b><small>NH-44 frontage</small><span className="pr">₹9.5 Cr/Ac</span></div></div>
            <div className="mk-card"><div className="ph" style={{ background: 'linear-gradient(135deg,#cfe0e6,#7fa8b8)' }}></div><div className="bx"><b>22 Ac · Sarjapur</b><small>Lake-view</small><span className="pr">₹6.2 Cr/Ac</span></div></div>
            <div className="mk-card"><div className="ph" style={{ background: 'linear-gradient(135deg,#e6dcc4,#c2a85f)' }}></div><div className="bx"><b>45 Ac · Hoskote</b><small>Industrial</small><span className="pr">₹3.8 Cr/Ac</span></div></div>
          </div>
        </div>
      </div>
      <div>
        <span className="pill">Use-case segments</span>
        <h3 className="serif" style={{ fontSize: '1.6rem', margin: '14px 0' }}>Nine ways buyers arrive — one inventory to serve them.</h3>
        <p className="lead-p">Every parcel is tagged for suitability, so buyers land on exactly the right inventory from the very first click.</p>
        <div className="grid g2" style={{ gap: '10px', marginTop: '18px' }}>
          <div className="pill">🏚 Villa &amp; Apartment Townships</div>
          <div className="pill">🏭 Industrial / Logistics</div>
          <div className="pill">🏢 IT Parks / SEZ</div>
          <div className="pill">🏝 Resorts &amp; Farmstays</div>
          <div className="pill">🌾 Agriculture / Farm land</div>
          <div className="pill">🎓 Institutional (school/hospital)</div>
          <div className="pill">🏙 Township / Mixed-use</div>
          <div className="pill">📈 Land banking / Future</div>
          <div className="pill">🛣 Highway commercial</div>
        </div>
        <a className="preview-link" href="/marketplace" target="_blank">Open the full interactive prototype →</a>
      </div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="admin">
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">06 — PRODUCT 2 · ADMIN DASHBOARD</div>
        <h2 className="sec-title serif">Publish a parcel in minutes, not days.</h2>
      </div>
      <p className="sec-sub">A login-protected command center with role-based access. The same rich data model that powers the public site is edited here — with live preview, validation, and instant publish.</p>
    </div>

    <div className="split reverse">
      <div className="mock">
        <div className="browser"><i style={{ background: '#ed6a5e' }}></i><i style={{ background: '#f4bf4f' }}></i><i style={{ background: '#61c554' }}></i><span className="url">admin.bhumi.land</span></div>
        <div className="ad-grid">
          <div className="ad-side">
            <div style={{ fontFamily: 'var(--serif)', color: '#fff', fontSize: '.8rem', marginBottom: '14px' }}>Bhūmī · Admin</div>
            <div className="it on">▦ Dashboard</div>
            <div className="it">▤ Properties</div>
            <div className="it">＋ Add Property</div>
            <div className="it">✆ Enquiries</div>
            <div className="it">◎ Media</div>
            <div className="it">▯ Analytics</div>
            <div className="it">⚙ Settings</div>
          </div>
          <div className="ad-main">
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', marginBottom: '10px' }}>Good morning, Admin 👋</div>
            <div className="ad-stats">
              <div className="ad-stat"><div className="n">128</div><div className="l">Live listings</div></div>
              <div className="ad-stat"><div className="n">42</div><div className="l">New enquiries</div></div>
              <div className="ad-stat"><div className="n">1.2k</div><div className="l">Views / wk</div></div>
              <div className="ad-stat"><div className="n">₹486Cr</div><div className="l">Inventory value</div></div>
            </div>
            <div className="ad-table">
              <div className="hd"><span>Property</span><span>Zone</span><span>Ext</span><span>Price/Ac</span><span>Status</span></div>
              <div className="rw"><span>Devanahalli parcel</span><span>North</span><span>68 Ac</span><span>₹9.5Cr</span><span style={{ color: '#1d7a4d' }}>Live</span></div>
              <div className="rw"><span>Sarjapur lake land</span><span>East</span><span>22 Ac</span><span>₹6.2Cr</span><span style={{ color: '#1d7a4d' }}>Live</span></div>
              <div className="rw"><span>Hoskote industrial</span><span>East</span><span>45 Ac</span><span>₹3.8Cr</span><span style={{ color: '#9a6a12' }}>Draft</span></div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <span className="pill">Admin capabilities</span>
        <h3 className="serif" style={{ fontSize: '1.6rem', margin: '14px 0' }}>Everything to run the marketplace.</h3>
        <div className="grid" style={{ gap: '14px', marginTop: '14px' }}>
          <div className="card" style={{ padding: '18px' }}><h3 style={{ fontSize: '1rem' }}>🔐 Secure, role-based login</h3><p>JWT auth, bcrypt-hashed passwords, session management, and roles: Admin, Editor, Sales agent.</p></div>
          <div className="card" style={{ padding: '18px' }}><h3 style={{ fontSize: '1rem' }}>📝 Guided property editor</h3><p>Stepped form across all 70+ fields with validation, autosave drafts, and a live preview pane.</p></div>
          <div className="card" style={{ padding: '18px' }}><h3 style={{ fontSize: '1rem' }}>🖼 Media manager</h3><p>Drag-drop upload, reorder, image optimization, and links for drone/360/docs.</p></div>
          <div className="card" style={{ padding: '18px' }}><h3 style={{ fontSize: '1rem' }}>📊 Lead &amp; analytics</h3><p>Enquiry pipeline, site-visit calendar, and dashboards for views, enquiries &amp; conversion.</p></div>
        </div>
        <a className="preview-link" href="/admin/login" target="_blank">Open the admin dashboard demo →</a>
      </div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="data" style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">07 — PROPERTY DATA MODEL</div>
        <h2 className="sec-title serif">The 70+ facts that actually decide a deal.</h2>
      </div>
      <p className="sec-sub">Every parcel is captured against this schema in the admin, then rendered on the public site. This is the backbone of the platform's transparency promise.</p>
    </div>

    <div className="schema">
      <details className="schema-group" open>
        <summary><span className="glyph">▣</span> Identity &amp; Listing<span className="cnt">9 fields</span><span className="arr">›</span></summary>
        <table className="schema-tbl">
          <tr><th>Property ID <span className="req">req</span></th><td>Unique human code, e.g. <code>BLR-1042</code> (auto-incrementing, zone-prefixed).</td></tr>
          <tr><th>Headline / Title <span className="req">req</span></th><td>SEO-rich, e.g. “68 Acres NH-44 Frontage Land – Devanahalli”.</td></tr>
          <tr><th>Short summary <span className="req">req</span></th><td>One-line teaser for cards.</td></tr>
          <tr><th>Description <span className="opt">opt</span></th><td>Rich-text rationale, location highlights &amp; investment thesis.</td></tr>
          <tr><th>Listing type <span className="req">req</span></th><td>Sale / Joint Venture / Lease / Outright.</td></tr>
          <tr><th>Status <span className="req">req</span></th><td>Draft / Live / Reserved / Under Agreement / Sold.</td></tr>
          <tr><th>Featured <span className="opt">opt</span></th><td>Boolean — surfaces on homepage carousel.</td></tr>
          <tr><th>Use-case tags <span className="req">req</span></th><td>Multi-select: township, villa, apartments, industrial, IT/SEZ, resort, agriculture, institutional, land-banking, highway-commercial.</td></tr>
          <tr><th>Assigned agent <span className="opt">opt</span></th><td>Maps enquiries to the responsible sales agent.</td></tr>
        </table>
      </details>

      <details className="schema-group">
        <summary><span className="glyph">◉</span> Location &amp; Connectivity<span className="cnt">11 fields</span><span className="arr">›</span></summary>
        <table className="schema-tbl">
          <tr><th>Micro-market / Zone <span className="req">req</span></th><td>Devanahalli, Sarjapur, Doddaballapur, Hoskote, Nelamangala, Anekal, Kanakapura Rd, Mysore Rd, Tumkur Rd, etc.</td></tr>
          <tr><th>Locality / Village <span className="req">req</span></th><td>Specific settlement name.</td></tr>
          <tr><th>Survey number(s) <span className="opt">opt</span></th><td>For cadastral matching &amp; verification.</td></tr>
          <tr><th>Latitude / Longitude <span className="req">req</span></th><td>Drives map pins &amp; radius intelligence.</td></tr>
          <tr><th>Distance to Airport (km) <span className="opt">opt</span></th><td>Kempegowda Int'l — key for North corridors.</td></tr>
          <tr><th>Distance to ORR / City / Metro <span className="opt">opt</span></th><td>Key connectivity anchors.</td></tr>
          <tr><th>Nearest highway / road <span className="opt">opt</span></th><td>NH-44, STRR, PRR, state highways.</td></tr>
          <tr><th>Road frontage <span className="opt">opt</span></th><td>Yes/No + road type + frontage length (m/ft).</td></tr>
          <tr><th>Connectivity notes <span className="opt">opt</span></th><td>Free text.</td></tr>
          <tr><th>Upcoming infra within radius <span className="opt">opt</span></th><td>Metro extensions, Peripheral Ring Road, STRR phases, etc.</td></tr>
          <tr><th>Pin / polygon geometry <span className="opt">opt</span></th><td>GeoJSON boundary for accurate map render.</td></tr>
        </table>
      </details>

      <details className="schema-group">
        <summary><span className="glyph">📐</span> Extent &amp; Physical<span className="cnt">9 fields</span><span className="arr">›</span></summary>
        <table className="schema-tbl">
          <tr><th>Total extent <span className="req">req</span></th><td>Acres + Guntas + Sqft (auto-converted).</td></tr>
          <tr><th>Dimensions / shape <span className="opt">opt</span></th><td>e.g. rectangular, irregular, frontage × depth.</td></tr>
          <tr><th>Topography <span className="opt">opt</span></th><td>Flat / gently sloping / undulating.</td></tr>
          <tr><th>Soil type <span className="opt">opt</span></th><td>Red loam, black cotton, rocky, etc.</td></tr>
          <tr><th>Water source / table <span className="opt">opt</span></th><td>Borewell, lake, canal, Cauvery supply proximity.</td></tr>
          <tr><th>Fencing / boundary <span className="opt">opt</span></th><td>None / barbed / compound wall.</td></tr>
          <tr><th>Electricity <span className="opt">opt</span></th><td>Available / transformer / HT line proximity.</td></tr>
          <tr><th>Existing structures / vegetation <span className="opt">opt</span></th><td>Trees, plantations, old buildings.</td></tr>
          <tr><th>Sub-dividable <span className="opt">opt</span></th><td>Can the parcel be split?</td></tr>
        </table>
      </details>

      <details className="schema-group">
        <summary><span className="glyph">⚖</span> Legal, Title &amp; Approvals<span className="cnt">11 fields</span><span className="arr">›</span></summary>
        <table className="schema-tbl">
          <tr><th>Land use / zoning <span className="req">req</span></th><td>Residential / Commercial / Industrial / Agricultural / Mixed / SEZ (per RMP-2031 master plan).</td></tr>
          <tr><th>DC Conversion status <span className="req">req</span></th><td>Converted / Not converted / NA.</td></tr>
          <tr><th>Khata <span className="opt">opt</span></th><td>A Khata / B Khata / Ekatha.</td></tr>
          <tr><th>Ownership type <span className="req">req</span></th><td>Single owner / Multiple / GPA / Agreement holder.</td></tr>
          <tr><th>Title clarity <span className="req">req</span></th><td>Clear / Pending / Disputed — with confidence flag.</td></tr>
          <tr><th>Encumbrance status <span className="opt">opt</span></th><td>EC summary, mortgage, liens.</td></tr>
          <tr><th>Litigation status <span className="opt">opt</span></th><td>None / Ongoing — with summary.</td></tr>
          <tr><th>Approvals <span className="opt">opt</span></th><td>BDA / BIAPPA / BMRDA / DTCP / KIADB / panchayat.</td></tr>
          <tr><th>Revenue records <span className="opt">opt</span></th><td>RTC/MR, Mutation Register extracts.</td></tr>
          <tr><th>Risk flags <span className="req">req</span></th><td>Flood zone / Rajakaluve buffer / Lake buffer / High-tension line / Gomala — surfaced as badges.</td></tr>
          <tr><th>Documents <span className="opt">opt</span></th><td>Title report, EC, sketch, brochure uploads.</td></tr>
        </table>
      </details>

      <details className="schema-group">
        <summary><span className="glyph">₹</span> Pricing &amp; Commercial<span className="cnt">6 fields</span><span className="arr">›</span></summary>
        <table className="schema-tbl">
          <tr><th>Total asking price <span className="req">req</span></th><td>₹ total (auto-computes per-acre &amp; per-sqft).</td></tr>
          <tr><th>Price per acre / sqft <span className="req">req</span></th><td>Derived, shown prominently.</td></tr>
          <tr><th>Price type <span className="req">req</span></th><td>Fixed / Negotiable / On Request.</td></tr>
          <tr><th>Token / booking amount <span className="opt">opt</span></th><td>For reservation.</td></tr>
          <tr><th>Payment terms <span className="opt">opt</span></th><td>Milestone structure, JV ratio, etc.</td></tr>
          <tr><th>Indicative yield / appreciation <span className="opt">opt</span></th><td>Historical corridor appreciation %.</td></tr>
        </table>
      </details>

      <details className="schema-group">
        <summary><span className="glyph">◎</span> Media &amp; Spatial Intelligence<span className="cnt">8 fields</span><span className="arr">›</span></summary>
        <table className="schema-tbl">
          <tr><th>Hero image + gallery <span className="req">req</span></th><td>Curated photographs.</td></tr>
          <tr><th>Drone / 360° tour link <span className="opt">opt</span></th><td>Embeddable immersive media.</td></tr>
          <tr><th>Layout / master plan <span className="opt">opt</span></th><td>Approved plan image/PDF.</td></tr>
          <tr><th>Growth corridor <span className="opt">opt</span></th><td>Designation &amp; rationale.</td></tr>
          <tr><th>Connectivity score <span className="opt">opt</span></th><td>0–100 composite.</td></tr>
          <tr><th>Nearby amenities <span className="opt">opt</span></th><td>Schools, hospitals, malls, transport within radius.</td></tr>
          <tr><th>Price trend (area) <span className="opt">opt</span></th><td>Mini chart of ₹/sqft over time.</td></tr>
          <tr><th>Demographics &amp; demand <span className="opt">opt</span></th><td>Population, employment hubs nearby.</td></tr>
        </table>
      </details>
    </div>
    <p className="note" style={{ marginTop: '18px' }}>Required fields enforce a minimum quality bar before a parcel can go <b>Live</b> — protecting the “verified &amp; transparent” promise.</p>
  </div>
</section>

<hr className="hr-soft" />


<section id="stack">
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">08 — TECH STACK &amp; ARCHITECTURE</div>
        <h2 className="sec-title serif">Modern, scalable, cost-aware.</h2>
      </div>
      <p className="sec-sub">A Jamstack-friendly architecture that delivers blazing-fast public pages, a realtime admin, and headless APIs ready for a future mobile app.</p>
    </div>

    <div className="grid g4">
      <div className="card"><div className="ico">⚛</div><h3>Frontend</h3><p>Next.js (React) + TypeScript. Public site: ISR/SSG for speed &amp; SEO; Admin: client-side SPA.</p><span className="tag">UI</span></div>
      <div className="card"><div className="ico">🖳</div><h3>Backend / API</h3><p>Node.js with NestJS or Next Route Handlers (tRPC/REST + Zod validation).</p><span className="tag">API</span></div>
      <div className="card"><div className="ico">🗄</div><h3>Database</h3><p>PostgreSQL (PostGIS for geo) + Prisma ORM. Redis cache for filters/map.</p><span className="tag">DATA</span></div>
      <div className="card"><div className="ico">🗂</div><h3>Media &amp; Files</h3><p>Cloudflare R2 / AWS S3 + Cloudinary for optimization &amp; transforms.</p><span className="tag">FILES</span></div>
      <div className="card"><div className="ico">🗺</div><h3>Maps &amp; Intel</h3><p>Mapbox GL JS (or Mappls India) for pins, polygons, draw-to-search, clusters.</p><span className="tag">GEO</span></div>
      <div className="card"><div className="ico">🔐</div><h3>Auth</h3><p>JWT + refresh tokens, bcrypt; optional OAuth. RBAC for admin roles.</p><span className="tag">SEC</span></div>
      <div className="card"><div className="ico">📨</div><h3>Integrations</h3><p>WhatsApp Business API, transactional email (Resend), Razorpay for tokens, Calendly for visits.</p><span className="tag">EXT</span></div>
      <div className="card"><div className="ico">🚀</div><h3>Deploy &amp; DX</h3><p>Vercel (web) + managed Postgres; CI via GitHub Actions; Sentry + PostHog analytics.</p><span className="tag">OPS</span></div>
    </div>

    <div className="card" style={{ marginTop: '28px', background: 'var(--paper)' }}>
      <h3 className="serif" style={{ marginBottom: '14px' }}>Architecture at a glance</h3>
      <div className="mono" style={{ background: '#0E3B2E', color: '#dcefe2', padding: '18px', borderRadius: '12px', lineHeight: '1.9', fontSize: '.78rem', overflowX: 'auto' }}>
┌─ <span style={{ color: 'var(--gold-soft)' }}>Public Marketplace</span> (SSG/ISR) &nbsp;┐&nbsp; ┌─ <span style={{ color: 'var(--gold-soft)' }}>Admin Dashboard</span> (SPA, auth) ┐<br  />
│&nbsp; Next.js · Mapbox · Tailwind &nbsp;&nbsp;&nbsp;│&nbsp; │&nbsp; Next.js · Charts · Forms &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br  />
└───────────────┬─────────────┘&nbsp; └───────────────┬──────────────────┘<br  />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp; <span style={{ color: '#9ad' }}>REST/tRPC · Zod validated</span> &nbsp;&nbsp;&nbsp;&nbsp;│<br  />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└───────────────┬─────────────────┘<br  />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌─ PostgreSQL + <span style={{ color: 'var(--gold-soft)' }}>PostGIS</span> (geo, polygons, radius queries)<br  />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ Redis (filter &amp; map cache)<br  />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ Object storage (R2/S3 + Cloudinary) — images, drone, docs<br  />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ Integrations: WhatsApp API · Email · Razorpay · Maps · Analytics
      </div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="money" style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">09 — BUSINESS MODEL</div>
        <h2 className="sec-title serif">Multiple, reinforcing revenue streams.</h2>
      </div>
      <p className="sec-sub">Marketplace liquidity funds growth; high-value services and intelligence create margin.</p>
    </div>
    <div className="grid g2" style={{ gap: '18px' }}>
      <div className="stream"><span className="n">01</span><div><h4>Transaction / Brokerage Commission</h4><p>Percentage of deal value on closed sales &amp; JVs — the core engine.</p></div></div>
      <div className="stream"><span className="n">02</span><div><h4>Listing &amp; Featured Placement</h4><p>Paid featured slots, priority listing for sellers/developers.</p></div></div>
      <div className="stream"><span className="n">03</span><div><h4>Consultation &amp; Risk Reports</h4><p>Paid spatial-intelligence &amp; diligence reports (TalkingLands-style coin/report model).</p></div></div>
      <div className="stream"><span className="n">04</span><div><h4>Immersive Media Services</h4><p>Drone shoots, 360° tours &amp; brochures for landowners/developers.</p></div></div>
      <div className="stream"><span className="n">05</span><div><h4>Enterprise / Broker Tools</h4><p>SaaS subscriptions for developers &amp; brokers (pipeline, microsites).</p></div></div>
      <div className="stream"><span className="n">06</span><div><h4>Financing Partnerships</h4><p>Referral fees from banks/NBFCs for land &amp; project loans.</p></div></div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="roadmap">
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">10 — ROADMAP</div>
        <h2 className="sec-title serif">From MVP to market leader, in four phases.</h2>
      </div>
      <p className="sec-sub">Ship a credible MVP fast, then layer intelligence, monetization, and scale.</p>
    </div>
    <div className="grid g2" style={{ alignItems: 'start' }}>
      <div className="timeline">
        <div className="phase">
          <div className="when">PHASE 1 · MONTHS 0–3</div>
          <h4>Foundation MVP</h4>
          <p>Brand &amp; design system, public marketplace (search, filter, grid, detail pages), admin CRUD + login, and lead capture via WhatsApp/email.</p>
          <div className="deliver"><span>Marketplace</span><span>Admin CRUD</span><span>Auth</span><span>30 seed listings</span></div>
        </div>
        <div className="phase">
          <div className="when">PHASE 2 · MONTHS 3–6</div>
          <h4>Map &amp; Media Layer</h4>
          <p>Interactive map with pins &amp; draw-to-search, drone/360 media embedding, document downloads, and a richer detail experience.</p>
          <div className="deliver"><span>Mapbox</span><span>Drone tours</span><span>Docs</span><span>100+ listings</span></div>
        </div>
        <div className="phase">
          <div className="when">PHASE 3 · MONTHS 6–10</div>
          <h4>Spatial Intelligence</h4>
          <p>Growth corridors, risk flags, connectivity scores, price-trend charts, and paid intelligence reports — the key differentiator.</p>
          <div className="deliver"><span>Risk flags</span><span>Growth intel</span><span>Paid reports</span><span>150 layers</span></div>
        </div>
        <div className="phase">
          <div className="when">PHASE 4 · MONTHS 10–18</div>
          <h4>Scale &amp; Ecosystem</h4>
          <p>Mobile app, broker/enterprise SaaS, project microsites, financing partnerships, and expansion to neighbouring metros.</p>
          <div className="deliver"><span>Mobile app</span><span>SaaS</span><span>Multi-city</span></div>
        </div>
      </div>
      <div>
        <div className="callout">
          <h2>Success metrics that matter.</h2>
          <p>Measured from day one — these KPIs keep the team honest about product-market fit and unit economics.</p>
          <div className="grid g2" style={{ gap: '22px', marginTop: '26px' }}>
            <div><div className="kpi" style={{ color: '#fff' }}>500+</div><div className="kpi-l" style={{ color: '#bcd' }}>Verified listings (Yr 1 target)</div></div>
            <div><div className="kpi" style={{ color: '#fff' }}>3–5%</div><div className="kpi-l" style={{ color: '#bcd' }}>Enquiry→visit conversion</div></div>
            <div><div className="kpi" style={{ color: '#fff' }}>&lt; 2.5s</div><div className="kpi-l" style={{ color: '#bcd' }}>Largest contentful paint</div></div>
            <div><div className="kpi" style={{ color: '#fff' }}>₹500Cr+</div><div className="kpi-l" style={{ color: '#bcd' }}>Inventory value listed</div></div>
            <div><div className="kpi" style={{ color: '#fff' }}>90+</div><div className="kpi-l" style={{ color: '#bcd' }}>Listings with full data score</div></div>
            <div><div className="kpi" style={{ color: '#fff' }}>25%+</div><div className="kpi-l" style={{ color: '#bcd' }}>Visitors returning monthly</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<hr className="hr-soft" />


<section id="trust" style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <div className="sec-head">
      <div>
        <div className="sec-num">11 — SECURITY, COMPLIANCE &amp; TRUST</div>
        <h2 className="sec-title serif">Trust is the product.</h2>
      </div>
      <p className="sec-sub">For high-value land deals, credibility is non-negotiable — baked into tech, process, and UX.</p>
    </div>
    <div className="grid g4">
      <div className="card"><div className="ico">🛡</div><h3>Auth &amp; RBAC</h3><p>JWT sessions, hashed passwords, least-privilege roles, audit logs for every admin action.</p></div>
      <div className="card"><div className="ico">📑</div><h3>Verification Process</h3><p>Checklist-gated publish; sensitive claims (title, risk) flagged as “pending verification”.</p></div>
      <div className="card"><div className="ico">🇮🇳</div><h3>Compliance</h3><p>RERA-aware messaging, DPDP Act data handling, document watermarking &amp; access control.</p></div>
      <div className="card"><div className="ico">⚖</div><h3>Legal Disclaimers</h3><p>Clear “informational only” framing; encourages independent diligence &amp; legal opinion.</p></div>
    </div>
  </div>
</section>


<section style={{ paddingBottom: '30px' }}>
  <div className="wrap">
    <div className="callout">
      <h2>Ready to see it in motion?</h2>
      <p>Two interactive prototypes accompany this blueprint — a buyer-facing marketplace and a login-protected admin dashboard. Both are fully clickable and built on the exact design system documented here.</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
        <a className="btn btn-gold" href="/marketplace" target="_blank">Open Marketplace Prototype</a>
        <a className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }} href="/admin/login" target="_blank">Open Admin Dashboard Demo</a>
      </div>
    </div>
  </div>
</section>


<footer>
  <div className="wrap">
    <div className="grid">
      <div>
        <a href="/" className="brand"><span className="mark">ಭೂ</span><span style={{ color: '#fff' }}>Bhūmī<small>Bengaluru Land Exchange</small></span></a>
        <p style={{ maxWidth: '34ch', fontSize: '.88rem', marginTop: '6px' }}>A world-class blueprint for a premium large-parcel land marketplace focused on Bengaluru — marketplace + admin, intelligence-rich and trust-first.</p>
        <p className="mono" style={{ color: 'var(--gold-soft)', marginTop: '14px' }}>Blueprint v1.0 · 2026</p>
      </div>
      <div><h5>Blueprint</h5><a href="#summary">Summary</a><a href="#brand">Brand</a><a href="#design">Design System</a><a href="#data">Data Model</a><a href="#stack">Tech Stack</a></div>
      <div><h5>Prototypes</h5><a href="/marketplace" target="_blank">Marketplace</a><a href="/admin/login" target="_blank">Admin Dashboard</a></div>
      <div><h5>Reference</h5><a href="founders-brief.html">Executive Brief</a><a href="/marketplace" target="_blank">Inventory Map</a><a href="#roadmap">Platform Roadmap</a></div>
    </div>
    <div className="fbot">
      <span>Conceptual blueprint for demonstration. Not legal or financial advice.</span>
      <span>Bengaluru · India</span>
    </div>
  </div>
</footer>




    </div>
  );
}
