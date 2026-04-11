'use client'
import { useState } from 'react'
import { Mail, Phone, MessageCircle, Lock, ArrowRight, CheckCircle } from 'lucide-react'
import { submitContact } from '@/lib/api'
import type { InquiryType } from '@/types'

const inquiryTypes: InquiryType[] = ['Performance Coaching','Trauma Counseling','Speaking Engagement','General Inquiry']

const paths = [
  { title:'The Strategy Audit',        desc:'For those who are busy but stagnant and need a high-performance roadmap.',                                  value:'Performance Coaching' as InquiryType },
  { title:'The Healing Space',         desc:'For students seeking a safe, confidential environment to process trauma or emotional pain.',                value:'Trauma Counseling'    as InquiryType },
  { title:'The Leadership Blueprint',  desc:'For organizations or groups looking to host a SCSI workshop or speaking engagement.',                       value:'Speaking Engagement'  as InquiryType },
]

export default function ContactPage() {
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', inquiryType:'Performance Coaching' as InquiryType, message:'' })
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')

  const handle = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({...p, [e.target.name]: e.target.value}))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus('loading')
    try { await submitContact(form); setStatus('success') }
    catch { setStatus('error') }
  }

  return (
    <>
      <section className="page-top" style={{ paddingTop: "7.5rem" }}>
        <div className="wrap">
          <p className="eyebrow">Contact SCSI</p>
          <h1 className="h-serif" style={{ fontSize:'clamp(2rem,5vw,3.25rem)', fontWeight:700, marginBottom:'0.875rem' }}>
            Your Transformation <span className="grad-text">Starts Here</span>
          </h1>
          <p style={{ color:'var(--txt-2)', fontSize:'1rem', lineHeight:1.8, maxWidth:'520px' }}>
            Whether you are ready to engineer your career, refine your mindset, or begin a journey of healing — the first step is a conversation.
          </p>
        </div>
      </section>

      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap">
          {/* On desktop: side by side. On mobile: stacked (form first, channels second) */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap:'2.5rem', alignItems:'start' }}>

            {/* ── Form (always first on mobile) ── */}
            <div style={{ order:1 }}>
              {status === 'success' ? (
                <div style={{ textAlign:'center', padding:'3.5rem 2rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)' }}>
                  <CheckCircle size={48} color="var(--gold)" style={{ margin:'0 auto 1.5rem' }}/>
                  <h3 className="h-serif" style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'0.75rem' }}>Message Received</h3>
                  <p style={{ color:'var(--txt-2)', lineHeight:1.8 }}>Expect a surgical response within 24–48 hours.</p>
                </div>
              ) : (
                <form onSubmit={submit} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'2rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  <h2 className="h-serif" style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'-0.25rem' }}>The Intake Form</h2>

                  {/* Path selector */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                    <label className="fl">Choose Your Path</label>
                    {paths.map(p => (
                      <button key={p.value} type="button" onClick={() => setForm(f=>({...f,inquiryType:p.value}))}
                        style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.875rem 1rem', background: form.inquiryType===p.value ? 'var(--gold-dim)' : 'var(--bg-1)', border:`1.5px solid ${form.inquiryType===p.value ? 'rgba(201,162,75,0.5)' : 'var(--border)'}`, borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                        <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:`2px solid ${form.inquiryType===p.value ? 'var(--gold)':'var(--border)'}`, background:form.inquiryType===p.value?'var(--gold)':'transparent', flexShrink:0, marginTop:'2px', transition:'all 0.2s' }}/>
                        <div>
                          <p style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--txt-1)', marginBottom:'0.2rem' }}>{p.title}</p>
                          <p style={{ fontSize:'0.78rem', color:'var(--txt-3)', lineHeight:1.5 }}>{p.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem' }}>
                    <div className="fgroup">
                      <label className="fl">Full Name</label>
                      <input name="fullName" required value={form.fullName} onChange={handle} className="fi" placeholder="Your name"/>
                    </div>
                    <div className="fgroup">
                      <label className="fl">Email</label>
                      <input name="email" type="email" required value={form.email} onChange={handle} className="fi" placeholder="you@email.com"/>
                    </div>
                  </div>
                  <div className="fgroup">
                    <label className="fl">Phone / WhatsApp</label>
                    <input name="phone" value={form.phone} onChange={handle} className="fi" placeholder="+234 xxx xxx xxxx"/>
                  </div>
                  <div className="fgroup">
                    <label className="fl">Your Message</label>
                    <p style={{ fontSize:'0.72rem', color:'var(--txt-3)', marginBottom:'0.375rem', fontStyle:'italic' }}>
                      Briefly describe the "wall" you are currently hitting.
                    </p>
                    <textarea name="message" required value={form.message} onChange={handle} rows={4} className="fi" placeholder="Tell us what you're facing…"/>
                  </div>

                  {status === 'error' && <p style={{ color:'#e07070', fontSize:'0.85rem' }}>Something went wrong. Try WhatsApp instead.</p>}

                  <button type="submit" disabled={status==='loading'} className="btn btn-gold" style={{ justifyContent:'center', width:'100%', padding:'0.875rem', opacity:status==='loading'?.7:1 }}>
                    {status==='loading' ? 'Sending…' : <><span>Send Message</span><ArrowRight size={14}/></>}
                  </button>
                  <p style={{ textAlign:'center', fontSize:'0.72rem', color:'var(--txt-3)', fontStyle:'italic' }}>
                    Expect a response within 24–48 hours.
                  </p>
                </form>
              )}
            </div>

            {/* ── Direct channels (second on mobile, right on desktop) ── */}
            <div style={{ order:2, display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'1.75rem' }}>
                <p className="fl" style={{ marginBottom:'1.25rem' }}>Direct Channels</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {[
                    { icon:<MessageCircle size={16}/>, label:'WhatsApp', href:'https://wa.me/2349018053015', text:'+234 901 805 3015' },
                    { icon:<Mail size={16}/>,          label:'Email',    href:'mailto:preciouseze156@gmail.com', text:'preciouseze156@gmail.com' },
                    { icon:<Phone size={16}/>,         label:'Phone',    href:'tel:+2349018053015', text:'+234 901 805 3015' },
                  ].map(c => (
                    <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem', background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', textDecoration:'none', transition:'all 0.2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.background='var(--gold-dim)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-1)'}}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'var(--radius-sm)', background:'var(--gold-dim)', border:'1px solid rgba(201,162,75,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', flexShrink:0 }}>
                        {c.icon}
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--txt-3)' }}>{c.label}</p>
                        <p style={{ fontSize:'0.85rem', color:'var(--txt-1)', fontWeight:500 }}>{c.text}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Privacy note */}
              <div style={{ padding:'1.25rem', background:'rgba(201,162,75,0.05)', border:'1px solid rgba(201,162,75,0.15)', borderRadius:'var(--radius-md)', display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
                <Lock size={14} color="var(--gold)" style={{ flexShrink:0, marginTop:'2px' }}/>
                <p style={{ fontSize:'0.82rem', color:'var(--txt-2)', lineHeight:1.7, fontStyle:'italic' }}>
                  Your privacy is our highest priority. All information is encrypted and handled with professional counseling confidentiality standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
