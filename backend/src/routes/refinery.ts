import { Router, Request, Response } from 'express'
import { query } from '../config/database'
import { validate, refinerySchema } from '../middleware/validate'

const router = Router()

router.post('/', validate(refinerySchema), async (req: Request, res: Response) => {
  try {
    const { fullName, levelOrProfession, primaryGoal, biggestHurdle, whatsappNumber, preferredSession } = req.body
    await query(
      `INSERT INTO refinery_registrations
         (full_name, level_or_profession, primary_goal, biggest_hurdle, whatsapp_number, preferred_session)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [fullName, levelOrProfession, primaryGoal, biggestHurdle, whatsappNumber, preferredSession]
    )
    res.status(201).json({
      success: true,
      message: 'Application received. You will be contacted via WhatsApp within 24–48 hours.',
    })
  } catch (err) {
    console.error('[Refinery]', err)
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM refinery_registrations ORDER BY created_at DESC`)
    res.json({ success: true, data: result.rows })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' })
  }
})

export default router
