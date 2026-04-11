'use client'
import { useEffect } from 'react'
import { Quote } from 'lucide-react'

const testimonials = [
  { name: "God'swill", role: 'Voice Coach & Mentee', quote: "SCSI didn't just give me advice—it gave me a map. Coach Precious identified exactly what was holding me back and built a strategy that actually worked. I went from confused to commanding." },
  { name: 'Student Voice Challenge Graduate', role: 'Public Speaking Program', quote: "The Public Speaking Mastery program was unlike anything I experienced in school. I learned the architecture of a message and now I can walk into any room and own it." },
  { name: 'SCSI Mentorship Cohort Member', role: 'Academic & Career Client', quote: "I was a final-year student with no clarity. After the Strategy Audit, I had a written plan with a 90-day execution map. My career trajectory completely changed." },
]

export default function TestimonialsSection() {
  useEffect(() => {
    const els = document.querySelectorAll('.sr')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sr-visible'); io.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="section" style={{ background: 'var(--bg-1)' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p className="eyebrow sr" style={{ justifyContent: 'center' }}>Testimonials</p>
          <h2 className="h-serif sr delay-1" style={{ fontSize: 'clamp(1.875rem,4vw,2.625rem)', fontWeight: 700 }}>
            What the <span className="grad-text">Giants</span> Are Saying
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px), 1fr))', gap: '1.125rem' }}>
          {testimonials.map(({ name, role, quote }, i) => (
            <div key={name} className={`sr delay-${i + 1} glow-gold`} style={{ padding: '2rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Quote size={28} color="var(--gold)" style={{ opacity: 0.4 }} />
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontStyle: 'italic', lineHeight: 1.8, color: 'var(--txt-1)', flex: 1 }}>
                "{quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.125rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid rgba(201,162,75,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>👤</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--txt-1)' }}>{name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
