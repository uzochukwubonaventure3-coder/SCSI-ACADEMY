'use client'
import { useEffect } from 'react'
import { Target, Layers, Globe } from 'lucide-react'

const pillars = [
  { icon: <Target size={20}/>, title: 'Surgical Precision', body: "We don't guess; we diagnose. We identify the specific mental blocks holding you back with the precision of a surgeon." },
  { icon: <Layers size={20}/>, title: 'Architectural Strategy', body: "We don't just talk; we build. We help you design a daily execution map that guarantees measurable progress." },
  { icon: <Globe size={20}/>,  title: 'Global Authority', body: "We don't train you for a classroom; we prepare you for the world stage. Your certification is just the beginning." },
]

export default function PhilosophySection() {
  useEffect(() => {
    const els = document.querySelectorAll('.sr')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sr-visible'); io.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="section hero-grid" style={{ background: 'var(--bg-0)' }}>
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,440px), 1fr))', gap: '4rem', alignItems: 'center' }}>

          {/* Left */}
          <div>
            <p className="eyebrow sr">The SCSI Philosophy</p>
            <h2 className="h-serif sr delay-1" style={{ fontSize: 'clamp(1.875rem,4vw,2.625rem)', fontWeight: 700, marginBottom: '1.25rem' }}>
              Engineering <span className="grad-text">Balanced Giants</span>
            </h2>
            <p className="sr delay-2" style={{ color: 'var(--txt-2)', fontSize: '1rem', lineHeight: 1.85, marginBottom: '1.75rem' }}>
              Many brilliant minds are trapped in <strong style={{ color: 'var(--txt-1)' }}>Busy Stagnation</strong> — working hard, staying up late, yet remaining in the same spot. They're confusing exhaustion with progress. SCSI was built to break that wheel.
            </p>

            {/* Quote box */}
            <div className="sr delay-3 grad-border" style={{ padding: '1.75rem', background: 'var(--bg-2)', borderRadius: 'var(--radius-xl)' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontStyle: 'italic', lineHeight: 1.8, color: 'var(--txt-1)', marginBottom: '1.25rem' }}>
                "We are not a typical counseling center; we are a <span style={{ color: 'var(--gold)', fontStyle: 'normal', fontWeight: 700 }}>Refinery</span>. We take raw potential and refine it into the structured authority of a Balanced Giant."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid rgba(201,162,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>👤</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Eze Tochukwu Precious</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.08em' }}>Founder, SCSI Academy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pillars.map((p, i) => (
              <div key={p.title} className={`sr delay-${i + 1}`} style={{ display: 'flex', gap: '1.125rem', padding: '1.5rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', transition: 'all 0.25s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--gold-dim)', border: '1px solid rgba(201,162,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                  {p.icon}
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '0.375rem' }}>{p.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--txt-2)', lineHeight: 1.7 }}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
