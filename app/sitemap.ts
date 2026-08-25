import type { MetadataRoute } from 'next'
import { practices } from '@/lib/content/services'
import { insights } from '@/lib/content/insights'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bhumiestates.in'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1, changeFrequency: 'weekly', lastModified: now },
    // The two practice pages carry the site. Everything else is a
    // sub-page of one of them, or a utility page.
    ...practices.map((p) => ({
      url: `${base}${p.href}`,
      priority: 0.95,
      changeFrequency: 'monthly' as const,
      lastModified: now,
    })),
    { url: `${base}/marketplace`, priority: 0.8, changeFrequency: 'daily', lastModified: now },
    { url: `${base}/insights`, priority: 0.8, changeFrequency: 'weekly', lastModified: now },
    { url: `${base}/contact`, priority: 0.7, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/privacy`, priority: 0.2, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/terms`, priority: 0.2, changeFrequency: 'yearly', lastModified: now },
  ]

  return [
    ...fixed,
    ...insights.map((i) => ({
      url: `${base}/insights/${i.slug}`,
      priority: 0.7,
      changeFrequency: 'monthly' as const,
      lastModified: new Date(i.published),
    })),
  ]
}
