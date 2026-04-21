import { Router, Request, Response } from 'express'
import { pool, query } from '../config/database'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { sendWelcomeEmail, sendVerificationEmail } from '../utils/email'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import axios from 'axios'
import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const router     = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback'
const PAYSTACK   = process.env.PAYSTACK_SECRET_KEY || ''

// ── Plan definitions ──────────────────────────────────────────────────
type PlanId = 'academy' | '1on1_monthly' | '1on1_3months' | '1on1_6months'

// Plans that include ALL video categories (no per-category unlock needed)
const PREMIUM_PLANS: PlanId[] = ['1on1_3months', '1on1_6months']

function getPlans(): Record<PlanId, {
  id: PlanId; label: string; amountKobo: number; durationDays: number
  description: string; badge: string | null; includesAllVideos: boolean
  savingsBadge?: string
}> {
  return {
    academy: {
      id: 'academy', label: 'SCSI Mentorship Academy',
      amountKobo:   parseInt(process.env.PRICE_ACADEMY_KOBO   || '1500000'),  // ₦15,000
      durationDays: 30,
      description:  'Group coaching, community, curriculum & certificate.',
      badge:        null, includesAllVideos: false,
    },
    '1on1_monthly': {
      id: '1on1_monthly', label: 'One-on-One Mentorship',
      amountKobo:   parseInt(process.env.PRICE_1ON1_MONTHLY_KOBO || '1500000'), // ₦15,000
      durationDays: 30,
      description:  'Private 1-on-1 coaching — personalized life audit.',
      badge:        'Deep Dive', includesAllVideos: false,
    },
    '1on1_3months': {
      id: '1on1_3months', label: 'One-on-One Coaching — 3 Months',
      amountKobo:   parseInt(process.env.PRICE_1ON1_3M_KOBO || '4000000'),  // ₦40,000
      durationDays: 90,
      description:  '3 months of 1-on-1 coaching + ALL video categories unlocked.',
      badge:        'Consistency', includesAllVideos: true,
      savingsBadge: 'Save ₦5,000',
    },
    '1on1_6months': {
      id: '1on1_6months', label: 'One-on-One Coaching — 6 Months',
      amountKobo:   parseInt(process.env.PRICE_1ON1_6M_KOBO || '6000000'),  // ₦60,000
      durationDays: 180,
      description:  '6 months total transformation + ALL video categories unlocked.',
      badge:        'Legacy Builder', includesAllVideos: true,
      savingsBadge: 'BEST VALUE — Save 33%',
    },
  }
}

