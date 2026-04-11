import { Router, Request, Response } from 'express'
import { query } from '../config/database'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()
const SITE = process.env.FRONTEND_URL || 'https://scsi-academy.vercel.app'

const staticRoutes = ['/', '/about', '/services', '/content', '/gallery', '/contact', '/refinery', '/signup', '/login']

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [blogs, videos] = await Promise.all([
      query(`SELECT slug, updated_at FROM blog_posts WHERE status='published' ORDER BY updated_at DESC`),
      query(`SELECT slug, updated_at FROM video_posts WHERE status='published' ORDER BY updated_at DESC`),
    ])

    const fmt = (d: Date | string) => new Date(d).toISOString().split('T')[0]
    const today = fmt(new Date())

    const urls = [
      ...staticRoutes.map(r => `
  <url>
    <loc>${SITE}${r}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${r === '/' ? '1.0' : '0.8'}</priority>
  </url>`),
      ...blogs.rows.map(b => `
  <url>
    <loc>${SITE}/blog/${b.slug}</loc>
    <lastmod>${fmt(b.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    res.set('Content-Type', 'application/xml')
    res.send(xml)
  } catch (err) {
    console.error('[Sitemap]', err)
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>')
  }
})

export default router
