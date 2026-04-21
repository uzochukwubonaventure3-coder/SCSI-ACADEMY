'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Play, Lock, Clock, Tag, Users, ChevronRight, Copy, Check,
  Wallet, CreditCard, ArrowRight, Share2
} from 'lucide-react'
import axios from 'axios'
import { useAccess } from '@/hooks/useAccess'
import { useWallet } from '@/hooks/useWallet'
import VideoPaywall from '@/components/VideoPaywall'
import FundWalletModal from '@/components/FundWalletModal'
import { useToast } from '@/components/ui/Toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface VideoData {
  id:number; title:string; slug:string; description:string; thumbnail_url?:string
  duration?:string; category?:string; tags:string[]; price_kobo:number
  is_free:boolean; purchase_count:number; created_at:string
  effective_price_kobo?:number; discount_active?:boolean; active_discount_pct?:number
  preview_url?:string|null; preview_end_seconds?:number
  outcomes?:string[]; lessons?:string[]; target_audience?:string
  video_url?:string
}

const naira = (k:number) => `₦${(k/100).toLocaleString('en-NG')}`

export default function VideoDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const slug    = params?.slug as string
  const toast   = useToast()

  const { user, hasAccess, token, loading: authLoading } = useAccess()
  const { wallet, reload: reloadWallet } = useWallet(token, hasAccess)

  const [video,        setVideo]        = useState<VideoData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [purchased,    setPurchased]    = useState(false)
  const [videoUrl,     setVideoUrl]     = useState<string | null>(null)
  const [showPaywall,  setShowPaywall]  = useState(false)
  const [showFund,     setShowFund]     = useState(false)
  const [fundKobo,     setFundKobo]     = useState<number | undefined>()
  const [copied,       setCopied]       = useState(false)
  const [paywallData,  setPaywallData]  = useState<Partial<VideoData> & { price_kobo:number; preview_url?:string|null; preview_end_seconds?:number }>({ price_kobo: 0 })

  const getT    = useCallback(() => token || (typeof window !== 'undefined' ? localStorage.getItem('scsi_access_token') : '') || '', [token])
  const authH   = useCallback(() => ({ Authorization: `Bearer ${getT()}` }), [getT])

  // Load video metadata
  useEffect(() => {
    if (!slug) return
    setLoading(true)
    axios.get(`${API}/api/videos?limit=50`)
      .then(r => {
        const v = (r.data?.data?.videos || []).find((v: VideoData) => v.slug === slug)
        if (v) { setVideo(v); setLoading(false) }
        else { setLoading(false) }
      })
      .catch(() => setLoading(false))
  }, [slug])

  // Check if already purchased
  useEffect(() => {
    if (!video || !hasAccess || authLoading) return
    const t = getT()
    if (!t) return
    axios.get(`${API}/api/videos/${video.id}/access`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => {
        if (r.data.success && r.data.canWatch && r.data.video?.video_url) {
          setPurchased(true)
          setVideoUrl(r.data.video.video_url)
        }
      })
      .catch(() => {})
  }, [video, hasAccess, authLoading, getT])

  const handleUnlock = async () => {
    if (!video) return
    if (!hasAccess) { router.push('/login?next=' + encodeURIComponent(`/videos/${slug}`)); return }
    try {
      const r = await axios.get(`${API}/api/videos/${video.id}/access`, { headers: authH() })
      if (r.data.canWatch && r.data.video?.video_url) {
        setPurchased(true); setVideoUrl(r.data.video.video_url)
      } else if (r.data.reason === 'not_purchased') {
        setPaywallData({
          ...video,
          price_kobo: r.data.price_kobo ?? video.price_kobo,
          effective_price_kobo: r.data.effective_price_kobo,
          preview_url: r.data.preview_url ?? video.preview_url ?? null,
          preview_end_seconds: r.data.preview_end_seconds ?? video.preview_end_seconds ?? 60,
        })
        setShowPaywall(true)
        axios.post(`${API}/api/videos/${video.id}/intent`, {}, { headers: authH() }).catch(() => {})
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { reason?: string; price_kobo?: number; preview_url?: string | null; preview_end_seconds?: number } } }
      const d = err.response?.data
      if (d?.reason === 'not_purchased') {
        setPaywallData({ ...video, price_kobo: d.price_kobo ?? video?.price_kobo ?? 0, preview_url: d.preview_url ?? null, preview_end_seconds: d.preview_end_seconds ?? 60 })
        setShowPaywall(true)
      }
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      toast.ok('Link copied! Share it with anyone.')
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const shareVideo = async () => {
    const url  = window.location.href
    const text = `Check out this masterclass on SCSI Academy: "${video?.title}"`
    if (navigator.share) {
      try { await navigator.share({ title: video?.title, text, url }) } catch { /* dismissed */ }
    } else {
      copyLink()
    }
  }

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-0)', paddingTop: '90px' }}>
        <div className="wrap" style={{ padding: '2rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,480px), 1fr))', gap: '2rem' }}>
            <div className="skeleton" style={{ height: '320px', borderRadius: '16px' }}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array(5).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: i === 0 ? '32px' : '16px', borderRadius: '6px', width: i === 1 ? '60%' : '100%' }}/>)}
            </div>
          </div>
        </div>
        <style>{`.skeleton{background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 50%,var(--bg-2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    )
  }

  if (!video) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', paddingTop: '90px' }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Video not found</h1>
          <p style={{ color: 'var(--txt-3)', marginBottom: '1.5rem' }}>This video may have been removed or the link is incorrect.</p>
          <Link href="/content" className="btn btn-gold" style={{ textDecoration: 'none' }}>Browse All Videos</Link>
        </div>
      </div>
    )
  }

  const effectivePrice = video.effective_price_kobo ?? video.price_kobo

  return (
    <>
      <style>{`.skeleton{background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 50%,var(--bg-2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {showPaywall && user && (
        <VideoPaywall
          videoId={video.id}
          videoTitle={video.title}
          priceKobo={paywallData.price_kobo}
          walletBalance={wallet?.balance_kobo ?? 0}
          userEmail={user.email}
          token={getT()}
          previewUrl={paywallData.preview_url ?? null}
          previewEndSeconds={paywallData.preview_end_seconds ?? 60}
          mainVideoUrl={video.video_url ?? null}
          thumbnailUrl={video.thumbnail_url ?? null}
          outcomes={video.outcomes}
          lessons={video.lessons}
          purchaseCount={video.purchase_count}
          discountActive={video.discount_active}
          discountPct={video.active_discount_pct}
          onPurchased={(url) => {
            setShowPaywall(false); setPurchased(true); setVideoUrl(url)
            reloadWallet(); toast.ok(`"${video.title}" unlocked! Enjoy the masterclass.`)
          }}
          onClose={() => setShowPaywall(false)}
          onFundWallet={(k) => { setFundKobo(k); setShowPaywall(false); setShowFund(true) }}
        />
      )}
      {showFund && user && (
        <FundWalletModal
          userEmail={user.email} token={getT()}
          suggestedAmountKobo={fundKobo}
          onClose={() => { setShowFund(false); setFundKobo(undefined) }}
          onFunded={(bal) => { reloadWallet(); setShowFund(false); toast.ok(`Wallet topped up! Balance: ${naira(bal)}`) }}
        />
      )}

      <div style={{ minHeight: '100vh', background: 'var(--bg-0)', paddingTop: '80px' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.25rem' }}>
          <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--txt-3)' }}>
            <Link href="/content" style={{ color: 'var(--txt-3)', textDecoration: 'none' }}>Content Library</Link>
            <ChevronRight size={12}/>
            <Link href="/content" style={{ color: 'var(--txt-3)', textDecoration: 'none' }}>{video.category || 'Videos'}</Link>
            <ChevronRight size={12}/>
            <span style={{ color: 'var(--txt-1)', fontWeight: 600 }}>{video.title}</span>
          </div>
        </div>

        <div className="wrap" style={{ padding: '2rem 1.25rem 4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '2.5rem', alignItems: 'start' }}>

            {/* ── Left: Video / Thumbnail ── */}
            <div>
              {purchased && videoUrl ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <iframe src={videoUrl} allowFullScreen allow="autoplay; encrypted-media"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}/>
                </div>
              ) : (
                <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-3), var(--bg-4))', cursor: 'pointer', border: '1px solid var(--border)' }}
                  onClick={handleUnlock}>
                  {video.thumbnail_url && (
                    <img src={video.thumbnail_url} alt={video.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
                  )}
                  {/* Dark overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: video.is_free ? 'rgba(201,162,75,0.9)' : 'rgba(0,0,0,0.7)', border: '2px solid rgba(201,162,75,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                      {video.is_free ? <Play size={24} fill="#080506" color="#080506" style={{ marginLeft: '2px' }}/> : <Lock size={22} color="var(--gold)"/>}
                    </div>
                    {!video.is_free && (
                      <div style={{ padding: '0.375rem 1rem', borderRadius: '99px', background: 'rgba(201,162,75,0.9)', backdropFilter: 'blur(4px)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#080506' }}>
                          {video.discount_active ? `${naira(effectivePrice)} (${video.active_discount_pct}% off)` : naira(effectivePrice)} to unlock
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Duration badge */}
                  {video.duration && (
                    <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.8)', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={10}/>{video.duration}
                    </div>
                  )}
                </div>
              )}

              {/* Share / Copy row */}
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button onClick={shareVideo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5625rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--txt-2)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--txt-1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--txt-2)' }}>
                  <Share2 size={14}/>Share Video
                </button>
                <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5625rem 1rem', borderRadius: '8px', border: `1px solid ${copied ? 'rgba(80,200,128,0.4)' : 'var(--border)'}`, background: copied ? 'rgba(80,200,128,0.08)' : 'var(--bg-2)', color: copied ? '#50c880' : 'var(--txt-2)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied ? <Check size={14}/> : <Copy size={14}/>}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* ── Right: Details + CTA ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Category + tags */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {video.category && (
                  <span style={{ padding: '0.2rem 0.625rem', borderRadius: '99px', background: 'rgba(201,162,75,0.1)', border: '1px solid rgba(201,162,75,0.25)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.06em' }}>
                    {video.category}
                  </span>
                )}
                {(video.tags || []).map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: 'var(--bg-3)', border: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--txt-3)' }}>
                    <Tag size={9}/>{t}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.375rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.3, color: 'var(--txt-1)', margin: 0 }}>
                {video.title}
              </h1>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {video.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem', color: 'var(--txt-3)' }}>
                    <Clock size={13}/>{video.duration}
                  </div>
                )}
                {video.purchase_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem', color: '#50c880' }}>
                    <Users size={13}/>{video.purchase_count} student{video.purchase_count !== 1 ? 's' : ''} enrolled
                  </div>
                )}
                {video.target_audience && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--txt-3)' }}>For: {video.target_audience}</div>
                )}
              </div>

              {/* Description */}
              {video.description && (
                <p style={{ fontSize: '0.9375rem', color: 'var(--txt-2)', lineHeight: 1.8, margin: 0 }}>
                  {video.description}
                </p>
              )}

              {/* Outcomes */}
              {video.outcomes && video.outcomes.length > 0 && (
                <div style={{ padding: '1.25rem', background: 'rgba(201,162,75,0.05)', border: '1px solid rgba(201,162,75,0.15)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem' }}>What you'll gain</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {video.outcomes.map((o, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(80,200,128,0.15)', border: '1px solid rgba(80,200,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                          <Check size={11} color="#50c880"/>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--txt-1)', lineHeight: 1.6 }}>{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA section */}
              {purchased ? (
                <div style={{ padding: '1.25rem', background: 'rgba(80,200,128,0.08)', border: '1px solid rgba(80,200,128,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Check size={20} color="#50c880" style={{ flexShrink: 0 }}/>
                  <div>
                    <p style={{ fontWeight: 700, color: '#50c880', marginBottom: '0.125rem' }}>You own this video</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>Scroll up to watch</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Price display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
                      {video.is_free ? 'Free' : naira(effectivePrice)}
                    </span>
                    {video.discount_active && (
                      <>
                        <span style={{ fontSize: '1.125rem', color: 'var(--txt-3)', textDecoration: 'line-through' }}>
                          {naira(video.price_kobo)}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e07070', background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.25)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                          {video.active_discount_pct}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  {!video.is_free && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>
                      {Math.round(effectivePrice / 100 / 30) < 200 ? `Less than ₦${Math.round(effectivePrice / 100 / 30)}/day` : 'One-time investment'} · Permanent access
                    </p>
                  )}

                  {!hasAccess ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <Link href="/signup" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '12px', background: 'var(--gold)', color: '#080506', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#d4a93a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                        <Play size={16} fill="#080506"/>Subscribe to Watch
                      </Link>
                      <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)', textAlign: 'center' }}>
                        Need a subscription first · <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Already subscribed? Login →</Link>
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <button onClick={handleUnlock} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '12px', background: 'var(--gold)', color: '#080506', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#d4a93a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                        {video.is_free ? <><Play size={16} fill="#080506"/>Watch Now — Free</> : <><Lock size={16}/>Unlock This Video — {naira(effectivePrice)}</>}
                      </button>
                      {!video.is_free && wallet && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--txt-3)' }}>
                          <Wallet size={12}/>Wallet balance: <strong style={{ color: wallet.balance_kobo >= effectivePrice ? '#50c880' : 'var(--txt-3)' }}>{naira(wallet.balance_kobo)}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Back link */}
              <Link href="/content" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem', color: 'var(--txt-3)', textDecoration: 'none', marginTop: '0.25rem' }}>
                ← Back to Content Library
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
