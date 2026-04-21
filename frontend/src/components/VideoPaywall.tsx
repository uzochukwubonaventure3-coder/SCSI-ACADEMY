'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Lock, Wallet, CreditCard, Plus, ArrowRight, CheckCircle,
  RefreshCw, X, Play, Sparkles, Tag, ChevronDown,
  Users, Target, Zap
} from 'lucide-react'
import axios from 'axios'
import { loadPaystack } from '@/utils/paystack'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

declare global {
  interface Window {
    PaystackPop: { setup: (cfg: { key:string;email:string;amount:number;ref:string;currency:string;onClose:()=>void;callback:(r:{reference:string})=>void }) => { openIframe:()=>void } }
  }
}

interface VideoPaywallProps {
  videoId:            number
  videoTitle:         string
  priceKobo:          number
  walletBalance:      number
  userEmail:          string
  token:              string
  previewUrl?:        string | null
  previewEndSeconds?: number
  mainVideoUrl?:      string | null
  thumbnailUrl?:      string | null
  outcomes?:          string[] | null     // "What you'll gain"
  lessons?:           string[] | null     // Locked lesson list
  purchaseCount?:     number              // Social proof
  discountActive?:    boolean
  discountPct?:       number
  onPurchased:        (videoUrl: string) => void
  onClose:            () => void
  onFundWallet:       (suggestedAmount?: number) => void
}

const naira = (k: number) => `₦${(k / 100).toLocaleString('en-NG')}`

