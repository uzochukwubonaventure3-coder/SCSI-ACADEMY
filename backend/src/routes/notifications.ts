import { Router, Request, Response } from 'express'
import { query } from '../config/database'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'
import { sendBroadcastEmail } from '../utils/email'

const router = Router()

// Helper: extract student id from decoded token (stored in req.admin by requireAuth)
function getUserId(req: AuthRequest): number | null {
  const decoded = req.admin as { id?: number; role?: string } | undefined
  if (!decoded) return null
  if (decoded.role === 'admin') return null // admins don't have personal notifications
  return decoded.id ?? null
}

// ─── GET /api/notifications ───────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    return res.json({ success: true, data: [], unread: 0 }) // admins get empty list
  }
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,
      [userId]
    )
    const unread = result.rows.filter((r: { is_read: boolean }) => !r.is_read).length
    res.json({ success: true, data: result.rows, unread })
  } catch (err) {
    console.error('[Notifications GET]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' })
  }
})

// ─── PATCH /api/notifications/read-all ───────────────────────────────
router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req)
  if (!userId) return res.json({ success: true })
  try {
    await query(`UPDATE notifications SET is_read=TRUE WHERE user_id=$1`, [userId])
    res.json({ success: true })
  } catch (err) {
    console.error('[Notifications read-all]', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

// ─── POST /api/notifications/broadcast (admin only) ──────────────────
router.post('/broadcast', requireAdmin, async (req: Request, res: Response) => {
  const { subject, body, audience } = req.body
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ success: false, message: 'Subject and body required' })
  }
  try {
    if (audience === 'newsletter') {
      const subs = await query(`SELECT email FROM newsletter_subscribers WHERE is_active=TRUE`)
      const emails = subs.rows.map((r: { email: string }) => r.email)
      await sendBroadcastEmail(emails, subject, body)
      await query(`INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`, [subject, body, 'newsletter', emails.length])
      return res.json({ success: true, message: `Sent to ${emails.length} newsletter subscribers` })
    }

    const q = audience === 'inactive'
      ? `SELECT id, email, full_name FROM content_users WHERE is_active=FALSE`
      : `SELECT id, email, full_name FROM content_users WHERE is_active=TRUE`

    const users = await query(q)
    const emails = users.rows.map((u: { email: string }) => u.email)

    await sendBroadcastEmail(emails, subject, body)

    for (const user of users.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'broadcast',$2,$3)`,
        [user.id, subject, body]
      ).catch(() => {})
    }

    await query(`INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`, [subject, body, audience || 'all', users.rows.length])
    res.json({ success: true, message: `Sent to ${users.rows.length} users` })
  } catch (err) {
    console.error('[Broadcast]', err)
    res.status(500).json({ success: false, message: 'Broadcast failed' })
  }
})

// ─── POST /api/notifications/content-alert (admin) ───────────────────
router.post('/content-alert', requireAdmin, async (req: Request, res: Response) => {
  const { title, type, link } = req.body
  if (!title) return res.status(400).json({ success: false, message: 'Title required' })
  try {
    const users = await query(`SELECT id, email FROM content_users WHERE is_active=TRUE`)
    const label = type === 'video' ? '🎥 New Video' : '📝 New Article'
    for (const user of users.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1,'content',$2,$3,$4)`,
        [user.id, `${label}: ${title}`, 'New content has been published on SCSI Academy', link || '/content']
      ).catch(() => {})
    }
    const subs = await query(`SELECT email FROM newsletter_subscribers WHERE is_active=TRUE`)
    if (subs.rows.length > 0) {
      const emails = subs.rows.map((r: { email: string }) => r.email)
      await sendBroadcastEmail(emails, `New on SCSI: ${title}`, `A new ${type === 'video' ? 'video' : 'article'} "<strong>${title}</strong>" has been published. <a href="${process.env.FRONTEND_URL}/content">Read it now →</a>`)
    }
    res.json({ success: true, message: `Notified ${users.rows.length} users` })
  } catch (err) {
    console.error('[Content Alert]', err)
    res.status(500).json({ success: false, message: 'Alert failed' })
  }
})

// ─── GET /api/notifications/broadcasts (admin) ───────────────────────
router.get('/broadcasts', requireAdmin, async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM broadcasts ORDER BY sent_at DESC LIMIT 50`)
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

export default router
