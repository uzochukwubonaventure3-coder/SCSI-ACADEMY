'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail, CheckCircle } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy]   = useState(false)
  const [sent, setSent]   = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await axios.post(`${API}/api/paywall/forgot-password`, { email })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'5rem 1.25rem', background:'var(--bg-0)' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'rgba(201,162,75,0.1)', border:'1.5px solid rgba(201,162,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
            <Mail size={22} color="var(--gold)"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem', fontWeight:700, marginBottom:'0.375rem' }}>Forgot password?</h1>
          <p style={{ color:'var(--txt-3)', fontSize:'0.9rem', lineHeight:1.6 }}>Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <div style={{ padding:'2.5rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', textAlign:'center' }}>
            <CheckCircle size={48} color="#50c880" style={{ margin:'0 auto 1.25rem' }}/>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>Check your email</h2>
            <p style={{ color:'var(--txt-2)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:'1.75rem' }}>
              If <strong style={{ color:'var(--txt-1)' }}>{email}</strong> is registered, you'll receive a password reset link within a few minutes.
            </p>
            <p style={{ fontSize:'0.8rem', color:'var(--txt-3)', marginBottom:'1.5rem' }}>
              Didn't receive it? Check your spam folder or try again in a few minutes.
            </p>
            <Link href="/login" className="btn btn-ghost" style={{ textDecoration:'none', justifyContent:'center', display:'inline-flex', width:'100%' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <div style={{ padding:'2.25rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)' }}>
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1.125rem' }}>
              <div className="fgroup">
                <label className="fl">Email Address</label>
                <input type="email" required value={email} className="fi"
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com" autoFocus/>
              </div>
              {error && <p style={{ color:'#e07070', fontSize:'0.875rem' }}>{error}</p>}
              <button type="submit" disabled={busy} className="btn btn-gold"
                style={{ justifyContent:'center', width:'100%', padding:'0.9375rem', opacity:busy?.7:1 }}>
                {busy
                  ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ width:'15px', height:'15px', border:'2px solid rgba(8,5,6,0.3)', borderTop:'2px solid #080506', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                      Sending…
                    </span>
                  : <><Mail size={14}/>Send Reset Link</>}
              </button>
            </form>
            <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.85rem', color:'var(--txt-3)' }}>
              Remember your password?{' '}
              <Link href="/login" style={{ color:'var(--gold)', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
            </p>
          </div>
        )}
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
