'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Target, Layers, Globe, Quote } from 'lucide-react'

const values = [
  'Surgical diagnosis over generic advice',
  'Architectural strategy, not motivational fluff',
  'Global preparation, not classroom limitations',
  'Confidential, professional-grade counseling',
  'Whole-person development — mind, career, soul',
]

const pillars = [
  { icon: <Target size={20}/>, title: 'Surgical Precision', body: "We don't guess; we diagnose. We identify the specific mental blocks holding you back with the precision of a surgeon." },
  { icon: <Layers size={20}/>, title: 'Architectural Strategy', body: "We don't just talk; we build. We help you design a daily execution map that guarantees measurable progress." },
  { icon: <Globe size={20}/>,  title: 'Global Authority', body: "We don't train you for a classroom; we prepare you for the world stage. Your certification is just the beginning." },
]

export default function AboutPage() {
  useEffect(() => {
    const els = document.querySelectorAll('.sr')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sr-visible'); io.unobserve(e.target) } })
    }, { threshold: 0.1 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style>{`.sr{opacity:0;transform:translateY(24px);transition:opacity .65s ease,transform .65s ease}.sr.sr-visible{opacity:1;transform:translateY(0)}.sr.d1{transition-delay:.1s}.sr.d2{transition-delay:.2s}.sr.d3{transition-delay:.3s}.sr.d4{transition-delay:.4s}`}</style>

      {/* ── Hero ── */}
      <section className="page-top">
        <div className="wrap">
          <p className="eyebrow sr">About SCSI Academy</p>
          <h1 className="h-serif sr d1" style={{ fontSize:'clamp(2.25rem,5.5vw,3.75rem)', fontWeight:700, lineHeight:1.1, maxWidth:'760px', marginBottom:'1rem' }}>
            We Are Not a Counseling Center.{' '}
            <span className="grad-text">We Are a Refinery.</span>
          </h1>
          <p className="sr d2" style={{ color:'var(--txt-2)', fontSize:'clamp(1rem,1.5vw,1.125rem)', lineHeight:1.8, maxWidth:'560px' }}>
            A place where raw potential becomes structured authority. Where exhausted students become engineered giants.
          </p>
        </div>
      </section>

      {/* ── Founder section ── */}
      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap:'4rem', alignItems:'center' }}>

            {/* Photo card */}
            <div className="sr" style={{ position:'relative', maxWidth:'380px', margin:'0 auto' }}>
              {/* Offset frame */}
              <div style={{ position:'absolute', top:'-12px', left:'-12px', right:'12px', bottom:'12px', border:'1px solid rgba(201,162,75,0.2)', borderRadius:'20px', zIndex:0, pointerEvents:'none' }}/>
              {/* Photo */}
              <div style={{ position:'relative', zIndex:1, borderRadius:'16px', overflow:'hidden', aspectRatio:'3/4', border:'1px solid var(--border)' }}>
                <img
                  src="/coach-photo.jpg"
                  alt="Eze Tochukwu Precious — Founder, SCSI Academy"
                  style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block' }}
                  onError={e => {
                    const img = e.currentTarget
                    img.style.display = 'none'
                    const ph = img.nextElementSibling as HTMLElement
                    if (ph) ph.style.display = 'flex'
                  }}
                />
                {/* Fallback placeholder */}
                <div style={{ display:'none', position:'absolute', inset:0, background:'linear-gradient(135deg,var(--bg-3),var(--bg-4))', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'0.875rem' }}>
                  <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'var(--gold-dim)', border:'2px solid rgba(201,162,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>👤</div>
                  <p style={{ fontSize:'0.78rem', color:'var(--txt-3)' }}>Photo loading…</p>
                </div>
                {/* Name overlay */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'1.75rem 1.5rem', background:'linear-gradient(to top, rgba(8,3,5,0.97) 0%, transparent 100%)' }}>
                  <p style={{ fontFamily:'var(--font-serif)', fontSize:'1.25rem', fontWeight:700, color:'#F0E6D0', marginBottom:'0.2rem' }}>Eze Tochukwu Precious</p>
                  <p style={{ fontSize:'0.68rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)' }}>Founder & Lead Mindset Coach</p>
                </div>
              </div>
              {/* Floating badge */}
              <div style={{ position:'absolute', top:'1.25rem', right:'-1rem', zIndex:2, background:'var(--gold)', color:'#080506', padding:'0.5rem 0.875rem', borderRadius:'var(--radius-sm)', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', boxShadow:'0 4px 16px rgba(201,162,75,0.4)', whiteSpace:'nowrap' }}>
                Certified Counselor
              </div>
            </div>

            {/* Bio */}
            <div>
              <h2 className="h-serif sr" style={{ fontSize:'clamp(1.75rem,3.5vw,2.375rem)', fontWeight:700, marginBottom:'1.5rem' }}>Meet the Founder</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.125rem', marginBottom:'2rem' }}>
                {[
                  `As a professional Counselor and Mindset Coach, I have seen firsthand the "Operational Blindness" that kills great dreams. Too many brilliant students are exhausted — but not progressing. They're busy, but stagnant.`,
                  `I created SCSI Academy to be the "high-definition mirror" for your life — the external authority that helps you see the spots on your own back. My role is to move you from the treadmill of Hard Work to the open track of Surgical Results.`,
                  `Whether you are a student struggling to find your voice, or a young leader ready to scale your impact, SCSI is the laboratory where your transformation begins.`,
                ].map((text, i) => (
                  <p key={i} className={`sr d${i+1}`} style={{ fontSize:'1rem', color:'var(--txt-2)', lineHeight:1.85 }}>{text}</p>
                ))}
              </div>

              {/* Core commitments */}
              <div className="sr d3" style={{ marginBottom:'2rem' }}>
                <p className="fl" style={{ marginBottom:'1rem' }}>Core Commitments</p>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                  {values.map(v => (
                    <li key={v} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', fontSize:'0.9375rem', color:'var(--txt-1)' }}>
                      <CheckCircle size={15} color="var(--gold)" style={{ flexShrink:0, marginTop:'3px' }}/>
                      {v}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sr d4" style={{ display:'flex', gap:'0.875rem', flexWrap:'wrap' }}>
                <Link href="/services" className="btn btn-gold" style={{ textDecoration:'none' }}>Our Services <ArrowRight size={14}/></Link>
                <Link href="/contact" className="btn btn-ghost" style={{ textDecoration:'none' }}>Book a Session</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Three pillars ── */}
      <section className="section" style={{ background:'var(--bg-1)' }}>
        <div className="wrap">
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <p className="eyebrow sr" style={{ justifyContent:'center' }}>The SCSI Philosophy</p>
            <h2 className="h-serif sr d1" style={{ fontSize:'clamp(1.75rem,4vw,2.5rem)', fontWeight:700 }}>
              Engineering <span className="grad-text">Balanced Giants</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap:'1.125rem' }}>
            {pillars.map((p, i) => (
              <div key={p.title} className={`sr d${i+1}`} style={{ padding:'2rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', transition:'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'var(--gold-dim)', border:'1px solid rgba(201,162,75,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', marginBottom:'1.25rem' }}>{p.icon}</div>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.125rem', fontWeight:700, color:'var(--txt-1)', marginBottom:'0.625rem' }}>{p.title}</h3>
                <p style={{ fontSize:'0.9rem', color:'var(--txt-2)', lineHeight:1.75 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder quote ── */}
      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap-sm">
          <div className="sr" style={{ position:'relative', padding:'3rem 2.5rem', background:'linear-gradient(135deg,var(--bg-2),var(--bg-3))', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', textAlign:'center' }}>
            {/* Coach small photo */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.5rem' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(201,162,75,0.35)', flexShrink:0 }}>
                <img src="/coach-photo.jpg" alt="Coach Precious" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center' }}
                  onError={e => { e.currentTarget.style.display='none'; const p=e.currentTarget.parentElement; if(p) p.innerHTML='<span style="font-size:2rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%">👤</span>' }}/>
              </div>
            </div>
            <Quote size={32} color="var(--gold)" style={{ opacity:0.3, margin:'0 auto 1.25rem' }}/>
            <h2 className="h-serif" style={{ fontSize:'clamp(1.5rem,3vw,2.25rem)', fontWeight:700, lineHeight:1.2, marginBottom:'1.5rem' }}>
              The Architecture of <span className="grad-text">Achievement</span>
            </h2>
            <p style={{ fontSize:'1.0625rem', color:'var(--txt-2)', lineHeight:1.9, marginBottom:'1.25rem' }}>
              At SCSI, we believe being a "student" is not just a phase of life — it is a discipline of growth. Many brilliant minds are trapped in a cycle of <strong style={{ color:'var(--txt-1)' }}>"Busy Stagnation."</strong>
            </p>
            <p style={{ fontSize:'1.0625rem', color:'var(--txt-2)', lineHeight:1.9, marginBottom:'1.25rem' }}>
              They work hard, stay up late, check off lists — yet remain in the same spot. Confusing exhaustion with progress.
            </p>
            <p style={{ fontSize:'1.0625rem', color:'var(--txt-2)', lineHeight:1.9, marginBottom:'2.5rem' }}>
              <strong style={{ color:'var(--gold)' }}>SCSI was founded to break that wheel.</strong> We specialize in Mindset Engineering and Strategic Counseling for the next generation of leaders.
            </p>
            <Link href="/refinery" className="btn btn-gold" style={{ textDecoration:'none' }}>
              Enter the Refinery <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
