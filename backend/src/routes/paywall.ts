import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import axios from 'axios'
import { query } from '../config/database'
import { sendVerificationEmail, sendWelcomeEmail } from '../utils/email'
import { z } from 'zod'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''
const JWT_SECRET      = process.env.JWT_SECRET || 'fallback'

// ─── Plans — change prices anytime via .env ───────────────────────────
function getPlans() {
  return {
    monthly: {
      id:           'monthly',
      label:        'Monthly Access',
      amountKobo:   parseInt(process.env.PRICE_MONTHLY_KOBO   || '1000000'), // ₦10,000
      durationDays: 30,
      description:  'Full access to all blog posts and videos for 30 days.',
      badge:        null,
    },
    quarterly: {
      id:           'quarterly',
      label:        '3-Month Bundle',
      amountKobo:   parseInt(process.env.PRICE_QUARTERLY_KOBO || '2500000'), // ₦25,000
      durationDays: 90,
      description:  'Full access for 3 months — save ₦5,000 vs monthly.',
      badge:        'Best Value',
    },
  }
}

type PlanId = 'monthly' | 'quarterly'

const registerSchema = z.object({
  fullName: z.string().min(2).max(150),
  email:    z.string().email(),
  password: z.string().min(6),
  plan:     z.enum(['monthly', 'quarterly']),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

function computeExpiry(planId: PlanId): string {
  const days = getPlans()[planId].durationDays
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function daysRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
}

function issueAccessToken(user: { id: number; email: string; plan: string; expires_at: string | null }) {
  return jwt.sign(
    { id: user.id, email: user.email, plan: user.plan, expiresAt: user.expires_at },
    JWT_SECRET,
    { expiresIn: '92d' }
  )
}

function hasActiveAccess(user: { expires_at: string | null; is_active: boolean }) {
  if (!user.is_active) return false
  if (!user.expires_at) return false
  return new Date(user.expires_at) > new Date()
}

// ─── GET /api/paywall/plans ───────────────────────────────────────────
router.get('/plans', (_req, res) => {
  const plans = getPlans()
  const fmt = (k: number) => {
    const amount = k / 100
    return `₦${amount.toLocaleString('en-US').replace(/,/g, ',')}`
  }
  res.json({
    success: true,
    data: Object.values(plans).map(p => ({
      id:            p.id,
      label:         p.label,
      price:         p.amountKobo,
      displayPrice:  p.id === 'monthly' ? '₦10,000' : '₦25,000',
      description:   p.description,
      badge:         p.badge,
      durationDays:  p.durationDays,
      durationLabel: p.durationDays === 30 ? '30 days' : '3 months',
    })),
  })
})

// ─── POST /api/paywall/register ───────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors })
  }

  const { fullName, email, password, plan } = result.data
  const selectedPlan = getPlans()[plan as PlanId]

  try {
    const existing = await query('SELECT id, expires_at, is_active FROM content_users WHERE email = $1', [email])
    if (existing.rows.length > 0 && hasActiveAccess(existing.rows[0])) {
      const days = daysRemaining(existing.rows[0].expires_at)
      return res.status(409).json({
        success: false,
        message: `This email already has ${days} day${days !== 1 ? 's' : ''} of access remaining. Please login instead.`,
      })
    }

    const hash = await bcrypt.hash(password, 12)
    const upserted = await query(
      `INSERT INTO content_users (full_name, email, password_hash, plan, is_active)
       VALUES ($1, $2, $3, $4, FALSE)
       ON CONFLICT (email) DO UPDATE
         SET full_name=$1, password_hash=$3, plan=$4, is_active=FALSE, updated_at=NOW()
       RETURNING id, email`,
      [fullName, email, hash, plan]
    )
    const userId = upserted.rows[0].id

    const reference = `SCSI-${plan.toUpperCase().slice(0,1)}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

    await query(
      `INSERT INTO payments (user_id, email, reference, plan, amount_kobo, status)
       VALUES ($1,$2,$3,$4,$5,'pending') ON CONFLICT (reference) DO NOTHING`,
      [userId, email, reference, plan, selectedPlan.amountKobo]
    )

    await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email, amount: selectedPlan.amountKobo, reference, currency: 'NGN',
        metadata: {
          user_id: userId, full_name: fullName, plan,
          custom_fields: [
            { display_name: 'Plan',     variable_name: 'plan',     value: selectedPlan.label },
            { display_name: 'Duration', variable_name: 'duration', value: `${selectedPlan.durationDays} days` },
          ],
        },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    )

    res.status(201).json({
      success: true, reference,
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY,
      email, amountKobo: selectedPlan.amountKobo, plan,
    })
  } catch (err) {
    console.error('[Paywall Register]', err)
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' })
  }
})

// ─── POST /api/paywall/verify ─────────────────────────────────────────
router.post('/verify', async (req: Request, res: Response) => {
  const { reference } = req.body
  if (!reference) return res.status(400).json({ success: false, message: 'Reference required' })

  try {
    const { data: psData } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    )

    if (psData.data.status !== 'success') {
      return res.status(402).json({ success: false, message: 'Payment not confirmed. Please try again.' })
    }

    const paymentRes = await query('SELECT * FROM payments WHERE reference = $1', [reference])
    if (!paymentRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' })
    }

    const payment = paymentRes.rows[0]

    // Idempotent re-verify
    if (payment.status === 'success') {
      const userRes = await query('SELECT * FROM content_users WHERE id = $1', [payment.user_id])
      const user = userRes.rows[0]
      return res.json({
        success: true, accessToken: issueAccessToken(user),
        daysGranted: daysRemaining(user.expires_at),
        user: { email: user.email, fullName: user.full_name, plan: user.plan, expiresAt: user.expires_at },
      })
    }

    const expiresAt = computeExpiry(payment.plan as PlanId)

    await query(
      `UPDATE content_users SET is_active=TRUE, plan=$1, expires_at=$2, updated_at=NOW() WHERE id=$3`,
      [payment.plan, expiresAt, payment.user_id]
    )
    await query(
      `UPDATE payments SET status='success', paystack_data=$1 WHERE reference=$2`,
      [JSON.stringify(psData.data), reference]
    )

    const userRes = await query('SELECT * FROM content_users WHERE id = $1', [payment.user_id])
    const user    = userRes.rows[0]

    res.json({
      success: true,
      accessToken:  issueAccessToken(user),
      daysGranted:  daysRemaining(expiresAt),
      user: { email: user.email, fullName: user.full_name, plan: user.plan, expiresAt: user.expires_at },
    })
  } catch (err) {
    console.error('[Paywall Verify]', err)
    res.status(500).json({ success: false, message: 'Verification failed. Contact support.' })
  }
})

// ─── POST /api/paywall/login ──────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ success: false, message: 'Invalid input' })

  const { email, password } = result.data

  try {
    const userRes = await query('SELECT * FROM content_users WHERE email = $1', [email])
    if (!userRes.rows.length) {
      return res.status(401).json({ success: false, message: 'No account found with this email.' })
    }

    const user  = userRes.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password.' })

    if (!hasActiveAccess(user)) {
      return res.status(403).json({
        success: false, expired: true, email, plan: user.plan,
        message: 'Your subscription has expired. Please renew to regain access.',
      })
    }

    const days = daysRemaining(user.expires_at)
    res.json({
      success: true, accessToken: issueAccessToken(user), daysRemaining: days,
      user: { email: user.email, fullName: user.full_name, plan: user.plan, expiresAt: user.expires_at },
    })
  } catch (err) {
    console.error('[Paywall Login]', err)
    res.status(500).json({ success: false, message: 'Login failed.' })
  }
})

// ─── GET /api/paywall/me ──────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as { id: number }
    const userRes = await query('SELECT * FROM content_users WHERE id = $1', [decoded.id])
    if (!userRes.rows.length) return res.status(401).json({ success: false, message: 'User not found' })

    const user = userRes.rows[0]
    if (!hasActiveAccess(user)) {
      return res.status(403).json({ success: false, message: 'Subscription expired', expired: true, daysRemaining: 0 })
    }

    res.json({
      success: true, daysRemaining: daysRemaining(user.expires_at),
      user: { email: user.email, fullName: user.full_name, plan: user.plan, expiresAt: user.expires_at },
    })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
})

// ─── POST /api/paywall/webhook (Paystack backup) ──────────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  const sig  = req.headers['x-paystack-signature'] as string
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex')
  if (hash !== sig) return res.status(401).json({ message: 'Invalid signature' })

  const { event, data } = req.body
  if (event === 'charge.success') {
    try {
      const pr = await query('SELECT * FROM payments WHERE reference = $1', [data.reference])
      if (!pr.rows.length || pr.rows[0].status === 'success') return res.sendStatus(200)

      const payment   = pr.rows[0]
      const expiresAt = computeExpiry(payment.plan as PlanId)

      await query(`UPDATE content_users SET is_active=TRUE, expires_at=$1, updated_at=NOW() WHERE id=$2`, [expiresAt, payment.user_id])
      await query(`UPDATE payments SET status='success', paystack_data=$1 WHERE reference=$2`, [JSON.stringify(data), data.reference])
      console.log(`[Webhook] ✅ ${data.reference} | plan: ${payment.plan} | expires: ${expiresAt}`)
    } catch (err) { console.error('[Webhook]', err) }
  }

  res.sendStatus(200)
})


// ─── POST /api/paywall/forgot-password ───────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email required' })
  try {
    const userRes = await query('SELECT id, full_name FROM content_users WHERE email = $1', [email])
    // Always return success to prevent email enumeration
    if (!userRes.rows.length) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
    }
    const user = userRes.rows[0]
    // Generate a secure token
    const resetToken = require('crypto').randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    await query(
      `UPDATE content_users SET verify_token=$1, verify_token_expiry=$2 WHERE id=$3`,
      [resetToken, expiry, user.id]
    )
    // Import email util lazily to avoid circular
    const { sendPasswordResetEmail } = await import('../utils/email')
    await sendPasswordResetEmail(email, user.full_name, resetToken)
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('[Forgot Password]', err)
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
  }
})

// ─── POST /api/paywall/reset-password ────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Token and new password (6+ chars) required' })
  }
  try {
    const result = await query(
      `SELECT id FROM content_users WHERE verify_token=$1 AND verify_token_expiry > NOW()`,
      [token]
    )
    if (!result.rows.length) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' })
    }
    const hash = await bcrypt.hash(newPassword, 12)
    await query(
      `UPDATE content_users SET password_hash=$1, verify_token=NULL, verify_token_expiry=NULL, updated_at=NOW() WHERE id=$2`,
      [hash, result.rows[0].id]
    )
    res.json({ success: true, message: 'Password reset successfully! You can now login.' })
  } catch (err) {
    console.error('[Reset Password]', err)
    res.status(500).json({ success: false, message: 'Reset failed. Please try again.' })
  }
})


// ─── PUT /api/paywall/phone ───────────────────────────────────────────
// Students can edit phone max 2 times
router.put('/phone', async (req: Request, res: Response) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'No token' })
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as { id: number }
    const { phone } = req.body
    if (!phone?.trim()) return res.status(400).json({ success:false, message:'Phone number required' })

    const userRes = await query('SELECT phone_edit_count, phone FROM content_users WHERE id=$1', [decoded.id])
    if (!userRes.rows.length) return res.status(404).json({ success:false, message:'User not found' })

    const { phone_edit_count } = userRes.rows[0]
    if (phone_edit_count >= 2) {
      return res.status(403).json({
        success:false,
        message:'Phone number can only be updated twice. Contact support to make further changes.'
      })
    }

    await query(
      `UPDATE content_users SET phone=$1, phone_edit_count=phone_edit_count+1, updated_at=NOW() WHERE id=$2`,
      [phone.trim(), decoded.id]
    )
    const remaining = 2 - (phone_edit_count + 1)
    res.json({
      success:true,
      message:`Phone updated. You have ${remaining} edit${remaining!==1?'s':''} remaining.`,
      editsRemaining: remaining
    })
  } catch (err) {
    console.error('[Phone Update]', err)
    res.status(500).json({ success:false, message:'Update failed' })
  }
})

export default router

// ─── PUT /api/paywall/profile ─────────────────────────────────────────
router.put('/profile', async (req: Request, res: Response) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'No token' })
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as { id: number }
    const { fullName, phone, bio, avatarUrl } = req.body
    if (!fullName?.trim()) return res.status(400).json({ success:false, message:'Name is required' })
    await query(
      `UPDATE content_users
       SET full_name=$1, phone=$2, bio=$3, avatar_url=$4, updated_at=NOW()
       WHERE id=$5`,
      [fullName.trim(), phone || null, bio || null, avatarUrl || null, decoded.id]
    )
    // Return updated user
    const userRes = await query('SELECT * FROM content_users WHERE id=$1', [decoded.id])
    const user = userRes.rows[0]
    res.json({
      success: true,
      message: 'Profile updated.',
      user: { email: user.email, fullName: user.full_name, plan: user.plan, expiresAt: user.expires_at, phone: user.phone, bio: user.bio, avatarUrl: user.avatar_url }
    })
  } catch (err) {
    console.error('[Profile Update]', err)
    res.status(500).json({ success:false, message:'Update failed' })
  }
})

// ─── PUT /api/paywall/password ────────────────────────────────────────
router.put('/password', async (req: Request, res: Response) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'No token' })
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as { id: number }
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success:false, message:'Invalid input' })
    }
    const userRes = await query('SELECT * FROM content_users WHERE id=$1', [decoded.id])
    if (!userRes.rows.length) return res.status(404).json({ success:false, message:'User not found' })
    const user = userRes.rows[0]
    const match = await bcrypt.compare(currentPassword, user.password_hash)
    if (!match) return res.status(401).json({ success:false, message:'Current password incorrect' })
    const hash = await bcrypt.hash(newPassword, 12)
    await query('UPDATE content_users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, decoded.id])
    res.json({ success:true, message:'Password changed successfully.' })
  } catch { res.status(500).json({ success:false, message:'Failed to change password' }) }
})

// ─── POST /api/paywall/verify-email ──────────────────────────────────
router.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ success: false, message: 'Token required' })
  try {
    const result = await query(
      `SELECT id FROM content_users
       WHERE verify_token = $1
         AND verify_token_expiry > NOW()
         AND email_verified = FALSE`,
      [token]
    )
    if (!result.rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' })
    }
    await query(
      `UPDATE content_users
       SET email_verified = TRUE, verify_token = NULL, verify_token_expiry = NULL, updated_at = NOW()
       WHERE id = $1`,
      [result.rows[0].id]
    )
    res.json({ success: true, message: 'Email verified successfully!' })
  } catch (err) {
    console.error('[Verify Email]', err)
    res.status(500).json({ success: false, message: 'Verification failed.' })
  }
})
