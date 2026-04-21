import { Router, Request, Response } from 'express'
import { query, pool } from '../config/database'
import { requireAuth, requireStudent, AuthRequest } from '../middleware/auth'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback'

function tryGetUserId(req: Request): number | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    const d = jwt.verify(header.split(' ')[1], JWT_SECRET) as { id?: number; role?: string }
    return d.role === 'admin' ? null : (d.id ?? null)
  } catch { return null }
}

// Compute the effective price (applying discount if still valid)
function effectivePrice(priceKobo: number, discountPct: number | null, discountExpiresAt: string | null): {
  effectiveKobo: number; discountActive: boolean; discountPct: number
} {
  if (!discountPct) return { effectiveKobo: priceKobo, discountActive: false, discountPct: 0 }
  if (discountExpiresAt && new Date(discountExpiresAt) < new Date()) {
    return { effectiveKobo: priceKobo, discountActive: false, discountPct: 0 }
  }
  return {
    effectiveKobo: Math.round(priceKobo * (1 - discountPct / 100)),
    discountActive: true,
    discountPct,
  }
}

// ─── GET /api/videos ──────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page     as string) || 1)
    const limit    = Math.min(50, parseInt(req.query.limit   as string) || 20)
    const offset   = (page - 1) * limit
    const category = req.query.category as string | undefined
    const sort     = (req.query.sort    as string) || 'recent'   // 'recent' | 'trending'

    const userId = tryGetUserId(req)

    // Build WHERE + ORDER BY
    const conditions: string[] = [`v.status = 'published'`]
    const params: (string | number)[] = []

    if (category) conditions.push(`v.category = $${params.push(category)}`)

    const where    = `WHERE ${conditions.join(' AND ')}`
    const orderBy  = sort === 'trending'
      ? `ORDER BY purchase_count DESC, v.created_at DESC`
      : `ORDER BY v.created_at DESC`

    // Fetch purchases for this user
    let purchasedIds: Set<number> = new Set()
    if (userId) {
      const pRes = await query(`SELECT video_id FROM video_purchases WHERE user_id = $1`, [userId])
      purchasedIds = new Set(pRes.rows.map((r: { video_id: number }) => r.video_id))
    }

    const pLimit  = params.push(limit)
    const pOffset = params.push(offset)

    const [videosRes, countRes, categoriesRes] = await Promise.all([
      query(
        `SELECT v.id, v.title, v.slug, v.description, v.thumbnail_url, v.video_url,
                v.duration, v.tags, v.status, v.created_at, v.updated_at,
                v.price_kobo, v.is_free, v.category,
                v.preview_url, v.preview_end_seconds,
                v.discount_percent, v.discount_expires_at,
                v.outcomes, v.target_audience, v.lessons,
                COUNT(pu.id) AS purchase_count
           FROM video_posts v
           LEFT JOIN video_purchases pu ON pu.video_id = v.id
           ${where}
           GROUP BY v.id
           ${orderBy}
           LIMIT $${pLimit} OFFSET $${pOffset}`,
        params
      ),
      query(
        `SELECT COUNT(*) FROM video_posts v ${where}`,
        params.slice(0, params.length - 2)   // exclude limit/offset
      ),
      query(`SELECT DISTINCT category FROM video_posts WHERE status='published' AND category IS NOT NULL ORDER BY category`),
    ])

    const videos = videosRes.rows.map((v: {
      id: number; is_free: boolean; price_kobo: number
      discount_percent: number | null; discount_expires_at: string | null
      [key: string]: unknown
    }) => {
      const ep = effectivePrice(v.price_kobo, v.discount_percent, v.discount_expires_at)
      return {
        ...v,
        purchase_count:   parseInt(String(v.purchase_count ?? 0)),
        purchased:        purchasedIds.has(v.id),
        effective_price_kobo: ep.effectiveKobo,
        discount_active:  ep.discountActive,
        active_discount_pct: ep.discountPct,
      }
    })

    res.json({
      success: true,
      data: {
        videos,
        total:      parseInt(countRes.rows[0].count),
        page,
        limit,
        categories: categoriesRes.rows.map((r: { category: string }) => r.category),
      },
    })
  } catch (err) {
    console.error('[Videos GET]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch videos' })
  }
})

