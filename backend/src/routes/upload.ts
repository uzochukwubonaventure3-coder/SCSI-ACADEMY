import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// ── Multer temp storage ─────────────────────
const upload = multer({ dest: 'uploads/' })

// ── Cloudinary config ───────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Upload route (image + video + profile pic) ─────────────
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded (use form-data key: file)',
        })
      }

      // upload to cloudinary (auto detects image/video)
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'scsi-academy',
        resource_type: 'auto',
      })

      // remove temp file
      fs.unlinkSync(req.file.path)

      return res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      })
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err)

      return res.status(500).json({
        success: false,
        message: err.message || 'Upload failed',
      })
    }
  }
)

export default router