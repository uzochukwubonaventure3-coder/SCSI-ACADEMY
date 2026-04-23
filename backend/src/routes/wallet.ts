import { Router, Response } from 'express'
import { pool, query } from '../config/database'
import { requireStudent, AuthRequest } from '../middleware/auth'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const router   = Router()
const PAYSTACK = process.env.PAYSTACK_SECRET_KEY || ''

// ── helpers ────────────────────────────────────────────────────────────
const naira = (k: number) => `₦${(k / 100).toLocaleString('en-NG')}`

function ensurePaystackConfig() {
  return !!PAYSTACK && !!process.env.PAYSTACK_PUBLIC_KEY
}

function getAxiosMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message
      || error.response?.data?.error
      || error.message
      || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

async function ensureWallet(userId: number): Promise<{ balance_kobo: number }> {
  const r = await query(
    `INSERT INTO wallets (user_id, balance_kobo) VALUES ($1, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  )
  const w = await query(`SELECT balance_kobo FROM wallets WHERE user_id = $1`, [userId])
  return w.rows[0]
}

// ─── GET /api/wallet ─────────────────────────────────────────────────
router.get('/', requireStudent, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!
  try {
    const wallet = await ensureWallet(userId)
    const txRes  = await query(
      `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    )
    res.json({ success: true, data: { balance_kobo: wallet.balance_kobo, transactions: txRes.rows } })
  } catch (err) {
    console.error('[Wallet GET]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch wallet' })
  }
})

