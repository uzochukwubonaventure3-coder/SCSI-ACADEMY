'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function ResetPasswordPageContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token  = params.get('token') || ''

  const [pw, setPw]     = useState({ next: '', confirm: '' })
  const [show, setShow] = useState({ n: false, c: false })
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle'|'success'|'error'>('idle')
  const [message, setMessage] = useState('')

  if (!token) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'5rem 1.25rem', background:'var(--bg-0)' }}>
      <div style={{ textAlign:'center' }}>
        <XCircle size={48} color="#e07070" style={{ margin:'0 auto 1.25rem' }}/>
        <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.5rem', marginBottom:'0.75rem' }}>Invalid Link</h2>
        <p style={{ color:'var(--txt-2)', marginBottom:'1.5rem' }}>This password reset link is invalid or missing.</p>
        <Link href="/forgot-password" className="btn btn-gold" style={{ textDecoration:'none' }}>Request New Link</Link>
      </div>
    </div>
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) { setStatus('error'); setMessage('Passwords do not match.'); return }
    if (pw.next.length < 6) { setStatus('error'); setMessage('Password must be at least 6 characters.'); return }
    setBusy(true)
    try {
      const { data } = await axios.post(`${API}/api/paywall/reset-password`, { token, newPassword: pw.next })
      if (data.success) {
        setStatus('success')
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setStatus('error'); setMessage(data.message)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setStatus('error'); setMessage(e.response?.data?.message || 'Reset failed. Link may have expired.')
    }
    setBusy(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'5rem 1.25rem', background:'var(--bg-0)' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'rgba(201,162,75,0.1)', border:'1.5px solid rgba(201,162,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
            <Lock size={22} color="var(--gold)"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem', fontWeight:700, marginBottom:'0.375rem' }}>Set New Password</h1>
          <p style={{ color:'var(--txt-3)', fontSize:'0.9rem' }}>Choose a strong password for your account</p>
        </div>

        {status === 'success' ? (
          <div style={{ padding:'2.5rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', textAlign:'center' }}>
            <CheckCircle size={48} color="#50c880" style={{ margin:'0 auto 1.25rem' }}/>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>Password Updated!</h2>
            <p style={{ color:'var(--txt-2)', fontSize:'0.9rem', marginBottom:'0.5rem' }}>Your password has been changed successfully.</p>
            <p style={{ fontSize:'0.8rem', color:'var(--txt-3)' }}>Redirecting to login…</p>
          </div>
        ) : (
          <div style={{ padding:'2.25rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)' }}>
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1.125rem' }}>
              {/* New password */}
              <div className="fgroup" style={{ position:'relative' }}>
                <label className="fl">New Password</label>
                <input type={show.n?'text':'password'} required value={pw.next} className="fi"
                  onChange={e => setPw(p => ({...p, next:e.target.value}))}
                  placeholder="Min. 6 characters" style={{ paddingRight:'3rem' }}/>
                <button type="button" onClick={() => setShow(s => ({...s,n:!s.n}))}
                  style={{ position:'absolute', right:'0.875rem', bottom:'0.875rem', background:'none', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', lineHeight:0 }}>
                  {show.n ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {/* Confirm password */}
              <div className="fgroup" style={{ position:'relative' }}>
                <label className="fl">Confirm New Password</label>
                <input type={show.c?'text':'password'} required value={pw.confirm} className="fi"
                  onChange={e => setPw(p => ({...p, confirm:e.target.value}))}
                  placeholder="Repeat your password" style={{ paddingRight:'3rem' }}/>
                <button type="button" onClick={() => setShow(s => ({...s,c:!s.c}))}
                  style={{ position:'absolute', right:'0.875rem', bottom:'0.875rem', background:'none', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', lineHeight:0 }}>
                  {show.c ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
                {/* Match indicator */}
                {pw.confirm && (
                  <p style={{ marginTop:'0.375rem', fontSize:'0.78rem', color: pw.next===pw.confirm?'#50c880':'#e07070', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                    {pw.next===pw.confirm ? <><CheckCircle size={12}/>Passwords match</> : <><XCircle size={12}/>Passwords don't match</>}
                  </p>
                )}
              </div>

              {status === 'error' && <p style={{ color:'#e07070', fontSize:'0.875rem', padding:'0.75rem', background:'rgba(220,60,60,0.08)', border:'1px solid rgba(220,60,60,0.25)', borderRadius:'var(--radius-sm)' }}>{message}</p>}

              <button type="submit" disabled={busy || pw.next !== pw.confirm} className="btn btn-gold"
                style={{ justifyContent:'center', width:'100%', padding:'0.9375rem', opacity:(busy||pw.next!==pw.confirm)?.7:1 }}>
                {busy
                  ? <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><span style={{ width:'15px', height:'15px', border:'2px solid rgba(8,5,6,0.3)', borderTop:'2px solid #080506', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>Updating…</span>
                  : <><Lock size={14}/>Reset Password</>}
              </button>
            </form>
          </div>
        )}
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-0)' }} />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
