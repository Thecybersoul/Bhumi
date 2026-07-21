// Centralized copy for the homepage and shared sections.
// Edit text here without touching component JSX.

export const hero = {
  eyebrow: `Bengaluru\u2019s Verified Land Marketplace`,
  title: { before: 'Land you can', italic: 'trust,', after: ' at a price you can verify.' },
  subhead:
    'Every parcel on Bhūmī passes a 9-point legal and physical verification before it goes live. Title-cleared, conversion-mapped, direct from the landowner. No brokers, no surprises at registration.',
  primaryCta: { label: 'Talk to a Land Expert', href: 'https://wa.me/918123845749?text=Hi%20Bh%C5%ABm%C4%AB%2C%20I%27d%20like%20to%20talk%20to%20a%20land%20expert.' },
  secondaryCta: { label: 'Explore Verified Parcels', href: '/marketplace' },
  callCta: { label: 'Call +91 81238 45749', href: 'tel:+918123845749' },
}

export const cityPills = {
  caption: 'Tap a micro-market to see only verified inventory in that belt.',
  items: [
    { label: 'North Bengaluru', zone: 'North' },
    { label: 'East Bengaluru', zone: 'East' },
    { label: 'South Bengaluru', zone: 'South' },
    { label: 'West Bengaluru', zone: 'West' },
    { label: 'Devanahalli corridor', zone: 'North' },
    { label: 'Sarjapur', zone: 'East' },
    { label: 'Hoskote', zone: 'East' },
    { label: 'Nandi Hills foothills', zone: 'North' },
    { label: 'Kanakapura Road', zone: 'South' },
    { label: 'Tumkur Road', zone: 'West' },
  ],
}

export const numbersStrip = {
  eyebrow: 'Bengaluru by the numbers',
  title: { before: 'Bengaluru land,', italic: 'measured.' },
  source: 'Sources: KIADB, BBMP, RERA Karnataka, BDA master plans. Updated quarterly.',
  items: [
    { key: '₹60K Cr+', value: 'Cumulative GCC & aerospace investment in North Bengaluru since 2020' },
    { key: '14% YoY', value: 'Average Devanahalli-corridor land appreciation, 2020–2025' },
    { key: '280 km', value: 'STRR length — the ring road reshaping 11 micro-markets' },
    { key: '9', value: 'Points in Bhūmī’s legal & physical verification checklist' },
  ],
}

export const features = [
  {
    eyebrow: 'The Bhūmī Standard',
    title: { before: 'We reject', italic: '80% of submissions.' },
    body:
      'Every parcel on Bhūmī passes a 9-point checklist: title search at sub-registrar, DC conversion status, RTC / Pahani, khata, rajakaluve buffer, soil, water table, road frontage, and encumbrance certificate. An independent advocate signs off before a listing goes live.',
    bullets: [
      '9 / 9 checks before listing',
      'Independent advocate sign-off',
      'Re-verified every 90 days',
    ],
    cta: { label: 'See a sample verification report →', href: '/insights/devanahalli-corridor' },
    icon: 'shield',
  },
  {
    eyebrow: 'No middlemen',
    title: { before: 'Direct-to-landowner.', italic: 'Always.' },
    body:
      'Every enquiry reaches the actual title-holder or their authorised family member. We do not allow brokers to list, and we do not insert ourselves into the negotiation.',
    bullets: [
      '0 brokered listings',
      'Average reply time: 4 hours',
      'Site visits within 7 days',
    ],
    cta: { label: 'Browse verified parcels →', href: '/marketplace' },
    icon: 'handshake',
  },
  {
    eyebrow: 'Built for decision-making',
    title: { before: '300+ data layers.', italic: 'On every parcel.' },
    body:
      'We layer BDA master plan, RERA project status, STRR alignment, airport funnel-zone, soil type, and historical appreciation on top of each listing — so the parcel is never a black box.',
    bullets: [
      'BDA 2031 master plan overlay',
      'KIADB SEZ proximity scoring',
      '5-year price-per-acre history',
    ],
    cta: { label: 'Read the Devanahalli corridor report →', href: '/insights/devanahalli-corridor' },
    icon: 'layers',
  },
]

