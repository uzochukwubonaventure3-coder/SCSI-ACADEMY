import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// ─── Schemas ──────────────────────────────────────────────────────────
export const contactSchema = z.object({
  fullName:    z.string().min(2).max(150),
  email:       z.string().email(),
  phone:       z.string().max(30).optional(),
  inquiryType: z.enum(['Performance Coaching', 'Trauma Counseling', 'Speaking Engagement', 'General Inquiry']),
  message:     z.string().min(10).max(2000),
})

export const refinerySchema = z.object({
  fullName:           z.string().min(2).max(150),
  levelOrProfession:  z.string().min(2).max(120),
  primaryGoal:        z.string().min(5).max(1000),
  biggestHurdle:      z.string().min(5).max(1000),
  whatsappNumber:     z.string().min(7).max(30),
  preferredSession: z.preprocess(
  (val) => typeof val === 'string' ? val.trim() : val,
  z.enum(['Morning Cohort', 'Evening Cohort'])
),
  email: z.string().email(),

})

export const newsletterSchema = z.object({
  email: z.string().email(),
})

// ─── Validate middleware factory ──────────────────────────────────────
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      console.log("❌ VALIDATION FAILED BODY:", req.body)
      console.log("❌ ERRORS:", result.error.errors)

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.errors,
      })
    }

    req.body = result.data
    next()
  }
}
