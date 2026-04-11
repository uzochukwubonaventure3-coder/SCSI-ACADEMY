'use client'
import { useState } from 'react'
import { ArrowRight, CheckCircle, Star } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function TestifyPage() {
  const [form, setForm] = useState({ name:'', role:'', email:'', quote:'' })
  const [rating, setRating] = useState(5)
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')

  const handle = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(p => ({...p, [e.target.name]: e.target.value}))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus('loading')
    try {
      await axios.post(`${API}/api/testimonials`, { ...form, rating })
      setStatus('success')
    } catch { setStatus('error') }
  }

  return (
    <>
      <section className="page-top">
        <div className="wrap">
          <p className="eyebrow">Share Your Story</p>
          <h1 className="h-serif" style={{ fontSize:'clamp(2rem,4.5vw,3rem)', fontWeight:700, marginBottom:'0.875rem' }}>
            What the <span className="grad-text">Giants</span> Are Saying
          </h1>
          <p style={{ color:'var(--txt-2)', fontSize:'1rem', lineHeight:1.8, maxWidth:'520px' }}>
            Has SCSI Academy changed your trajectory? Share your story to inspire the next generation of giants.
          </p>
        </div>
      </section>

      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap-sm">
          {status === 'success' ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)' }}>
              <CheckCircle size={52} color="var(--gold)" style={{ margin:'0 auto 1.5rem' }}/>
              <h2 className="h-serif" style={{ fontSize:'1.75rem', fontWeight:700, marginBottom:'0.875rem' }}>Thank You, Giant!</h2>
              <p style={{ color:'var(--txt-2)', lineHeight:1.8, maxWidth:'400px', margin:'0 auto' }}>
                Your testimonial has been received and will be reviewed by Coach Precious. Once approved, your story will inspire others.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'2.5rem', display:'flex', flexDirection:'column', gap:'1.375rem' }}>
              <h2 className="h-serif" style={{ fontSize:'1.375rem', fontWeight:700 }}>Your Transformation Story</h2>

              {/* Rating */}
              <div>
                <label className="fl" style={{ marginBottom:'0.75rem' }}>Your Rating</label>
                <div style={{ display:'flex', gap:'0.375rem' }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setRating(n)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:'0.125rem', transition:'transform 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
                      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                      <Star size={24} fill={n<=rating ? 'var(--gold)' : 'transparent'} color={n<=rating ? 'var(--gold)' : 'var(--border)'}/>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="fgroup">
                  <label className="fl">Full Name</label>
                  <input name="name" required value={form.name} onChange={handle} className="fi" placeholder="Your name"/>
                </div>
                <div className="fgroup">
                  <label className="fl">Role / Title</label>
                  <input name="role" value={form.role} onChange={handle} className="fi" placeholder="e.g. Final Year Student"/>
                </div>
              </div>

              <div className="fgroup">
                <label className="fl">Email (not published)</label>
                <input name="email" type="email" value={form.email} onChange={handle} className="fi" placeholder="your@email.com"/>
              </div>

              <div className="fgroup">
                <label className="fl">Your Testimonial</label>
                <p style={{ fontSize:'0.72rem', color:'var(--txt-3)', marginBottom:'0.375rem', fontStyle:'italic' }}>
                  How did SCSI Academy impact your life? Be specific about the transformation.
                </p>
                <textarea name="quote" required value={form.quote} onChange={handle} rows={5} className="fi"
                  placeholder="Before SCSI, I was… After working with Coach Precious, I…"
                  style={{ resize:'vertical' }}/>
              </div>

              <div style={{ padding:'1rem', background:'var(--gold-dim)', border:'1px solid rgba(201,162,75,0.2)', borderRadius:'var(--radius-md)' }}>
                <p style={{ fontSize:'0.8rem', color:'var(--txt-2)', lineHeight:1.7 }}>
                  By submitting this form, you agree to allow SCSI Academy to publish your testimonial on the website. Your email will not be published or shared.
                </p>
              </div>

              {status === 'error' && <p style={{ color:'#e07070', fontSize:'0.875rem' }}>Submission failed. Please try again.</p>}

              <button type="submit" disabled={status==='loading'} className="btn btn-gold"
                style={{ justifyContent:'center', padding:'0.9375rem', opacity:status==='loading'?.7:1 }}>
                {status==='loading' ? 'Submitting…' : <><span>Submit My Story</span><ArrowRight size={15}/></>}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
