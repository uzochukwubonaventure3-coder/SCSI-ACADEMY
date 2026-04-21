import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/database'
import { notifyNewContent } from './notifications'
import { requireAdmin as requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// ─── POST /api/admin/login ────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' })
  }

  const adminEmail    = process.env.ADMIN_EMAIL
  const adminHashEnv  = process.env.ADMIN_PASSWORD_HASH

  if (email !== adminEmail || !adminHashEnv) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const match = await bcrypt.compare(password, adminHashEnv)
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  )

  res.json({ success: true, token })
})

// ─── GET /api/admin/dashboard ─────────────────────────────────────────
router.get('/dashboard', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const [contacts, refinery, newsletter, blogs, videos, testimonials] = await Promise.all([
      query('SELECT COUNT(*) FROM contact_submissions'),
      query('SELECT COUNT(*) FROM refinery_registrations'),
      query('SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = TRUE'),
      query("SELECT COUNT(*) FROM blog_posts WHERE status = 'published'"),
      query("SELECT COUNT(*) FROM video_posts WHERE status = 'published'"),
      query('SELECT COUNT(*) FROM testimonials WHERE approved = FALSE'),
    ])
    res.json({
      success: true,
      data: {
        totalContacts:        parseInt(contacts.rows[0].count),
        totalRegistrations:   parseInt(refinery.rows[0].count),
        activeSubscribers:    parseInt(newsletter.rows[0].count),
        publishedPosts:       parseInt(blogs.rows[0].count),
        publishedVideos:      parseInt(videos.rows[0].count),
        pendingTestimonials:  parseInt(testimonials.rows[0].count),
      },
    })
  } catch (err) {
    console.error('[Admin Dashboard]', err)
    res.status(500).json({ success: false, message: 'Failed to load dashboard' })
  }
})

// ─── Blog CRUD ────────────────────────────────────────────────────────
router.get('/blog', requireAuth, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM blog_posts ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch posts' })
  }
})

router.post('/blog', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, excerpt, content, coverImage, tags, status } = req.body
    if (!title || !slug || !content) {
      return res.status(400).json({ success: false, message: 'Title, slug, and content are required' })
    }
    const result = await query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, slug, excerpt || null, content, coverImage || null, tags || [], status || 'draft']
    )
    if ((status || 'draft') === 'published') {
      notifyNewContent(title, 'blog', slug).catch(console.error)
    }
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err: unknown) {
    const msg = err instanceof Error && err.message.includes('unique') ? 'Slug already exists' : 'Failed to create post'
    res.status(400).json({ success: false, message: msg })
  }
})

router.put('/blog/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, excerpt, content, coverImage, tags, status } = req.body
    const result = await query(
      `UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4, cover_image=$5,
       tags=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [title, slug, excerpt, content, coverImage, tags || [], status, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Post not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update post' })
  }
})

router.delete('/blog/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await query('DELETE FROM blog_posts WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Post deleted' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete post' })
  }
})

// ─── Video CRUD ───────────────────────────────────────────────────────
router.get('/videos', requireAuth, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM video_posts ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch videos' })
  }
})

router.post('/videos', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Video POST payload:', req.body)
    let { title, slug, description, videoUrl, thumbnailUrl, duration, tags, status } = req.body
    videoUrl = videoUrl || req.body.video_url
    console.log('Extracted videoUrl:', videoUrl)
    if (!title || !slug || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Title, slug, and videoUrl are required' })
    }
    const { priceKobo, isFree, category, previewUrl, previewEndSeconds,
            discountPercent, discountExpiresAt, outcomes, targetAudience, lessons } = req.body
    const result = await query(
      `INSERT INTO video_posts (title, slug, description, video_url, thumbnail_url, duration, tags, status,
        price_kobo, is_free, category, preview_url, preview_end_seconds,
        discount_percent, discount_expires_at, outcomes, target_audience, lessons)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [title, slug, description || null, videoUrl, thumbnailUrl || null, duration || null,
       tags || [], status || 'draft', priceKobo ?? 200000, isFree ?? false, category || null,
       previewUrl || null, previewEndSeconds ?? 60,
       discountPercent || null, discountExpiresAt || null,
       outcomes || null, targetAudience || null, lessons || null]
    )
    if ((status || 'draft') === 'published') {
      notifyNewContent(title, 'video', slug).catch(console.error)
    }
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err: unknown) {
    const msg = err instanceof Error && err.message.includes('unique') ? 'Slug already exists' : 'Failed to create video'
    res.status(400).json({ success: false, message: msg })
  }
})

