'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function VerifyEmailPageContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token  = params.get('token')
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return }
    axios.post(`${API}/api/paywall/verify-email`, { token })
      .then(r => {
        if (r.data.success) {
          setStatus('success')
          setTimeout(() => router.push('/content'), 3000)
        } else {
          setStatus('error')
          setMessage(r.data.message || 'Verification failed.')
        }
      })
      .catch(() => { setStatus('error'); setMessage('Link expired or invalid. Please contact support.') })
  }, [token, router])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'5rem 1.25rem', background:'var(--bg-0)' }}>
      <div style={{ width:'100%', maxWidth:'420px', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'2.5rem', textAlign:'center' }}>
        {status === 'loading' && (
          <>
            <Loader size={48} color="var(--gold)" style={{ margin:'0 auto 1.5rem', animation:'spin 0.8s linear infinite' }}/>
            <h2 className="h-serif" style={{ fontSize:'1.375rem', fontWeight:700, marginBottom:'0.5rem' }}>Verifying your email…</h2>
            <p style={{ color:'var(--txt-2)', fontSize:'0.9rem' }}>Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} color="#50c880" style={{ margin:'0 auto 1.5rem' }}/>
            <h2 className="h-serif" style={{ fontSize:'1.375rem', fontWeight:700, marginBottom:'0.5rem' }}>Email Verified!</h2>
            <p style={{ color:'var(--txt-2)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:'1.5rem' }}>
              Your email has been verified successfully. Redirecting you to your content…
            </p>
            <Link href="/content" className="btn btn-gold" style={{ textDecoration:'none', justifyContent:'center', display:'inline-flex', width:'100%' }}>
              Go to Content Library
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} color="#e07070" style={{ margin:'0 auto 1.5rem' }}/>
            <h2 className="h-serif" style={{ fontSize:'1.375rem', fontWeight:700, marginBottom:'0.5rem' }}>Verification Failed</h2>
            <p style={{ color:'var(--txt-2)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:'1.5rem' }}>{message}</p>
            <Link href="/login" className="btn btn-ghost" style={{ textDecoration:'none', justifyContent:'center', display:'inline-flex', width:'100%' }}>
              Back to Login
            </Link>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-0)' }} />}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}
