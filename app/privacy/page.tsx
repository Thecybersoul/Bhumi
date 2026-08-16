import type { Metadata } from 'next'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import { brand } from '@/lib/content/brand'

export const metadata = {
  title: 'Privacy policy',
  description: 'What Bhumi Estates collects, why, who it is shared with, and how to have it deleted.',
  alternates: { canonical: '/privacy' },
} satisfies Metadata

const sections = [
  {
    heading: 'What we collect',
    body: 'When you send an enquiry, request a verification review, download the checklist, use a decision tool or request data room access, we collect the details you give us — typically name, phone, email, and the specific detail that makes the enquiry useful (a survey number, an extent, a specification requirement). Tool inputs are stored alongside the enquiry so an advisor can reply with an answer rather than a question. We also record basic visit metadata: pages viewed, device type and approximate city.',
  },
  {
    heading: 'Why we collect it',
    body: 'To answer you, to prepare a preliminary read on a parcel, and to route large-parcel enquiries to a named advisor. Where you have asked for the verification checklist, to send it. That is the whole list.',
  },
  {
    heading: 'Who it is shared with',
    body: 'Your details go to our advisory desk. Where you enquire about a specific listing, we share what is necessary with the verified seller of that parcel and no more. We do not sell personal data to advertisers, data brokers or anyone else, and we do not pass it to third parties for their own marketing.',
  },
  {
    heading: 'Data room requests',
    body: 'A data room request records your name, organisation, role, contact details, buyer type, indicative ticket size and your acceptance of the confidentiality undertaking. That record exists because access to a seller\'s survey documents and verification report has to be attributable to a named person. It is retained for the life of the mandate and for a reasonable period afterwards.',
  },
  {
    heading: 'How it is stored',
    body: 'Enquiry data is stored in Supabase (Postgres) with row-level security. Public endpoints can write an enquiry; they cannot read one. Administrative access requires an authenticated session, and the service credentials that bypass row-level security are held server-side only and never reach the browser.',
  },
  {
    heading: 'How long we keep it',
    body: 'Enquiries and lead records are retained while the relationship is active and for a reasonable period afterwards for our own records. Verification case records are retained longer, because a verification certificate has to remain traceable to the file behind it.',
  },
  {
    heading: 'WhatsApp',
    body: 'Click-to-chat links open WhatsApp, which is operated by Meta under its own privacy terms. Anything you send us there sits within WhatsApp as well as in our records. If you would rather not use it, every page carries a form and a phone number.',
  },
  {
    heading: 'Your rights',
    body: `Ask us for a copy of what we hold, ask us to correct it, or ask us to delete it. Write to ${brand.email} and we will action the request within seven business days. You do not need to give a reason.`,
  },
  {
    heading: 'Cookies',
    body: 'The site sets one cookie, and only for administrative users: an authentication session cookie on /admin. Public visitors are not tracked with cookies by this site. If an analytics provider is added later, this section will be updated before it is switched on.',
  },
]

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Legal"
          title="Privacy"
          italic="policy."
          lede="Short, because what we do with your data is simple: we use it to answer you, and we do not sell it."
          crumbs={[{ label: 'Privacy' }]}
          tone="cream"
        />
        <section className="section">
          <div className="wrap-narrow docSection">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2>{s.heading}</h2>
                <p>{s.body}</p>
              </div>
            ))}
            <h2>Contact</h2>
            <p>
              {brand.legalName}, {brand.address.line1}, {brand.address.line2}. Email{' '}
              <a href={`mailto:${brand.email}`} className="link-arrow">
                {brand.email}
              </a>{' '}
              or call{' '}
              <a href={`tel:${brand.phoneRaw}`} className="link-arrow">
                {brand.phone}
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