router.put('/videos/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    let { title, slug, description, videoUrl, thumbnailUrl, duration, tags, status,
            priceKobo, isFree, category, previewUrl, previewEndSeconds,
            discountPercent, discountExpiresAt, outcomes, targetAudience, lessons } = req.body
    videoUrl = videoUrl || req.body.video_url
    const result = await query(
      `UPDATE video_posts SET title=$1, slug=$2, description=$3, video_url=$4,
       thumbnail_url=$5, duration=$6, tags=$7, status=$8,
       price_kobo=$9, is_free=$10, category=$11,
       preview_url=$12, preview_end_seconds=$13,
       discount_percent=$14, discount_expires_at=$15,
       outcomes=$16, target_audience=$17, lessons=$18,
       updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [title, slug, description, videoUrl, thumbnailUrl, duration, tags || [], status,
       priceKobo ?? 200000, isFree ?? false, category || null,
       previewUrl || null, previewEndSeconds ?? 60,
       discountPercent || null, discountExpiresAt || null,
       outcomes || null, targetAudience || null, lessons || null,
       req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Video not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update video' })
  }
})

router.delete('/videos/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await query('DELETE FROM video_posts WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Video deleted' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete video' })
  }
})

// ─── Testimonials management ──────────────────────────────────────────
router.get('/testimonials', requireAuth, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM testimonials ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch testimonials' })
  }
})

router.patch('/testimonials/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await query('UPDATE testimonials SET approved = TRUE WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Testimonial approved' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to approve' })
  }
})

router.delete('/testimonials/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await query('DELETE FROM testimonials WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Deleted' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete' })
  }
})

// ─── Gallery management ───────────────────────────────────────────────
router.post('/gallery', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, imageUrl, altText, category } = req.body
    if (!imageUrl) return res.status(400).json({ success: false, message: 'imageUrl required' })
    const result = await query(
      'INSERT INTO gallery_images (title, image_url, alt_text, category) VALUES ($1,$2,$3,$4) RETURNING *',
      [title || null, imageUrl, altText || '', category || null]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to add image' })
  }
})

router.delete('/gallery/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await query('DELETE FROM gallery_images WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Image deleted' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete image' })
  }
})

// ─── View contact/refinery submissions ───────────────────────────────
router.get('/contacts', requireAuth, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 100')
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch' })
  }
})

router.get('/registrations', requireAuth, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM refinery_registrations ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch' })
  }
})

router.get('/subscribers', requireAuth, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM newsletter_subscribers WHERE is_active=TRUE ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch' })
  }
})

export default router

// ─── Paywall users & payments (admin view) ────────────────────────────
router.get('/paywall/users', requireAuth, async (_req, res) => {
  try {
    const result = await query(`
      SELECT cu.id, cu.full_name, cu.email, cu.plan, cu.expires_at, cu.is_active, cu.created_at,
             COUNT(p.id) FILTER (WHERE p.status = 'success') as payment_count,
             SUM(p.amount_kobo) FILTER (WHERE p.status = 'success') as total_paid_kobo
      FROM content_users cu
      LEFT JOIN payments p ON p.user_id = cu.id
      GROUP BY cu.id
      ORDER BY cu.created_at DESC
    `)
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch users' })
  }
})

router.get('/paywall/payments', requireAuth, async (_req, res) => {
  try {
    const result = await query(`
      SELECT p.*, cu.full_name FROM payments p
      LEFT JOIN content_users cu ON cu.id = p.user_id
      ORDER BY p.created_at DESC LIMIT 100
    `)
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' })
  }
})

// Revoke / restore access
router.patch('/paywall/users/:id/toggle', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `UPDATE content_users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active`,
      [req.params.id]
    )
    const status = result.rows[0]?.is_active ? 'activated' : 'deactivated'
    res.json({ success: true, message: `User ${status}` })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle' })
  }
})

// ─── Student notes ────────────────────────────────────────────────────
router.post('/students/:id/notes', requireAuth, async (req, res) => {
  try {
    const { note } = req.body
    if (!note?.trim()) return res.status(400).json({ success:false, message:'Note required' })
    await query(
      `INSERT INTO student_notes (student_id, admin_note) VALUES ($1, $2)`,
      [req.params.id, note.trim()]
    )
    res.status(201).json({ success:true, message:'Note saved' })
  } catch { res.status(500).json({ success:false, message:'Failed to save note' }) }
})

router.get('/students/:id/notes', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM student_notes WHERE student_id=$1 ORDER BY created_at DESC`,
      [req.params.id]
    )
    res.json({ success:true, data:result.rows })
  } catch { res.status(500).json({ success:false, message:'Failed to fetch notes' }) }
})

