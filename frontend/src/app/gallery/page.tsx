'use client'
import { useState, useEffect } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface GalleryImage {
  id: number; title: string; image_url: string; alt_text: string; category: string; created_at: string
}

export default function GalleryPage() {
  const [images,   setImages]   = useState<GalleryImage[]>([])
  const [filter,   setFilter]   = useState('All')
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/gallery`)
      .then(r => { if (r.data.success) setImages(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const categories = ['All', ...Array.from(new Set(images.map(i => i.category).filter(Boolean)))]
  const filtered   = filter === 'All' ? images : images.filter(i => i.category === filter)

  // Split images into 3 columns for true masonry
  const cols = [0, 1, 2].map(ci => filtered.filter((_, idx) => idx % 3 === ci))

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: 'clamp(88px,10vh,110px)', paddingBottom: '2.5rem', background: 'linear-gradient(175deg,var(--bg-2) 0%,var(--bg-0) 100%)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <p className="eyebrow">Gallery</p>
          <h1 className="h-serif" style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
            Moments of <span className="grad-text">Transformation</span>
          </h1>
          <p style={{ color: 'var(--txt-2)', fontSize: '1rem', lineHeight: 1.8, maxWidth: '480px' }}>
            Coaching sessions, workshops, student milestones, and community moments captured in time.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
        <div className="wrap" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '0.4375rem 1rem', borderRadius: '99px', border: `1.5px solid ${filter===cat?'var(--gold)':'var(--border)'}`, background: filter===cat?'var(--gold-dim)':'transparent', color: filter===cat?'var(--gold)':'var(--txt-3)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section style={{ background: 'var(--bg-0)', padding: '2rem 0 4rem' }}>
        <div className="wrap">
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
              {Array(9).fill(0).map((_,i) => (
                <div key={i} className="skeleton" style={{ borderRadius: '12px', height: `${160 + (i%3)*80}px` }}/>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <ImageIcon size={24} color="rgba(201,162,75,0.4)"/>
              </div>
              <h3 className="h-serif" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>No images yet</h3>
              <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                {filter === 'All' ? 'Coach Precious will add photos here soon.' : `No ${filter} photos yet.`}
              </p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              {/* Mobile: 2 columns */}
              <div className="gallery-mobile" style={{ display: 'none', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                {filtered.map(img => <GalleryCard key={img.id} img={img} onClick={() => setLightbox(img)}/>)}
              </div>
              {/* Desktop: 3-column masonry */}
              <div className="gallery-desktop" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {cols.map((col, ci) => (
                  <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {col.map(img => <GalleryCard key={img.id} img={img} onClick={() => setLightbox(img)}/>)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', cursor: 'zoom-out' }}>
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18}/>
          </button>
          <img
            src={lightbox.image_url}
            alt={lightbox.alt_text || lightbox.title}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', cursor: 'default' }}
          />
          {lightbox.title && (
            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>{lightbox.title}</p>
              {lightbox.category && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>{lightbox.category}</span>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .skeleton{background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 50%,var(--bg-2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:640px){
          .gallery-desktop{display:none!important}
          .gallery-mobile{display:grid!important}
        }
      `}</style>
    </>
  )
}

function GalleryCard({ img, onClick }: { img: GalleryImage; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div onClick={onClick}
      style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', position: 'relative', background: 'var(--bg-2)', border: '1px solid var(--border)', transition: 'transform 0.25s, box-shadow 0.25s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>
      {!loaded && <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: '12px' }}/>}
      <img
        src={img.image_url}
        alt={img.alt_text || img.title}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ width: '100%', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
      />
      {/* Hover overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,5,6,0.82) 0%, transparent 55%)', opacity: 0, transition: 'opacity 0.25s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
        <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.875rem', right: '0.875rem' }}>
          {img.title && <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.875rem', fontWeight: 700, color: 'white', marginBottom: '0.2rem', lineHeight: 1.3 }}>{img.title}</p>}
          {img.category && <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>{img.category}</p>}
        </div>
      </div>
    </div>
  )
}
