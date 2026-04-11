import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/database'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback'

// ─── POST /api/auth/login ─────────────────────────────────────────────
// Unified login for both students and admins
// Returns { role: 'student' | 'admin', token, user }
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' })
  }

  // 1. Check if admin (from env or admin_users table)
  const adminEmail = process.env.ADMIN_EMAIL
  if (email === adminEmail) {
    const adminHash = process.env.ADMIN_PASSWORD_HASH
    if (!adminHash) return res.status(401).json({ success: false, message: 'Admin not configured' })
    const match = await bcrypt.compare(password, adminHash)
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password' })

    const token = jwt.sign({ email, role: 'admin', type: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      success: true,
      role: 'admin',
      token,
      user: { email, fullName: 'Coach Precious', role: 'admin' }
    })
  }

  // 2. Check student
  try {
    const userRes = await query('SELECT * FROM content_users WHERE email = $1', [email])
    if (!userRes.rows.length) {
      return res.status(401).json({ success: false, message: 'No account found with this email.' })
    }
    const user = userRes.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password.' })

    // Check if payment was made but account not activated
    if (!user.is_active) {
      // Check if they have a pending payment
      const pendingPay = await query(
        `SELECT reference, plan, amount_kobo FROM payments WHERE user_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 1`,
        [user.id]
      )
      if (pendingPay.rows.length > 0) {
        return res.status(402).json({
          success: false,
          message: 'Your payment was not completed. Please subscribe to activate your account.',
          needsPayment: true,
          email,
        })
      }
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please subscribe to access content.',
        needsPayment: true,
        email,
      })
    }

    // Check expiry
    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      const days = 0
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
        expired: true,
        email,
        plan: user.plan,
      })
    }

    const expiresAt = user.expires_at
    const daysLeft = expiresAt
      ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
      : null

    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan, role: 'student', expiresAt },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    // Update last login
    await query('UPDATE content_users SET updated_at=NOW() WHERE id=$1', [user.id])

    res.json({
      success: true,
      role: 'student',
      token,
      daysRemaining: daysLeft,
      user: {
        id:        user.id,
        email:     user.email,
        fullName:  user.full_name,
        plan:      user.plan,
        expiresAt: user.expires_at,
        phone:     user.phone,
        bio:       user.bio,
        avatarUrl: user.avatar_url,
        role:      'student',
      }
    })
  } catch (err) {
    console.error('[Auth Login]', err)
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' })
  }
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token' })
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as {
      id?: number; email: string; role: string; plan?: string; expiresAt?: string
    }
    if (decoded.role === 'admin') {
      return res.json({ success: true, user: { email: decoded.email, fullName: 'Coach Precious', role: 'admin' } })
    }
    if (!decoded.id) return res.status(401).json({ success: false, message: 'Invalid token' })
    const userRes = await query('SELECT * FROM content_users WHERE id=$1', [decoded.id])
    if (!userRes.rows.length) return res.status(401).json({ success: false, message: 'User not found' })
    const user = userRes.rows[0]

    if (!user.is_active || (user.expires_at && new Date(user.expires_at) < new Date())) {
      return res.status(403).json({ success: false, message: 'Access expired', expired: true })
    }

    res.json({
      success: true,
      user: {
        id: user.id, email: user.email, fullName: user.full_name,
        plan: user.plan, expiresAt: user.expires_at, role: 'student',
        phone: user.phone, bio: user.bio, avatarUrl: user.avatar_url,
      }
    })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
})

export default router