// ─── Revenue summary ─────────────────────────────────────────────────
router.get('/revenue', requireAuth, async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM revenue_summary`)
    res.json({ success:true, data: result.rows[0] })
  } catch { res.status(500).json({ success:false, message:'Failed to fetch revenue' }) }
})

// ─── GET /api/admin/analytics/revenue ────────────────────────────────
router.get('/analytics/revenue', requireAuth, async (_req, res: Response) => {
  try {
    const [subRev, vidRev, walletFund, last7, last30, topVids, daily30] = await Promise.all([

      // Subscription revenue (from payments table)
      query(`
        SELECT
          COALESCE(SUM(amount_kobo) FILTER (WHERE status='success'), 0)                AS total_kobo,
          COALESCE(SUM(amount_kobo) FILTER (WHERE status='success' AND plan='monthly'), 0) AS monthly_kobo,
          COALESCE(SUM(amount_kobo) FILTER (WHERE status='success' AND plan='quarterly'),0) AS quarterly_kobo,
          COUNT(*)          FILTER (WHERE status='success')                             AS count
        FROM payments
      `),

      // Video purchase revenue
      query(`
        SELECT
          COALESCE(SUM(amount_kobo), 0) AS total_kobo,
          COUNT(*)                      AS count,
          COUNT(*) FILTER (WHERE paid_via='wallet')   AS wallet_count,
          COUNT(*) FILTER (WHERE paid_via='paystack') AS paystack_count
        FROM video_purchases
      `),

      // Wallet funding total (credits from top-ups only, not video purchases)
      query(`
        SELECT COALESCE(SUM(amount_kobo), 0) AS total_kobo, COUNT(*) AS count
        FROM wallet_transactions
        WHERE type='credit'
      `),

      // Last 7 days combined revenue
      query(`
        SELECT
          COALESCE(
            (SELECT SUM(amount_kobo) FROM payments          WHERE status='success' AND created_at >= NOW()-INTERVAL '7 days') +
            (SELECT SUM(amount_kobo) FROM video_purchases                          WHERE             created_at >= NOW()-INTERVAL '7 days')
          , 0) AS total_kobo,
          (SELECT COUNT(*) FROM payments       WHERE status='success' AND created_at >= NOW()-INTERVAL '7 days') AS sub_count,
          (SELECT COUNT(*) FROM video_purchases                        WHERE             created_at >= NOW()-INTERVAL '7 days') AS vid_count
      `),

      // Last 30 days combined revenue
      query(`
        SELECT
          COALESCE(
            (SELECT SUM(amount_kobo) FROM payments          WHERE status='success' AND created_at >= NOW()-INTERVAL '30 days') +
            (SELECT SUM(amount_kobo) FROM video_purchases                          WHERE             created_at >= NOW()-INTERVAL '30 days')
          , 0) AS total_kobo,
          (SELECT COUNT(*) FROM payments       WHERE status='success' AND created_at >= NOW()-INTERVAL '30 days') AS sub_count,
          (SELECT COUNT(*) FROM video_purchases                        WHERE             created_at >= NOW()-INTERVAL '30 days') AS vid_count
      `),

      // Top earning videos (by revenue)
      query(`
        SELECT
          vp.id,
          vp.title,
          vp.price_kobo,
          COUNT(pu.id)           AS purchase_count,
          COALESCE(SUM(pu.amount_kobo), 0) AS total_revenue_kobo
        FROM video_posts vp
        LEFT JOIN video_purchases pu ON pu.video_id = vp.id
        GROUP BY vp.id, vp.title, vp.price_kobo
        HAVING COUNT(pu.id) > 0
        ORDER BY total_revenue_kobo DESC
        LIMIT 10
      `),

      // Daily revenue for last 30 days (chart data)
      query(`
        SELECT day, SUM(amount_kobo) AS total_kobo
        FROM (
          SELECT DATE_TRUNC('day', created_at) AS day, amount_kobo
          FROM payments WHERE status='success' AND created_at >= NOW()-INTERVAL '30 days'
          UNION ALL
          SELECT DATE_TRUNC('day', created_at) AS day, amount_kobo
          FROM video_purchases WHERE created_at >= NOW()-INTERVAL '30 days'
        ) combined
        GROUP BY day
        ORDER BY day ASC
      `),
    ])

    const sub  = subRev.rows[0]
    const vid  = vidRev.rows[0]
    const fund = walletFund.rows[0]
    const r7   = last7.rows[0]
    const r30  = last30.rows[0]

    res.json({
      success: true,
      data: {
        total_revenue:          parseInt(sub.total_kobo) + parseInt(vid.total_kobo),
        subscription_revenue:   parseInt(sub.total_kobo),
        video_revenue:          parseInt(vid.total_kobo),
        wallet_funding_total:   parseInt(fund.total_kobo),
        subscription_count:     parseInt(sub.count),
        video_purchase_count:   parseInt(vid.count),
        monthly_sub_kobo:       parseInt(sub.monthly_kobo),
        quarterly_sub_kobo:     parseInt(sub.quarterly_kobo),
        wallet_paid_count:      parseInt(vid.wallet_count),
        paystack_paid_count:    parseInt(vid.paystack_count),
        revenue_last_7_days:    parseInt(r7.total_kobo) || 0,
        revenue_last_30_days:   parseInt(r30.total_kobo) || 0,
        last_7_sub_count:       parseInt(r7.sub_count),
        last_7_vid_count:       parseInt(r7.vid_count),
        last_30_sub_count:      parseInt(r30.sub_count),
        last_30_vid_count:      parseInt(r30.vid_count),
        top_earning_videos:     topVids.rows.map((v: {id:number;title:string;price_kobo:string;purchase_count:string;total_revenue_kobo:string}) => ({
          id:                  v.id,
          title:               v.title,
          price_kobo:          parseInt(v.price_kobo),
          purchase_count:      parseInt(v.purchase_count),
          total_revenue_kobo:  parseInt(v.total_revenue_kobo),
        })),
        daily_chart: daily30.rows.map((d: {day:string;total_kobo:string}) => ({
          day:        d.day.slice(0,10),
          total_kobo: parseInt(d.total_kobo),
        })),
      },
    })
  } catch (err) {
    console.error('[Analytics Revenue]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' })
  }
})

// ─── GET  /api/admin/coupons ──────────────────────────────────────────
router.get('/coupons', requireAuth, async (_req, res: Response) => {
  try {
    const result = await query(`
      SELECT c.*,
        COUNT(cu.id) AS total_uses
      FROM coupons c
      LEFT JOIN coupon_uses cu ON cu.coupon_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[Coupons GET]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' })
  }
})