export const trustStrip = {
  caption: 'Every Bhūmī parcel meets all six. No exceptions.',
  items: [
    '9-point legal check',
    'Independent advocate sign-off',
    'Direct-to-landowner listings',
    'Conversion-status verified',
    'Encumbrance cleared',
    'Site visit within 7 days',
  ],
}

export const tools = {
  eyebrow: 'Land Tools',
  title: { before: 'Do the math', italic: 'before you make the trip.' },
  cards: [
    {
      icon: '🔍',
      title: 'Survey Number Lookup',
      desc: 'Enter a survey number, get a clean read on owner, extent, and conversion status in under 60 seconds.',
      href: '/tools/survey-lookup',
      cta: 'Look up a survey number',
    },
    {
      icon: '📊',
      title: 'Price Estimator',
      desc: 'Get a realistic ₹/acre band for any Bengaluru micro-market, based on 24 months of Bhūmī transaction data.',
      href: '/tools/price-estimator',
      cta: 'Estimate price',
    },
    {
      icon: '📝',
      title: 'Land Evaluator',
      desc: 'Tell us about your land in 90 seconds. Our team replies with a feasibility read and a price band within one business day.',
      href: '/tools/land-evaluator',
      cta: 'Submit for evaluation',
    },
  ],
}

export const testimonials = {
  eyebrow: 'What buyers & sellers say',
  title: { before: 'Verified by', italic: 'outcomes.' },
  items: [
    {
      quote:
        'We shortlisted 14 parcels in three weeks. Bhūmī’s verification stack cut our legal-diligence bill by half.',
      name: 'Rohit Krishnan',
      role: 'Founder, Northwind Estates',
      meta: 'Buyer · 22-acre Sarjapur acquisition',
    },
    {
      quote:
        'I listed 40 acres of agricultural land in Kanakapura. Three serious buyers, zero time-wasters.',
      name: 'Smt. Lakshmi Devi',
      role: 'Landowner',
      meta: 'Seller · South Bengaluru',
    },
    {
      quote:
        'The Bhūmī team walked the parcel twice before listing. That diligence is what closed the deal.',
      name: 'Vikram Bhat',
      role: 'Director, Hoskote Industrial Park',
      meta: 'Industrial buyer · East Bengaluru',
    },
  ],
}

export const faq = {
  eyebrow: 'Frequently asked',
  title: { before: 'The', italic: 'fine print.' },
  items: [
    {
      q: 'How do you verify a parcel?',
      a: 'Every listing passes our 9-point legal & physical checklist. A Bhūmī advocate signs off on title, conversion, and encumbrance before a parcel goes live, and we re-verify every 90 days.',
    },
    {
      q: 'Are the prices negotiable?',
      a: 'Yes — unless marked "Fixed". All prices are set by the landowner; Bhūmī does not insert itself into negotiations.',
    },
    {
      q: 'Can I visit a parcel before deciding?',
      a: 'Yes. Tap "Request site visit" on any parcel and our team will schedule a guided visit within 7 days, anywhere in Bengaluru.',
    },
    {
      q: 'Do you charge buyers a fee?',
      a: 'No buyer fees. Bhūmī is paid by the listing side only, and only on a successful close.',
    },
    {
      q: 'Is Bhūmī a broker?',
      a: 'No. We are a marketplace. We do not negotiate, do not hold funds, and do not earn commission on the transaction. We verify and connect.',
    },
    {
      q: 'How do you handle data on my enquiry?',
      a: 'Your contact details are shared only with the verified landowner of the parcel you enquired about. We never sell data. See our Privacy Policy for the full breakdown.',
    },
  ],
}

export const insightsTeaser = {
  eyebrow: 'Insights',
  title: { before: 'What 7,400 acres of verified inventory', italic: 'taught us.' },
  subhead:
    'Data-led reports on Bengaluru micro-markets, infrastructure catalysts, and pricing dynamics. New every two weeks.',
}
