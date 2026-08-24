/* Homepage copy.

   The homepage does one job: make the two practices legible in
   five seconds, then send the visitor into whichever one is
   theirs. Nothing here claims a track record — where a
   credibility bar would sit, generic industry context sits
   instead (see industryContext in ./verification). */

export const hero = {
  eyebrow: 'Property Consultancy · Branding & Advertising',
  /* The full eyebrow wraps to two lines on a phone, which eats
     the footage. Short form below 640px. */
  mobileEyebrow: 'Property · Branding',
  title: { before: 'We find the land, and make it', italic: 'impossible', after: ' to miss.' },
  subhead:
    'Two practices under one roof. Property Consultancy sources the parcel, proves the title and builds the project. Branding Consultancy gives it an identity and puts it in front of the people who matter.',
  /* Mobile gets one short line so the background footage stays
     the thing you actually see. */
  mobileSubhead: 'Property consultancy and branding, under one roof.',
  primary: { label: 'Tell us what you need', href: '/contact' },
  secondary: { label: 'Property Consultancy', href: '/property-consultancy' },
  tertiary: { label: 'Branding & Advertising', href: '/branding-advertising' },
}

export const practicesIntro = {
  eyebrow: 'What we do',
  title: { before: 'Two practices,', italic: 'one continuous thread.' },
  body: 'Most firms do one of these and outsource the other, which is where the thread breaks — the constraint found at diligence never reaches the person designing the hoarding. Running both means the story a project tells outside matches what is actually true on the title.',
}

export const standard = {
  eyebrow: 'How we work',
  title: { before: 'Say the thing that is', italic: 'actually true.' },
  body: 'A young firm has a choice: invent a track record, or be unusually straight about what it does and does not yet have. We have taken the second option, and built the site accordingly.',
  rules: [
    {
      rule: 'No invented numbers',
      detail:
        'You will not find a parcel count or a success rate on this site, because we are not going to manufacture one. The figures we publish are industry ground rules, marked as such.',
    },
    {
      rule: 'Findings are reported as found',
      detail:
        'Diligence is only worth what its independence is worth. A record is pulled at source rather than accepted from a seller, and a finding is not softened to make a deal easier.',
    },
    {
      rule: 'Every page ends somewhere specific',
      detail:
        'No page finishes by asking you to "get in touch". Each one names the next step and what you get from taking it.',
    },
  ],
}

export const verificationTeaser = {
  eyebrow: 'Inside Property Consultancy',
  title: { before: 'Four stages. Each one', italic: 'answers a question.' },
  body: 'Not a ten-step diagram nobody reads, and not a single "under review" status that tells you nothing. Four named stages, each one resolving a question a buyer would ask out loud — who owns it, is the title clean, is anything pending, and what is the answer in writing.',
  cta: { label: 'See how verification works', href: '/property-consultancy#verification' },
}

export const brandingTeaser = {
  eyebrow: 'Inside Branding Consultancy',
  title: { before: 'A project is judged', italic: 'before the brochure opens.' },
  body: 'At the boundary wall, at the entrance, on the drive past at fifty kilometres an hour. Real estate branding lives outdoors, at scale, in weather — so it is designed for those conditions, then carried by media bought on sightline and traffic direction rather than on rate card alone.',
  cta: { label: 'See the branding practice', href: '/branding-advertising' },
}

export const faq = {
  eyebrow: 'Straight answers',
  title: { before: 'The questions worth asking', italic: 'before you engage.' },
  items: [
    {
      q: 'Why are there no project numbers or case studies on this site?',
      a: 'Because we would have to invent them. Bhumi Estates is a young firm and does not yet have a published track record to show. We would rather say that plainly than fill the page with figures nobody can check. As real engagements complete and clients agree to be named, they will appear here with dates attached.',
    },
    {
      q: 'What does the first conversation cost?',
      a: 'Nothing. The first review is a preliminary read — we look at what you have, tell you what is missing, and tell you whether the parcel or the project is worth taking further. Full verification and any consultancy engagement are quoted before work starts.',
    },
    {
      q: 'Can I use you for branding without using the property side?',
      a: 'Yes, and the reverse is equally true. The two practices are deliberately separable. They are run together because the continuity is useful when you need both, not because either one is a condition of the other.',
    },
    {
      q: 'Can I share your verification report with my bank?',
      a: 'That is what it is written for. The report is issued dated, with a reference number and its scope limitations stated plainly, precisely so it can be forwarded to a lender, a partner or a buyer.',
    },
    {
      q: 'Do you buy land yourself?',
      a: 'We act for clients. Where we hold or represent inventory, it is marked as such on the listing, because you should always know which side of the table we are on.',
    },
    {
      q: 'Why is WhatsApp the main way to reach you?',
      a: 'Because it is how landowners and developers in this market actually make first contact. A form is on every page as a backup, and a phone number is in the header of every one.',
    },
  ],
}

export const closingCta = {
  eyebrow: 'One next step',
  title: { before: 'Tell us what you are trying', italic: 'to do.' },
  body: 'A parcel to find, a title to check, a project to build, or a launch that needs to be seen. We will tell you what is realistic before we quote it.',
  primary: { label: 'Tell us what you need', href: '/contact' },
  secondary: { label: 'Call an advisor', href: 'tel:+918123845749' },
}
