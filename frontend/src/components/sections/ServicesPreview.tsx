'use client'
import Link from 'next/link'
import { ArrowRight, Brain, GraduationCap, Mic, Users, Briefcase, Heart } from 'lucide-react'

const services = [
  { id:'mindset',   icon:<Brain size={22}/>,         title:'Mindset Engineering',       sub:'Private Coaching',     desc:'Surgical audit of your life, habits, and goals. We identify Operational Blindness and build your custom success map.',     tag:'Most Intensive' },
  { id:'academic',  icon:<GraduationCap size={22}/>, title:'Academic & Career Counseling', sub:'Career Bridging',   desc:'Bridge the gap between student and professional with skills the classroom never teaches.', tag:null },
  { id:'speaking',  icon:<Mic size={22}/>,           title:'Public Speaking Mastery',    sub:'Voice & Influence',   desc:'Master the Hook, Message, and Call to Action. Move from being heard to being influential.', tag:null },
  { id:'workshops', icon:<Users size={22}/>,         title:'Leadership Workshops',       sub:'Group Sessions',      desc:'High-impact group sessions covering The Busy Trap and Architecture of Achievement.', tag:'Group' },
  { id:'branding',  icon:<Briefcase size={22}/>,     title:'Professional Branding',      sub:'Digital Authority',   desc:'Audit and rebuild your LinkedIn to reflect the authority of a leader, not the confusion of a wanderer.', tag:null },
  { id:'healing',   icon:<Heart size={22}/>,         title:'Trauma Recovery & Healing',  sub:'Safe Space Counseling', desc:'A confidential Refinery for processing traumatic experiences and rebuilding your inner strength.', tag:'Confidential' },
]

export default function ServicesPreview() {
  return (
    <section className="section" style={{ background:'var(--bg-1)' }}>
      <div className="wrap">
        {/* Header */}
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-end', justifyContent:'space-between', gap:'1.5rem', marginBottom:'3rem' }}>
          <div>
            <p className="eyebrow">Our Services</p>
            <h2 className="h-serif" style={{ fontSize:'clamp(1.875rem,4vw,2.625rem)', fontWeight:700 }}>
              Engineering the{' '}
              <span className="grad-text">Giant Within</span>
            </h2>
          </div>
          <Link href="/services" className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}>
            All Services <ArrowRight size={13}/>
          </Link>
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,320px),1fr))', gap:'1.125rem' }}>
          {services.map(s => (
            <Link key={s.id} href={`/services#${s.id}`} style={{ textDecoration:'none', display:'block' }}>
              <div className="card" style={{ padding:'1.75rem', height:'100%', display:'flex', flexDirection:'column', gap:'1rem', cursor:'pointer' }}>
                {/* Icon + badge row */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'var(--gold-dim)', border:'1px solid rgba(201,162,75,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', flexShrink:0 }}>
                    {s.icon}
                  </div>
                  {s.tag && <span className="badge">{s.tag}</span>}
                </div>
                {/* Text */}
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--txt-3)', marginBottom:'0.3rem' }}>{s.sub}</p>
                  <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.0625rem', fontWeight:700, color:'var(--txt-1)', lineHeight:1.3, marginBottom:'0.625rem' }}>{s.title}</h3>
                  <p style={{ fontSize:'0.875rem', color:'var(--txt-2)', lineHeight:1.7 }}>{s.desc}</p>
                </div>
                {/* Arrow */}
                <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', fontWeight:600, color:'var(--gold)', paddingTop:'0.75rem', borderTop:'1px solid var(--border)' }}>
                  Learn more <ArrowRight size={12}/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
