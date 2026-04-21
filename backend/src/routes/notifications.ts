import { Router, Request, Response } from 'express'
import { query } from '../config/database'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'
import { sendBroadcastEmail } from '../utils/email'

const router = Router()

// ─── GET /api/notifications (student) ────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as { user?: {id:number}; admin?: {id?:number} }).user?.id || req.admin?.id
    const result = await query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,
      [userId]
    )
    const unread = result.rows.filter(r => !r.is_read).length
    res.json({ success:true, data:result.rows, unread })
  } catch { res.status(500).json({ success:false, message:'Failed' }) }
})

// ─── PATCH /api/notifications/read-all ───────────────────────────────
router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as { user?: {id:number}; admin?: {id?:number} }).user?.id || req.admin?.id
    await query(`UPDATE notifications SET is_read=TRUE WHERE user_id=$1`, [userId])
    res.json({ success:true })
  } catch { res.status(500).json({ success:false, message:'Failed' }) }
})

// ─── POST /api/notifications/broadcast (admin) ────────────────────────
// Sends email + creates in-app notification for all active users
router.post('/broadcast', requireAdmin, async (req: Request, res: Response) => {
  const { subject, body, audience } = req.body
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ success:false, message:'Subject and body required' })
  }

  try {
    let usersQuery = `SELECT id, email, full_name FROM content_users WHERE is_active=TRUE`
    if (audience === 'newsletter') {
      // Send to newsletter subscribers instead
      const subs = await query(`SELECT email FROM newsletter_subscribers WHERE is_active=TRUE`)
      const emails = subs.rows.map((r: {email:string}) => r.email)
      // Send emails
      await sendBroadcastEmail(emails, subject, body)
      await query(
        `INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`,
        [subject, body, 'newsletter', emails.length]
      )
      return res.json({ success:true, message:`Broadcast sent to ${emails.length} newsletter subscribers` })
    }

    if (audience === 'inactive') {
      usersQuery = `SELECT id, email, full_name FROM content_users WHERE is_active=FALSE`
    } else if (audience === 'low_wallet') {
      usersQuery = `SELECT cu.id, cu.email, cu.full_name FROM content_users cu LEFT JOIN wallets w ON w.user_id=cu.id WHERE cu.is_active=TRUE AND COALESCE(w.balance_kobo,0)<200000`
    } else if (audience === 'non_purchasers') {
      usersQuery = `SELECT cu.id, cu.email, cu.full_name FROM content_users cu WHERE cu.is_active=TRUE AND NOT EXISTS (SELECT 1 FROM video_purchases vp WHERE vp.user_id=cu.id)`
    }

    // Intake/refinery registrants — email only (they may not have content_users accounts)
    if (audience === 'intake_registrants') {
      const regs = await query(`SELECT DISTINCT email, full_name FROM refinery_registrations ORDER BY created_at DESC`)
      const emails = regs.rows.map((r: {email:string}) => r.email)
      await sendBroadcastEmail(emails, subject, body)
      await query(`INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`, [subject, body, 'intake_registrants', emails.length])
      return res.json({ success:true, message:`Broadcast sent to ${emails.length} intake registrants` })
    }

    const users = await query(usersQuery)
    const emails = users.rows.map((u: {email:string}) => u.email)

    // Send emails
    await sendBroadcastEmail(emails, subject, body)

    // Create in-app notifications for account holders
    for (const user of users.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'broadcast',$2,$3)`,
        [user.id, subject, body]
      ).catch(() => {}) // Don't fail if one user notification fails
    }

    await query(
      `INSERT INTO broadcasts (subject, body, audience, sent_count) VALUES ($1,$2,$3,$4)`,
      [subject, body, audience || 'all', users.rows.length]
    )

    res.json({ success:true, message:`Broadcast sent to ${users.rows.length} users` })
  } catch (err) {
    console.error('[Broadcast]', err)
    res.status(500).json({ success:false, message:'Broadcast failed' })
  }
})

// ─── POST /api/notifications/content-alert (admin - on new post) ──────
router.post('/content-alert', requireAdmin, async (req: Request, res: Response) => {
  const { title, type, link } = req.body
  if (!title) return res.status(400).json({ success:false, message:'Title required' })

  try {
    const users = await query(`SELECT id, email FROM content_users WHERE is_active=TRUE`)
    const label = type === 'video' ? '🎥 New Video' : '📝 New Article'

    for (const user of users.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1,'content',$2,$3,$4)`,
        [user.id, `${label}: ${title}`, `New content has been published on SCSI Academy`, link || '/content']
      ).catch(() => {})
    }

    // Email newsletter subscribers too
    const subs = await query(`SELECT email FROM newsletter_subscribers WHERE is_active=TRUE`)
    if (subs.rows.length > 0) {
      const emails = subs.rows.map((r:{email:string}) => r.email)
      const body = `A new ${type === 'video' ? 'video' : 'article'} "<strong>${title}</strong>" has been published on SCSI Academy. Login to read it now.`
      await sendBroadcastEmail(emails, `New on SCSI: ${title}`, body)
    }

    res.json({ success:true, message:`Notification sent to ${users.rows.length} users` })
  } catch (err) {
    console.error('[Content Alert]', err)
    res.status(500).json({ success:false, message:'Alert failed' })
  }
})

// ─── GET /api/notifications/broadcasts (admin) ───────────────────────
router.get('/broadcasts', requireAdmin, async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM broadcasts ORDER BY sent_at DESC LIMIT 50`)
    res.json({ success:true, data:result.rows })
  } catch { res.status(500).json({ success:false, message:'Failed' }) }
})

export default router
