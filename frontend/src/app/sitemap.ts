import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://scsi-academy.vercel.app'
  const now  = new Date()

  return [
    { url: base,                    lastModified: now, changeFrequency: 'weekly',  priority: 1   },
    { url: `${base}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/services`,      lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/content`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/gallery`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.7 },
    { url: `${base}/refinery`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/signup`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.7 },
  ]
}
