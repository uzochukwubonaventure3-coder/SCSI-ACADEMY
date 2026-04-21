/**
 * Auth middleware
 * - requireAuth: any valid JWT (admin or student)
 * - requireStudent: only student tokens (has userId)
 * - requireAdmin: only admin role tokens
 */
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production'

// Extend Express Request with decoded fields
export interface AuthRequest extends Request {
  userId?:  number              // set by requireAuth / requireStudent
  userEmail?: string
  userPlan?:  string
  admin?: { email: string; role?: string }
}

// ─── Decoded token shapes ─────────────────────────────────────────────
interface StudentToken {
  id:        number
  email:     string
  plan?:     string
  expiresAt?: string
  role?:     never             // students never have role:'admin'
}

interface AdminToken {
  email: string
  role:  'admin'
}

type DecodedToken = StudentToken | AdminToken

function isAdmin(t: DecodedToken): t is AdminToken {
  return (t as AdminToken).role === 'admin'
}

// ─── requireAuth ──────────────────────────────────────────────────────
// Accepts both admin and student tokens. Sets userId for students.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as DecodedToken
    if (!isAdmin(decoded)) {
      req.userId    = decoded.id
      req.userEmail = decoded.email
      req.userPlan  = decoded.plan
    }
    req.admin = { email: decoded.email, role: isAdmin(decoded) ? 'admin' : undefined }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// ─── requireStudent ───────────────────────────────────────────────────
// Rejects admin tokens. Requires a valid student JWT with an id.
export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as DecodedToken
    if (isAdmin(decoded)) {
      return res.status(403).json({ success: false, message: 'Student account required' })
    }
    if (!decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid token: missing user ID' })
    }
    req.userId    = decoded.id
    req.userEmail = decoded.email
    req.userPlan  = decoded.plan
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// ─── requireAdmin ────────────────────────────────────────────────────
// Only accepts tokens where role === 'admin'.
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as DecodedToken
    if (!isAdmin(decoded)) {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    req.admin = { email: decoded.email, role: 'admin' }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}
