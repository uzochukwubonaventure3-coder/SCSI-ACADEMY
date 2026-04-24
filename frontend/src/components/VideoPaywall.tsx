'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Lock, Wallet, CreditCard, CheckCircle, RefreshCw, X, Play,
  Sparkles, Tag, ChevronDown, Users, Target, Zap, Plus, ArrowRight
} from 'lucide-react'
import axios from 'axios'
import { loadPaystack } from '@/utils/paystack'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

declare global {
  interface Window {
    PaystackPop?: {
      setup: (cfg: {
        key: string; email: string; amount: number; ref: string; currency: string
        onClose: () => void; callback: (r: { reference: string }) => void
      }) => { openIframe: () => void }
    }
  }
}

interface VideoPaywallProps {
  videoId:            number
  videoTitle:         string
  priceKobo:          number        // original price in kobo
  walletBalance:      number        // current balance in kobo
  userEmail:          string
  token:              string
  previewUrl?:        string | null // admin-set dedicated clip
  previewEndSeconds?: number        // how many seconds to show (default 60)
  mainVideoUrl?:      string | null // full video URL for timed preview fallback
  thumbnailUrl?:      string | null
  outcomes?:          string[] | null
  lessons?:           string[] | null
  purchaseCount?:     number
  discountActive?:    boolean
  discountPct?:       number
  onPurchased:        (videoUrl: string) => void
  onClose:            () => void
  onFundWallet:       (suggestedAmountKobo?: number) => void // amount in KOBO
}

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG')}`

