import { Router } from 'express'
import { query } from '../config/database'

const router = Router()

// GET approved testimonials
router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, role, quote, avatar_url, created_at
       FROM testimonials WHERE approved = TRUE ORDER BY created_at DESC`
    )
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch testimonials' })
  }
})

// POST - public submission
router.post('/', async (req, res) => {
  try {
    const { name, role, quote, email, rating } = req.body
    if (!name || !quote || quote.length < 20) {
      return res.status(400).json({ success: false, message: 'Name and a meaningful quote (20+ chars) are required' })
    }
    await query(
      `INSERT INTO testimonials (name, role, quote, email, approved)
       VALUES ($1, $2, $3, $4, FALSE)`,
      [name.trim(), role?.trim() || null, quote.trim(), email?.trim() || null]
    )
    res.status(201).json({
      success: true,
      message: 'Testimonial submitted for review. Thank you for sharing your story!'
    })
  } catch {
    res.status(500).json({ success: false, message: 'Submission failed' })
  }
})

export default router
