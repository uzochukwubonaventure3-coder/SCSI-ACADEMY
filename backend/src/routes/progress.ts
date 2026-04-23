import { Router, Response } from 'express'
import { query } from '../config/database'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/progress/mark — mark a piece of content as read
router.post('/mark', requireAuth, async (req: AuthRequest, res: Response) => {
  const { contentType, contentId } = req.body
  if (!contentType || !contentId || !['blog','video'].includes(contentType)) {
    return res.status(400).json({ success: false, message: 'contentType (blog|video) and contentId required' })
  }
  const userId = req.userId
  if (!userId) {
    return res.status(403).json({ success: false, message: 'Student account required' })
  }
  try {
    await query(
      `INSERT INTO content_reads (user_id, content_type, content_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, content_type, content_id) DO NOTHING`,
      [userId, contentType, contentId]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('[Progress mark]', err)
    res.status(500).json({ success: false, message: 'Failed to mark content' })
  }
})

// GET /api/progress — get all reads for current user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(403).json({ success: false, message: 'Student account required' })
    }
    const result = await query(
      `SELECT content_type, content_id, read_at FROM content_reads WHERE user_id = $1`,
      [userId]
    )
    const reads: Record<string, number[]> = { blog: [], video: [] }
    result.rows.forEach(r => { reads[r.content_type]?.push(r.content_id) })
    res.json({ success: true, data: reads })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch progress' })
  }
})

export default router
