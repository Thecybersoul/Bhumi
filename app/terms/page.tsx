import type { Metadata } from 'next'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PageHero from '@/components/site/PageHero'
import { brand } from '@/lib/content/brand'

export const metadata = {
  title: 'Terms and conditions',
  description:
    'The terms on which Bhumi Estates provides this site, its decision-support tools, its verification reports and its data room.',
  alternates: { canonical: '/terms' },
} satisfies Metadata

const sections = [
  {
    heading: 'What this site is',
    body: 'An information and enquiry platform for land and property advisory in Bengaluru and its growth corridors. Nothing on it is an offer, an invitation to treat, or a binding commitment by us or by any seller.',
  },
  {
    heading: 'Indicative information',
    body: 'Corridor price bands, infrastructure timelines, tool outputs and listing figures are indicative. They are compiled from publicly reported transactions, listing data, published announcements and our own mandate history. They are not valuations, and infrastructure timelines routinely move. Confirm anything you intend to rely on at parcel level.',
  },
  {
    heading: 'The decision-support tools',
    body: 'Every tool on this site produces illustrative planning ranges. The construction estimator is not a quotation. The zoning checker is corridor-level guidance and not a zoning certificate. The warehouse checklist reflects market convention, not a statutory standard. Where a tool references tax treatment — including Section 45(5A) capital gains timing or GST — that is general information and your own tax counsel must advise on your facts.',
  },
  {
    heading: 'Verification reports',
    body: 'A verification report relates only to the parcel, the documents and the scope stated in that report, as at its date. It is a professional opinion based on records available to us at the time; it is not a title guarantee, and it does not insure against a defect that no available record disclosed. Scope limitations are stated in the report body and are part of it. A report has a stated validity period, after which the position should be refreshed.',
  },
  {
    heading: 'The data room',
    body: 'Access to a large-parcel information memorandum is granted at our discretion, to identified persons, against an accepted confidentiality undertaking. That undertaking binds you and your organisation. Material released is confidential, is provided solely to evaluate a possible transaction, and must not be used to approach a landowner or any party in an assembly directly.',
  },
  {
    heading: 'Our role',
    body: 'We act on mandates for clients. Where we hold or represent inventory, the listing says so, because you should always know which side of a table we are on. We are not an escrow agent, and we do not hold transaction funds.',
  },
  {
    heading: 'Fees',
    body: 'The first preliminary verification review is free. Full six-stage verification and every other engagement is quoted in writing before work starts. There are no facilitation charges, processing fees or undisclosed commissions.',
  },
  {
    heading: 'Regulatory',
    body: `${brand.legalName} holds K-RERA agent registration ${brand.reraNumber}, displayed in the footer of this site and in advertising as required. Registration is a compliance status, not a warranty of any project or parcel.`,
  },
  {
    heading: 'Limitation of liability',
    body: 'We are liable for our own professional work to the extent set out in the engagement letter for that work. We are not liable for a transaction between a buyer and a seller introduced through this platform, for a third party\'s conduct, or for a decision taken on the basis of the indicative information described above.',
  },
  {
    heading: 'Changes',
    body: 'These terms may change. The version on this page at the time you use the site is the one that applies. Material changes to how a verification report is scoped will be reflected in the report itself, not only here.',
  },
  {
    heading: 'Governing law',
    body: 'These terms are governed by the laws of India, and the courts at Bengaluru have jurisdiction.',
  },
]

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Legal"
          title="Terms and"
          italic="conditions."
          lede="Written to be read. In particular, the sections on indicative information and on what a verification report does and does not cover are worth two minutes."
          crumbs={[{ label: 'Terms' }]}
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