// ─── POST /api/wallet/fund/initialize ────────────────────────────────
// Creates a Paystack transaction to fund the wallet
router.post('/fund/initialize', requireStudent, async (req: AuthRequest, res: Response) => {
  const userId    = req.userId!
  const { amount_kobo } = req.body

  if (!ensurePaystackConfig()) {
    return res.status(500).json({ success: false, message: 'Paystack is not configured on the server' })
  }

  if (!amount_kobo || amount_kobo < 10000) { // min ₦100
    return res.status(400).json({ success: false, message: 'Minimum funding amount is ₦100' })
  }

  try {
    // Get user email
    const userRes = await query(`SELECT email, full_name FROM content_users WHERE id = $1`, [userId])
    if (!userRes.rows.length) return res.status(404).json({ success: false, message: 'User not found' })
    const { email, full_name } = userRes.rows[0]

    const reference = `WALLET-${userId}-${Date.now()}`

    const { data } = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount:    amount_kobo,
        reference,
        currency:  'NGN',
        metadata: {
          user_id:  userId,
          type:     'wallet_fund',
          full_name,
          custom_fields: [{ display_name: 'Type', variable_name: 'type', value: 'Wallet Top-up' }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    res.json({
      success:    true,
      reference,
      amountKobo: amount_kobo,
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY,
      email,
      authorizationUrl: data.data.authorization_url,
    })
  } catch (err) {
    console.error('[Wallet Fund Init]', err)
    res.status(500).json({ success: false, message: getAxiosMessage(err, 'Failed to initialize payment') })
  }
})

// ─── POST /api/wallet/fund/verify ────────────────────────────────────
// Verifies the Paystack transaction and credits the wallet
router.post('/fund/verify', requireStudent, async (req: AuthRequest, res: Response) => {
  const userId    = req.userId!
  const { reference } = req.body

  if (!ensurePaystackConfig()) {
    return res.status(500).json({ success: false, message: 'Paystack is not configured on the server' })
  }

  if (!reference) return res.status(400).json({ success: false, message: 'Reference required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Idempotent check — prevent double credit
    const dupCheck = await client.query(
      `SELECT id FROM wallet_transactions WHERE reference = $1 AND type = 'credit'`,
      [reference]
    )
    if (dupCheck.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.json({ success: true, message: 'Already credited', alreadyProcessed: true })
    }

    // 2. Verify with Paystack
    const { data: psData } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK}` },
        timeout: 15000,
      }
    )

    if (psData.data.status !== 'success') {
      await client.query('ROLLBACK')
      return res.status(402).json({ success: false, message: 'Payment not successful' })
    }

    if (Number(psData.data.metadata?.user_id) !== userId) {
      await client.query('ROLLBACK')
      return res.status(403).json({ success: false, message: 'Payment does not belong to this user' })
    }

    const amount_kobo = psData.data.amount

    // 3. Ensure wallet exists
    await client.query(
      `INSERT INTO wallets (user_id, balance_kobo) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    )

    // 4. Credit wallet
    await client.query(
      `UPDATE wallets SET balance_kobo = balance_kobo + $1, updated_at = NOW() WHERE user_id = $2`,
      [amount_kobo, userId]
    )

    // 5. Log transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount_kobo, reference, description)
       VALUES ($1, 'credit', $2, $3, $4)`,
      [userId, amount_kobo, reference, `Wallet top-up — ${naira(amount_kobo)}`]
    )

    await client.query('COMMIT')

    const walletRes = await query(`SELECT balance_kobo FROM wallets WHERE user_id = $1`, [userId])
    res.json({
      success:       true,
      message:       `Wallet credited with ${naira(amount_kobo)}`,
      amount_kobo,
      new_balance:   walletRes.rows[0].balance_kobo,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Wallet Fund Verify]', err)
    res.status(500).json({ success: false, message: getAxiosMessage(err, 'Failed to verify payment') })
  } finally {
    client.release()
  }
})

// ─── POST /api/wallet/purchase/video ─────────────────────────────────
// Deduct wallet balance to purchase a video
router.post('/purchase/video', requireStudent, async (req: AuthRequest, res: Response) => {
  const userId  = req.userId!
  const { video_id, coupon_id } = req.body

  if (!video_id) return res.status(400).json({ success: false, message: 'video_id required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Get video price
    const videoRes = await client.query(
      `SELECT id, title, price_kobo, is_free, status FROM video_posts WHERE id = $1`,
      [video_id]
    )
    if (!videoRes.rows.length || videoRes.rows[0].status !== 'published') {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Video not found' })
    }
    const video = videoRes.rows[0]

    if (video.is_free) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'This video is free — no purchase needed' })
    }

    // 2. Check not already purchased (idempotent)
    const already = await client.query(
      `SELECT id FROM video_purchases WHERE user_id = $1 AND video_id = $2`,
      [userId, video_id]
    )
    if (already.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.json({ success: true, message: 'Already purchased', alreadyOwned: true })
    }

    // 3. Check active subscription
    const userRes = await client.query(
      `SELECT is_active, expires_at FROM content_users WHERE id = $1`,
      [userId]
    )
    const user = userRes.rows[0]
    if (!user.is_active || !user.expires_at || new Date(user.expires_at) <= new Date()) {
      await client.query('ROLLBACK')
      return res.status(403).json({ success: false, message: 'Active subscription required', reason: 'no_subscription' })
    }

    // 3b. Apply coupon discount if provided
    let finalPrice = video.price_kobo
    let couponRow: {
      id: number
      discount_percent: number
      usage_limit: number | null
      used_count: number
      expires_at: string | null
    } | null = null
    if (coupon_id) {
      const couponRes = await client.query(
        `SELECT * FROM coupons WHERE id=$1 AND is_active=TRUE FOR UPDATE`,
        [coupon_id]
      )
      if (couponRes.rows.length) {
        couponRow = couponRes.rows[0]
        const cp = couponRow!
        const notExpired = !cp.expires_at || new Date(cp.expires_at) > new Date()
        const notMaxed   = cp.usage_limit === null || cp.used_count < cp.usage_limit
        // Check not already used by this user for this video
        const usedAlready = await client.query(
          `SELECT id FROM coupon_uses WHERE coupon_id=$1 AND user_id=$2 AND video_id=$3`,
          [cp.id, userId, video_id]
        )
        if (notExpired && notMaxed && !usedAlready.rows.length) {
          finalPrice = Math.round(video.price_kobo * (1 - cp.discount_percent / 100))
        }
      }
    }

    // 4. Check wallet balance against final price
    const walletRes = await client.query(
      `SELECT balance_kobo FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [userId]
    )
    const balance = walletRes.rows[0]?.balance_kobo ?? 0

    if (balance < finalPrice) {
      await client.query('ROLLBACK')
      return res.status(402).json({
        success:          false,
        message:          `Insufficient wallet balance. Need ${naira(finalPrice)}, have ${naira(balance)}`,
        reason:           'insufficient_balance',
        required_kobo:    finalPrice,
        balance_kobo:     balance,
        shortfall_kobo:   finalPrice - balance,
      })
    }

    // 5. Deduct balance (atomic)
    await client.query(
      `UPDATE wallets SET balance_kobo = balance_kobo - $1, updated_at = NOW() WHERE user_id = $2`,
      [finalPrice, userId]
    )

    // 6. Record purchase
    await client.query(
      `INSERT INTO video_purchases (user_id, video_id, amount_kobo, paid_via)
       VALUES ($1, $2, $3, 'wallet')`,
      [userId, video_id, finalPrice]
    )

    // 7. Log wallet transaction
    const discountNote = couponRow && finalPrice < video.price_kobo
      ? ` (${couponRow.discount_percent}% off)` : ''
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount_kobo, description)
       VALUES ($1, 'debit', $2, $3)`,
      [userId, finalPrice, `Video purchase: ${video.title}${discountNote}`]
    )

    // 8. Consume coupon
    if (couponRow) {
      await client.query(
        `UPDATE coupons SET used_count = used_count + 1 WHERE id=$1`, [couponRow.id]
      )
      await client.query(
        `INSERT INTO coupon_uses (coupon_id, user_id, video_id) VALUES ($1,$2,$3)
         ON CONFLICT DO NOTHING`,
        [couponRow.id, userId, video_id]
      )
    }

    await client.query('COMMIT')

    const newWallet = await query(`SELECT balance_kobo FROM wallets WHERE user_id = $1`, [userId])
    res.json({
      success:         true,
      message:         `"${video.title}" unlocked successfully!`,
      amount_kobo:     finalPrice,
      original_price:  video.price_kobo,
      discount_applied: couponRow ? couponRow.discount_percent : 0,
      new_balance:     newWallet.rows[0].balance_kobo,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Wallet Purchase Video]', err)
    res.status(500).json({ success: false, message: 'Purchase failed' })
  } finally {
    client.release()
  }
})

// ─── POST /api/wallet/purchase/video/paystack ────────────────────────
// Initialize Paystack payment to buy a single video
router.post('/purchase/video/paystack', requireStudent, async (req: AuthRequest, res: Response) => {
  const userId    = req.userId!
  const { video_id, coupon_id } = req.body

  if (!ensurePaystackConfig()) {
    return res.status(500).json({ success: false, message: 'Paystack is not configured on the server' })
  }

  if (!video_id) return res.status(400).json({ success: false, message: 'video_id required' })

  try {
    // Get video
    const videoRes = await query(
      `SELECT id, title, price_kobo, is_free, status FROM video_posts WHERE id = $1`,
      [video_id]
    )
    if (!videoRes.rows.length || videoRes.rows[0].status !== 'published') {
      return res.status(404).json({ success: false, message: 'Video not found' })
    }
    const video = videoRes.rows[0]
    if (video.is_free) return res.status(400).json({ success: false, message: 'Video is free' })

    // Check not already purchased
    const already = await query(
      `SELECT id FROM video_purchases WHERE user_id = $1 AND video_id = $2`,
      [userId, video_id]
    )
    if (already.rows.length > 0) {
      return res.json({ success: true, message: 'Already purchased', alreadyOwned: true })
    }

    // Check subscription
    const userRes = await query(
      `SELECT email, full_name, is_active, expires_at FROM content_users WHERE id = $1`,
      [userId]
    )
    const user = userRes.rows[0]
    if (!user.is_active || !user.expires_at || new Date(user.expires_at) <= new Date()) {
      return res.status(403).json({ success: false, message: 'Active subscription required', reason: 'no_subscription' })
    }

    // Apply coupon discount if provided
    let finalPrice    = video.price_kobo
    let discountPct   = 0
    if (coupon_id) {
      const cpRes = await query(
        `SELECT * FROM coupons WHERE id=$1 AND is_active=TRUE`, [coupon_id]
      )
      if (cpRes.rows.length) {
        const cp = cpRes.rows[0]
        const valid = (!cp.expires_at || new Date(cp.expires_at) > new Date())
                   && (cp.usage_limit === null || cp.used_count < cp.usage_limit)
        if (valid) {
          discountPct = cp.discount_percent
          finalPrice  = Math.round(video.price_kobo * (1 - discountPct / 100))
        }
      }
    }

    const reference = `VID-${video_id}-${userId}-${Date.now()}`

    const { data } = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email:    user.email,
        amount:   finalPrice,
        reference,
        currency: 'NGN',
        metadata: {
          user_id:       userId,
          video_id,
          coupon_id:     coupon_id || null,
          discount_pct:  discountPct,
          original_price: video.price_kobo,
          type:          'video_purchase',
          custom_fields: [
            { display_name: 'Video', variable_name: 'video', value: video.title },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    res.json({
      success:         true,
      reference,
      amountKobo:      finalPrice,
      originalKobo:    video.price_kobo,
      discountPercent: discountPct,
      paystackKey:     process.env.PAYSTACK_PUBLIC_KEY,
      email:           user.email,
      videoTitle:      video.title,
    })
  } catch (err) {
    console.error('[Video Paystack Init]', err)
    res.status(500).json({ success: false, message: getAxiosMessage(err, 'Failed to initialize payment') })
  }
})

// ─── POST /api/wallet/purchase/video/paystack/verify ─────────────────
// Verify Paystack payment and record video purchase
router.post('/purchase/video/paystack/verify', requireStudent, async (req: AuthRequest, res: Response) => {
  const userId    = req.userId!
  const { reference } = req.body
  if (!ensurePaystackConfig()) {
    return res.status(500).json({ success: false, message: 'Paystack is not configured on the server' })
  }
  if (!reference) return res.status(400).json({ success: false, message: 'Reference required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Idempotent check
    const dup = await client.query(
      `SELECT id FROM video_purchases WHERE payment_reference = $1`,
      [reference]
    )
    if (dup.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.json({ success: true, message: 'Already verified', alreadyProcessed: true })
    }

    // Verify with Paystack
    const { data: psData } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK}` },
        timeout: 15000,
      }
    )

    if (psData.data.status !== 'success') {
      await client.query('ROLLBACK')
      return res.status(402).json({ success: false, message: 'Payment not successful' })
    }

    const { user_id: metaUserId, video_id } = psData.data.metadata
    // Security: verify the user_id in metadata matches the authenticated user
    if (Number(metaUserId) !== userId) {
      await client.query('ROLLBACK')
      return res.status(403).json({ success: false, message: 'Token mismatch' })
    }

    const amount_kobo = psData.data.amount

    // Record purchase
    await client.query(
      `INSERT INTO video_purchases (user_id, video_id, amount_kobo, payment_reference, paid_via)
       VALUES ($1, $2, $3, $4, 'paystack')
       ON CONFLICT (user_id, video_id) DO NOTHING`,
      [userId, video_id, amount_kobo, reference]
    )

    await client.query('COMMIT')

    res.json({
      success:    true,
      message:    'Video unlocked! Enjoy the content.',
      video_id:   Number(video_id),
      amount_kobo,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Video Paystack Verify]', err)
    res.status(500).json({ success: false, message: getAxiosMessage(err, 'Verification failed') })
  } finally {
    client.release()
  }
})

export default router
