export function extractFirstImageFromHtml(html: string): string | null {
  if (!html) return null
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

export function getBlogPostImage(post: { cover_image?: string|null; content?: string|null }): string | null {
  if (post.cover_image) return post.cover_image
  if (post.content) return extractFirstImageFromHtml(post.content)
  return null
}

export function getVideoThumbnail(videoUrl: string | null | undefined, existingThumb?: string | null): string | null {
  if (existingThumb) return existingThumb
  if (!videoUrl) return null
  // YouTube
  const yt = videoUrl.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`
  // Cloudinary video
  if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/upload/')) {
    return videoUrl
      .replace('/video/upload/', '/video/upload/so_1,w_600,h_338,c_fill,q_70,f_jpg/')
      .replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.jpg')
  }
  return null
}
