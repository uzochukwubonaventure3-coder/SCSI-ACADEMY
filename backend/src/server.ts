import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { testConnection } from './config/database'
import contactRoutes      from './routes/contact'
import refineryRoutes     from './routes/refinery'
import newsletterRoutes   from './routes/newsletter'
import blogRoutes         from './routes/blog'
import videoRoutes        from './routes/videos'
import testimonialsRoutes from './routes/testimonials'
import galleryRoutes      from './routes/gallery'
import adminRoutes        from './routes/admin'
import paywallRoutes      from './routes/paywall'
import authRoutes         from './routes/auth'
import uploadRoutes       from './routes/upload'
import searchRoutes       from './routes/search'
import progressRoutes     from './routes/progress'
import sitemapRoutes        from './routes/sitemap'
import notificationRoutes   from './routes/notifications'

dotenv.config()
console.log("CLOUD NAME 👉", process.env.CLOUDINARY_CLOUD_NAME)

const app  = express()
const PORT = process.env.PORT || 5000

// ─── Security ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // handled by Next.js
}))

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ]
    // Allow Vercel preview URLs
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ─── Raw body for Paystack webhook ───────────────────────────────────
app.use('/api/paywall/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Rate limiting ────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many submissions. Please wait before trying again.' },
})

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many search requests.' },
})

app.use('/api', apiLimiter)
app.use('/api/contact',   formLimiter)
app.use('/api/refinery',  formLimiter)
app.use('/api/newsletter',formLimiter)
app.use('/api/paywall/register', formLimiter)
app.use('/api/search',    searchLimiter)

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
app.use('/sitemap.xml',       sitemapRoutes)
app.use('/api/notifications', notificationRoutes)

// ─── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({
    success:   true,
    message:   'SCSI Academy API is running',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  })
})

// ─── 404 ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }))

// ─── Error handler ────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SCSI API Error]', err.message)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────────────
async function start() {
  await testConnection()
  app.listen(PORT, () => {
    console.log(`\n✅ SCSI Academy API v2.0.0`)
    console.log(`   http://localhost:${PORT}/api/health\n`)
  })
}

start()
