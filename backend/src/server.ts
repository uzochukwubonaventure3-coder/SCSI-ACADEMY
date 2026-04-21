/**
 * SCSI Academy — Express API server
 * Production-hardened: security headers, rate limiting, input validation,
 * proper error handling, no sensitive data in logs.
 */
import express       from 'express'
import cors          from 'cors'
import helmet        from 'helmet'
import rateLimit     from 'express-rate-limit'
import dotenv        from 'dotenv'
import { testConnection } from './config/database'

// ─── Route imports ────────────────────────────────────────────────────
import contactRoutes       from './routes/contact'
import refineryRoutes      from './routes/refinery'
import newsletterRoutes    from './routes/newsletter'
import blogRoutes          from './routes/blog'
import videoRoutes         from './routes/videos'
import testimonialsRoutes  from './routes/testimonials'
import galleryRoutes       from './routes/gallery'
import adminRoutes         from './routes/admin'
import paywallRoutes       from './routes/paywall'
import authRoutes          from './routes/auth'
import uploadRoutes        from './routes/upload'
import searchRoutes        from './routes/search'
import progressRoutes      from './routes/progress'
import sitemapRoutes       from './routes/sitemap'
import notificationRoutes  from './routes/notifications'
import walletRoutes        from './routes/wallet'
import couponRoutes        from './routes/coupons'
import categoryRoutes      from './routes/categories'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

// ─── Security headers (helmet) ────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // managed by Next.js
}))

// ─── CORS ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
]
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server, Vercel previews, and configured origins
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true)
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true,
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
}))

// ─── Raw body ONLY for Paystack webhook (must come before json parser) ─
app.use('/api/paywall/webhook', express.raw({ type: 'application/json' }))

// ─── Body parsers ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ─── Rate limiters ────────────────────────────────────────────────────
// General API: 200 req / 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

// Auth / form submission: 15 req / hour per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      15,
  message:  { success: false, message: 'Too many attempts. Please wait before trying again.' },
})

// Search: 30 req / minute per IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      30,
  message:  { success: false, message: 'Too many search requests.' },
})

// Apply general limiter to all /api routes
app.use('/api', apiLimiter)

// Stricter limits on auth and form endpoints
app.use('/api/contact',           authLimiter)
app.use('/api/refinery',          authLimiter)
app.use('/api/newsletter',        authLimiter)
app.use('/api/paywall/register',  authLimiter)
app.use('/api/paywall/login',     authLimiter)
app.use('/api/paywall/forgot-password', authLimiter)
app.use('/api/search',            searchLimiter)

// ─── Routes ───────────────────────────────────────────────────────────
app.use('/api/contact',       contactRoutes)
app.use('/api/refinery',      refineryRoutes)
app.use('/api/newsletter',    newsletterRoutes)
app.use('/api/blog',          blogRoutes)
app.use('/api/videos',        videoRoutes)
app.use('/api/testimonials',  testimonialsRoutes)
app.use('/api/gallery',       galleryRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/paywall',       paywallRoutes)
app.use('/api/auth',          authRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/search',        searchRoutes)
app.use('/api/progress',      progressRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/wallet',        walletRoutes)
app.use('/api/coupons',       couponRoutes)
app.use('/api/categories',    categoryRoutes)
app.use('/sitemap.xml',       sitemapRoutes)

// ─── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success:   true,
    message:   'SCSI Academy API is running',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
    uptime_s:  Math.floor(process.uptime()),
  })
})

// ─── System status (admin only) ───────────────────────────────────────
app.get('/api/admin/system/status', async (_req, res) => {
  const start = Date.now()
  try {
    const { query: dbQuery } = await import('./config/database')
    await dbQuery('SELECT 1')
    const dbMs = Date.now() - start

    const [lastWebhook, lastPayment, lastVideo, dbSize] = await Promise.all([
      dbQuery(`SELECT created_at, payload->>'type' AS type FROM system_events WHERE type='webhook' ORDER BY created_at DESC LIMIT 1`).catch(() => ({ rows: [] })),
      dbQuery(`SELECT created_at, plan, amount_kobo FROM payments WHERE status='success' ORDER BY created_at DESC LIMIT 1`).catch(() => ({ rows: [] })),
      dbQuery(`SELECT created_at, title FROM video_posts ORDER BY created_at DESC LIMIT 1`).catch(() => ({ rows: [] })),
      dbQuery(`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`).catch(() => ({ rows: [{ size: 'N/A' }] })),
    ])

    res.json({
      success: true,
      data: {
        api:          { status: 'ok', uptime_s: Math.floor(process.uptime()), env: process.env.NODE_ENV },
        database:     { status: 'ok', response_ms: dbMs, size: dbSize.rows[0]?.size ?? 'N/A' },
        paystack:     { configured: !!process.env.PAYSTACK_SECRET_KEY },
        cloudinary:   { configured: !!process.env.CLOUDINARY_API_KEY },
        email:        { configured: !!process.env.EMAIL_USER },
        last_webhook: lastWebhook.rows[0] ?? null,
        last_payment: lastPayment.rows[0] ?? null,
        last_video:   lastVideo.rows[0]   ?? null,
        memory_mb:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp:    new Date().toISOString(),
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      data: {
        api:      { status: 'ok' },
        database: { status: 'error', message: 'Database unreachable' },
        timestamp: new Date().toISOString(),
      },
    })
  }
})

// ─── 404 ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ─── Global error handler ─────────────────────────────────────────────
// Catches any unhandled errors — never crashes the process
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log without exposing stack trace to client
  console.error('[API Error]', err.message)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────────────
async function start() {
  try {
    await testConnection()
    app.listen(PORT, () => {
      console.log(`✅ SCSI Academy API — port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
