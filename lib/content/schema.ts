/* ═══════════════════════════════════════════════════════════
   What is editable, declared once.

   Every block of copy the site renders is described here: its
   fields, their types, and the value compiled into the codebase.
   Two things read this file.

   The site reads the default, so a page renders correctly before
   anything has been edited and cannot be emptied by a bad write.
   The dashboard reads the field list and generates the form, so
   adding an editable field is a change here rather than a new
   screen — which is the only way "everything is editable" stays
   true as the site grows.
   ═══════════════════════════════════════════════════════════ */

import { brand } from './brand'
import { hero, practicesIntro, constructionTeaser } from './home'
import { practices } from './services'
import { billboardIntro } from './billboards'
import { designIntro } from './designs'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'image'
  | 'video'
  | 'url'
  | 'list' // list of plain strings
  | 'group' // fixed set of named sub-fields

export interface Field {
  key: string
  label: string
  type: FieldType
  help?: string
  /** Soft guidance shown in the editor, not enforced on save. */
  limit?: number
  /** Sub-fields for `group`. */
  fields?: Field[]
}

export interface Block {
  key: string
  /** Which page this block belongs to, for grouping in the admin. */
  page: 'brand' | 'home' | 'property' | 'branding' | 'media'
  title: string
  description?: string
  /** Where it appears, so an editor can find it on the live page. */
  preview?: string
  fields: Field[]
  default: Record<string, unknown>
}

const titleGroup = (key: string, label: string): Field => ({
  key,
  label,
  type: 'group',
  help: 'The closing clause renders in italic serif.',
  fields: [
    { key: 'before', label: 'Opening', type: 'text' },
    { key: 'italic', label: 'Italic clause', type: 'text' },
    { key: 'after', label: 'Trailing (optional)', type: 'text' },
  ],
})

