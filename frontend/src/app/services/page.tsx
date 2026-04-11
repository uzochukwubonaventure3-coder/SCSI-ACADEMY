'use client'
import Link from 'next/link'
import { Brain, GraduationCap, Mic, Users, Briefcase, Heart, ArrowRight, CheckCircle } from 'lucide-react'

const services = [
  { id:'mindset',   icon:<Brain size={26}/>,         tag:'Most Intensive', title:'One-on-One Mindset Engineering',         sub:'Private Coaching',       body:`This is our most intensive service. As your Coach, I sit with you to perform a "Surgical Audit" of your current life, habits, and goals. We identify the "Operational Blindness" slowing you down and build a custom map for your success.`,  bestFor:'Individuals ready for a total life reset and personalized accountability.', outcome:'A clear, written strategy and the discipline to execute it.' },
  { id:'academic',  icon:<GraduationCap size={26}/>, tag:null,             title:'Academic & Career Counseling',           sub:'Career Bridging',        body:`We bridge the gap between being a "Student" and becoming a "Professional." We help you understand the true value of your certification while building the soft skills—like discipline and time management—that the classroom doesn't teach.`,   bestFor:'400-level students and recent graduates preparing for the global stage.', outcome:'Clarity on your career path and a mindset built for the marketplace.' },
  { id:'speaking',  icon:<Mic size={26}/>,           tag:null,             title:'Public Speaking & Communication Mastery', sub:'Voice & Influence',     body:`Your voice is your greatest tool, but only if it is trained. We coach you on the art of the "Hook," the "Message," and the "Call to Action." We help you move from being "heard" to being "influential."`,  bestFor:'Aspiring public speakers, student leaders, and content creators.', outcome:'The ability to speak with authority and command any room or lens.' },
  { id:'workshops', icon:<Users size={26}/>,         tag:'Group Sessions',  title:'SCSI Leadership Workshops',              sub:'Organizational Training', body:`These are group sessions designed for student organizations and campus brands. We cover high-impact topics such as The Value of Certification, The Busy Trap, and The Architecture of Achievement.`, bestFor:'Universities, student groups, and youth organizations.', outcome:'A collective shift in mindset from "student" to "global giant."' },
  { id:'branding',  icon:<Briefcase size={26}/>,     tag:null,             title:'Professional Branding & Positioning',     sub:'Digital Authority',      body:`We help you audit your digital presence, specifically on LinkedIn and Facebook. We ensure that your "About" section, your headlines, and your content reflect the authority of a leader rather than the confusion of a wanderer.`, bestFor:'Students and young entrepreneurs looking to attract high-level clients or employers.', outcome:'A professional digital identity that commands respect.' },
  { id:'healing',   icon:<Heart size={26}/>,         tag:'Confidential',   title:'Trauma Recovery & Emotional Healing',    sub:'Safe Space Counseling',   body:`The weight of the past can be the heaviest anchor holding a student back. At SCSI, we provide a safe, confidential "Refinery" for those who have walked through traumatic experiences. We don't just ask you to "get over it"; we walk with you through the process of deconstructing the pain and rebuilding your inner strength.`, bestFor:'Students and young leaders who feel "stuck" due to past wounds, grief, or traumatic setbacks.', outcome:'A journey toward emotional wholeness, restored confidence, and mental freedom.' },
]

export default function ServicesPage() {
  return (
    <>
      <section className="page-top" style={{ paddingTop: "7.5rem" }}>
        <div className="wrap">
          <p className="eyebrow">Our Services</p>
          <h1 className="h-serif" style={{ fontSize:'clamp(2rem,5vw,3.25rem)', fontWeight:700, marginBottom:'0.875rem' }}>
            Engineering the <span className="grad-text">Giant Within</span>
          </h1>
          <p style={{ color:'var(--txt-2)', fontSize:'1rem', lineHeight:1.8, maxWidth:'520px' }}>
            At SCSI Academy, we don't provide "advice"; we provide Architectural Solutions — precision-engineered to move you from effort to results.
          </p>
        </div>
      </section>

      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {services.map((s, i) => (
            <div key={s.id} id={s.id} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', overflow:'hidden', scrollMarginTop:'100px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap:'0' }}>
                {/* Left panel */}
                <div style={{ padding:'2rem', background: i%2===0 ? 'var(--bg-3)' : 'var(--bg-2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'1rem', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem' }}>
                      <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'var(--gold-dim)', border:'1px solid rgba(201,162,75,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)' }}>
                        {s.icon}
                      </div>
                      {s.tag && <span className="badge">{s.tag}</span>}
                    </div>
                    <p style={{ fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--txt-3)', marginBottom:'0.375rem' }}>{s.sub}</p>
                    <h2 className="h-serif" style={{ fontSize:'clamp(1.125rem,2vw,1.5rem)', fontWeight:700, lineHeight:1.25, color:'var(--txt-1)' }}>{s.title}</h2>
                  </div>
                  <Link href="/contact" className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start', textDecoration:'none' }}>
                    Book this Service <ArrowRight size={12}/>
                  </Link>
                </div>
                {/* Right panel */}
                <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  <p style={{ fontSize:'0.9375rem', color:'var(--txt-2)', lineHeight:1.85 }}>{s.body}</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
                      <CheckCircle size={15} color="var(--gold)" style={{ flexShrink:0, marginTop:'3px' }}/>
                      <div>
                        <span style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)' }}>Best for: </span>
                        <span style={{ fontSize:'0.875rem', color:'var(--txt-2)' }}>{s.bestFor}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
                      <CheckCircle size={15} color="var(--gold)" style={{ flexShrink:0, marginTop:'3px' }}/>
                      <div>
                        <span style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)' }}>Outcome: </span>
                        <span style={{ fontSize:'0.875rem', color:'var(--txt-2)' }}>{s.outcome}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'4rem 1.25rem', background:'var(--bg-1)', borderTop:'1px solid var(--border)', textAlign:'center' }}>
        <div className="wrap-sm">
          <h3 className="h-serif" style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:700, marginBottom:'0.875rem' }}>Ready to Enter the Refinery?</h3>
          <p style={{ color:'var(--txt-2)', marginBottom:'2rem', lineHeight:1.8 }}>Don't just work harder—work smarter. Book your Strategy Audit today.</p>
          <div style={{ display:'flex', gap:'0.875rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/refinery" className="btn btn-gold">Book Strategy Audit <ArrowRight size={14}/></Link>
            <Link href="/contact"  className="btn btn-ghost">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  )
}
