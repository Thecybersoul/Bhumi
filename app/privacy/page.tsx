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
    body: 'A data room request records your name, organisation, role, contact details, buyer type, indicative ticket size and your acceptance of the confidentiality undertaking. That record exists because access to a seller\'s survey documents and verification report has to be attributable to a named person. It is retained for the life of the engagement and for a reasonable period afterwards.',
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
    body: 'Click-to-chat links open WhatsApp, which is operated by Meta under its own privacy terms. Our WhatsApp Business number is connected to our records through Meta’s WhatsApp Business Platform: messages, photos, documents and voice notes in one-to-one business chats with us (and, once, up to six months of earlier chats) are received into our private systems so an advisor can act on them, and the names we have saved for numbers are used to label those chats. Personal chats are excluded before anything is stored, and chats not yet confirmed as business are deleted within seven days. Group chats are not read. If you would rather not use WhatsApp, every page carries a form and a phone number.',
  },
  {
    heading: 'Instagram',
    body: 'Our Instagram account is connected through Meta’s Instagram API. Direct messages and comments sent to our account are received into the same private systems so we can answer enquiries, and we publish posts about our listings. We do not read anyone else’s account.',
  },
  {
    heading: 'Data deletion',
    id: 'data-deletion',
    body: `To have your WhatsApp or Instagram messages with us, or any other record we hold about you, deleted, write to ${brand.email} with the number or account you used; we confirm within seven business days. If you used Instagram or Facebook login with our app, removing the app in your account settings also removes our stored connection.`,
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
              <div key={s.heading} id={'id' in s ? s.id : undefined}>
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