function computeExpiry(planId: PlanId): string {
  const days = getPlans()[planId].durationDays
  const d    = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function issueAccessToken(user: { id:number; email:string; plan:string; expires_at:string|null }) {
  return jwt.sign(
    { id:user.id, email:user.email, plan:user.plan, expiresAt:user.expires_at },
    JWT_SECRET, { expiresIn: '30d' }
  )
}

function hasActiveAccess(user: { expires_at:string|null; is_active:boolean }) {
  return user.is_active && user.expires_at && new Date(user.expires_at) > new Date()
}

// ── GET /api/paywall/plans ────────────────────────────────────────────
router.get('/plans', (_req, res) => {
  const plans = getPlans()
  const naira = (k:number) => `₦${(k/100).toLocaleString('en-NG')}`
  res.json({
    success: true,
    data: Object.values(plans).map(p => ({
      id:              p.id,
      label:           p.label,
      price:           p.amountKobo,
      displayPrice:    naira(p.amountKobo),
      description:     p.description,
      badge:           p.badge,
      savingsBadge:    p.savingsBadge || null,
      durationDays:    p.durationDays,
      durationLabel:   p.durationDays === 30 ? '1 Month' : p.durationDays === 90 ? '3 Months' : '6 Months',
      includesAllVideos: p.includesAllVideos,
    })),
  })
})

// Schemas
const registerSchema = z.object({
  fullName: z.string().min(2).max(150),
  email:    z.string().email(),
  password: z.string().min(6),
  plan:     z.enum(['academy', '1on1_monthly', '1on1_3months', '1on1_6months']),
})
const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

// ── POST /api/paywall/register ────────────────────────────────────────
router.post('/register', async (req:Request, res:Response) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ success:false, message:'Invalid form data.', errors:result.error.flatten() })
  const { fullName, email, password, plan } = result.data
  const selectedPlan = getPlans()[plan]

  try {
    // Check existing
    const existing = await query(`SELECT id, is_active, expires_at, plan FROM content_users WHERE email=$1`, [email])
    if (existing.rows.length > 0) {
      const u = existing.rows[0]
      if (hasActiveAccess(u)) {
        return res.status(409).json({ success:false, message:'An active account already exists for this email. Please log in.', alreadyActive:true })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verifyToken  = crypto.randomBytes(32).toString('hex')

    // Upsert user
    let user
    if (existing.rows.length > 0) {
      const r = await query(
        `UPDATE content_users SET full_name=$1, password_hash=$2, plan=$3, is_active=FALSE, verify_token=$4, verify_token_expiry=NOW()+INTERVAL '24 hours', updated_at=NOW() WHERE email=$5 RETURNING *`,
        [fullName, passwordHash, plan, verifyToken, email]
      )
      user = r.rows[0]
    } else {
      const r = await query(
        `INSERT INTO content_users (full_name, email, password_hash, plan, is_active, verify_token, verify_token_expiry)
         VALUES ($1,$2,$3,$4,FALSE,$5,NOW()+INTERVAL '24 hours') RETURNING *`,
        [fullName, email, passwordHash, plan, verifyToken]
      )
      user = r.rows[0]
    }

    // Initialize Paystack
    const reference = `SUB-${user.id}-${Date.now()}`
    const { data } = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email, amount: selectedPlan.amountKobo, reference, currency: 'NGN',
        metadata: {
          user_id: user.id, plan, full_name: fullName,
          custom_fields: [
            { display_name:'Plan',     variable_name:'plan',     value:selectedPlan.label },
            { display_name:'Duration', variable_name:'duration', value:selectedPlan.durationDays+' days' },
          ],
        },
      },
      { headers:{ Authorization:`Bearer ${PAYSTACK}` } }
    )

    res.json({
      success:     true,
      reference,
      amountKobo:  selectedPlan.amountKobo,
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY,
      email,
      planLabel:   selectedPlan.label,
    })
  } catch (err:unknown) {
    console.error('[Register]', err)
    const e = err as { response?:{data?:{message?:string}};message?:string }
    res.status(500).json({ success:false, message:e.response?.data?.message || e.message || 'Registration failed' })
  }
})

// ── POST /api/paywall/verify ──────────────────────────────────────────
router.post('/verify', async (req:Request, res:Response) => {
  const { reference } = req.body
  if (!reference) return res.status(400).json({ success:false, message:'Reference required' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Idempotent
    const dup = await client.query(`SELECT id FROM payments WHERE reference=$1`, [reference])
    if (dup.rows.length > 0) {
      await client.query('ROLLBACK')
      const u = await query(`SELECT cu.* FROM content_users cu JOIN payments p ON p.user_id=cu.id WHERE p.reference=$1`, [reference])
      if (u.rows.length) {
        const token = issueAccessToken(u.rows[0])
        return res.json({ success:true, alreadyVerified:true, token, daysGranted:getPlans()[u.rows[0].plan as PlanId]?.durationDays })
      }
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
    const { user_id, plan } = ps.data.metadata
    const selectedPlan = getPlans()[plan as PlanId]
    if (!selectedPlan) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success:false, message:'Unknown plan' })
    }
    const expiresAt = computeExpiry(plan as PlanId)
    await client.query(
      `UPDATE content_users SET is_active=TRUE, plan=$1, expires_at=$2, updated_at=NOW() WHERE id=$3`,
      [plan, expiresAt, user_id]
    )
    await client.query(
      `INSERT INTO payments (user_id,email,reference,plan,amount_kobo,status,paystack_data)
       VALUES ($1,$2,$3,$4,$5,'success',$6)`,
      [user_id, ps.data.customer.email, reference, plan, ps.data.amount, JSON.stringify(ps.data)]
    )
    await client.query('COMMIT')
    const user = await query(`SELECT * FROM content_users WHERE id=$1`, [user_id])
    const token = issueAccessToken(user.rows[0])
    sendWelcomeEmail(user.rows[0].email, user.rows[0].full_name, selectedPlan.label).catch(console.error)
    res.json({ success:true, token, daysGranted:selectedPlan.durationDays, planLabel:selectedPlan.label, includesAllVideos:selectedPlan.includesAllVideos })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Verify]', err)
    res.status(500).json({ success:false, message:'Verification failed' })
  } finally { client.release() }
})

