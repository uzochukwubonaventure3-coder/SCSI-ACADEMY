'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, GraduationCap, Shield } from 'lucide-react'
import { useAccess } from '@/hooks/useAccess'

export default function LoginPage() {
  const router  = useRouter()
  const params  = useSearchParams()
  const next    = params.get('next') || '/content'
  const { login, hasAccess, isAdmin, loading } = useAccess()

  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPw, setShowPw]     = useState(false)
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const [needsPayment, setNeedsPayment] = useState(false)
  const [expiredEmail, setExpiredEmail] = useState('')

  useEffect(() => {
    if (!loading && hasAccess) {
      router.replace(isAdmin ? '/admin' : next)
    }
  }, [hasAccess, isAdmin, loading, next, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setNeedsPayment(false)

    const res = await login(form.email, form.password)
    if (res.success) {
      router.replace(res.role === 'admin' ? '/admin' : next)
    } else {
      setError(res.message)
      if (res.needsPayment) { setNeedsPayment(true); setExpiredEmail(form.email) }
    }
    setBusy(false)
  }

  if (loading || hasAccess) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-0)' }}>
        <div style={{ width:'32px', height:'32px', border:'2px solid var(--bg-3)', borderTop:'2px solid var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg-0)', overflow:'hidden' }}>

      {/* ── Left decorative panel ── */}
      <div className="show-md" style={{ flex:'0 0 46%', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'3rem' }}>
        {/* Background */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #080305 0%, #1A0608 35%, #2A0D0D 65%, #1A0608 100%)' }}/>
        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(201,162,75,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,75,0.05) 1px, transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }}/>
        {/* Glow orbs */}
        <div style={{ position:'absolute', top:'-15%', right:'-10%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,162,75,0.1) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-10%', left:'-10%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(124,26,26,0.25) 0%, transparent 65%)', pointerEvents:'none' }}/>

        {/* Logo */}
        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(201,162,75,0.12)', border:'1px solid rgba(201,162,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <GraduationCap size={20} color="var(--gold)"/>
          </div>
          <div>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:'1.125rem', fontWeight:700, color:'var(--gold)', display:'block', lineHeight:1 }}>SCSI Academy</span>
            <span style={{ fontSize:'0.55rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(201,162,75,0.5)' }}>Student Counseling Services International</span>
          </div>
        </div>

        {/* Coach photo + headline */}
        <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'2rem 0' }}>
          <div style={{ position:'relative', marginBottom:'2rem' }}>
            {/* Photo frame */}
            <div style={{ position:'absolute', top:'-8px', left:'-8px', right:'8px', bottom:'8px', border:'1px solid rgba(201,162,75,0.2)', borderRadius:'20px' }}/>
            <div style={{ borderRadius:'16px', overflow:'hidden', aspectRatio:'4/5', maxWidth:'280px', border:'1px solid rgba(201,162,75,0.15)', position:'relative' }}>
              <img src="/coach-photo.jpg" alt="Eze Tochukwu Precious" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }}/>
              {/* Name overlay */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'1.5rem', background:'linear-gradient(to top, rgba(8,3,5,0.96) 0%, transparent 100%)' }}>
                <p style={{ fontFamily:'var(--font-serif)', fontSize:'1.0625rem', fontWeight:700, color:'#F0E6D0', marginBottom:'0.2rem' }}>Eze Tochukwu Precious</p>
                <p style={{ fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)' }}>Founder & Lead Mindset Coach</p>
              </div>
            </div>
          </div>

          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(1.5rem,2.5vw,2.125rem)', fontWeight:700, color:'#F0E6D0', lineHeight:1.2, marginBottom:'1rem' }}>
            Stop Running<br/>in Circles.
          </h2>
          <p style={{ color:'rgba(240,230,208,0.55)', fontSize:'0.9375rem', lineHeight:1.8, maxWidth:'300px' }}>
            Sign in to access premium mindset content, video masterclasses, and your personal growth dashboard.
          </p>
        </div>

        {/* Quote */}
        <div style={{ position:'relative', padding:'1.25rem', background:'rgba(201,162,75,0.06)', border:'1px solid rgba(201,162,75,0.15)', borderRadius:'var(--radius-lg)' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:'0.875rem', color:'rgba(240,230,208,0.75)', lineHeight:1.75, marginBottom:'0.625rem' }}>
            "The refinery is where raw potential becomes structured authority."
          </p>
          <p style={{ fontSize:'0.68rem', color:'var(--gold)', letterSpacing:'0.08em' }}>— Eze Tochukwu Precious</p>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1.25rem', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:'420px' }}>

          {/* Mobile logo */}
          <div className="hide-md" style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'2.5rem', justifyContent:'center' }}>
            <GraduationCap size={24} color="var(--gold)"/>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:'1.25rem', fontWeight:700, color:'var(--gold)' }}>SCSI Academy</span>
          </div>

          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem', fontWeight:700, marginBottom:'0.375rem' }}>Welcome back</h1>
          <p style={{ color:'var(--txt-3)', fontSize:'0.875rem', marginBottom:'2rem' }}>
            Sign in to your account — student or admin
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.125rem' }}>
            <div className="fgroup">
              <label className="fl">Email Address</label>
              <input type="email" required value={form.email} className="fi"
                onChange={e => setForm(p => ({...p, email:e.target.value}))}
                placeholder="you@email.com" autoComplete="email" autoFocus/>
            </div>

            <div className="fgroup" style={{ position:'relative' }}>
              <label className="fl">Password</label>
              <input type={showPw?'text':'password'} required value={form.password} className="fi"
                onChange={e => setForm(p => ({...p, password:e.target.value}))}
                placeholder="••••••••" autoComplete="current-password"
                style={{ paddingRight:'3rem' }}/>
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position:'absolute', right:'0.875rem', bottom:'0.875rem', background:'none', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', lineHeight:0 }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign:'right', marginTop:'-0.5rem' }}>
              <Link href="/forgot-password" style={{ fontSize:'0.8rem', color:'var(--gold)', textDecoration:'none', fontWeight:500 }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <div style={{ padding:'0.875rem 1rem', background:'rgba(220,60,60,0.08)', border:'1px solid rgba(220,60,60,0.25)', borderRadius:'var(--radius-sm)', fontSize:'0.875rem', lineHeight:1.6 }}>
                <p style={{ color:'#e07070', marginBottom: needsPayment ? '0.625rem' : 0 }}>{error}</p>
                {needsPayment && (
                  <Link href={`/signup?email=${encodeURIComponent(expiredEmail)}`}
                    style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', padding:'0.5rem 1rem', background:'var(--gold)', color:'#080506', borderRadius:'var(--radius-sm)', fontSize:'0.8rem', fontWeight:700, textDecoration:'none' }}>
                    Subscribe Now <ArrowRight size={12}/>
                  </Link>
                )}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-gold"
              style={{ justifyContent:'center', width:'100%', padding:'0.9375rem', fontSize:'0.9rem', opacity:busy?.7:1 }}>
              {busy
                ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <span style={{ width:'15px', height:'15px', border:'2px solid rgba(8,5,6,0.3)', borderTop:'2px solid #080506', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                    Signing in…
                  </span>
                : <><span>Sign In</span><ArrowRight size={15}/></>}
            </button>
          </form>

          <div style={{ marginTop:'1.75rem', padding:'1.25rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', textAlign:'center' }}>
            <p style={{ fontSize:'0.875rem', color:'var(--txt-2)', marginBottom:'0.75rem' }}>Don't have access yet?</p>
            <Link href="/signup" className="btn btn-ghost"
              style={{ textDecoration:'none', justifyContent:'center', display:'inline-flex', width:'100%', fontSize:'0.85rem' }}>
              Subscribe for Access <ArrowRight size={13}/>
            </Link>
          </div>

          {/* Admin indicator */}
          <div style={{ marginTop:'1.25rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem', opacity:0.4 }}>
            <Shield size={11} color="var(--txt-3)"/>
            <span style={{ fontSize:'0.7rem', color:'var(--txt-3)' }}>Admin access: use your configured admin email</span>
          </div>
        </div>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
