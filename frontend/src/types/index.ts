// ─── API Response Types ───────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// ─── Contact Form ─────────────────────────────────────────────────────
export type InquiryType =
  | 'Performance Coaching'
  | 'Trauma Counseling'
  | 'Speaking Engagement'
  | 'General Inquiry'

export interface ContactFormData {
  fullName: string
  email: string
  phone: string
  inquiryType: InquiryType
  message: string
}

// ─── Mentorship Registration ──────────────────────────────────────────
export type SessionTime = 'Morning Cohort' | 'Evening Cohort'

export interface RefineryFormData {
  fullName: string
  levelOrProfession: string
  primaryGoal: string
  biggestHurdle: string
  whatsappNumber: string
  preferredSession: SessionTime
}

// ─── Newsletter ───────────────────────────────────────────────────────
export interface NewsletterFormData {
  email: string
}

// ─── Blog Post ────────────────────────────────────────────────────────
export type PostStatus = 'draft' | 'published'

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  tags: string[]
  status: PostStatus
  createdAt: string
  updatedAt: string
}

// ─── Video Post ───────────────────────────────────────────────────────
export interface VideoPost {
  id: number
  title: string
  slug: string
  description: string
  videoUrl: string        // YouTube / Vimeo embed URL
  thumbnailUrl?: string
  duration?: string
  tags: string[]
  status: PostStatus
  createdAt: string
  updatedAt: string
}

// ─── Service ──────────────────────────────────────────────────────────
export interface Service {
  id: number
  title: string
  icon: string
  shortDesc: string
  fullDesc: string
  bestFor: string
  outcome: string
  slug: string
}

// ─── Testimonial ─────────────────────────────────────────────────────
export interface Testimonial {
  id: number
  name: string
  role: string
  quote: string
  avatarUrl?: string
  approved: boolean
  createdAt: string
}

// ─── Gallery Image ────────────────────────────────────────────────────
export interface GalleryImage {
  id: number
  title?: string
  imageUrl: string
  altText: string
  category?: string
  createdAt: string
}

// ─── Theme ────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light'

// ─── Paywall / Access ─────────────────────────────────────────────────
export type PlanType = 'monthly' | 'quarterly'

export interface AccessPlan {
  id: PlanType
  label: string
  price: number          // in kobo (Paystack uses kobo)
  displayPrice: string   // e.g. "₦5,000"
  description: string
  badge?: string
}

export interface ContentUser {
  id: number
  email: string
  fullName: string
  plan: PlanType
  expiresAt: string | null   // null only before first payment
  accessToken: string
}

export interface PaymentVerification {
  reference: string
  plan: PlanType
  email: string
  fullName: string
}
