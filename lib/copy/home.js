// Centralized copy for the homepage and shared sections.
// Edit text here without touching component JSX.

export const hero = {
  eyebrow: `Bengaluru\u2019s Verified Land Marketplace`,
  title: { before: 'Land you can', italic: 'trust,', after: ' at a price you can verify.' },
  subhead:
    'Every parcel on Bhūmī passes a 9-point legal and physical verification before it goes live. Title-cleared, conversion-mapped, and thoroughly checked. No surprises at registration.',
  primaryCta: { label: 'Talk to a Land Expert', href: 'https://wa.me/918123845749?text=Hi%20Bh%C5%ABm%C4%AB%2C%20I%27d%20like%20to%20talk%20to%20a%20land%20expert.' },
  secondaryCta: { label: 'Explore Verified Parcels', href: '/marketplace' },
  callCta: { label: 'Call +91 81238 45749', href: 'tel:+918123845749' },
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
    cta: { label: 'Explore the marketplace →', href: '/marketplace' },
    icon: 'shield',
    image: '/images/bhumi-standard.png'
  }
]

export const trustStrip = {
  caption: 'Every Bhūmī parcel meets all five. No exceptions.',
  items: [
    '9-point legal check',
    'Independent advocate sign-off',
    'Conversion-status verified',
    'Encumbrance cleared',
    'Site visit within 7 days',
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
      role: 'Seller',
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
      a: 'Yes — unless marked "Fixed".',
    },
    {
      q: 'Can I visit a parcel before deciding?',
      a: 'Yes. Tap "Request site visit" on any parcel and our team will schedule a guided visit within 7 days, anywhere in Bengaluru.',
    },
    {
      q: 'How do you handle data on my enquiry?',
      a: 'Your contact details are shared only with the verified seller of the parcel you enquired about. We never sell data. See our Privacy Policy for the full breakdown.',
    },
  ],
}

export const insightsTeaser = {
  eyebrow: 'Insights',
  title: { before: 'What 7,400 acres of verified inventory', italic: 'taught us.' },
  subhead:
    'Data-led reports on Bengaluru micro-markets, infrastructure catalysts, and pricing dynamics. New every two weeks.',
}