// ── POST /api/paywall/login ───────────────────────────────────────────
router.post('/login', async (req:Request, res:Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ success:false, message:'Email and password required' })
  const { email, password } = result.data
  try {
    const r = await query(`SELECT * FROM content_users WHERE email=$1`, [email])
    if (!r.rows.length) return res.status(401).json({ success:false, message:'No account found for this email. Please sign up.' })
    const user = r.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ success:false, message:'Incorrect password.' })
    if (!user.is_active) return res.status(403).json({ success:false, message:'Your account is inactive. Please complete payment.', inactive:true })
    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      return res.status(403).json({ success:false, message:'Your subscription has expired. Please renew.', expired:true, plan:user.plan })
    }
    const token = issueAccessToken(user)
    res.json({ success:true, token, user:{ id:user.id, email:user.email, fullName:user.full_name, plan:user.plan, expiresAt:user.expires_at, avatarUrl:user.avatar_url, phone:user.phone, bio:user.bio } })
  } catch (err) {
    console.error('[Login]', err)
    res.status(500).json({ success:false, message:'Login failed' })
  }
})

// ── GET /api/paywall/me ───────────────────────────────────────────────
router.get('/me', requireAuth, async (req:AuthRequest, res:Response) => {
  const userId = req.userId
  if (!userId) return res.status(403).json({ success:false, message:'Student account required' })
  try {
    const r = await query(`SELECT * FROM content_users WHERE id=$1`, [userId])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'User not found' })
    const u = r.rows[0]
    res.json({ success:true, user:{ id:u.id, email:u.email, fullName:u.full_name, plan:u.plan, expiresAt:u.expires_at, isActive:u.is_active, avatarUrl:u.avatar_url, phone:u.phone, bio:u.bio } })
  } catch { res.status(500).json({ success:false, message:'Failed' }) }
})

// ── PUT /api/paywall/profile ──────────────────────────────────────────
router.put('/profile', requireAuth, async (req:AuthRequest, res:Response) => {
  const userId = req.userId
  if (!userId) return res.status(403).json({ success:false, message:'Student account required' })
  const { fullName, bio, avatarUrl } = req.body
  try {
    const r = await query(
      `UPDATE content_users SET full_name=COALESCE($1,full_name), bio=COALESCE($2,bio), avatar_url=COALESCE($3,avatar_url), updated_at=NOW() WHERE id=$4 RETURNING *`,
      [fullName||null, bio||null, avatarUrl||null, userId]
    )
    const u = r.rows[0]
    res.json({ success:true, message:'Profile updated.', user:{ email:u.email, fullName:u.full_name, plan:u.plan, expiresAt:u.expires_at, phone:u.phone, bio:u.bio, avatarUrl:u.avatar_url } })
  } catch { res.status(500).json({ success:false, message:'Update failed' }) }
})

// ── PUT /api/paywall/password ─────────────────────────────────────────
router.put('/password', requireAuth, async (req:AuthRequest, res:Response) => {
  const userId = req.userId
  if (!userId) return res.status(403).json({ success:false, message:'Student account required' })
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success:false, message:'Current and new password (min 6 chars) required' })
  }
  try {
    const r = await query(`SELECT password_hash FROM content_users WHERE id=$1`, [userId])
    const valid = await bcrypt.compare(currentPassword, r.rows[0]?.password_hash || '')
    if (!valid) return res.status(401).json({ success:false, message:'Current password is incorrect' })
    const hash = await bcrypt.hash(newPassword, 12)
    await query(`UPDATE content_users SET password_hash=$1, updated_at=NOW() WHERE id=$2`, [hash, userId])
    res.json({ success:true, message:'Password changed successfully' })
  } catch { res.status(500).json({ success:false, message:'Failed to change password' }) }
})

// ── PUT /api/paywall/phone ────────────────────────────────────────────
router.put('/phone', requireAuth, async (req:AuthRequest, res:Response) => {
  const userId = req.userId
  if (!userId) return res.status(403).json({ success:false, message:'Student account required' })
  const { phone } = req.body
  if (!phone?.trim()) return res.status(400).json({ success:false, message:'Phone number required' })
  try {
    const r = await query(`SELECT phone_edit_count FROM content_users WHERE id=$1`, [userId])
    const count = r.rows[0]?.phone_edit_count ?? 0
    if (count >= 2) return res.status(403).json({ success:false, message:'Maximum phone edits reached' })
    await query(`UPDATE content_users SET phone=$1, phone_edit_count=phone_edit_count+1, updated_at=NOW() WHERE id=$2`, [phone, userId])
    res.json({ success:true, message:'Phone updated' })
  } catch { res.status(500).json({ success:false, message:'Failed to update phone' }) }
})

