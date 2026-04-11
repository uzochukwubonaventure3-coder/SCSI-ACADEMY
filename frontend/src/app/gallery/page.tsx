'use client'
import { useState, useEffect } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface GalleryImage {
  id: number; title: string; image_url: string; alt_text: string; category: string; created_at: string
}

const placeholders = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: ['Mentorship Class', 'Strategy Session', 'Workshop', 'Student Voice Challenge', 'Coaching Session', 'Leadership Summit', 'Graduation', 'Community'][i % 8],
  image_url: '',
  alt_text: '',
  category: ['Mentorship','Events','Portraits','Workshops'][i % 4],
  created_at: '',
}))

const gradients = [
  'linear-gradient(135deg, #1a0505, #5a0d0d)',
  'linear-gradient(135deg, #1A1212, #3D2626)',
  'linear-gradient(135deg, #3D2626, #2d0505)',
  'linear-gradient(135deg, #0D0A0A, #2A1C1C)',
  'linear-gradient(135deg, #2d0505, #6b0f0f)',
  'linear-gradient(135deg, #1e0a0a, #4a1a1a)',
]

export default function GalleryPage() {
  const [images, setImages]   = useState<GalleryImage[]>(placeholders)
  const [filter, setFilter]   = useState('All')
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/gallery`)
      .then(r => { if (r.data.success && r.data.data.length) setImages(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const categories = ['All', ...Array.from(new Set(images.map(i => i.category).filter(Boolean)))]
  const filtered   = filter === 'All' ? images : images.filter(i => i.category === filter)

  return (
    <>
      {/* Hero */}
      <section className="page-top">
        <div className="wrap">
          <p className="eyebrow">Gallery</p>
          <h1 className="h-serif" style={{ fontSize:'clamp(2rem,5vw,3.25rem)', fontWeight:700, marginBottom:'0.875rem' }}>
            Moments of <span className="grad-text">Transformation</span>
          </h1>
          <p style={{ color:'var(--txt-2)', fontSize:'1rem', lineHeight:1.8, maxWidth:'520px' }}>
            A visual record of SCSI Academy's impact — mentorship sessions, workshops, student milestones, and community moments.
          </p>
        </div>
      </section>

      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap">
          {/* Filter chips */}
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'2rem' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                style={{ padding:'0.4375rem 1rem', borderRadius:'99px', border:`1.5px solid ${filter===cat?'var(--gold)':'var(--border)'}`, background:filter===cat?'var(--gold-dim)':'transparent', color:filter===cat?'var(--gold)':'var(--txt-2)', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', transition:'all 0.18s' }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Masonry-style grid */}
          <div style={{ columns:'repeat(auto-fill,minmax(240px,1fr))', columnGap:'0.875rem', lineHeight:0 }}>
            {filtered.map((img, i) => (
              <div key={img.id}
                style={{ marginBottom:'0.875rem', breakInside:'avoid', borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer', border:'1px solid var(--border)', position:'relative', lineHeight:'normal', transition:'transform 0.25s, box-shadow 0.25s', display:'block' }}
                onClick={() => img.image_url && setLightbox(img)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
                {img.image_url ? (
                  <img src={img.image_url} alt={img.alt_text||img.title}
                    style={{ width:'100%', display:'block', objectFit:'cover' }} loading="lazy"/>
                ) : (
                  <div style={{ height:i%3===0?'220px':i%3===1?'180px':'250px', background:gradients[i%gradients.length], display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
                    <ImageIcon size={24} color="rgba(201,162,75,0.3)"/>
                    <p style={{ fontSize:'0.78rem', color:'rgba(201,162,75,0.5)', textAlign:'center', padding:'0 1rem' }}>{img.title}</p>
                  </div>
                )}
                {/* Category badge */}
                {img.category && (
                  <div style={{ position:'absolute', bottom:'0.625rem', left:'0.625rem', padding:'0.15rem 0.5rem', borderRadius:'99px', background:'rgba(8,5,6,0.75)', backdropFilter:'blur(4px)', fontSize:'0.62rem', fontWeight:700, color:'var(--gold)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                    {img.category}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div style={{ textAlign:'center', padding:'4rem', color:'var(--txt-3)' }}>
              <ImageIcon size={36} style={{ margin:'0 auto 1rem', opacity:0.3 }}/>
              <p>No images in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', cursor:'pointer' }}>
          <button onClick={() => setLightbox(null)}
            style={{ position:'absolute', top:'1.25rem', right:'1.25rem', width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={18}/>
          </button>
          <img src={lightbox.image_url} alt={lightbox.alt_text||lightbox.title}
            style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:'var(--radius-lg)', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}/>
          {lightbox.title && (
            <div style={{ position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)', textAlign:'center', color:'rgba(255,255,255,0.8)', fontSize:'0.875rem', background:'rgba(0,0,0,0.5)', padding:'0.5rem 1.25rem', borderRadius:'99px', backdropFilter:'blur(4px)', whiteSpace:'nowrap' }}>
              {lightbox.title}
            </div>
          )}
        </div>
      )}
    </>
  )
}
