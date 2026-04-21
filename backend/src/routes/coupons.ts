import { Router, Response } from 'express'
import { pool, query } from '../config/database'
import { requireStudent, AuthRequest } from '../middleware/auth'

const router = Router()

// ─── POST /api/coupons/apply ──────────────────────────────────────────
// Validate a coupon code and return discount info. Does NOT consume the coupon.
router.post('/apply', requireStudent, async (req: AuthRequest, res: Response) => {
  const userId  = req.userId!
  const { code, video_id } = req.body

  if (!code?.trim()) return res.status(400).json({ success: false, message: 'Coupon code required' })

  try {
    const result = await query(
      `SELECT * FROM coupons WHERE code = UPPER(TRIM($1)) AND is_active = TRUE`,
      [code]
    )
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' })
    }
    const coupon = result.rows[0]

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' })
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' })
    }

    // Check if this user already used this coupon for this video
    if (video_id) {
      const already = await query(
        `SELECT id FROM coupon_uses WHERE coupon_id=$1 AND user_id=$2 AND video_id=$3`,
        [coupon.id, userId, video_id]
      )
      if (already.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon for this video' })
      }
    }

    res.json({
      success:          true,
      coupon_id:        coupon.id,
      code:             coupon.code,
      discount_percent: coupon.discount_percent,
      expires_at:       coupon.expires_at,
      message:          `${coupon.discount_percent}% discount applied!`,
    })
  } catch (err) {
    console.error('[Coupon Apply]', err)
    res.status(500).json({ success: false, message: 'Failed to validate coupon' })
  }
})

export default router