function buildPreviewEmbed(url: string, end: number): string {
  try {
    const m = url.match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?start=0&end=${end}&autoplay=1&rel=0`
    return url
  } catch { return url }
}

export default function VideoPaywall({
  videoId, videoTitle, priceKobo, walletBalance, userEmail, token,
  previewUrl, previewEndSeconds=60, mainVideoUrl, thumbnailUrl,
  outcomes, lessons, purchaseCount=0,
  discountActive=false, discountPct=0,
  onPurchased, onClose, onFundWallet,
}: VideoPaywallProps) {
  const [phase,     setPhase]     = useState<'preview'|'paywall'>('preview')
  const [payMode,   setPayMode]   = useState<'idle'|'success'|'error'>('idle')
  const [busy,      setBusy]      = useState(false)
  const [message,   setMessage]   = useState('')
  const [unlocking, setUnlocking] = useState(false)

  // Coupon
  const [couponCode,  setCouponCode]  = useState('')
  const [couponId,    setCouponId]    = useState<number|null>(null)
  const [couponPct,   setCouponPct]   = useState(discountPct)
  const [couponMsg,   setCouponMsg]   = useState(discountActive&&discountPct>0?`${discountPct}% discount active`:'')
  const [couponErr,   setCouponErr]   = useState('')
  const [couponBusy,  setCouponBusy]  = useState(false)
  const [showCoupon,  setShowCoupon]  = useState(false)

  const timerRef = useRef<NodeJS.Timeout>()
  const authH    = () => ({ Authorization: `Bearer ${token}` })

  const activePct      = Math.max(couponPct, discountActive ? discountPct : 0)
  const discountedPrice = activePct > 0 ? Math.round(priceKobo * (1 - activePct / 100)) : priceKobo
  const canAfford       = walletBalance >= discountedPrice
  const shortfall       = discountedPrice - walletBalance
  const suggestedTop    = shortfall > 0 ? Math.ceil(shortfall / 100) * 100 : 0

  const previewSrc = previewUrl ? previewUrl
    : mainVideoUrl ? buildPreviewEmbed(mainVideoUrl, previewEndSeconds) : null

  useEffect(()=>{
    if(phase!=='preview'||!previewSrc){setPhase('paywall');return}
    timerRef.current=setTimeout(()=>setPhase('paywall'),(previewEndSeconds+3)*1000)
    return ()=>clearTimeout(timerRef.current)
  },[phase,previewSrc,previewEndSeconds])


  const applyCoupon = async()=>{
    if(!couponCode.trim()) return
    setCouponBusy(true);setCouponErr('');setCouponMsg('')
    try{
      const{data}=await axios.post(`${API}/api/coupons/apply`,{code:couponCode.trim().toUpperCase(),video_id:videoId},{headers:authH()})
      if(data.success){setCouponId(data.coupon_id);setCouponPct(data.discount_percent);setCouponMsg(data.message)}
    }catch(e:unknown){
      const err=e as {response?:{data?:{message?:string}}}
      setCouponErr(err.response?.data?.message||'Invalid coupon');setCouponId(null);setCouponPct(0)
    }
    setCouponBusy(false)
  }

  const buyWithWallet=async()=>{
    setBusy(true);setUnlocking(true)
    try{
      const{data}=await axios.post(`${API}/api/wallet/purchase/video`,{video_id:videoId,coupon_id:couponId},{headers:authH()})
      if(data.success||data.alreadyOwned){
        setPayMode('success');setMessage('Unlocked! Loading…')
        const access=await axios.get(`${API}/api/videos/${videoId}/access`,{headers:authH()})
        setTimeout(()=>onPurchased(access.data?.video?.video_url||''),700)
      } else throw new Error(data.message)
    }catch(e:unknown){
      setUnlocking(false)
      const err=e as {response?:{data?:{message?:string}}}
      setMessage(err.response?.data?.message||'Purchase failed.');setPayMode('error')
    }
    setBusy(false)
  }

  const buyWithPaystack = async () => {
    setBusy(true)
    setPayMode('idle')
    setMessage('')

    try {
      const { data } = await axios.post(
        `${API}/api/wallet/purchase/video/paystack`,
        { video_id: videoId, coupon_id: couponId },
        { headers: authH() }
      )

      if (!data.success && !data.alreadyOwned) {
        throw new Error(data.message || 'Unable to initialize Paystack purchase')
      }

      if (data.alreadyOwned) {
        const access = await axios.get(`${API}/api/videos/${videoId}/access`, { headers: authH() })
        onPurchased(access.data?.video?.video_url || '')
        return
      }

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
        key: data.paystackKey,
        email: data.email,
        amount: data.amountKobo,
        ref: data.reference,
        currency: 'NGN',
        onClose: () => {
          setPayMode('error')
          setMessage('Payment window was closed. Please try again.')
          setBusy(false)
        },
        callback: async (response) => {
          setUnlocking(true)
          setPayMode('success')
          setMessage('Verifying payment…')

          try {
            const verification = await axios.post(
              `${API}/api/wallet/purchase/video/paystack/verify`,
              { reference: response.reference },
              { headers: authH() }
            )

            if (verification.data.success || verification.data.alreadyProcessed) {
              setMessage('Unlocked! Loading…')
              const access = await axios.get(`${API}/api/videos/${videoId}/access`, { headers: authH() })
              setTimeout(() => onPurchased(access.data?.video?.video_url || ''), 700)
              return
            }

            throw new Error(verification.data.message || 'Payment verification failed')
          } catch (verificationError: unknown) {
            const err = verificationError as { message?: string }
            setUnlocking(false)
            setPayMode('error')
            setMessage(err.message || 'Verification failed. Please contact support.')
          } finally {
            setBusy(false)
          }
        },
      })

      handler.openIframe()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      setMessage(err.response?.data?.message || err.message || 'Payment failed. Please try again.')
      setPayMode('error')
      setBusy(false)
    }
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.25rem'}}>
      <div style={{width:'100%',maxWidth:phase==='preview'?'760px':'460px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',overflow:'hidden',animation:'fadeUp 0.3s ease both',transition:'max-width 0.4s cubic-bezier(.4,0,.2,1)',maxHeight:'92vh',overflowY:'auto'}}>

        {/* ── PREVIEW PHASE ── */}
        {phase==='preview'&&previewSrc&&(
          <>
            <div style={{position:'relative'}}>
              <div style={{position:'relative',paddingBottom:'56.25%',background:'#000'}}>
                <iframe src={previewSrc} allow="autoplay; encrypted-media" allowFullScreen style={{position:'absolute',inset:0,width:'100%',height:'100%',border:'none'}}/>
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:'40%',background:'linear-gradient(to top,rgba(8,5,6,0.9),transparent)',pointerEvents:'none'}}/>
                <div style={{position:'absolute',top:'0.75rem',left:'0.75rem',display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.25rem 0.625rem',borderRadius:'99px',background:'rgba(201,162,75,0.92)'}}>
                  <Play size={10} fill="#080506" color="#080506"/>
                  <span style={{fontSize:'0.6rem',fontWeight:800,color:'#080506',letterSpacing:'0.06em'}}>PREVIEW · {previewEndSeconds}s</span>
                </div>
                <button onClick={onClose} style={{position:'absolute',top:'0.75rem',right:'0.75rem',width:'30px',height:'30px',borderRadius:'50%',background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
              </div>
            </div>
            <div style={{padding:'1.25rem 1.5rem',background:'linear-gradient(135deg,var(--bg-3),var(--bg-2))',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
              <div>
                <h3 style={{fontFamily:'var(--font-serif)',fontSize:'1rem',fontWeight:700,color:'var(--txt-1)',marginBottom:'0.2rem'}}>{videoTitle}</h3>
                <p style={{fontSize:'0.75rem',color:'var(--txt-3)'}}>Preview ends automatically · Unlock for full access</p>
              </div>
              <div style={{display:'flex',gap:'0.5rem',flexShrink:0}}>
                <button onClick={()=>setPhase('paywall')} className="btn btn-gold" style={{gap:'0.5rem'}}>
                  <Lock size={13}/>Unlock — {naira(discountedPrice)}
                </button>
                <button onClick={onClose} className="btn btn-ghost btn-sm">Later</button>
              </div>
            </div>
          </>
        )}

        {/* ── PAYWALL PHASE ── */}
        {phase==='paywall'&&(
          <>
            <div style={{padding:'1.375rem 1.5rem 1rem',borderBottom:'1px solid var(--border)',position:'relative'}}>
              <button onClick={onClose} style={{position:'absolute',top:'1rem',right:'1rem',background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',display:'flex'}}><X size={18}/></button>

              {unlocking?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'1.25rem 0 0.75rem'}}>
                  <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'rgba(201,162,75,0.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem',animation:'pulseRing 1s ease infinite'}}>
                    <Sparkles size={26} color="var(--gold)" style={{animation:'spin 2s linear infinite'}}/>
                  </div>
                  <p style={{fontFamily:'var(--font-serif)',fontSize:'1.125rem',fontWeight:700,marginBottom:'0.25rem'}}>Unlocking your content…</p>
                  <p style={{fontSize:'0.875rem',color:'var(--txt-3)'}}>{message}</p>
                </div>
              ):(
                <>
                  {/* Thumbnail with lock overlay */}
                  {thumbnailUrl?(
                    <div style={{height:'130px',borderRadius:'var(--radius-md)',overflow:'hidden',marginBottom:'1rem',position:'relative'}}>
                      <img src={thumbnailUrl} alt={videoTitle} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(8,5,6,0.72),transparent)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(0,0,0,0.65)',border:'2px solid rgba(201,162,75,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <Lock size={16} color="var(--gold)"/>
                        </div>
                      </div>
                    </div>
                  ):(
                    <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(201,162,75,0.12)',border:'1px solid rgba(201,162,75,0.25)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'0.875rem'}}>
                      <Lock size={20} color="var(--gold)"/>
                    </div>
                  )}

                  <h2 style={{fontFamily:'var(--font-serif)',fontSize:'1.0625rem',fontWeight:700,marginBottom:'0.5rem',paddingRight:'2rem',lineHeight:1.3}}>{videoTitle}</h2>

                  {/* Price + discount */}
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
                    {activePct>0?(
                      <>
                        <div style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',padding:'0.25rem 0.75rem',background:'rgba(80,200,128,0.1)',border:'1px solid rgba(80,200,128,0.3)',borderRadius:'99px'}}>
                          <span style={{fontSize:'0.875rem',fontWeight:800,color:'#50c880'}}>{naira(discountedPrice)}</span>
                        </div>
                        <span style={{fontSize:'0.8rem',color:'var(--txt-3)',textDecoration:'line-through'}}>{naira(priceKobo)}</span>
                        <div style={{display:'inline-flex',alignItems:'center',gap:'0.25rem',padding:'0.15rem 0.5rem',background:'rgba(80,200,128,0.1)',border:'1px solid rgba(80,200,128,0.25)',borderRadius:'99px'}}>
                          <Zap size={9} color="#50c880"/><span style={{fontSize:'0.65rem',fontWeight:800,color:'#50c880'}}>{activePct}% OFF</span>
                        </div>
                      </>
                    ):(
                      <div style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',padding:'0.25rem 0.75rem',background:'rgba(201,162,75,0.1)',border:'1px solid rgba(201,162,75,0.25)',borderRadius:'99px'}}>
                        <span style={{fontSize:'0.875rem',fontWeight:700,color:'var(--gold)'}}>Unlock for {naira(priceKobo)}</span>
                      </div>
                    )}
                  </div>

                  {/* Value framing */}
                  <p style={{fontSize:'0.72rem',color:'var(--txt-3)',marginBottom:'0.5rem'}}>
                    {naira(discountedPrice)} · {Math.round(discountedPrice/100/30)<100?`Less than ₦${Math.round(discountedPrice/100/30)}/day for lasting impact`:'One-time investment in yourself'}
                  </p>

                  {/* Social proof */}
                  {purchaseCount>0&&(
                    <div style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',padding:'0.2rem 0.625rem',background:'rgba(80,200,128,0.08)',border:'1px solid rgba(80,200,128,0.2)',borderRadius:'99px',marginBottom:'0.25rem'}}>
                      <Users size={10} color="#50c880"/>
                      <span style={{fontSize:'0.68rem',fontWeight:600,color:'#50c880'}}>{purchaseCount} student{purchaseCount!==1?'s':''} unlocked this</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {!unlocking&&(
              <div style={{padding:'1rem 1.5rem 1.375rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>

                {/* Error state */}
                {payMode==='error'&&(
                  <div style={{padding:'0.75rem',background:'rgba(220,60,60,0.08)',border:'1px solid rgba(220,60,60,0.25)',borderRadius:'var(--radius-sm)',color:'#e07070',fontSize:'0.85rem'}}>{message}</div>
                )}

                {/* Outcomes — what you'll gain */}
                {outcomes&&outcomes.length>0&&(
                  <div style={{padding:'0.875rem 1rem',background:'rgba(201,162,75,0.05)',border:'1px solid rgba(201,162,75,0.15)',borderRadius:'var(--radius-md)'}}>
                    <p style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.5rem',display:'flex',alignItems:'center',gap:'0.375rem'}}>
                      <Target size={11}/>What you'll gain
                    </p>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                      {outcomes.slice(0,4).map((o,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'0.5rem'}}>
                          <CheckCircle size={12} color="#50c880" style={{flexShrink:0,marginTop:'1px'}}/>
                          <span style={{fontSize:'0.8rem',color:'var(--txt-2)',lineHeight:1.5}}>{o}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locked lessons */}
                {lessons&&lessons.length>0&&(
                  <div style={{padding:'0.875rem 1rem',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)'}}>
                    <p style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--txt-3)',marginBottom:'0.625rem'}}>🔒 Unlock to access all lessons</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                      {lessons.slice(0,5).map((l,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.375rem 0.5rem',borderRadius:'6px',background:'rgba(255,255,255,0.02)'}}>
                          <Lock size={10} color="var(--txt-3)" style={{flexShrink:0}}/>
                          <span style={{fontSize:'0.78rem',color:'var(--txt-3)'}}>{l}</span>
                        </div>
                      ))}
                      {lessons.length>5&&<p style={{fontSize:'0.7rem',color:'var(--txt-3)',paddingLeft:'1.25rem'}}>+{lessons.length-5} more lessons inside</p>}
                    </div>
                  </div>
                )}

                {/* Coupon toggle */}
                <div style={{borderRadius:'var(--radius-md)',border:'1px solid var(--border)',overflow:'hidden'}}>
                  <button onClick={()=>setShowCoupon(s=>!s)}
                    style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.625rem 1rem',background:'transparent',border:'none',cursor:'pointer',color:'var(--txt-2)',fontSize:'0.8rem',fontWeight:600}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <Tag size={13} color={couponPct>0?'#50c880':'var(--txt-3)'}/>
                      {couponPct>0?<span style={{color:'#50c880'}}>Coupon: {couponPct}% off</span>:'Have a coupon code?'}
                    </div>
                    <ChevronDown size={13} style={{transform:showCoupon?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
                  </button>
                  {showCoupon&&(
                    <div style={{padding:'0 1rem 0.875rem',borderTop:'1px solid var(--border)',paddingTop:'0.75rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                      {couponPct>0?(
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.625rem 0.875rem',background:'rgba(80,200,128,0.08)',border:'1px solid rgba(80,200,128,0.25)',borderRadius:'var(--radius-sm)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><CheckCircle size={13} color="#50c880"/><span style={{fontSize:'0.85rem',fontWeight:700,color:'#50c880'}}>{couponMsg}</span></div>
                          <button onClick={()=>{setCouponId(null);setCouponPct(0);setCouponCode('');setCouponMsg('');setCouponErr('')}} style={{background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',fontSize:'0.72rem',textDecoration:'underline'}}>Remove</button>
                        </div>
                      ):(
                        <div style={{display:'flex',gap:'0.5rem'}}>
                          <input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&applyCoupon()} placeholder="ENTER CODE" className="fi" style={{flex:1,textTransform:'uppercase',letterSpacing:'0.08em',fontSize:'0.85rem'}}/>
                          <button onClick={applyCoupon} disabled={couponBusy||!couponCode.trim()} className="btn btn-gold btn-sm" style={{flexShrink:0,opacity:couponBusy?.7:1}}>
                            {couponBusy?<RefreshCw size={13} style={{animation:'spin 0.8s linear infinite'}}/>:'Apply'}
                          </button>
                        </div>
                      )}
                      {couponErr&&<p style={{fontSize:'0.78rem',color:'#e07070'}}>{couponErr}</p>}
                    </div>
                  )}
                </div>

                {/* Wallet CTA */}
                <div style={{padding:'1rem',background:'var(--bg-1)',border:`1.5px solid ${canAfford?'rgba(201,162,75,0.3)':'var(--border)'}`,borderRadius:'var(--radius-md)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.625rem',flexWrap:'wrap',gap:'0.375rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <Wallet size={14} color="var(--gold)"/>
                      <span style={{fontWeight:700,fontSize:'0.85rem',color:'var(--txt-1)'}}>Pay with Wallet</span>
                    </div>
                    <span style={{fontSize:'0.75rem',fontWeight:700,color:canAfford?'#50c880':'#e07070',background:canAfford?'rgba(80,200,128,0.1)':'rgba(220,60,60,0.08)',padding:'0.15rem 0.5rem',borderRadius:'99px'}}>
                      Balance: {naira(walletBalance)}
                    </span>
                  </div>
                  {canAfford?(
                    <button onClick={buyWithWallet} disabled={busy} className="btn btn-gold" style={{width:'100%',justifyContent:'center',opacity:busy?.7:1}}>
                      {busy?<><RefreshCw size={13} style={{animation:'spin 0.8s linear infinite'}}/>Processing…</>:<><Wallet size={13}/>Unlock with Wallet — {naira(discountedPrice)}</>}
                    </button>
                  ):(
                    <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                      <p style={{fontSize:'0.8rem',color:'var(--txt-2)',lineHeight:1.5}}>You need <strong style={{color:'var(--gold)'}}>{naira(shortfall)}</strong> more to unlock.</p>
                      <button onClick={()=>onFundWallet(suggestedTop*100)}
                        style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',padding:'0.4375rem 0.875rem',borderRadius:'var(--radius-sm)',border:'1.5px solid rgba(201,162,75,0.4)',background:'rgba(201,162,75,0.08)',color:'var(--gold)',fontSize:'0.8rem',fontWeight:700,cursor:'pointer',width:'fit-content',transition:'background 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(201,162,75,0.15)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(201,162,75,0.08)'}>
                        <Plus size={13}/>Add {naira(suggestedTop*100)} to Wallet
                      </button>
                    </div>
                  )}
                </div>

                <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                  <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
                  <span style={{fontSize:'0.68rem',color:'var(--txt-3)',fontWeight:600}}>OR</span>
                  <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
                </div>

                <button onClick={buyWithPaystack} disabled={busy} className="btn btn-ghost" style={{justifyContent:'center',width:'100%',gap:'0.5rem',opacity:busy?.7:1}}>
                  <CreditCard size={14}/>Get Instant Access — {naira(discountedPrice)} <ArrowRight size={13}/>
                </button>

                {previewSrc&&(
                  <button onClick={()=>setPhase('preview')} style={{background:'none',border:'none',color:'var(--txt-3)',fontSize:'0.75rem',cursor:'pointer',textAlign:'center',textDecoration:'underline'}}>← Watch preview again</button>
                )}

                <div style={{textAlign:'center',display:'flex',flexDirection:'column',gap:'0.25rem'}}>
                  <p style={{fontSize:'0.68rem',color:'var(--txt-3)'}}>🔒 Secured by Paystack · Instant access after payment</p>
                  <a href={`https://wa.me/2349018053015?text=${encodeURIComponent(`Hello Coach Precious! I just paid for "${videoTitle}" on SCSI Academy and need guidance.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{fontSize:'0.7rem',color:'#25D366',textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'0.3rem',opacity:0.85}}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Need guidance? Chat with Coach
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes pulseRing{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}`}</style>
    </div>
  )
}