// ─── POST /api/admin/coupons ─────────────────────────────────────────
router.post('/coupons', requireAuth, async (req, res: Response) => {
  const { code, discount_percent, expires_at, usage_limit } = req.body
  if (!code?.trim() || !discount_percent) {
    return res.status(400).json({ success: false, message: 'code and discount_percent required' })
  }
  if (discount_percent < 1 || discount_percent > 100) {
    return res.status(400).json({ success: false, message: 'discount_percent must be 1–100' })
  }
  try {
    const result = await query(
      `INSERT INTO coupons (code, discount_percent, expires_at, usage_limit)
       VALUES (UPPER(TRIM($1)), $2, $3, $4) RETURNING *`,
      [code, discount_percent, expires_at || null, usage_limit || null]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err: unknown) {
    const msg = err instanceof Error && err.message.includes('unique')
      ? 'Coupon code already exists' : 'Failed to create coupon'
    res.status(400).json({ success: false, message: msg })
  }
})

// ─── PATCH /api/admin/coupons/:id/toggle ─────────────────────────────
router.patch('/coupons/:id/toggle', requireAuth, async (req, res: Response) => {
  try {
    const result = await query(
      `UPDATE coupons SET is_active = NOT is_active WHERE id=$1 RETURNING *`,
      [req.params.id]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle coupon' })
  }
})

// ─── DELETE /api/admin/coupons/:id ───────────────────────────────────
router.delete('/coupons/:id', requireAuth, async (req, res: Response) => {
  try {
    await query(`DELETE FROM coupons WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' })
  }
})
