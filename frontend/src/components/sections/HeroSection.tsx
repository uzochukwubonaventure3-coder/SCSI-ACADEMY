'use client'
import Link from 'next/link'
import { ArrowRight, ChevronDown, BookOpen, Users, Star } from 'lucide-react'

export default function HeroSection() {
  return (
    <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden', paddingTop:'80px' }}>

      {/* Background layers */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,26,26,0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 100%, rgba(201,162,75,0.06) 0%, transparent 60%)', pointerEvents:'none' }} />
      
      {/* Decorative circles */}
      <div style={{ position:'absolute', top:'8%', right:'-4%', width:'500px', height:'500px', borderRadius:'50%', border:'1px solid rgba(201,162,75,0.06)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'14%', right:'2%', width:'350px', height:'350px', borderRadius:'50%', border:'1px solid rgba(201,162,75,0.04)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-10%', left:'-8%', width:'400px', height:'400px', borderRadius:'50%', border:'1px solid rgba(124,26,26,0.12)', pointerEvents:'none' }} />

      {/* Content */}
      <div className="wrap" style={{ position:'relative', zIndex:2, padding:'4rem 1.25rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'3rem', alignItems:'center' }}>

          {/* Left: Main content */}
          <div style={{ maxWidth:'680px' }}>
            {/* Pill badge */}
            <div className="anim-up" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.35rem 0.875rem', background:'rgba(201,162,75,0.1)', border:'1px solid rgba(201,162,75,0.25)', borderRadius:'99px', marginBottom:'1.75rem' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--gold)', animation:'pulse 2s ease infinite', flexShrink:0 }} />
              <span style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)' }}>
                Student Counseling Services International
              </span>
            </div>

            {/* Headline */}
            <h1 className="h-serif anim-up d1" style={{ fontSize:'clamp(2.625rem,6vw,4.5rem)', fontWeight:700, lineHeight:1.08, marginBottom:'1.5rem' }}>
              Stop Running<br />in Circles.{' '}
              <span className="grad-text">Start Engineering</span>{' '}
              <span className="grad-text">Your Legacy.</span>
            </h1>

            {/* Subtext */}
            <p className="anim-up d2" style={{ fontSize:'clamp(1rem,1.5vw,1.125rem)', color:'var(--txt-2)', lineHeight:1.8, maxWidth:'540px', marginBottom:'2.5rem' }}>
              At SCSI Academy we specialize in{' '}
              <strong style={{ color:'var(--txt-1)' }}>Mindset Engineering</strong> and{' '}
              <strong style={{ color:'var(--txt-1)' }}>Strategic Counseling</strong> for the next generation of leaders.
              We take your raw potential and refine it into the structured authority of a{' '}
              <em style={{ color:'var(--gold)', fontStyle:'normal' }}>Balanced Giant</em>.
            </p>

            {/* CTAs */}
            <div className="anim-up d3" style={{ display:'flex', flexWrap:'wrap', gap:'0.875rem', marginBottom:'3rem' }}>
              <Link href="/refinery" className="btn btn-gold" style={{ padding:'0.875rem 2rem', fontSize:'0.875rem' }}>
                Enter the Refinery <ArrowRight size={15}/>
              </Link>
              <Link href="/services" className="btn btn-ghost" style={{ padding:'0.875rem 2rem', fontSize:'0.875rem' }}>
                Explore Services
              </Link>
            </div>

            {/* Stats strip */}
            <div className="anim-up d4" style={{ display:'flex', flexWrap:'wrap', gap:'2rem' }}>
              {[
                { icon:<Users size={14}/>, value:'500+', label:'Students Mentored' },
                { icon:<BookOpen size={14}/>, value:'6',    label:'Service Pillars'  },
                { icon:<Star size={14}/>,   value:'90%',  label:'Transformation Rate'},
              ].map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--gold-dim)', border:'1px solid rgba(201,162,75,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', flexShrink:0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.0625rem', fontWeight:700, color:'var(--txt-1)', lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--txt-3)', letterSpacing:'0.06em' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Featured card — visible on md+ */}
          <div className="anim-up d3 show-md" style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:'100%', maxWidth:'360px', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'2rem', boxShadow:'var(--shadow-lg)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <span style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', fontWeight:700, color:'var(--txt-1)' }}>Meet Your Coach</span>
                <span className="badge">Founder</span>
              </div>
              <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg,var(--bg-3),var(--bg-4))', border:'2px solid rgba(201,162,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', marginBottom:'1rem' }}>👤</div>
              <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.25rem', fontWeight:700, marginBottom:'0.25rem', color:'var(--txt-1)' }}>Eze Tochukwu Precious</h3>
              <p style={{ fontSize:'0.75rem', color:'var(--gold)', letterSpacing:'0.08em', marginBottom:'1rem' }}>Professional Counselor & Mindset Coach</p>
              <p style={{ fontSize:'0.875rem', color:'var(--txt-2)', lineHeight:1.75, marginBottom:'1.5rem' }}>
                "I created SCSI to be the high-definition mirror for your life—helping you see the spots on your own back."
              </p>
              <Link href="/about" className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', fontSize:'0.78rem' }}>
                Read Full Story <ArrowRight size={13}/>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem', animation:'float 2.5s ease infinite', opacity:0.5 }}>
        <span style={{ fontSize:'0.6rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--txt-3)' }}>Scroll</span>
        <ChevronDown size={14} color="var(--gold)"/>
      </div>
    </section>
  )
}
