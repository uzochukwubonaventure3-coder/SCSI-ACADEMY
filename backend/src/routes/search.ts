import { Router } from 'express'
import { query } from '../config/database'

const router = Router()

// GET /api/search?q=mindset&type=all|blog|video
router.get('/', async (req, res) => {
  const q    = String(req.query.q || '').trim()
  const type = String(req.query.type || 'all')

  if (!q || q.length < 2) {
    return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' })
  }

  const term = `%${q}%`

  try {
    const results: { posts: unknown[]; videos: unknown[] } = { posts: [], videos: [] }

    if (type === 'all' || type === 'blog') {
      const r = await query(
        `SELECT id, title, slug, excerpt, tags, created_at, 'blog' AS content_type
         FROM blog_posts
         WHERE status = 'published'
           AND (title ILIKE $1 OR excerpt ILIKE $1 OR array_to_string(tags,',') ILIKE $1)
         ORDER BY created_at DESC LIMIT 10`,
        [term]
      )
      results.posts = r.rows
    }

    if (type === 'all' || type === 'video') {
      const r = await query(
        `SELECT id, title, slug, description, duration, tags, created_at, 'video' AS content_type
         FROM video_posts
         WHERE status = 'published'
           AND (title ILIKE $1 OR description ILIKE $1 OR array_to_string(tags,',') ILIKE $1)
         ORDER BY created_at DESC LIMIT 10`,
        [term]
      )
      results.videos = r.rows
    }

    const total = results.posts.length + results.videos.length

    res.json({ success: true, data: results, total, query: q })
  } catch (err) {
    console.error('[Search]', err)
    res.status(500).json({ success: false, message: 'Search failed' })
  }
})

export default router
