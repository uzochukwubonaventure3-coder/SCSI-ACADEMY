import { Router, Request, Response } from 'express'
import { query } from '../config/database'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'
import { sendBroadcastEmail } from '../utils/email'

const router = Router()

function getNotificationUserId(req: AuthRequest): number | null {
  return typeof req.userId === 'number' ? req.userId : null
}

export async function notifyNewContent(title: string, type: 'blog' | 'video', linkOrSlug?: string) {
  const users = await query(`SELECT id FROM content_users WHERE is_active=TRUE`)
  const label = type === 'video' ? 'New Video' : 'New Article'
  const basePath = type === 'video' ? '/videos' : '/blog'
  const link = linkOrSlug
    ? (linkOrSlug.startsWith('/') ? linkOrSlug : `${basePath}/${linkOrSlug}`)
    : '/content'

  for (const user of users.rows) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1,'content',$2,$3,$4)`,
      [user.id, `${label}: ${title}`, 'New content has been published on SCSI Academy', link]
    ).catch(() => {})
  }

  const subs = await query(`SELECT email FROM newsletter_subscribers WHERE is_active=TRUE`)
  if (subs.rows.length > 0) {
    const emails = subs.rows.map((r: { email: string }) => r.email)
    const body = `A new ${type === 'video' ? 'video' : 'article'} "<strong>${title}</strong>" has been published on SCSI Academy. Login to read it now.`
    await sendBroadcastEmail(emails, `New on SCSI: ${title}`, body)
  }
}

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getNotificationUserId(req)
    if (!userId) return res.status(403).json({ success: false, message: 'Student account required' })

    const result = await query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,
      [userId]
    )
    const unread = result.rows.filter((row: { is_read: boolean }) => !row.is_read).length
    res.json({ success: true, data: result.rows, unread })
  } catch {
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

router.get('/unread-count', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getNotificationUserId(req)
    if (!userId) return res.status(403).json({ success: false, message: 'Student account required' })

    const result = await query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id=$1 AND is_read=FALSE`,
      [userId]
    )

    res.json({ success: true, unread: result.rows[0]?.unread ?? 0 })
  } catch {
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getNotificationUserId(req)
    if (!userId) return res.status(403).json({ success: false, message: 'Student account required' })

    await query(`UPDATE notifications SET is_read=TRUE WHERE user_id=$1`, [userId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getNotificationUserId(req)
    if (!userId) return res.status(403).json({ success: false, message: 'Student account required' })

    const result = await query(
      `UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, userId]
    )

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }

    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

router.post('/broadcast', requireAdmin, async (req: Request, res: Response) => {
  const { subject, body, audience } = req.body
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ success: false, message: 'Subject and body required' })
  }

  try {
    let usersQuery = `SELECT id, email, full_name FROM content_users WHERE is_active=TRUE`
    if (audience === 'newsletter') {
      const subs = await query(`SELECT email FROM newsletter_subscribers WHERE is_active=TRUE`)
      const emails = subs.rows.map((r: { email: string }) => r.email)
      await sendBroadcastEmail(emails, subject, body)
      await query(
        `INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`,
        [subject, body, 'newsletter', emails.length]
      )
      return res.json({ success: true, message: `Broadcast sent to ${emails.length} newsletter subscribers` })
    }

    if (audience === 'inactive') {
      usersQuery = `SELECT id, email, full_name FROM content_users WHERE is_active=FALSE`
    } else if (audience === 'low_wallet') {
      usersQuery = `SELECT cu.id, cu.email, cu.full_name FROM content_users cu LEFT JOIN wallets w ON w.user_id=cu.id WHERE cu.is_active=TRUE AND COALESCE(w.balance_kobo,0)<200000`
    } else if (audience === 'non_purchasers') {
      usersQuery = `SELECT cu.id, cu.email, cu.full_name FROM content_users cu WHERE cu.is_active=TRUE AND NOT EXISTS (SELECT 1 FROM video_purchases vp WHERE vp.user_id=cu.id)`
    }

    if (audience === 'intake_registrants') {
      const regs = await query(`SELECT DISTINCT email, full_name FROM refinery_registrations ORDER BY created_at DESC`)
      const emails = regs.rows.map((r: { email: string }) => r.email)
      await sendBroadcastEmail(emails, subject, body)
      await query(
        `INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`,
        [subject, body, 'intake_registrants', emails.length]
      )
      return res.json({ success: true, message: `Broadcast sent to ${emails.length} intake registrants` })
    }

    const users = await query(usersQuery)
    const emails = users.rows.map((u: { email: string }) => u.email)

    await sendBroadcastEmail(emails, subject, body)

    for (const user of users.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'broadcast',$2,$3)`,
        [user.id, subject, body]
      ).catch(() => {})
    }

    await query(
      `INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`,
      [subject, body, audience || 'all', users.rows.length]
    )

    res.json({ success: true, message: `Broadcast sent to ${users.rows.length} users` })
  } catch (err) {
    console.error('[Broadcast]', err)
    res.status(500).json({ success: false, message: 'Broadcast failed' })
  }
})

router.post('/content-alert', requireAdmin, async (req: Request, res: Response) => {
  const { title, type, link } = req.body
  if (!title) return res.status(400).json({ success: false, message: 'Title required' })

  try {
    await notifyNewContent(title, type === 'video' ? 'video' : 'blog', link)
    const users = await query(`SELECT COUNT(*)::int AS count FROM content_users WHERE is_active=TRUE`)
    res.json({ success: true, message: `Notification sent to ${users.rows[0]?.count ?? 0} users` })
  } catch (err) {
    console.error('[Content Alert]', err)
    res.status(500).json({ success: false, message: 'Alert failed' })
  }
})

router.get('/broadcasts', requireAdmin, async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM broadcasts ORDER BY sent_at DESC LIMIT 50`)
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

export default router
