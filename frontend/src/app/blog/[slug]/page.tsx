'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import Link from 'next/link'
import PaywallGate from '@/components/PaywallGate'

async function fetchPost(slug: string) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  try {
    const res = await fetch(`${API}/api/blog/${slug}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.success ? data.data : null
  } catch { return null }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost(params.slug).then(p => { setPost(p); setLoading(false) })
  }, [params.slug])

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '72px' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(212,175,55,0.2)', borderTop: '2px solid #D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  )

  if (!post) return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', paddingTop: '72px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700 }}>Post Not Found</h1>
      <Link href="/blog" style={{ color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to Blog
      </Link>
    </section>
  )

  return (
    <PaywallGate>
      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', background: 'linear-gradient(180deg, #1A0808 0%, var(--bg-0) 100%)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--txt-3)', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2rem' }}>
            <ArrowLeft size={13} /> Back to Blog
          </Link>
          {Array.isArray(post.tags) && (post.tags as string[]).length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {(post.tags as string[]).map((tag: string) => (
                <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.25rem' }}>
            {post.title as string}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--txt-3)', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Calendar size={12} />
              {new Date(post.created_at as string).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--border)' }} />
            <span>Coach Eze Tochukwu Precious</span>
          </div>
        </div>
      </section>

      {post.cover_image && (
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.5rem' }}>
          <img src={post.cover_image as string} alt={post.title as string} style={{ width: '100%', height: '400px', objectFit: 'cover', border: '1px solid var(--border)' }} />
        </div>
      )}

      <section style={{ padding: '4rem 1.5rem 6rem', background: 'var(--bg-0)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ color: 'var(--txt-2)', fontSize: '1.0625rem', lineHeight: 1.9 }}
            dangerouslySetInnerHTML={{ __html: (post.content as string).replace(/\n/g, '<br/>') }} />
          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <ArrowLeft size={13} /> More Articles
            </Link>
          </div>
        </div>
      </section>
    </PaywallGate>
  )
}
