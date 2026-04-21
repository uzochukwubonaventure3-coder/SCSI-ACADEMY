'use client'
import { useState, useEffect } from 'react'
import { Quote, Star } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Testimonial {
  id: number; name: string; role: string; quote: string; approved: boolean
}

// Static fallbacks shown while API loads
const fallbacks: Testimonial[] = [
  { id:1, name:"God'swill", role:'Voice Coach & Mentee', quote:'SCSI didn\'t just give me advice—it gave me a map. Coach Precious identified exactly what was holding me back and built a strategy that actually worked. I went from confused to commanding.', approved:true },
  { id:2, name:'Student Voice Challenge Graduate', role:'Public Speaking Program', quote:'The Public Speaking Mastery program was unlike anything I experienced in school. I learned the architecture of a message and now I can walk into any room and own it.', approved:true },
  { id:3, name:'SCSI Mentorship Cohort Member', role:'Academic & Career Client', quote:'I was a final-year student with no clarity. After the Strategy Audit, I had a written plan with a 90-day execution map. My career trajectory completely changed.', approved:true },
  { id:4, name:'Chisom O.', role:'1-on-1 Coaching Client', quote:'Three months with Coach Precious rewired how I think about discipline, consistency, and self-worth. I am unrecognizable in the best way possible.', approved:true },
  { id:5, name:'Emmanuel A.', role:'Leadership Workshop Graduate', quote:'The SCSI workshop on "The Busy Trap" broke something open in me. I stopped being productive for show and started actually building results that matter.', approved:true },
]

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbacks)

  useEffect(() => {
    axios.get(`${API}/api/testimonials?approved=true`).then(r => {
      const data = r.data?.data
      if (Array.isArray(data) && data.length >= 3) setTestimonials(data)
    }).catch(() => {})
  }, [])

  // Duplicate for seamless loop
  const doubled = [...testimonials, ...testimonials]

  return (
    <section className="section" style={{ background: 'var(--bg-1)', overflow: 'hidden', position: 'relative' }}>
      {/* Section header */}
      <div className="wrap" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <p className="eyebrow sr" style={{ justifyContent: 'center' }}>Testimonials</p>
        <h2 className="h-serif sr delay-1" style={{ fontSize: 'clamp(1.875rem,4vw,2.625rem)', fontWeight: 700 }}>
          What the <span className="grad-text">Giants</span> Are Saying
        </h2>
      </div>

      {/* Left + Right gradient masks */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '120px', background: 'linear-gradient(to right, var(--bg-1), transparent)', zIndex: 2, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '120px', background: 'linear-gradient(to left, var(--bg-1), transparent)', zIndex: 2, pointerEvents: 'none' }}/>

      {/* Scrolling track */}
      <div className="marquee-viewport" style={{ overflow: 'hidden', width: '100%' }}>
        <div className="marquee-track">
          {doubled.map((t, i) => (
            <div key={`${t.id}-${i}`} className="marquee-card">
              {/* Stars */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {Array(5).fill(0).map((_,si) => (
                  <Star key={si} size={13} fill="var(--gold)" color="var(--gold)" style={{ opacity: 0.85 }}/>
                ))}
              </div>
              {/* Quote */}
              <Quote size={22} color="var(--gold)" style={{ opacity: 0.35, marginBottom: '0.75rem' }}/>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontStyle: 'italic', lineHeight: 1.8, color: 'var(--txt-1)', flex: 1, marginBottom: '1.25rem' }}>
                "{t.quote}"
              </p>
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.125rem', marginTop: 'auto' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid rgba(201,162,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>👤</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--txt-1)' }}>{t.name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .marquee-track {
          display: flex;
          gap: 1.25rem;
          width: max-content;
          animation: marqueeScroll 40s linear infinite;
          padding: 0.5rem 0 1.5rem;
        }
        .marquee-viewport:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-card {
          width: 320px;
          flex-shrink: 0;
          padding: 1.75rem;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          cursor: default;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          will-change: transform;
        }
        .marquee-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 16px 48px rgba(0,0,0,0.22), 0 0 0 1px rgba(201,162,75,0.25);
          border-color: rgba(201,162,75,0.3);
        }
        @media(max-width:640px){
          .marquee-track { animation-duration: 30s; }
          .marquee-card  { width: 260px; padding: 1.25rem; }
        }
      `}</style>
    </section>
  )
}