// ─── GET /api/videos/trending ─────────────────────────────────────────
router.get('/trending', async (req: Request, res: Response) => {
  const userId = tryGetUserId(req)
  const limit  = Math.min(10, parseInt(req.query.limit as string) || 6)
  try {
    let purchasedIds: Set<number> = new Set()
    if (userId) {
      const pRes = await query(`SELECT video_id FROM video_purchases WHERE user_id = $1`, [userId])
      purchasedIds = new Set(pRes.rows.map((r: { video_id: number }) => r.video_id))
    }
    const result = await query(
      `SELECT v.id, v.title, v.slug, v.description, v.thumbnail_url,
              v.thumbnail_url, v.video_url,
              v.duration, v.tags, v.category, v.price_kobo, v.is_free,
              v.discount_percent, v.discount_expires_at,
              v.preview_url, v.preview_end_seconds,
              COUNT(pu.id) AS purchase_count
         FROM video_posts v
         LEFT JOIN video_purchases pu ON pu.video_id = v.id
         WHERE v.status = 'published'
         GROUP BY v.id
         HAVING COUNT(pu.id) > 0
         ORDER BY COUNT(pu.id) DESC, v.created_at DESC
         LIMIT $1`,
      [limit]
    )
    const videos = result.rows.map((v: { id:number; price_kobo:number; discount_percent:number|null; discount_expires_at:string|null; [key:string]:unknown }) => {
      const ep = effectivePrice(v.price_kobo, v.discount_percent, v.discount_expires_at)
      return { ...v, purchase_count: parseInt(String(v.purchase_count??0)), purchased: purchasedIds.has(v.id), effective_price_kobo: ep.effectiveKobo, discount_active: ep.discountActive, active_discount_pct: ep.discountPct }
    })
    res.json({ success: true, data: videos })
  } catch (err) {
    console.error('[Videos Trending]', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

// ─── GET /api/videos/recent ───────────────────────────────────────────
router.get('/recent', async (req: Request, res: Response) => {
  const userId = tryGetUserId(req)
  const limit  = Math.min(10, parseInt(req.query.limit as string) || 6)
  try {
    let purchasedIds: Set<number> = new Set()
    if (userId) {
      const pRes = await query(`SELECT video_id FROM video_purchases WHERE user_id = $1`, [userId])
      purchasedIds = new Set(pRes.rows.map((r: { video_id: number }) => r.video_id))
    }
    const result = await query(
      `SELECT v.id, v.title, v.slug, v.description, v.thumbnail_url,
              v.thumbnail_url, v.video_url,
              v.duration, v.tags, v.category, v.price_kobo, v.is_free,
              v.discount_percent, v.discount_expires_at,
              v.preview_url, v.preview_end_seconds,
              COUNT(pu.id) AS purchase_count
         FROM video_posts v
         LEFT JOIN video_purchases pu ON pu.video_id = v.id
         WHERE v.status = 'published'
         GROUP BY v.id
         ORDER BY v.created_at DESC
         LIMIT $1`,
      [limit]
    )
    const videos = result.rows.map((v: { id:number; price_kobo:number; discount_percent:number|null; discount_expires_at:string|null; [key:string]:unknown }) => {
      const ep = effectivePrice(v.price_kobo, v.discount_percent, v.discount_expires_at)
      return { ...v, purchase_count: parseInt(String(v.purchase_count??0)), purchased: purchasedIds.has(v.id), effective_price_kobo: ep.effectiveKobo, discount_active: ep.discountActive, active_discount_pct: ep.discountPct }
    })
    res.json({ success: true, data: videos })
  } catch (err) {
    console.error('[Videos Recent]', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

// ─── GET /api/videos/:id/recommendations ─────────────────────────────
router.get('/:id/recommendations', async (req: Request, res: Response) => {
  const videoId = parseInt(req.params.id)
  const userId  = tryGetUserId(req)
  const limit   = Math.min(6, parseInt(req.query.limit as string) || 4)
  try {
    // Get category of current video
    const vidRes = await query(`SELECT category FROM video_posts WHERE id=$1 AND status='published'`, [videoId])
    if (!vidRes.rows.length) return res.json({ success: true, data: [] })
    const category = vidRes.rows[0].category

    let purchasedIds: Set<number> = new Set()
    if (userId) {
      const pRes = await query(`SELECT video_id FROM video_purchases WHERE user_id = $1`, [userId])
      purchasedIds = new Set(pRes.rows.map((r: { video_id: number }) => r.video_id))
    }

    // Same category first, then fill with other published videos if needed
    const result = await query(
      `(SELECT v.id, v.title, v.slug, v.description, v.thumbnail_url,
               v.duration, v.tags, v.category, v.price_kobo, v.is_free,
               v.discount_percent, v.discount_expires_at,
               v.preview_url, v.preview_end_seconds,
               COUNT(pu.id) AS purchase_count,
               1 AS relevance
          FROM video_posts v
          LEFT JOIN video_purchases pu ON pu.video_id = v.id
          WHERE v.status='published' AND v.id != $1 AND v.category = $2
          GROUP BY v.id
          ORDER BY COUNT(pu.id) DESC, v.created_at DESC
          LIMIT $3)
       UNION ALL
       (SELECT v.id, v.title, v.slug, v.description, v.thumbnail_url,
               v.duration, v.tags, v.category, v.price_kobo, v.is_free,
               v.discount_percent, v.discount_expires_at,
               v.preview_url, v.preview_end_seconds,
               COUNT(pu.id) AS purchase_count,
               0 AS relevance
          FROM video_posts v
          LEFT JOIN video_purchases pu ON pu.video_id = v.id
          WHERE v.status='published' AND v.id != $1 AND (v.category != $2 OR v.category IS NULL)
          GROUP BY v.id
          ORDER BY COUNT(pu.id) DESC, v.created_at DESC
          LIMIT $3)
       ORDER BY relevance DESC, purchase_count DESC
       LIMIT $3`,
      [videoId, category || '', limit]
    )

    const videos = result.rows.map((v: { id:number; price_kobo:number; discount_percent:number|null; discount_expires_at:string|null; [key:string]:unknown }) => {
      const ep = effectivePrice(v.price_kobo, v.discount_percent, v.discount_expires_at)
      return { ...v, purchase_count: parseInt(String(v.purchase_count??0)), purchased: purchasedIds.has(v.id), effective_price_kobo: ep.effectiveKobo, discount_active: ep.discountActive, active_discount_pct: ep.discountPct }
    })
    res.json({ success: true, data: videos })
  } catch (err) {
    console.error('[Recommendations]', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
})

// ─── POST /api/videos/:id/intent ─────────────────────────────────────
// Record that a user viewed a video's paywall (for follow-up notifications)
router.post('/:id/intent', requireStudent, async (req: AuthRequest, res: Response) => {
  const videoId = parseInt(req.params.id)
  const userId  = req.userId!
  try {
    await query(
      `INSERT INTO video_view_intents (user_id, video_id)
       VALUES ($1, $2) ON CONFLICT (user_id, video_id) DO NOTHING`,
      [userId, videoId]
    )
    res.json({ success: true })
  } catch { res.json({ success: true }) }  // silent fail — non-critical
})

// Premium plans — these users never need to pay for individual videos or categories
const PREMIUM_PLANS = ['1on1_3months', '1on1_6months']

// ─── GET /api/videos/:id/access ──────────────────────────────────────
router.get('/:id/access', requireAuth, async (req: AuthRequest, res: Response) => {
  const videoId = parseInt(req.params.id)
  const userId  = req.userId

  if (!userId) {
    return res.status(403).json({ success: false, message: 'Student account required', canWatch: false })
  }

  try {
    const videoRes = await query(
      `SELECT id, title, slug, price_kobo, is_free, status, category,
              discount_percent, discount_expires_at
       FROM video_posts WHERE id = $1`,
      [videoId]
    )
    if (!videoRes.rows.length || videoRes.rows[0].status !== 'published') {
      return res.status(404).json({ success: false, message: 'Video not found', canWatch: false })
    }
    const video = videoRes.rows[0]
    const ep    = effectivePrice(video.price_kobo, video.discount_percent, video.discount_expires_at)

    // Check subscription
    const userRes = await query(`SELECT is_active, expires_at, plan FROM content_users WHERE id = $1`, [userId])
    if (!userRes.rows.length) return res.status(404).json({ success: false, message: 'User not found', canWatch: false })
    const user = userRes.rows[0]
    const hasActiveSub = user.is_active && user.expires_at && new Date(user.expires_at) > new Date()
    if (!hasActiveSub) {
      return res.status(403).json({ success: false, canWatch: false, reason: 'no_subscription', message: 'Active subscription required' })
    }

    const isPremiumPlan = PREMIUM_PLANS.includes(user.plan)
    const isFull = await query(
      `SELECT id, title, slug, description, video_url, thumbnail_url, duration, tags, category,
              price_kobo, is_free, created_at, outcomes, target_audience, lessons,
              discount_percent, discount_expires_at
       FROM video_posts WHERE id = $1`, [videoId])
    const fullVideo = isFull.rows[0]

    // 1. Free video — always watchable
    if (video.is_free) {
      return res.json({ success: true, canWatch: true, reason: 'free', video: fullVideo })
    }

    // 2. Premium plan — all videos included
    if (isPremiumPlan) {
      return res.json({ success: true, canWatch: true, reason: 'premium_plan', video: fullVideo })
    }

    // 3. Individual video purchased
    const vidPurchase = await query(`SELECT id FROM video_purchases WHERE user_id=$1 AND video_id=$2`, [userId, videoId])
    if (vidPurchase.rows.length > 0) {
      return res.json({ success: true, canWatch: true, reason: 'purchased', video: fullVideo })
    }

    // 4. Category purchased (unlocks all videos in that category)
    if (video.category) {
      const catPurchase = await query(`SELECT id FROM category_purchases WHERE user_id=$1 AND category=$2`, [userId, video.category])
      if (catPurchase.rows.length > 0) {
        return res.json({ success: true, canWatch: true, reason: 'category_purchased', video: fullVideo })
      }
    }

    // 5. Not purchased — return paywall data
    const pd = fullVideo
    return res.status(402).json({
      success: false, canWatch: false, reason: 'not_purchased',
      message: 'Purchase required',
      videoId,
      price_kobo:           video.price_kobo,
      effective_price_kobo: ep.effectiveKobo,
      discount_active:      ep.discountActive,
      active_discount_pct:  ep.discountPct,
      title:                video.title,
      category:             video.category,
      preview_url:          pd?.preview_url   || null,
      preview_end_seconds:  pd?.preview_end_seconds ?? 60,
      thumbnail_url:        pd?.thumbnail_url  || null,
      outcomes:             pd?.outcomes       || [],
      target_audience:      pd?.target_audience || null,
      lessons:              pd?.lessons         || [],
    })
  } catch (err) {
    console.error('[Video Access]', err)
    res.status(500).json({ success: false, message: 'Access check failed', canWatch: false })
  }
})

export default router
