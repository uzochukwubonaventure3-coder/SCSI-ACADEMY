import { Router, Response } from 'express'
import { pool, query } from '../config/database'
import { requireStudent, requireAdmin, AuthRequest } from '../middleware/auth'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const router  = Router()
const PAYSTACK = process.env.PAYSTACK_SECRET_KEY || ''
const naira   = (k:number) => `₦${(k/100).toLocaleString('en-NG')}`

// Plans that include all video categories for free
const PREMIUM_PLANS = ['1on1_3months', '1on1_6months']

// ── GET /api/categories  ─────────────────────────────────────────────
// Returns all video categories with prices + whether current user has purchased
router.get('/', requireStudent, async (req:AuthRequest, res:Response) => {
  const userId = req.userId!
  try {
    // Get user plan
    const userRes = await query(`SELECT plan, is_active, expires_at FROM content_users WHERE id=$1`, [userId])
    const user    = userRes.rows[0]
    const isPremium = user && PREMIUM_PLANS.includes(user.plan) && user.is_active && user.expires_at && new Date(user.expires_at) > new Date()

    // Get all categories from published videos
    const catsRes  = await query(`SELECT DISTINCT category, COUNT(*) as video_count FROM video_posts WHERE status='published' AND category IS NOT NULL GROUP BY category ORDER BY category`)

    // Get category prices
    const pricesRes = await query(`SELECT category, price_kobo, description FROM category_prices`)
    const priceMap  = Object.fromEntries(pricesRes.rows.map((r:{category:string;price_kobo:number;description:string}) => [r.category, r.price_kobo]))

    // Get user's category purchases
    const purchasedRes = await query(`SELECT category FROM category_purchases WHERE user_id=$1`, [userId])
    const purchasedCats = new Set(purchasedRes.rows.map((r:{category:string}) => r.category))

    const categories = catsRes.rows.map((r:{category:string;video_count:string}) => ({
      category:    r.category,
      video_count: parseInt(r.video_count),
      price_kobo:  priceMap[r.category] ?? 200000,
      purchased:   isPremium || purchasedCats.has(r.category),
      included_in_plan: isPremium,
    }))

    res.json({ success:true, data:{ categories, is_premium_plan:isPremium } })
  } catch (err) {
    console.error('[Categories]', err)
    res.status(500).json({ success:false, message:'Failed to fetch categories' })
  }
})

// ── POST /api/categories/purchase/initialize ─────────────────────────
router.post('/purchase/initialize', requireStudent, async (req:AuthRequest, res:Response) => {
  const userId   = req.userId!
  const { category } = req.body
  if (!category?.trim()) return res.status(400).json({ success:false, message:'Category required' })

  try {
    // Check user has active subscription
    const userRes = await query(`SELECT email, full_name, plan, is_active, expires_at FROM content_users WHERE id=$1`, [userId])
    const user    = userRes.rows[0]
    if (!user?.is_active || !user.expires_at || new Date(user.expires_at) <= new Date()) {
      return res.status(403).json({ success:false, message:'Active subscription required', reason:'no_subscription' })
    }
    if (PREMIUM_PLANS.includes(user.plan)) {
      return res.status(400).json({ success:false, message:'Your plan already includes all video categories.' })
    }

    // Check not already purchased
    const already = await query(`SELECT id FROM category_purchases WHERE user_id=$1 AND category=$2`, [userId, category])
    if (already.rows.length > 0) {
      return res.json({ success:true, message:'Already purchased', alreadyOwned:true })
    }

    // Get price
    const priceRes = await query(`SELECT price_kobo FROM category_prices WHERE category=$1`, [category])
    const priceKobo = priceRes.rows[0]?.price_kobo ?? 200000

    const reference = `CAT-${userId}-${category.replace(/\s/g,'-')}-${Date.now()}`
    const { data } = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email, amount: priceKobo, reference, currency: 'NGN',
        metadata: {
          user_id: userId, category, type: 'category_purchase',
          custom_fields: [
            { display_name:'Category', variable_name:'category', value:category },
            { display_name:'Videos',   variable_name:'access',   value:`All ${category} videos` },
          ],
        },
      },
      { headers:{ Authorization:`Bearer ${PAYSTACK}` } }
    )

    res.json({
      success:     true, reference,
      amountKobo:  priceKobo,
      displayPrice: naira(priceKobo),
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY,
      email:       user.email,
      category,
    })
  } catch (err) {
    console.error('[Cat Purchase Init]', err)
    res.status(500).json({ success:false, message:'Failed to initialize payment' })
  }
})

