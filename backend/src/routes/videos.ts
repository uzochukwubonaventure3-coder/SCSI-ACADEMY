import { Router } from 'express'
import { query } from '../config/database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 9
    const offset = (page - 1) * limit

    const [videos, countResult] = await Promise.all([
      query(`SELECT * FROM video_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      query(`SELECT COUNT(*) FROM video_posts WHERE status = 'published'`),
    ])

    res.json({ success: true, data: { videos: videos.rows, total: parseInt(countResult.rows[0].count), page, limit } })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch videos' })
  }
})

export default router