// ── POST /api/paywall/forgot-password ────────────────────────────────
router.post('/forgot-password', async (req:Request, res:Response) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ success:false, message:'Email required' })
  try {
    const r = await query(`SELECT id, full_name FROM content_users WHERE email=$1`, [email])
    if (r.rows.length) {
      const token  = crypto.randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 3600000)
      await query(`UPDATE content_users SET verify_token=$1, verify_token_expiry=$2 WHERE id=$3`, [token, expiry, r.rows[0].id])
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
      // sendPasswordResetEmail(email, r.rows[0].full_name, resetUrl).catch(console.error)
      console.log('[Reset URL]', resetUrl)
    }
    res.json({ success:true, message:'If that email exists, a reset link has been sent.' })
  } catch { res.status(500).json({ success:false, message:'Failed' }) }
})

// ── POST /api/paywall/reset-password ─────────────────────────────────
router.post('/reset-password', async (req:Request, res:Response) => {
  const { token, password } = req.body
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ success:false, message:'Token and password (6+ chars) required' })
  }
  try {
    const r = await query(`SELECT id FROM content_users WHERE verify_token=$1 AND verify_token_expiry > NOW()`, [token])
    if (!r.rows.length) return res.status(400).json({ success:false, message:'Invalid or expired token' })
    const hash = await bcrypt.hash(password, 12)
    await query(`UPDATE content_users SET password_hash=$1, verify_token=NULL, verify_token_expiry=NULL, updated_at=NOW() WHERE id=$2`, [hash, r.rows[0].id])
    res.json({ success:true, message:'Password reset successfully. You can now log in.' })
  } catch { res.status(500).json({ success:false, message:'Reset failed' }) }
})

// ── POST /api/paywall/verify-email ───────────────────────────────────
router.post('/verify-email', async (req:Request, res:Response) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ success:false, message:'Token required' })
  try {
    const r = await query(`SELECT id FROM content_users WHERE verify_token=$1 AND verify_token_expiry > NOW()`, [token])
    if (!r.rows.length) return res.status(400).json({ success:false, message:'Invalid or expired token' })
    await query(`UPDATE content_users SET email_verified=TRUE, verify_token=NULL, verify_token_expiry=NULL WHERE id=$1`, [r.rows[0].id])
    res.json({ success:true, message:'Email verified.' })
  } catch { res.status(500).json({ success:false, message:'Verification failed' }) }
})

// ── POST /api/paywall/webhook ─────────────────────────────────────────
router.post('/webhook', async (req:Request, res:Response) => {
  const secret = process.env.PAYSTACK_SECRET_KEY || ''
  const hash   = crypto.createHmac('sha512', secret).update(req.body).digest('hex')
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ success:false, message:'Invalid signature' })
  }
  try {
    const event = JSON.parse(req.body.toString())
    if (event.event === 'charge.success') {
      const { reference, metadata, amount, customer } = event.data
      const { user_id, plan } = metadata || {}
      if (user_id && plan && getPlans()[plan as PlanId]) {
        const expiresAt = computeExpiry(plan as PlanId)
        await query(`UPDATE content_users SET is_active=TRUE, plan=$1, expires_at=$2, updated_at=NOW() WHERE id=$3`, [plan, expiresAt, user_id])
        await query(
          `INSERT INTO payments (user_id,email,reference,plan,amount_kobo,status,paystack_data) VALUES ($1,$2,$3,$4,$5,'success',$6) ON CONFLICT (reference) DO NOTHING`,
          [user_id, customer.email, reference, plan, amount, JSON.stringify(event.data)]
        )
        // Log system event
        await query(`INSERT INTO system_events (type, payload) VALUES ('webhook', $1)`, [JSON.stringify({ reference, plan, user_id })]).catch(()=>{})
      }
    }
    res.json({ received:true })
  } catch (err) { console.error('[Webhook]', err); res.status(500).json({ success:false }) }
})

export { PREMIUM_PLANS, getPlans }
export default router
