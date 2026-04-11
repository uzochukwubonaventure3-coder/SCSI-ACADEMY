import { Router } from 'express'
import { query } from '../config/database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const page  = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 9
    const offset = (page - 1) * limit

    const [posts, countResult] = await Promise.all([
      query(`SELECT * FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      query(`SELECT COUNT(*) FROM blog_posts WHERE status = 'published'`),
    ])

    res.json({
      success: true,
      data: {
        posts: posts.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
      },
    })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch blog posts' })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM blog_posts WHERE slug = $1 AND status = 'published'`,
      [req.params.slug]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Post not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch post' })
  }
})

export default router