// ── POST /api/categories/purchase/verify ─────────────────────────────
router.post('/purchase/verify', requireStudent, async (req:AuthRequest, res:Response) => {
  const userId    = req.userId!
  const { reference } = req.body
  if (!reference) return res.status(400).json({ success:false, message:'Reference required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Idempotent
    const dup = await client.query(`SELECT id FROM category_purchases WHERE payment_reference=$1`, [reference])
    if (dup.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.json({ success:true, message:'Already verified', alreadyProcessed:true })
    }
    // Verify with Paystack
    const { data:ps } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers:{ Authorization:`Bearer ${PAYSTACK}` } }
    )
    if (ps.data.status !== 'success') {
      await client.query('ROLLBACK')
      return res.status(402).json({ success:false, message:'Payment not successful' })
    }
    const { user_id, category } = ps.data.metadata
    if (Number(user_id) !== userId) {
      await client.query('ROLLBACK')
      return res.status(403).json({ success:false, message:'Token mismatch' })
    }
    await client.query(
      `INSERT INTO category_purchases (user_id, category, amount_kobo, payment_reference, paid_via)
       VALUES ($1,$2,$3,$4,'paystack') ON CONFLICT (user_id, category) DO NOTHING`,
      [userId, category, ps.data.amount, reference]
    )
    await client.query('COMMIT')
    res.json({ success:true, message:`All ${category} videos unlocked!`, category })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Cat Purchase Verify]', err)
    res.status(500).json({ success:false, message:'Verification failed' })
  } finally { client.release() }
})

// ── POST /api/categories/purchase/wallet ─────────────────────────────
router.post('/purchase/wallet', requireStudent, async (req:AuthRequest, res:Response) => {
  const userId   = req.userId!
  const { category } = req.body
  if (!category?.trim()) return res.status(400).json({ success:false, message:'Category required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const userRes = await client.query(`SELECT plan, is_active, expires_at FROM content_users WHERE id=$1`, [userId])
    const user    = userRes.rows[0]
    if (!user?.is_active || !user.expires_at || new Date(user.expires_at) <= new Date()) {
      await client.query('ROLLBACK')
      return res.status(403).json({ success:false, message:'Active subscription required', reason:'no_subscription' })
    }
    if (PREMIUM_PLANS.includes(user.plan)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success:false, message:'Your plan already includes all video categories.' })
    }
    const already = await client.query(`SELECT id FROM category_purchases WHERE user_id=$1 AND category=$2`, [userId, category])
    if (already.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.json({ success:true, message:'Already purchased', alreadyOwned:true })
    }
    const priceRes  = await client.query(`SELECT price_kobo FROM category_prices WHERE category=$1`, [category])
    const priceKobo = priceRes.rows[0]?.price_kobo ?? 200000
    const walletRes = await client.query(`SELECT balance_kobo FROM wallets WHERE user_id=$1 FOR UPDATE`, [userId])
    const balance   = walletRes.rows[0]?.balance_kobo ?? 0
    if (balance < priceKobo) {
      await client.query('ROLLBACK')
      return res.status(402).json({
        success:false, message:`Insufficient balance. Need ${naira(priceKobo)}, have ${naira(balance)}`,
        reason:'insufficient_balance', required_kobo:priceKobo, balance_kobo:balance,
        shortfall_kobo: priceKobo - balance,
      })
    }
    await client.query(`UPDATE wallets SET balance_kobo=balance_kobo-$1, updated_at=NOW() WHERE user_id=$2`, [priceKobo, userId])
    await client.query(`INSERT INTO category_purchases (user_id, category, amount_kobo, paid_via) VALUES ($1,$2,$3,'wallet')`, [userId, category, priceKobo])
    await client.query(`INSERT INTO wallet_transactions (user_id, type, amount_kobo, description) VALUES ($1,'debit',$2,$3)`, [userId, priceKobo, `Category unlock: ${category} videos`])
    await client.query('COMMIT')
    const newWallet = await query(`SELECT balance_kobo FROM wallets WHERE user_id=$1`, [userId])
    res.json({ success:true, message:`All ${category} videos unlocked!`, category, new_balance:newWallet.rows[0].balance_kobo })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Cat Wallet Purchase]', err)
    res.status(500).json({ success:false, message:'Purchase failed' })
  } finally { client.release() }
})

// ── Admin: GET/PUT category prices ───────────────────────────────────
router.get('/prices', requireAdmin, async (_req, res:Response) => {
  try {
    const r = await query(`SELECT * FROM category_prices ORDER BY category`)
    res.json({ success:true, data:r.rows })
  } catch { res.status(500).json({ success:false, message:'Failed' }) }
})
router.put('/prices/:category', requireAdmin, async (req:AuthRequest, res:Response) => {
  const { price_kobo, description } = req.body
  try {
    const r = await query(
      `INSERT INTO category_prices (category, price_kobo, description) VALUES ($1,$2,$3)
       ON CONFLICT (category) DO UPDATE SET price_kobo=$2, description=$3, updated_at=NOW() RETURNING *`,
      [req.params.category, price_kobo, description||null]
    )
    res.json({ success:true, data:r.rows[0] })
  } catch { res.status(500).json({ success:false, message:'Failed' }) }
})

export default router
