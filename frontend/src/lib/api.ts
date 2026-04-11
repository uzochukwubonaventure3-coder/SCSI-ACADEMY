import axios from 'axios'
import type {
  ContactFormData,
  RefineryFormData,
  NewsletterFormData,
  ApiResponse,
  BlogPost,
  VideoPost,
  Testimonial,
  GalleryImage,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ─── Contact ──────────────────────────────────────────────────────────
export async function submitContact(
  data: ContactFormData
): Promise<ApiResponse> {
  const res = await api.post('/api/contact', data)
  return res.data
}

// ─── Refinery Registration ────────────────────────────────────────────
export async function submitRefineryRegistration(
  data: RefineryFormData
): Promise<ApiResponse> {
  const res = await api.post('/api/refinery', data)
  return res.data
}

// ─── Newsletter ───────────────────────────────────────────────────────
export async function subscribeNewsletter(
  data: NewsletterFormData
): Promise<ApiResponse> {
  const res = await api.post('/api/newsletter', data)
  return res.data
}

// ─── Blog ─────────────────────────────────────────────────────────────
export async function getBlogPosts(page = 1, limit = 9): Promise<ApiResponse<{ posts: BlogPost[]; total: number }>> {
  const res = await api.get(`/api/blog?page=${page}&limit=${limit}`)
  return res.data
}

export async function getBlogPost(slug: string): Promise<ApiResponse<BlogPost>> {
  const res = await api.get(`/api/blog/${slug}`)
  return res.data
}

// ─── Videos ───────────────────────────────────────────────────────────
export async function getVideos(page = 1, limit = 9): Promise<ApiResponse<{ videos: VideoPost[]; total: number }>> {
  const res = await api.get(`/api/videos?page=${page}&limit=${limit}`)
  return res.data
}

// ─── Testimonials ─────────────────────────────────────────────────────
export async function getTestimonials(): Promise<ApiResponse<Testimonial[]>> {
  const res = await api.get('/api/testimonials')
  return res.data
}

// ─── Gallery ──────────────────────────────────────────────────────────
export async function getGalleryImages(): Promise<ApiResponse<GalleryImage[]>> {
  const res = await api.get('/api/gallery')
  return res.data
}
