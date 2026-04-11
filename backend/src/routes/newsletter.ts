import { Router, Request, Response } from 'express'
import { query } from '../config/database'
import { validate, newsletterSchema } from '../middleware/validate'

const router = Router()

router.post('/', validate(newsletterSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    await query(
      `INSERT INTO newsletter_subscribers (email)
       VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET is_active = TRUE`,
      [email]
    )
    res.status(201).json({ success: true, message: 'Subscribed! Weekly Mindset Audits incoming.' })
  } catch (err) {
    console.error('[Newsletter]', err)
    res.status(500).json({ success: false, message: 'Subscription failed.' })
  }
})

export default router
