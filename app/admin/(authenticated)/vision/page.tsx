
import React from 'react';
import './vision.css';
import Link from 'next/link';
import AdminLayout from '../layout';

export default function VisionPage() {
  return (
    <div className="doc-wrapper">
      


<header className="topbar">
  <div className="wrap row">
    <a href="/" className="brand"><span className="mark">ಭೂ</span><span>Bhūmī<small>For the Founding Team</small></span></a>
    <div className="cta">
      <a className="btn btn-ghost" href="blueprint.html">Full Blueprint →</a>
      <a className="btn btn-primary" href="/marketplace" target="_blank">See Prototype</a>
    </div>
  </div>
</header>


<div className="cover" id="top">
  <div className="wrap">
    <span className="eyebrow"><span className="dot"></span> Founding Team Brief · Executive Overview</span>
    <h1>A strategic overview of <em>what we're building</em>.</h1>
    <p className="lead">This document outlines the core business fundamentals of Bhūmī — the value proposition, the target audience, the product ecosystem, and the execution strategy. Just the business opportunity and the execution plan.</p>
  </div>
</div>


<section>
  <div className="wrap">
    <span className="sec-tag">01 · The one idea</span>
    <h2 className="big">We are building the <em>most trusted place</em> to buy &amp; sell large land in Bengaluru.</h2>
    <p className="body">Today, finding a large plot of land in Bengaluru — for a villa project, a factory, a resort, a farm, or just as an investment — is messy. Buyers waste weeks jumping between brokers, WhatsApp messages, and vague listings that hide more than they reveal.</p>
    <div style={{ margin: '34px 0' }}>
      <p className="lede">We bring every great parcel of land into one trusted, transparent marketplace — with all the important facts in one place, so a buyer can confidently choose from their screen.</p>
    </div>
    <p className="body"><strong>That's it.</strong> Be the first place serious land buyers think of, and the easiest place for landowners to be seen. Everything else flows from that.</p>
  </div>
</section>
<hr className="hr-soft" />


<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">02 · Why now, why Bengaluru</span>
    <h2 className="big">Bengaluru is growing outward — and land is the prize.</h2>
    <p className="body">The city is expanding fast along every direction — the airport, the ring roads, new metros, industrial corridors. The people who own or buy the right land early stand to gain enormously. But the market to find and trust that land is broken.</p>
    <div className="stats">
      <div className="stat"><div className="k">#3</div><div className="l">Largest metro in India — and still growing fast</div></div>
      <div className="stat"><div className="k">9</div><div className="l">Active growth corridors around the city</div></div>
      <div className="stat"><div className="k">Crores</div><div className="l">In land changing hands every month — mostly offline</div></div>
      <div className="stat"><div className="k">0</div><div className="l">Trusted, large-parcel-first brands serving this need</div></div>
    </div>
    <p className="body" style={{ marginTop: '28px' }}>There is no clear, trusted leader for <strong>large parcels of land</strong>. Most property platforms focus on apartments and houses. We focus on the land underneath everything — the raw material of all development. That's a wide-open lane.</p>
  </div>
</section>
<hr className="hr-soft" />


<section>
  <div className="wrap">
    <span className="sec-tag">03 · Who we serve</span>
    <h2 className="big">Six kinds of people come to us.</h2>
    <p className="body">Each arrives with a different goal — but they all need the same thing: trustworthy land, clearly explained. We tag every parcel for who it suits best.</p>
    <div className="grid g3" style={{ marginTop: '30px' }}>
      <div className="card"><div className="emoji">🏘</div><h3>The Developer</h3><p>Building villa or apartment townships. Needs large, well-located, titled parcels they can plan a whole project on.</p><span className="who">Township · Villa</span></div>
      <div className="card"><div className="emoji">🏭</div><h3>The Industrialist</h3><p>Needs land for factories, warehouses, logistics. Cares about roads, power, soil and clearances.</p><span className="who">Industrial</span></div>
      <div className="card"><div className="emoji">📈</div><h3>The Investor</h3><p>Buying land to hold and let it appreciate. Wants growth corridors and future infrastructure.</p><span className="who">Land-banking</span></div>
      <div className="card"><div className="emoji">🏝</div><h3>The Resort Builder</h3><p>Looking for scenic, peaceful land for resorts, retreats or farmstays.</p><span className="who">Resort · Farmstay</span></div>
      <div className="card"><div className="emoji">🌾</div><h3>The Farmer / Agri Buyer</h3><p>Wants fertile, water-rich farmland — sometimes to cultivate, often to hold.</p><span className="who">Agriculture</span></div>
      <div className="card"><div className="emoji">🏢</div><h3>The Institution</h3><p>Schools, hospitals, IT parks, SEZs — need sizable, well-connected, zoned land.</p><span className="who">Institutional</span></div>
    </div>
    <p className="body" style={{ marginTop: '24px' }}><strong>One inventory, many doors in.</strong> A buyer can arrive looking for "factory land near Hoskote" or "farmland on Kanakapura Road" — and land in exactly the right place.</p>
  </div>
</section>
<hr className="hr-soft" />


<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">04 · What we're building</span>
    <h2 className="big">Two things — and only two.</h2>
    <p className="body">Everything we make falls into one of two buckets. Keep it this simple.</p>
    <div className="split">
      <div className="product buyer">
        <div className="ph">Thing 1 · For the world to see</div>
        <h3>The Marketplace</h3>
        <p>Our shop window. The website buyers visit to find land.</p>
        <ul>
          <li><span className="c">✓</span>Search by area, size, price &amp; purpose</li>
          <li><span className="c">✓</span>Beautiful property pages with every key fact</li>
          <li><span className="c">✓</span>Photos, drone views &amp; maps</li>
          <li><span className="c">✓</span>Enquire or book a visit in one tap</li>
        </ul>
      </div>
      <div className="product team">
        <div className="ph">Thing 2 · For us to run it</div>
        <h3>The Admin Dashboard</h3>
        <p>Our back office. Where the team adds &amp; manages everything.</p>
        <ul>
          <li><span className="c">✓</span>Log in securely to add new land parcels</li>
          <li><span className="c">✓</span>Fill in all the property details &amp; photos</li>
          <li><span className="c">✓</span>See who enquired &amp; follow up</li>
          <li><span className="c">✓</span>Track views, leads &amp; performance</li>
        </ul>
      </div>
    </div>
    <p className="body" style={{ marginTop: '24px' }}>When we add or edit a parcel in the admin, it instantly appears on the marketplace. <strong>One source of truth.</strong> No duplication, no confusion.</p>
  </div>
</section>
<hr className="hr-soft" />


<section>
  <div className="wrap">
    <span className="sec-tag">05 · Our promise to every buyer</span>
    <h2 className="big">Every parcel tells the <em>whole story</em>.</h2>
    <p className="body">This is what makes us different from every broker and listing site. For each piece of land, we don't just post a photo and a price — we answer the questions a buyer would otherwise spend weeks chasing.</p>
    <div className="flow">
      <div className="step"><div className="n">WHERE</div><h4>Location</h4><p>Exactly where, what's nearby, how connected</p></div>
      <div className="arrow">→</div>
      <div className="step"><div className="n">HOW BIG</div><h4>Extent &amp; Shape</h4><p>How many acres, the terrain, the soil</p></div>
      <div className="arrow">→</div>
      <div className="step"><div className="n">IS IT SAFE</div><h4>Legal &amp; Title</h4><p>Ownership, clear title, approvals, risk flags</p></div>
      <div className="arrow">→</div>
      <div className="step"><div className="n">HOW MUCH</div><h4>Price</h4><p>Clear pricing, per acre, negotiable or not</p></div>
      <div className="arrow">→</div>
      <div className="step"><div className="n">GOOD FOR?</div><h4>Best Use</h4><p>What this land is actually suited for</p></div>
    </div>
    <p className="body" style={{ marginTop: '24px' }}>When a buyer can see all five on their phone, they can confidently <strong>shortlist 3–5 parcels before ever visiting a site.</strong> That speed and confidence is our product.</p>
  </div>
</section>
<hr className="hr-soft" />


<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">06 · Why buyers will choose us</span>
    <h2 className="big">Today is chaos. Tomorrow is clarity.</h2>
    <div className="vs">
      <div className="col bad">
        <h4><span className="ic">✕</span> Buying land today</h4>
        <ul>
          <li><span className="ic">✕</span>Days of calling random brokers</li>
          <li><span className="ic">✕</span>Vague listings with one photo &amp; no details</li>
          <li><span className="ic">✕</span>No idea if the title is clear or risky</li>
          <li><span className="ic">✕</span>Visiting plots that turn out to be wrong</li>
          <li><span className="ic">✕</span>Hidden prices, hidden problems</li>
        </ul>
      </div>
      <div className="col good">
        <h4><span className="ic">✓</span> Buying land with Bhūmī</h4>
        <ul>
          <li><span className="ic">✓</span>One trusted place, all verified parcels</li>
          <li><span className="ic">✓</span>Full details, photos, maps &amp; drone views</li>
          <li><span className="ic">✓</span>Title &amp; risk clearly shown upfront</li>
          <li><span className="ic">✓</span>Shortlist from screen — visit only the best</li>
          <li><span className="ic">✓</span>Transparent pricing &amp; honest guidance</li>
        </ul>
      </div>
    </div>
    <p className="body" style={{ marginTop: '26px' }}><strong>Trust is our real product.</strong> Land deals are huge decisions. If people believe we tell the truth — clearly and completely — they'll keep coming back, and they'll tell others.</p>
  </div>
</section>
<hr className="hr-soft" />


<section>
  <div className="wrap">
    <span className="sec-tag">07 · How we make money</span>
    <h2 className="big">Several ways — one core engine.</h2>
    <p className="body">The business earns from multiple streams, but most of our money comes from successfully connecting buyers and sellers of land.</p>
    <div className="money">
      <div className="row"><div className="num">01</div><div><h4>Success commission on deals</h4><p>When a deal closes because of us — a sale, a joint venture, a lease — we earn a percentage. This is the heart of the business.</p><span className="pill core">CORE · from day one</span></div></div>
      <div className="row"><div className="num">02</div><div><h4>Paid featured listings</h4><p>Landowners or developers who want their parcel shown first and highlighted pay for premium placement.</p><span className="pill core">CORE · from day one</span></div></div>
      <div className="row"><div className="num">03</div><div><h4>Expert consultation &amp; reports</h4><p>Buyers pay for deep due-diligence — location analysis, risk checks, valuation reports.</p><span className="pill later">LATER · once trust is built</span></div></div>
      <div className="row"><div className="num">04</div><div><h4>Drone, photo &amp; media services</h4><p>We shoot and create beautiful media (drone tours, brochures) for landowners who want to list well.</p><span className="pill later">LATER · as we grow</span></div></div>
      <div className="row"><div className="num">05</div><div><h4>Loan &amp; financing referrals</h4><p>Banks pay us when we connect a buyer to a land or project loan.</p><span className="pill later">LATER · partnerships</span></div></div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">08 · The path forward</span>
    <h2 className="big">Four steps, one direction.</h2>
    <div className="phases">
      <div className="ph">
        <div className="when">STEP 1<b>First 3 months</b></div>
        <div><h4>Build the basics &amp; fill the shelves</h4><p>Launch the marketplace and the admin. Get our first 30 real, verified parcels listed. Make it look world-class so people trust us on sight.</p></div>
      </div>
      <div className="ph">
        <div className="when">STEP 2<b>Months 3–6</b></div>
        <div><h4>Add maps &amp; rich media</h4><p>Interactive maps so people can see land by location. Drone footage &amp; 360° views so it feels real. Grow to 100+ parcels.</p></div>
      </div>
      <div className="ph">
        <div className="when">STEP 3<b>Months 6–10</b></div>
        <div><h4>Become the intelligence leader</h4><p>Layer in growth analysis, risk flags &amp; price trends — so we don't just show land, we help people <em>understand</em> it. Start charging for deep reports.</p></div>
      </div>
      <div className="ph">
        <div className="when">STEP 4<b>Months 10+</b></div>
        <div><h4>Scale &amp; expand</h4><p>A mobile app, tools for brokers &amp; developers, and eventually take this model to the next cities.</p></div>
      </div>
    </div>
  </div>
</section>
<hr className="hr-soft" />


<section>
  <div className="wrap">
    <span className="sec-tag">09 · What we stand for</span>
    <h2 className="big">Three words to guide every decision.</h2>
    <div className="vals" style={{ marginTop: '30px' }}>
      <div className="val"><div className="em">🔍</div><h4>Transparency</h4><p>We tell the whole truth about every parcel — even the risks. Especially the risks.</p></div>
      <div className="val"><div className="em">🤝</div><h4>Trust</h4><p>We'd rather lose a quick deal than mislead a buyer. Trust compounds; shortcuts don't.</p></div>
      <div className="val"><div className="em">✨</div><h4>Excellence</h4><p>Every detail — the photos, the data, the design — should feel premium and effortless.</p></div>
    </div>
    <div style={{ margin: '46px 0 10px' }}>
      <p className="quote">If a buyer can't trust what they see on our screen, nothing else we build matters.</p>
    </div>
  </div>
</section>
<hr className="hr-soft" />


<section style={{ background: 'var(--paper)' }}>
  <div className="wrap">
    <span className="sec-tag">10 · For us to decide</span>
    <h2 className="big">The questions only <em>we</em> can answer.</h2>
    <p className="body">Before we build, the founding team should align on these. There's no wrong answer — but we must choose deliberately.</p>
    <div style={{ marginTop: '26px' }}>
      <div className="q"><div className="qt">Decision 1</div><h4>What's our final name &amp; identity?</h4><p>We're using "Bhūmī" (ಭೂ — Kannada for 'earth/land'). Does the team feel it? Or do we go another direction?</p>
        <div className="opts"><span>Bhūmī ✓</span><span>TerraBengaluru</span><span>Acreage</span><span>Something else</span></div></div>
      <div className="q"><div className="qt">Decision 2</div><h4>Which corridors do we launch with?</h4><p>We can't cover all of Bengaluru on day one. Which 3–4 zones (e.g. Devanahalli, Sarjapur, Hoskote) do we own first?</p>
        <div className="opts"><span>North / Airport</span><span>East / Sarjapur</span><span>South / Kanakapura</span><span>West / Tumkur</span></div></div>
      <div className="q"><div className="qt">Decision 3</div><h4>Where do our first listings come from?</h4><p>Do we list our own/known inventory, partner with landowners, or recruit broker networks? A mix?</p>
        <div className="opts"><span>Own inventory</span><span>Landowner partnerships</span><span>Broker network</span><span>Mix of all</span></div></div>
      <div className="q"><div className="qt">Decision 4</div><h4>How aggressive is our commission model?</h4><p>Lower fees to win share early, or premium fees with premium service? What's our pricing philosophy?</p>
        <div className="opts"><span>Win share first</span><span>Premium from start</span><span>Tiered</span></div></div>
      <div className="q"><div className="qt">Decision 5</div><h4>Who builds &amp; runs it?</h4><p>In-house team, an agency, or technical co-founder? This shapes speed, cost and control.</p>
        <div className="opts"><span>In-house</span><span>Agency</span><span>Tech co-founder</span></div></div>
    </div>
  </div>
</section>


<section style={{ paddingTop: '20px' }}>
  <div className="wrap">
    <div className="callout">
      <h2>The opportunity is real. The lane is open. The plan is clear.</h2>
      <p>Bengaluru's land market is waiting for a brand that leads with trust and clarity. Let's make Bhūmī that brand.</p>
      <div style={{ marginTop: '26px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className="btn btn-gold" href="/marketplace" target="_blank">See the Marketplace</a>
        <a className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }} href="blueprint.html">Read the Full Blueprint</a>
      </div>
    </div>
  </div>
</section>


<footer>
  <div className="wrap">
    <div className="row">
      <div>
        <a href="/" className="brand"><span className="mark">ಭೂ</span><span style={{ color: '#fff' }}>Bhūmī<small>Bengaluru Land Exchange</small></span></a>
        <p style={{ marginTop: '8px' }}>A founding-team brief providing a strategic overview of the platform. For the full technical blueprint, use the link above.</p>
      </div>
      <div style={{ fontSize: '.78rem', color: '#7f8a73' }}>Bengaluru · India · 2026</div>
    </div>
    <div className="fbot">
      <span>Conceptual document for the founding team. Not legal or financial advice.</span>
      <span>Bhūmī · v1.0</span>
    </div>
  </div>
</footer>


    </div>
  );
}
