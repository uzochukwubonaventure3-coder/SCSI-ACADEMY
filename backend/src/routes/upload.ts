import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()

// Cloudinary signature: params MUST exactly match what you send in the FormData
// Only include params that will be in the POST (folder + timestamp)
function sign(paramsToSign: Record<string, string | number>, secret: string): string {
  const str = Object.keys(paramsToSign).sort()
    .map(k => `${k}=${paramsToSign[k]}`)
    .join('&') + secret
  return crypto.createHash('sha1').update(str).digest('hex')
}

function getEnv() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim().toLowerCase()
  const apiKey    = (process.env.CLOUDINARY_API_KEY || '').trim()
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim()
  return { cloudName, apiKey, apiSecret }
}

// GET /api/upload/cloudinary-signature  — image upload
router.get('/cloudinary-signature', requireAuth, (req: Request, res: Response) => {
  const { cloudName, apiKey, apiSecret } = getEnv()

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({
      success: false,
      message: 'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env and restart the server.'
    })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder    = 'scsi-academy'

  // Sign ONLY the params you'll send in FormData (folder + timestamp)
  const signature = sign({ folder, timestamp }, apiSecret)

  console.log('[Upload] Image signature generated for cloud:', cloudName)
  res.json({
    success: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  })
})

// GET /api/upload/video-signature  — video upload
router.get('/video-signature', requireAuth, (req: Request, res: Response) => {
  const { cloudName, apiKey, apiSecret } = getEnv()

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ success: false, message: 'Cloudinary not configured' })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder    = 'scsi-academy/videos'

  // Sign ONLY folder + timestamp (DO NOT include resource_type in signature)
  const signature = sign({ folder, timestamp }, apiSecret)

  console.log('[Upload] Video signature generated for cloud:', cloudName)
  res.json({
    success: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
  })
})

export default router
