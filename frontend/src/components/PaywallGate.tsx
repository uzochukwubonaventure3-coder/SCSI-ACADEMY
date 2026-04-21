'use client'

import { useState, useEffect } from 'react'
import {
  Lock, Eye, EyeOff, ArrowRight, CheckCircle,
  Crown, RefreshCw, X, CalendarClock, AlertCircle,
} from 'lucide-react'
import axios from 'axios'
import { useAccess } from '@/hooks/useAccess'
import { loadPaystack } from '@/utils/paystack'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Plan {
  id: 'monthly' | 'quarterly'
  label: string
  price: number
  displayPrice: string
  description: string
  badge: string | null
  durationDays: number
  durationLabel: string
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (cfg: {
        key: string; email: string; amount: number; ref: string; currency: string
        onClose: () => void
        callback: (r: { reference: string }) => void
      }) => { openIframe: () => void }
    }
  }
}

type Screen = 'plans' | 'register' | 'login'

const inp: React.CSSProperties = {
  width: '100%', padding: '0.8rem 1rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(212,175,55,0.25)',
  color: '#FDFAF5', fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', transition: 'border-color 0.2s',
}
const lbl: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
  textTransform: 'uppercase', color: '#D4AF37', display: 'block', marginBottom: '0.375rem',
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; extra?: React.ReactNode }) {
  const { label, extra, ...rest } = props
  return (
    <div style={{ position: 'relative' }}>
      <label style={lbl}>{label}</label>
      <input {...rest} style={{ ...inp, ...(extra ? { paddingRight: '2.75rem' } : {}) }}
        onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.7)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.25)')} />
      {extra && <div style={{ position: 'absolute', right: '0.75rem', bottom: '0.8rem' }}>{extra}</div>}
    </div>
  )
}

