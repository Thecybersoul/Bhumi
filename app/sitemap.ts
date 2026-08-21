import type { MetadataRoute } from 'next'
import { hubTypes } from '@/lib/content/propertyTypes'
import { pillars } from '@/lib/content/pillars'
import { corridors } from '@/lib/content/corridors'
import { caseStudies } from '@/lib/content/caseStudies'
import { insights } from '@/lib/content/insights'
import { tools } from '@/lib/content/tools'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://bhumiestates.in'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1, changeFrequency: 'weekly', lastModified: now },
    // Sourcing, branding and advertising are the commercial lines, so
    // Services carries the highest priority after the homepage.
    { url: `${base}/services`, priority: 0.95, changeFrequency: 'monthly', lastModified: now },
    { url: `${base}/large-land-parcels`, priority: 0.9, changeFrequency: 'weekly', lastModified: now },
    { url: `${base}/property-types`, priority: 0.85, changeFrequency: 'monthly', lastModified: now },
    { url: `${base}/marketplace`, priority: 0.85, changeFrequency: 'daily', lastModified: now },
    // The four former index pages now redirect into this one hub.
    { url: `${base}/resources`, priority: 0.8, changeFrequency: 'weekly', lastModified: now },
    { url: `${base}/verification`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
    { url: `${base}/checklist`, priority: 0.75, changeFrequency: 'monthly', lastModified: now },
    { url: `${base}/contact`, priority: 0.7, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/privacy`, priority: 0.2, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/terms`, priority: 0.2, changeFrequency: 'yearly', lastModified: now },
  ]

  return [
    ...fixed,
    ...hubTypes.map((t) => ({
      url: `${base}${t.href}`,
      priority: 0.8,
      changeFrequency: 'monthly' as const,
      lastModified: now,
    })),
    ...pillars.map((p) => ({
      url: `${base}/services/${p.slug}`,
      priority: 0.75,
      changeFrequency: 'monthly' as const,
      lastModified: now,
    })),
    ...corridors.map((c) => ({
      url: `${base}/corridors/${c.slug}`,
      priority: 0.8,
      changeFrequency: 'weekly' as const,
      lastModified: new Date(c.updated),
    })),
    ...caseStudies.map((c) => ({
      url: `${base}/portfolio/${c.slug}`,
      priority: 0.7,
      changeFrequency: 'yearly' as const,
      lastModified: new Date(c.published),
    })),
    ...insights.map((i) => ({
      url: `${base}/insights/${i.slug}`,
      priority: 0.7,
      changeFrequency: 'monthly' as const,
      lastModified: new Date(i.published),
    })),
    ...tools.map((t) => ({
      url: `${base}/tools/${t.slug}`,
      priority: 0.7,
      changeFrequency: 'monthly' as const,
      lastModified: now,
    })),
  ]
}
