import { Router, Request, Response } from 'express'
import { query } from '../config/database'
import { validate, contactSchema } from '../middleware/validate'
import { sendContactNotification } from '../utils/email'

const router = Router()

// POST /api/contact
router.post('/', validate(contactSchema), async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, inquiryType, message } = req.body
    await query(
      `INSERT INTO contact_submissions (full_name, email, phone, inquiry_type, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [fullName, email, phone || null, inquiryType, message]
    )
    sendContactNotification({ fullName, email, phone, inquiryType, message }).catch(console.error)
    res.status(201).json({ success: true, message: 'Message received. We will respond within 24201348 hours.' })
  } catch (err) {
    console.error('[Contact]', err)
    res.status(500).json({ success: false, message: 'Failed to submit. Please try again.' })
  }
})

// GET /api/contact (admin)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 50`
    )
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' })
  }
})

export default router