function Alert({ type, msg }: { type: 'error' | 'success'; msg: string }) {
  const isErr = type === 'error'
  return (
    <div style={{ padding: '0.625rem 0.875rem', background: isErr ? 'rgba(240,112,112,0.08)' : 'rgba(212,175,55,0.08)', border: `1px solid ${isErr ? 'rgba(240,112,112,0.35)' : 'rgba(212,175,55,0.35)'}`, color: isErr ? '#f07070' : '#D4AF37', fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.5 }}>
      {isErr ? <X size={13} style={{ flexShrink: 0, marginTop: '2px' }} /> : <CheckCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
      {msg}
    </div>
  )
}

export default function PaywallGate({ children }: { children: React.ReactNode }) {
  const { hasAccess, loading, login, logout, setAccessFromPayment, user } = useAccess()
  const [plans, setPlans]         = useState<Plan[]>([])
  const [selected, setSelected]   = useState<Plan | null>(null)
  const [screen, setScreen]       = useState<Screen>('plans')
  const [showPw, setShowPw]       = useState(false)
  const [busy, setBusy]           = useState(false)
  const [msg, setMsg]             = useState('')
  const [msgType, setMsgType]     = useState<'error' | 'success'>('error')
  const [daysLeft, setDaysLeft]   = useState<number | null>(null)

  const [reg, setReg]     = useState({ fullName: '', email: '', password: '' })
  const [loginF, setLoginF] = useState({ email: '', password: '' })

  // Load plans
  useEffect(() => {
    axios.get(`${API}/api/paywall/plans`)
      .then(r => {
        setPlans(r.data.data)
        // default to quarterly (best value)
        setSelected(r.data.data.find((p: Plan) => p.id === 'quarterly') ?? r.data.data[0])
      })
      .catch(() => {
        const fallback: Plan[] = [
          { id: 'monthly',   label: 'Monthly Access',  price: 1000000, displayPrice: '₦10,000', description: 'Full access for 30 days.', badge: null,         durationDays: 30, durationLabel: '30 days' },
          { id: 'quarterly', label: '3-Month Bundle',  price: 2500000, displayPrice: '₦25,000', description: 'Full access for 3 months — save ₦5,000.', badge: 'Best Value', durationDays: 90, durationLabel: '3 months' },
        ]
        setPlans(fallback)
        setSelected(fallback[1])
      })
  }, [])

  // Days remaining from access context
  useEffect(() => {
    if (!user?.expiresAt) return
    const diff = new Date(user.expiresAt).getTime() - Date.now()
    setDaysLeft(Math.max(0, Math.ceil(diff / 86400000)))
  }, [user])

  // ── Already has access ────────────────────────────────────────────
  if (!loading && hasAccess) {
    const planLabel = user?.plan === 'quarterly' ? '3-Month Bundle' : 'Monthly Access'
    const isExpiringSoon = daysLeft !== null && daysLeft <= 7

    return (
      <>
        {/* Access status bar */}
        <div style={{ background: isExpiringSoon ? 'rgba(240,112,112,0.07)' : 'rgba(212,175,55,0.07)', borderBottom: `1px solid ${isExpiringSoon ? 'rgba(240,112,112,0.25)' : 'rgba(212,175,55,0.2)'}`, padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {isExpiringSoon
              ? <AlertCircle size={13} color="#f07070" />
              : <Crown size={13} color="#D4AF37" />}
            <span style={{ fontSize: '0.78rem', color: isExpiringSoon ? '#f07070' : '#D4AF37', fontWeight: 600 }}>
              {planLabel}
              {daysLeft !== null && (
                <span style={{ fontWeight: 400, marginLeft: '0.5rem', opacity: 0.8 }}>
                  · {daysLeft === 0 ? 'expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                </span>
              )}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isExpiringSoon && (
              <button
                onClick={() => { logout(); setTimeout(() => setScreen('plans'), 100) }}
                style={{ fontSize: '0.72rem', color: '#f07070', background: 'transparent', border: '1px solid rgba(240,112,112,0.4)', padding: '0.25rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                Renew Now
              </button>
            )}
            <button onClick={logout} style={{ fontSize: '0.7rem', color: '#8A7060', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Sign out
            </button>
          </div>
        </div>
        {children}
      </>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <RefreshCw size={20} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )

  // ── Handle payment ────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setBusy(true); setMsg('')

    try {
      const { data } = await axios.post(`${API}/api/paywall/register`, { ...reg, plan: selected.id })
      if (!data.success) { setMsg(data.message); setMsgType('error'); setBusy(false); return }

      const requiredFields = ['paystackKey', 'email', 'amountKobo', 'reference'] as const
      for (const field of requiredFields) {
        if (!data[field] && data[field] !== 0) {
          throw new Error(`Missing Paystack response field: ${field}`)
        }
      }

      const paystack = await loadPaystack()
      if (!paystack || typeof paystack.setup !== 'function') {
        throw new Error('Paystack is unavailable. Please reload the page and try again.')
      }

      const handler = paystack.setup({
        key:      data.paystackKey,
        email:    data.email,
        amount:   data.amountKobo,
        ref:      data.reference,
        currency: 'NGN',
        onClose: () => {
          setMsg('Payment window was closed. Click "Pay" again to complete your subscription.')
          setMsgType('error'); setBusy(false)
        },
        callback: async (response) => {
          setMsg('Verifying payment…'); setMsgType('success')
          try {
            const v = await axios.post(`${API}/api/paywall/verify`, { reference: response.reference })
            if (v.data.success) {
              setAccessFromPayment(v.data.accessToken, v.data.user)
              setDaysLeft(v.data.daysGranted)
              setMsg(`✅ Access unlocked for ${v.data.daysGranted} days. Welcome!`)
              setMsgType('success')
            } else {
              throw new Error(v.data.message || 'Verification failed')
            }
          } catch (verificationError: unknown) {
            const err = verificationError as { message?: string }
            setMsg(err.message || 'Verification error. Contact support.')
            setMsgType('error')
          } finally {
            setBusy(false)
          }
        },
      })
      handler.openIframe()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setMsg(e.response?.data?.message || 'Something went wrong.')
      setMsgType('error'); setBusy(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setMsg('')
    try {
      const res = await login(loginF.email, loginF.password)
      if (!res.success) { setMsg(res.message); setMsgType('error') }
    } finally {
      setBusy(false)
    }
  }

  // ── Paywall UI ────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Blurred content preview */}
      <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', maxHeight: '500px', overflow: 'hidden', opacity: 0.45 }}>
        {children}
      </div>

      {/* Gradient fade + lock card */}
      <div style={{ position: 'absolute', inset: 0, paddingTop: '80px', background: 'linear-gradient(to bottom, rgba(13,10,10,0.1) 0%, rgba(13,10,10,0.85) 35%, rgba(13,10,10,1) 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 10, paddingTop: '3rem' }}>
        <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(22,14,14,0.97)', border: '1px solid rgba(212,175,55,0.28)', backdropFilter: 'blur(16px)', padding: '2.25rem' }}>

          {/* Card header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ width: '50px', height: '50px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Lock size={18} color="#D4AF37" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 700, color: '#FDFAF5', marginBottom: '0.3rem' }}>
              {screen === 'login' ? 'Welcome Back' : 'Unlock Premium Content'}
            </h2>
            <p style={{ color: '#8A7060', fontSize: '0.825rem', lineHeight: 1.55 }}>
              {screen === 'login'
                ? 'Sign in to access your subscription.'
                : 'Get full access to all articles and videos.'}
            </p>
          </div>

          {/* ─ Plans ─ */}
          {screen === 'plans' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.375rem' }}>
                {plans.map(plan => {
                  const isActive = selected?.id === plan.id
                  return (
                    <button key={plan.id} onClick={() => setSelected(plan)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.125rem', background: isActive ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: '17px', height: '17px', borderRadius: '50%', border: `2px solid ${isActive ? '#D4AF37' : 'rgba(255,255,255,0.18)'}`, background: isActive ? '#D4AF37' : 'transparent', flexShrink: 0, transition: 'all 0.2s' }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FDFAF5' }}>{plan.label}</span>
                            {plan.badge && (
                              <span style={{ padding: '0.1rem 0.5rem', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarClock size={11} color="#8A7060" />
                            <span style={{ fontSize: '0.75rem', color: '#8A7060' }}>{plan.durationLabel}</span>
                            <span style={{ fontSize: '0.75rem', color: '#525252' }}>·</span>
                            <span style={{ fontSize: '0.75rem', color: '#8A7060' }}>{plan.description}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: '#D4AF37' }}>{plan.displayPrice}</div>
                        <div style={{ fontSize: '0.62rem', color: '#8A7060' }}>
                          {plan.id === 'monthly' ? 'per month' : 'one-time'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Savings callout */}
              {selected?.id === 'quarterly' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.3)', marginBottom: '1.25rem' }}>
                  <CheckCircle size={12} color="#D4AF37" />
                  <span style={{ fontSize: '0.75rem', color: '#D4AF37' }}>
                    You save <strong>₦5,000</strong> vs paying monthly for 3 months (₦30,000)
                  </span>
                </div>
              )}

              <button onClick={() => setScreen('register')} style={{ width: '100%', padding: '0.875rem', background: '#D4AF37', color: '#0D0A0A', border: 'none', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.8rem', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fcd34d'}
                onMouseLeave={e => e.currentTarget.style.background = '#D4AF37'}>
                Subscribe · {selected?.displayPrice} <ArrowRight size={13} />
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#8A7060' }}>
                Already subscribed?{' '}
                <button onClick={() => setScreen('login')} style={{ color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px', fontSize: 'inherit' }}>
                  Login here
                </button>
              </p>
            </>
          )}

          {/* ─ Register + Pay ─ */}
          {screen === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Plan reminder */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', marginBottom: '0.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#C4A882', fontWeight: 600 }}>{selected?.label}</span>
                  <span style={{ fontSize: '0.72rem', color: '#8A7060', marginLeft: '0.5rem' }}>· {selected?.durationLabel}</span>
                </div>
                <span style={{ fontWeight: 700, color: '#D4AF37', fontSize: '0.9rem' }}>{selected?.displayPrice}</span>
              </div>

              <Input label="Full Name" required value={reg.fullName} placeholder="Your full name"
                onChange={e => setReg(p => ({ ...p, fullName: e.target.value }))} />
              <Input label="Email Address" type="email" required value={reg.email} placeholder="you@email.com"
                onChange={e => setReg(p => ({ ...p, email: e.target.value }))} />
              <Input label="Create Password" type={showPw ? 'text' : 'password'} required value={reg.password} placeholder="Min. 6 characters"
                onChange={e => setReg(p => ({ ...p, password: e.target.value }))}
                extra={
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', color: '#8A7060', cursor: 'pointer', display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                } />

              {msg && <Alert type={msgType} msg={msg} />}

              <button type="submit" disabled={busy} style={{ padding: '0.875rem', background: '#D4AF37', color: '#0D0A0A', border: 'none', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.72 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }}>
                {busy
                  ? <><RefreshCw size={13} style={{ animation: 'spin 0.9s linear infinite' }} /> Processing…</>
                  : <>Pay {selected?.displayPrice} · Unlock Access <ArrowRight size={13} /></>}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <button type="button" onClick={() => { setScreen('plans'); setMsg('') }} style={{ color: '#8A7060', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Change plan
                </button>
                <button type="button" onClick={() => { setScreen('login'); setMsg('') }} style={{ color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Login instead
                </button>
              </div>
            </form>
          )}

          {/* ─ Login ─ */}
          {screen === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <Input label="Email Address" type="email" required value={loginF.email} placeholder="you@email.com"
                onChange={e => setLoginF(p => ({ ...p, email: e.target.value }))} />
              <Input label="Password" type={showPw ? 'text' : 'password'} required value={loginF.password} placeholder="••••••••"
                onChange={e => setLoginF(p => ({ ...p, password: e.target.value }))}
                extra={
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', color: '#8A7060', cursor: 'pointer', display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                } />

              {msg && <Alert type={msgType} msg={msg} />}

              <button type="submit" disabled={busy} style={{ padding: '0.875rem', background: '#D4AF37', color: '#0D0A0A', border: 'none', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.72 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {busy ? <><RefreshCw size={13} style={{ animation: 'spin 0.9s linear infinite' }} /> Signing in…</> : <>Sign In <ArrowRight size={13} /></>}
              </button>

              <button type="button" onClick={() => { setScreen('plans'); setMsg('') }} style={{ color: '#8A7060', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                ← Subscribe instead
              </button>
            </form>
          )}

          {/* Trust strip */}
          <div style={{ marginTop: '1.375rem', paddingTop: '1.125rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {['🔒 Secure', '✅ Instant Access', '🇳🇬 Paystack'].map(t => (
              <span key={t} style={{ fontSize: '0.62rem', color: '#525252', letterSpacing: '0.04em' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
