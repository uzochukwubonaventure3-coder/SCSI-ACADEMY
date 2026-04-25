'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, GraduationCap, Shield } from 'lucide-react'
import { useAccess } from '@/hooks/useAccess'

function LoginPageContent() {
  const router = useRouter()
  const params = useSearchParams()

  const next = params.get('next') || '/content'
  const { login, hasAccess, isAdmin, loading } = useAccess()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needsPayment, setNeedsPayment] = useState(false)
  const [expiredEmail, setExpiredEmail] = useState('')

  useEffect(() => {
    if (!loading && hasAccess) {
      router.replace(isAdmin ? '/admin' : next)
    }
  }, [hasAccess, isAdmin, loading, next, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')
    setNeedsPayment(false)

    try {
      const res = await login(form.email, form.password)

      if (res.success) {
        // ROLE-BASED REDIRECT (IMPORTANT FIX)
        if (res.role === 'admin') {
          router.replace('/admin')
        } else {
          router.replace(next)
        }
      } else {
        setError(res.message)

        if (res.needsPayment) {
          setNeedsPayment(true)
          setExpiredEmail(form.email)
        }
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (loading || hasAccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-0)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--bg-3)',
          borderTop: '2px solid var(--gold)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-0)' }}>

      {/* LEFT PANEL */}
      <div className="show-md" style={{
        flex: '0 0 46%',
        position: 'relative',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #080305 0%, #1A0608 50%, #2A0D0D 100%)'
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', gap: '0.75rem' }}>
          <GraduationCap color="var(--gold)" />
          <div>
            <div style={{ color: 'var(--gold)', fontWeight: 700 }}>SCSI Academy</div>
            <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>Student Counseling Services</div>
          </div>
        </div>

        {/* Message */}
        <div style={{ position: 'relative' }}>
          <h2 style={{ color: '#fff', fontSize: '2rem' }}>
            Welcome Back
          </h2>
          <p style={{ opacity: 0.7 }}>
            Sign in to access your dashboard or admin panel.
          </p>
        </div>

        {/* Quote */}
        <div style={{
          position: 'relative',
          padding: '1rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <p style={{ fontStyle: 'italic', color: '#ccc' }}>
            “Consistency builds mastery.”
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <form onSubmit={handleSubmit} style={{ width: 400 }}>

          <h1 style={{ fontSize: '2rem', marginBottom: 20 }}>Login</h1>

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 10,
              border: '1px solid #ccc'
            }}
          />

          {/* PASSWORD */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{
                width: '100%',
                padding: 12,
                marginBottom: 10,
                border: '1px solid #ccc'
              }}
            />

            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute',
                right: 10,
                top: 10,
                background: 'none',
                border: 'none'
              }}
            >
              {showPw ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div style={{
              color: 'red',
              marginBottom: 10
            }}>
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            disabled={busy}
            type="submit"
            style={{
              width: '100%',
              padding: 12,
              background: 'black',
              color: 'white',
              border: 'none'
            }}
          >
            {busy ? 'Logging in...' : 'Login'}
            <ArrowRight size={14} />
          </button>

          {/* ADMIN HINT */}
          <div style={{
            marginTop: 15,
            fontSize: 12,
            opacity: 0.6,
            display: 'flex',
            gap: 5,
            alignItems: 'center'
          }}>
            <Shield size={12} />
            Admin and user login supported
          </div>

        </form>
      </div>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}