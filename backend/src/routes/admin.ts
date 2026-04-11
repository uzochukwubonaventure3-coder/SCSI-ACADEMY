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
    const { title, slug, description, videoUrl, thumbnailUrl, duration, tags, status } = req.body
    if (!title || !slug || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Title, slug, and videoUrl are required' })
    }
    const result = await query(
      `INSERT INTO video_posts (title, slug, description, video_url, thumbnail_url, duration, tags, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, slug, description || null, videoUrl, thumbnailUrl || null, duration || null, tags || [], status || 'draft']
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
    const { title, slug, description, videoUrl, thumbnailUrl, duration, tags, status } = req.body
    const result = await query(
      `UPDATE video_posts SET title=$1, slug=$2, description=$3, video_url=$4,
       thumbnail_url=$5, duration=$6, tags=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, slug, description, videoUrl, thumbnailUrl, duration, tags || [], status, req.params.id]
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