// Build a YouTube embed URL with ?end= for timed preview
function buildTimedPreview(url: string, endSecs: number): string | null {
  try {
    // Match YouTube video ID from embed or watch URLs
    const m = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&start=0&end=${endSecs}&rel=0&modestbranding=1`
    // Cloudinary / direct URL — use as-is (browser native controls will handle time)
    return url
  } catch { return null }
}

export default function VideoPaywall({
  videoId, videoTitle, priceKobo, walletBalance, userEmail, token,
  previewUrl, previewEndSeconds = 60, mainVideoUrl, thumbnailUrl,
  outcomes, lessons, purchaseCount = 0,
  discountActive = false, discountPct = 0,
  onPurchased, onClose, onFundWallet,
}: VideoPaywallProps) {
  const [phase,      setPhase]      = useState<'preview' | 'paywall'>('preview')
  const [payState,   setPayState]   = useState<'idle' | 'buying' | 'success' | 'error'>('idle')
  const [message,    setMessage]    = useState('')
  const [unlocking,  setUnlocking]  = useState(false)

  // Coupon
  const [couponCode,  setCouponCode]  = useState('')
  const [couponId,    setCouponId]    = useState<number | null>(null)
  const [couponPct,   setCouponPct]   = useState(discountActive ? discountPct : 0)
  const [couponMsg,   setCouponMsg]   = useState(discountActive && discountPct > 0 ? `${discountPct}% off applied!` : '')
  const [couponErr,   setCouponErr]   = useState('')
  const [couponBusy,  setCouponBusy]  = useState(false)
  const [showCoupon,  setShowCoupon]  = useState(false)
  const [previewCountdown, setPreviewCountdown] = useState(previewEndSeconds)

  const timerRef     = useRef<NodeJS.Timeout>()
  const countdownRef = useRef<NodeJS.Timeout>()
  const authH        = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token])

  // Effective price after coupon/discount (all in kobo)
  const activePct       = Math.max(couponPct, discountActive ? discountPct : 0)
  const discountedPrice = activePct > 0 ? Math.round(priceKobo * (1 - activePct / 100)) : priceKobo
  const canAfford       = walletBalance >= discountedPrice
  const shortfallKobo   = Math.max(0, discountedPrice - walletBalance)
  // suggestedTop: round up to nearest ₦100 (=10000 kobo), keep in KOBO
  const suggestedKobo   = shortfallKobo > 0
    ? Math.ceil(shortfallKobo / 10000) * 10000
    : 0

  // Build the embed src:
  // Priority: dedicated previewUrl > timed main video > no preview (go straight to paywall)
  const previewSrc: string | null = previewUrl
    ? previewUrl
    : mainVideoUrl
    ? buildTimedPreview(mainVideoUrl, previewEndSeconds)
    : null

  // Auto-transition preview → paywall after previewEndSeconds
  useEffect(() => {
    if (phase !== 'preview') return
    if (!previewSrc) {
      // No preview available — go straight to paywall
      setPhase('paywall')
      return
    }
    // Countdown display
    setPreviewCountdown(previewEndSeconds)
    countdownRef.current = setInterval(() => {
      setPreviewCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    // Switch to paywall after preview
    timerRef.current = setTimeout(() => {
      clearInterval(countdownRef.current)
      setPhase('paywall')
    }, previewEndSeconds * 1000)

    return () => {
      clearTimeout(timerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [phase, previewSrc, previewEndSeconds])

  // ── Apply coupon ───────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponBusy(true); setCouponErr(''); setCouponMsg('')
    try {
      const { data } = await axios.post(
        `${API}/api/coupons/apply`,
        { code: couponCode.trim().toUpperCase(), video_id: videoId },
        { headers: authH() }
      )
      if (data.success) {
        setCouponId(data.coupon_id)
        setCouponPct(data.discount_percent)
        setCouponMsg(`${data.discount_percent}% discount applied!`)
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setCouponErr(err.response?.data?.message || 'Invalid or expired coupon')
      setCouponId(null); setCouponPct(0)
    }
    setCouponBusy(false)
  }

  // ── Wallet purchase ────────────────────────────────────────────────
  const buyWithWallet = async () => {
    setPayState('buying'); setUnlocking(true)
    try {
      const { data } = await axios.post(
        `${API}/api/wallet/purchase/video`,
        { video_id: videoId, coupon_id: couponId },
        { headers: authH() }
      )
      if (data.success || data.alreadyOwned) {
        setPayState('success'); setMessage('Unlocked! Loading your video…')
        const access = await axios.get(`${API}/api/videos/${videoId}/access`, { headers: authH() })
        setTimeout(() => onPurchased(access.data?.video?.video_url || ''), 700)
      } else throw new Error(data.message)
    } catch (e: unknown) {
      setUnlocking(false)
      const err = e as { response?: { data?: { message?: string } } }
      setMessage(err.response?.data?.message || 'Purchase failed. Try again.')
      setPayState('error')
    }
  }

  // ── Paystack purchase ──────────────────────────────────────────────
  const buyWithPaystack = async () => {
    setPayState('buying')
    try {
      const { data } = await axios.post(
        `${API}/api/wallet/purchase/video/paystack`,
        { video_id: videoId, coupon_id: couponId },
        { headers: authH() }
      )
      if (!data.success && !data.alreadyOwned) throw new Error(data.message)
      if (data.alreadyOwned) {
        const a = await axios.get(`${API}/api/videos/${videoId}/access`, { headers: authH() })
        onPurchased(a.data?.video?.video_url || ''); return
      }
      if (!data.paystackKey) throw new Error('Paystack public key is missing on the server')

      const paystack = await loadPaystack()
      if (!paystack || typeof paystack.setup !== 'function') {
        throw new Error('Paystack is unavailable. Please refresh and try again.')
      }

      setPayState('idle') // reset so Paystack popup can show
      const handlePaymentCallback = (res: { reference: string }) => {
        void (async () => {
          setUnlocking(true); setPayState('success'); setMessage('Verifying payment…')
          try {
            const v = await axios.post(
              `${API}/api/wallet/purchase/video/paystack/verify`,
              { reference: res.reference }, { headers: authH() }
            )
            if (v.data.success || v.data.alreadyProcessed) {
              setMessage('Unlocked! Loading your video…')
              const a = await axios.get(`${API}/api/videos/${videoId}/access`, { headers: authH() })
              setTimeout(() => onPurchased(a.data?.video?.video_url || ''), 700)
            }
          } catch {
            setUnlocking(false); setPayState('error')
            setMessage('Verification failed. If you were charged, contact support.')
          }
        })()
      }

      const handler = paystack.setup({
        key: data.paystackKey, email: data.email,
        amount: data.amountKobo, ref: data.reference, currency: 'NGN',
        onClose: () => {
          setPayState('error')
          setMessage('Payment was closed. Try again when you\'re ready.')
        },
        callback: handlePaymentCallback,
      })
      handler.openIframe()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setMessage(err.response?.data?.message || err.message || 'Payment failed.')
      setPayState('error')
    }
  }

  // ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>

      {/* ── PREVIEW PHASE ────────────────────────────────────────── */}
      {phase === 'preview' && previewSrc && (
        <div style={{
          width: '100%', maxWidth: '800px', borderRadius: '20px',
          overflow: 'hidden', animation: 'fadeUp 0.3s ease both',
          background: '#000', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Video */}
          <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
            <iframe
              src={previewSrc}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
            {/* PREVIEW pill */}
            <div style={{ position: 'absolute', top: '0.875rem', left: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '99px', background: 'rgba(201,162,75,0.95)', backdropFilter: 'blur(4px)' }}>
              <Play size={10} fill="#080506" color="#080506"/>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#080506', letterSpacing: '0.06em' }}>FREE PREVIEW</span>
            </div>
            {/* Countdown */}
            <div style={{ position: 'absolute', top: '0.875rem', right: '3.5rem', padding: '0.3rem 0.75rem', borderRadius: '99px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                {Math.floor(previewCountdown / 60)}:{String(previewCountdown % 60).padStart(2, '0')} left
              </span>
            </div>
            {/* Close */}
            <button onClick={onClose} style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15}/>
            </button>
            {/* Bottom gradient */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(8,5,6,0.95), transparent)', pointerEvents: 'none' }}/>
          </div>

          {/* Bottom bar */}
          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '0.125rem' }}>{videoTitle}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)' }}>
                Preview ends in {previewCountdown}s · Full video unlocks instantly after payment
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
              <button onClick={() => { clearTimeout(timerRef.current); clearInterval(countdownRef.current); setPhase('paywall') }}
                className="btn btn-gold" style={{ gap: '0.5rem', whiteSpace: 'nowrap' }}>
                <Lock size={13}/>Unlock Full Video — {naira(discountedPrice)}
              </button>
              <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYWALL PHASE ────────────────────────────────────────── */}
      {phase === 'paywall' && (
        <div style={{
          width: '100%', maxWidth: '440px',
          background: 'var(--bg-2)', borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          animation: 'fadeUp 0.35s cubic-bezier(.4,0,.2,1) both',
          maxHeight: '92vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* ── Unlocking overlay ── */}
          {unlocking && (
            <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(201,162,75,0.12)', border: '2px solid rgba(201,162,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseRing 1.2s ease infinite' }}>
                <Sparkles size={28} color="var(--gold)" style={{ animation: 'spin 2.5s linear infinite' }}/>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '0.375rem' }}>
                  {payState === 'success' ? '🎉 Unlocked!' : 'Processing…'}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--txt-3)' }}>{message}</p>
              </div>
            </div>
          )}

          {/* ── Main paywall content ── */}
          {!unlocking && (
            <>
              {/* Header */}
              <div style={{ padding: '1.5rem 1.5rem 1.25rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.125rem', right: '1.125rem', width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--txt-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-4)'; e.currentTarget.style.color = 'var(--txt-1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--txt-3)' }}>
                  <X size={14}/>
                </button>

                {/* Thumbnail */}
                {thumbnailUrl ? (
                  <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.125rem', position: 'relative' }}>
                    <img src={thumbnailUrl} alt={videoTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,5,6,0.75), transparent)', display: 'flex', alignItems: 'flex-end', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                        <Lock size={11} color="var(--gold)"/>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)' }}>Premium Content</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(201,162,75,0.12)', border: '1px solid rgba(201,162,75,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={20} color="var(--gold)"/>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>Premium Content</span>
                  </div>
                )}

                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--txt-1)', paddingRight: '2rem', marginBottom: '0.75rem' }}>
                  {videoTitle}
                </h2>

                {/* Price row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {activePct > 0 ? (
                    <>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, color: '#50c880', lineHeight: 1 }}>
                        {naira(discountedPrice)}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--txt-3)', textDecoration: 'line-through' }}>
                        {naira(priceKobo)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.3)', fontSize: '0.65rem', fontWeight: 800, color: '#e07070' }}>
                        <Zap size={9}/>{activePct}% OFF
                      </span>
                    </>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
                      {naira(priceKobo)}
                    </span>
                  )}
                </div>

                {/* Value + social proof row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--txt-3)' }}>
                    {Math.round(discountedPrice / 100 / 30) < 200
                      ? `Less than ₦${Math.round(discountedPrice / 100 / 30)}/day`
                      : 'One-time payment'}
                    {' '}· Instant access
                  </p>
                  {purchaseCount > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 600, color: '#50c880' }}>
                      <Users size={10}/>{purchaseCount} student{purchaseCount !== 1 ? 's' : ''} enrolled
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)', marginInline: '1.5rem' }}/>

              {/* Body */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Error */}
                {payState === 'error' && (
                  <div style={{ padding: '0.875rem 1rem', background: 'rgba(220,60,60,0.07)', border: '1px solid rgba(220,60,60,0.22)', borderRadius: '10px', color: '#e07070', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {message}
                  </div>
                )}

                {/* Outcomes */}
                {outcomes && outcomes.length > 0 && (
                  <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,162,75,0.04)', border: '1px solid rgba(201,162,75,0.14)', borderRadius: '10px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Target size={11}/>What you'll gain
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {outcomes.slice(0, 4).map((o, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <CheckCircle size={12} color="#50c880" style={{ flexShrink: 0, marginTop: '2px' }}/>
                          <span style={{ fontSize: '0.8rem', color: 'var(--txt-2)', lineHeight: 1.5 }}>{o}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locked lessons */}
                {lessons && lessons.length > 0 && (
                  <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: '0.625rem' }}>🔒 Locked lessons</p>
                    {lessons.slice(0, 4).map((l, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: i < lessons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <Lock size={10} color="var(--txt-3)" style={{ flexShrink: 0 }}/>
                        <span style={{ fontSize: '0.78rem', color: 'var(--txt-3)' }}>{l}</span>
                      </div>
                    ))}
                    {lessons.length > 4 && <p style={{ fontSize: '0.7rem', color: 'var(--txt-3)', marginTop: '0.375rem' }}>+{lessons.length - 4} more inside</p>}
                  </div>
                )}

                {/* Coupon */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <button onClick={() => setShowCoupon(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: couponPct > 0 ? '#50c880' : 'var(--txt-2)' }}>
                      <Tag size={13} color={couponPct > 0 ? '#50c880' : 'var(--txt-3)'}/>
                      {couponPct > 0 ? `Coupon applied: ${couponPct}% off ✓` : 'Have a coupon code?'}
                    </span>
                    <ChevronDown size={14} color="var(--txt-3)" style={{ transform: showCoupon ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
                  </button>
                  {showCoupon && (
                    <div style={{ padding: '0 1rem 0.875rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {couponPct > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'rgba(80,200,128,0.08)', border: '1px solid rgba(80,200,128,0.22)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#50c880' }}>✓ {couponMsg}</span>
                          <button onClick={() => { setCouponId(null); setCouponPct(0); setCouponCode(''); setCouponMsg('') }} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}>Remove</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && applyCoupon()} placeholder="ENTER CODE" className="fi" style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.875rem' }}/>
                          <button onClick={applyCoupon} disabled={couponBusy || !couponCode.trim()} className="btn btn-gold btn-sm" style={{ flexShrink: 0, opacity: couponBusy ? .7 : 1 }}>
                            {couponBusy ? <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }}/> : 'Apply'}
                          </button>
                        </div>
                      )}
                      {couponErr && <p style={{ fontSize: '0.78rem', color: '#e07070' }}>{couponErr}</p>}
                    </div>
                  )}
                </div>

                {/* ── Wallet CTA ── */}
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1.5px solid ${canAfford ? 'rgba(201,162,75,0.35)' : 'var(--border)'}`, background: canAfford ? 'rgba(201,162,75,0.04)' : 'var(--bg-1)' }}>
                  <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wallet size={15} color="var(--gold)"/>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--txt-1)' }}>Pay with Wallet</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '99px', background: canAfford ? 'rgba(80,200,128,0.1)' : 'rgba(220,60,60,0.08)', color: canAfford ? '#50c880' : '#e07070' }}>
                      Balance: {naira(walletBalance)}
                    </span>
                  </div>
                  <div style={{ padding: '0.875rem 1rem' }}>
                    {canAfford ? (
                      <button onClick={buyWithWallet} disabled={payState === 'buying'} style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: 'none', background: 'var(--gold)', color: '#080506', fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', fontWeight: 800, cursor: payState === 'buying' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: payState === 'buying' ? .7 : 1, transition: 'all 0.15s' }}
                        onMouseEnter={e => { if (payState !== 'buying') e.currentTarget.style.background = '#d4a93a' }}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                        {payState === 'buying'
                          ? <><RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }}/>Processing…</>
                          : <><Wallet size={15}/>Unlock with Wallet — {naira(discountedPrice)}</>}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--txt-2)', lineHeight: 1.5 }}>
                          You need <strong style={{ color: 'var(--gold)' }}>{naira(shortfallKobo)}</strong> more to unlock this video.
                        </p>
                        <button onClick={() => onFundWallet(suggestedKobo)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', borderRadius: '8px', border: '1.5px solid rgba(201,162,75,0.4)', background: 'rgba(201,162,75,0.08)', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', width: 'fit-content', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,162,75,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,162,75,0.08)'}>
                          <Plus size={14}/>Top up {naira(suggestedKobo)}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}/>
                  <span style={{ fontSize: '0.68rem', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.06em' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}/>
                </div>

                {/* Paystack CTA */}
                <button onClick={buyWithPaystack} disabled={payState === 'buying'} style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg-1)', color: 'var(--txt-1)', fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', fontWeight: 700, cursor: payState === 'buying' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: payState === 'buying' ? .7 : 1, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (payState !== 'buying') { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-2)' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-1)' }}>
                  <CreditCard size={15}/>Pay {naira(discountedPrice)} with Card / Transfer <ArrowRight size={13}/>
                </button>

                {/* Preview again */}
                {previewSrc && (
                  <button onClick={() => { setPhase('preview'); setPayState('idle'); setMessage('') }} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                    ← Watch preview again
                  </button>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--txt-3)', marginBottom: '0.25rem' }}>
                    🔒 Secured by Paystack · Instant access after payment
                  </p>
                  <a href={`https://wa.me/2349018053015?text=${encodeURIComponent(`Hello Coach Precious! I need guidance on the video "${videoTitle}" on SCSI Academy.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.7rem', color: '#25D366', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Need help? Chat with Coach
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulseRing { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.12); opacity:.7 } }
      `}</style>
    </div>
  )
}