export const blocks: Block[] = [
  /* ─── Brand and contact ──────────────────────────────── */
  {
    key: 'brand.identity',
    page: 'brand',
    title: 'Identity and contact',
    description: 'Used in the header, the footer, every call-to-action and the structured data.',
    preview: 'Every page',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'legalName', label: 'Legal name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text', limit: 60 },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'phone', label: 'Phone (displayed)', type: 'text' },
      { key: 'phoneRaw', label: 'Phone (digits only, for WhatsApp and tel:)', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      {
        key: 'address',
        label: 'Address',
        type: 'group',
        fields: [
          { key: 'line1', label: 'Line 1', type: 'text' },
          { key: 'line2', label: 'Line 2', type: 'text' },
        ],
      },
      {
        key: 'social',
        label: 'Social',
        type: 'group',
        fields: [
          { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
          { key: 'instagram', label: 'Instagram URL', type: 'url' },
        ],
      },
    ],
    default: {
      name: brand.name,
      legalName: brand.legalName,
      tagline: brand.tagline,
      city: brand.city,
      phone: brand.phone,
      phoneRaw: brand.phoneRaw,
      email: brand.email,
      address: brand.address,
      social: brand.social,
    },
  },

  /* ─── Homepage ───────────────────────────────────────── */
  {
    key: 'home.hero',
    page: 'home',
    title: 'Hero',
    description:
      'The first screen. The mobile lines are shown below 640px so the background footage stays visible — keep them short.',
    preview: '/',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text', limit: 60 },
      { key: 'mobileEyebrow', label: 'Eyebrow (mobile)', type: 'text', limit: 26 },
      titleGroup('title', 'Headline'),
      { key: 'subhead', label: 'Sub-heading', type: 'textarea', limit: 240 },
      { key: 'mobileSubhead', label: 'Sub-heading (mobile)', type: 'text', limit: 90 },
    ],
    default: {
      eyebrow: hero.eyebrow,
      mobileEyebrow: hero.mobileEyebrow,
      title: hero.title,
      subhead: hero.subhead,
      mobileSubhead: hero.mobileSubhead,
    },
  },
  {
    key: 'home.heroMedia',
    page: 'home',
    title: 'Hero background',
    description:
      'Plays muted and looping behind every main hero. The poster is shown while the video loads, and in place of it under reduced-motion.',
    preview: '/',
    fields: [
      { key: 'video', label: 'Video', type: 'video', help: 'MP4, H.264. Keep under about 8 MB.' },
      { key: 'poster', label: 'Poster image', type: 'image' },
    ],
    default: { video: '/video/hero.mp4', poster: '/img/hero-poster.jpg' },
  },
  {
    key: 'home.whatWeDo',
    page: 'home',
    title: 'What we do',
    description: 'Heading above the two practices and the thread that connects them.',
    preview: '/#practices',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      titleGroup('title', 'Headline'),
      { key: 'body', label: 'Body', type: 'textarea', limit: 260 },
    ],
    default: {
      eyebrow: practicesIntro.eyebrow,
      title: practicesIntro.title,
      body: practicesIntro.body,
    },
  },
  {
    key: 'home.construction',
    page: 'home',
    title: 'Construction rail',
    description: 'Short build section above the closing band.',
    preview: '/#build',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      titleGroup('title', 'Headline'),
      { key: 'body', label: 'Body', type: 'textarea', limit: 220 },
    ],
    default: {
      eyebrow: constructionTeaser.eyebrow,
      title: constructionTeaser.title,
      body: constructionTeaser.body,
    },
  },
  /* No 'home.closing' block: the homepage no longer has its own
     closing band — see the comment in app/page.tsx. The footer's
     "One next step" CTA, present on every page, is what closes it
     now, and that copy is not CMS-editable. */

  /* ─── Property Consultancy ───────────────────────────── */
  {
    key: 'property.hero',
    page: 'property',
    title: 'Hero',
    preview: '/property-consultancy',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      titleGroup('title', 'Headline'),
      { key: 'lede', label: 'Lede', type: 'textarea', limit: 300 },
      { key: 'mobileLede', label: 'Lede (mobile)', type: 'text', limit: 100 },
      { key: 'pitch', label: 'One-line pitch (homepage card)', type: 'text', limit: 80 },
    ],
    default: {
      eyebrow: practices[0].eyebrow,
      title: practices[0].title,
      lede: practices[0].lede,
      mobileLede: practices[0].mobileLede,
      pitch: practices[0].pitch,
    },
  },
  {
    key: 'property.marketplace',
    page: 'property',
    title: 'Marketplace section',
    preview: '/property-consultancy#marketplace',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      titleGroup('title', 'Headline'),
      { key: 'body', label: 'Body', type: 'textarea', limit: 260 },
    ],
    default: {
      eyebrow: 'Marketplace',
      title: { before: 'Land and property,', italic: 'currently on the desk.' },
      body: 'Every listing states its verification position and the number that decides its asset class. If nothing here fits, sourcing starts from a written brief instead.',
    },
  },
  {
    key: 'property.audience',
    page: 'property',
    title: 'Who this is for',
    description: 'The list in the closing band.',
    preview: '/property-consultancy',
    fields: [{ key: 'items', label: 'Audience', type: 'list' }],
    default: { items: practices[0].audience },
  },

  /* ─── Branding & Outdoor Advertising ─────────────────── */
  {
    key: 'branding.hero',
    page: 'branding',
    title: 'Hero',
    preview: '/branding-advertising',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      titleGroup('title', 'Headline'),
      { key: 'lede', label: 'Lede', type: 'textarea', limit: 300 },
      { key: 'mobileLede', label: 'Lede (mobile)', type: 'text', limit: 100 },
      { key: 'pitch', label: 'One-line pitch (homepage card)', type: 'text', limit: 80 },
    ],
    default: {
      eyebrow: practices[1].eyebrow,
      title: practices[1].title,
      lede: practices[1].lede,
      mobileLede: practices[1].mobileLede,
      pitch: practices[1].pitch,
    },
  },
  {
    key: 'branding.inventory',
    page: 'branding',
    title: 'Bookable inventory',
    description: 'Sits above the outdoor sites. The note and attribution are shown under the list.',
    preview: '/branding-advertising#inventory',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      titleGroup('title', 'Headline'),
      { key: 'body', label: 'Body', type: 'textarea', limit: 420 },
      { key: 'suited', label: 'Suited to', type: 'text' },
      { key: 'note', label: 'Footnote', type: 'text' },
    ],
    default: {
      eyebrow: billboardIntro.eyebrow,
      title: billboardIntro.title,
      body: billboardIntro.body,
      suited: billboardIntro.suited,
      note: billboardIntro.note,
    },
  },
  {
    key: 'branding.audience',
    page: 'branding',
    title: 'Who this is for',
    preview: '/branding-advertising',
    fields: [{ key: 'items', label: 'Audience', type: 'list' }],
    default: { items: practices[1].audience },
  },

  /* ─── Design gallery framing ─────────────────────────── */
  {
    key: 'property.designIntro',
    page: 'property',
    title: 'Design gallery framing',
    description:
      'The attribution matters: these renders are the construction partner\'s work, not Bhumi\'s completed projects. Keep that distinction in the text.',
    preview: '/property-consultancy/construction-development',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      titleGroup('title', 'Headline'),
      { key: 'body', label: 'Body', type: 'textarea', limit: 460 },
      { key: 'attribution', label: 'Attribution', type: 'textarea', limit: 300 },
    ],
    default: {
      eyebrow: designIntro.eyebrow,
      title: designIntro.title,
      body: designIntro.body,
      attribution: designIntro.attribution,
    },
  },
]

export const blocksByPage = (page: Block['page']) => blocks.filter((b) => b.page === page)

export const getBlockDef = (key: string) => blocks.find((b) => b.key === key)

export const PAGES: { id: Block['page']; label: string; href?: string }[] = [
  { id: 'brand', label: 'Brand & contact' },
  { id: 'home', label: 'Homepage', href: '/' },
  { id: 'property', label: 'Property Consultancy', href: '/property-consultancy' },
  { id: 'branding', label: 'Branding & Advertising', href: '/branding-advertising' },
]
