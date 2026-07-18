// Privacy and Terms copy. Plain text + headings; the page components map
// these into JSX.

export const privacy = {
  title: 'Privacy Policy',
  intro:
    'At Bhūmī, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.',
  sections: [
    {
      heading: '1. Information We Collect',
      body: 'When you submit an enquiry, schedule a site visit, or sign up for our newsletter, we collect personal details such as your name, email address, phone number, and any specific requirements or preferences you provide. We also record metadata about your visit (pages viewed, device type, approximate city) to improve our content.',
    },
    {
      heading: '2. How We Use Your Information',
      body: 'Your information is used to process your enquiries, connect you with the verified landowner of the parcel you asked about, and provide tailored property recommendations. We may also use your contact details to send occasional updates on the Bengaluru land market, which you can opt out of at any time.',
    },
    {
      heading: '3. Data Sharing',
      body: 'We share your name, phone, and enquiry details only with the verified landowner of the parcel you enquired about. We do not sell your personal data to brokers, advertisers, or third-party data brokers — ever.',
    },
    {
      heading: '4. Data Protection',
      body: 'We implement industry-standard security measures to protect your data against unauthorized access, alteration, or disclosure. Enquiry data is stored in Supabase (Postgres) with row-level security; access is logged and audited.',
    },
    {
      heading: '5. Your Rights',
      body: 'You can request a copy of the data we hold on you, ask us to correct it, or ask us to delete it entirely. Write to contact@bhumiestates.in and we will action your request within 7 business days.',
    },
  ],
}

export const terms = {
  title: 'Terms & Conditions',
  intro:
    'Welcome to Bhūmī. By accessing or using our platform, you agree to comply with and be bound by the following terms and conditions.',
  sections: [
    {
      heading: '1. Use of the Platform',
      body: 'Bhūmī is a premium marketplace for large land parcels in and around Bengaluru. The information provided on this platform is for illustrative and informational purposes only. It does not constitute a legal, financial, or binding offer. Users must conduct their own due diligence before entering into any transaction.',
    },
    {
      heading: '2. Verification & Accuracy',
      body: 'While we apply a 9-point legal and physical verification checklist to every listing, Bhūmī does not guarantee the absolute accuracy or completeness of the data. Spatial intelligence, distance, and risk flags are indicative and should be independently confirmed before any decision.',
    },
    {
      heading: '3. Enquiries & Transactions',
      body: 'Submitting an enquiry or scheduling a site visit through the platform does not create a binding contract. All transactions are subject to formal legal documentation, title verification at the sub-registrar, and offline execution. Bhūmī does not act as a broker, agent, or escrow.',
    },
    {
      heading: '4. Fees',
      body: 'Bhūmī is free for buyers. The platform is paid by the listing side, and only on a successful close, as set out in the listing agreement. We do not charge any hidden fees, processing fees, or "facilitation" charges.',
    },
    {
      heading: '5. Limitation of Liability',
      body: 'Bhūmī is not liable for any loss arising from a transaction between a buyer and a landowner introduced through the platform. We verify listings to the best of our ability but cannot warrant the future conduct of any party.',
    },
  ],
}
