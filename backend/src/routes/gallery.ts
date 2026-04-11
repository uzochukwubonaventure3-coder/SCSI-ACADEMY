import { Router } from 'express'
import { query } from '../config/database'
import { requireAdmin } from '../middleware/auth'

const router = Router()

// GET all gallery images (public)
router.get('/', async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM gallery_images ORDER BY created_at DESC`)
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch gallery' })
  }
})

// POST add image (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, imageUrl, altText, category } = req.body
    if (!imageUrl?.trim()) return res.status(400).json({ success: false, message: 'Image URL required' })
    const result = await query(
      `INSERT INTO gallery_images (title, image_url, alt_text, category) VALUES ($1,$2,$3,$4) RETURNING *`,
      [title || '', imageUrl, altText || title || '', category || 'General']
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to add image' })
  }
})

// DELETE image (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM gallery_images WHERE id=$1', [req.params.id])
    res.json({ success: true, message: 'Image deleted' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete' })
  }
})

export default router
