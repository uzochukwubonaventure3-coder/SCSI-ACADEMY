'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Crown, CheckCircle, RefreshCw, Users, Zap, Brain, Check } from 'lucide-react'
import axios from 'axios'
import { useAccess } from '@/hooks/useAccess'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadPaystack } from '@/utils/paystack'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

declare global {
  interface Window {
    PaystackPop: { setup:(c:{key:string;email:string;amount:number;ref:string;currency:string;onClose:()=>void;callback:(r:{reference:string})=>void})=>{openIframe:()=>void} }
  }
}

interface Plan {
  id: string; label: string; price: number; displayPrice: string
  description: string; badge: string|null; savingsBadge: string|null
  durationDays: number; durationLabel: string; includesAllVideos: boolean
}

const PLAN_ICONS: Record<string,React.ReactNode> = {
  academy:       <Users size={20}/>,
  '1on1_monthly':  <Brain size={20}/>,
  '1on1_3months':  <Zap size={20}/>,
  '1on1_6months':  <Crown size={20}/>,
}
const PLAN_COLORS: Record<string,string> = {
  academy:       '#5B5BD6',
  '1on1_monthly':  '#C9A24B',
  '1on1_3months':  '#50c880',
  '1on1_6months':  '#E89B1A',
}
const PLAN_FEATURES: Record<string,string[]> = {
  academy: ['Weekly group coaching sessions', 'Access to curriculum & resources', 'Community of high-achievers', 'Certificate of completion', 'Video category unlocks at ₦2,000 each'],
  '1on1_monthly': ['Private 1-on-1 sessions', 'Personalized life audit', 'Weekly action plans', 'Rapid problem solving', 'Video category unlocks at ₦2,000 each'],
  '1on1_3months': ['All 1-on-1 Monthly benefits', 'Subconscious reengineering', 'Mid-point evaluation at week 6', 'Crisis support via chat', '✅ ALL video categories included FREE'],
  '1on1_6months': ['All 3-Month benefits', 'Total identity transformation', '2-year & 5-year life roadmap', 'Elite VIP access', '✅ ALL video categories included FREE'],
}

export default function SignupPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const planFromUrl  = searchParams?.get('plan')
  const { setAccessFromPayment, hasAccess } = useAccess()
  const [plans, setPlans]             = useState<Plan[]>([])
  const [selected, setSelected]       = useState<Plan|null>(null)
  const [step, setStep]               = useState<'plan'|'details'>(hasAccess ? 'details' : 'plan')
  const [form, setForm]               = useState({ fullName:'', email:'', password:'', confirmPassword:'' })
  const [showPw, setShowPw]           = useState({ p:false, c:false })
  const [busy, setBusy]               = useState(false)
  const [msg, setMsg]                 = useState('')
  const [msgOk, setMsgOk]             = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)

  const pwMatch   = form.password && form.confirmPassword && form.password === form.confirmPassword
  const pwNoMatch = form.confirmPassword && form.password !== form.confirmPassword

  useEffect(() => {
    if (hasAccess) { router.replace('/content'); return }
    axios.get(`${API}/api/paywall/plans`).then(r => {
      const data: Plan[] = r.data.data
      setPlans(data)
      // Pre-select plan from URL (?plan=1on1_6months) or default to best value
      const matchedPlan = planFromUrl ? data.find((p: Plan) => p.id === planFromUrl) : null
      const defaultPlan = data.find((p: Plan) => p.id === '1on1_6months') ?? data[0]
      const chosenPlan  = matchedPlan ?? defaultPlan
      setSelected(chosenPlan)
      // If plan came from URL, jump straight to account details step
      if (planFromUrl && matchedPlan) setStep('details')
    }).catch(() => {
      const fallback: Plan[] = [
        { id:'academy',       label:'SCSI Mentorship Academy',         price:1500000, displayPrice:'₦15,000', description:'Group coaching + community.',                           badge:null,           savingsBadge:null,              durationDays:30,  durationLabel:'1 Month',  includesAllVideos:false },
        { id:'1on1_monthly',  label:'One-on-One Mentorship',           price:1500000, displayPrice:'₦15,000', description:'Private 1-on-1 coaching.',                              badge:'Deep Dive',    savingsBadge:null,              durationDays:30,  durationLabel:'1 Month',  includesAllVideos:false },
        { id:'1on1_3months',  label:'One-on-One Coaching — 3 Months',  price:4000000, displayPrice:'₦40,000', description:'3 months + all video categories unlocked.',              badge:'Consistency',  savingsBadge:'Save ₦5,000',     durationDays:90,  durationLabel:'3 Months', includesAllVideos:true  },
        { id:'1on1_6months',  label:'One-on-One Coaching — 6 Months',  price:6000000, displayPrice:'₦60,000', description:'Total transformation + all video categories for free.',  badge:'Legacy Builder',savingsBadge:'BEST VALUE — Save 33%', durationDays:180, durationLabel:'6 Months', includesAllVideos:true  },
      ]
      setPlans(fallback)
      setSelected(fallback[3])
    })
  }, [hasAccess, router])

  const pay = async () => {
    if (!selected) return
    if (!form.fullName.trim() || !form.email.trim()) { setMsg('Please fill in all fields.'); setMsgOk(false); return }
    if (form.password !== form.confirmPassword) { setMsg('Passwords do not match.'); setMsgOk(false); return }
    if (form.password.length < 6) { setMsg('Password must be at least 6 characters.'); setMsgOk(false); return }
    setBusy(true); setMsg('')
    try {
      const { data } = await axios.post(`${API}/api/paywall/register`, {
        fullName: form.fullName, email: form.email, password: form.password, plan: selected.id
      })
      if (!data.success) { setMsg(data.message); setMsgOk(false); setBusy(false); return }
      if (!data.paystackKey) { setMsg('Paystack public key is missing on the server.'); setMsgOk(false); setBusy(false); return }

      const paystack = await loadPaystack()
      if (!paystack || typeof paystack.setup !== 'function') {
        setMsg('Payment system not ready. Please refresh the page.')
        setMsgOk(false)
        setBusy(false)
        return
      }

      const handlePaymentCallback = (res: { reference: string }) => {
        void (async () => {
          setMsg('Verifying payment…'); setMsgOk(true)
          try {
            const v = await axios.post(`${API}/api/paywall/verify`, { reference: res.reference })
            if (v.data.success) {
              setMsg(`Welcome to SCSI Academy! ${selected.durationLabel} of access unlocked.`)
              setMsgOk(true)
              setShowWhatsApp(true)
              if (typeof setAccessFromPayment === 'function') setAccessFromPayment(v.data.token)
              setTimeout(() => router.push('/content'), 4500)
            } else { setMsg('Verification failed. Contact support.'); setMsgOk(false) }
          } catch { setMsg('Verification error. Contact support.'); setMsgOk(false) }
          setBusy(false)
        })()
      }

      const handler = paystack.setup({
        key:      data.paystackKey,
        email:    data.email,
        amount:   data.amountKobo,
        ref:      data.reference,
        currency: 'NGN',
        onClose:  () => { setMsg('Payment closed. Click Pay to complete your subscription.'); setMsgOk(false); setBusy(false) },
        callback: handlePaymentCallback,
      })
      handler.openIframe()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string; code?: string }
      const fallback = err.message === 'Network Error'
        ? `Cannot reach the server at ${API}. Check NEXT_PUBLIC_API_URL or backend availability.`
        : err.message
      setMsg(err.response?.data?.message || fallback || 'Something went wrong.')
      setMsgOk(false)
      setBusy(false)
    }
  }

  const isBestValue = (p: Plan) => p.id === '1on1_6months'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-0)', paddingTop:'80px', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'2rem 1.25rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <p className="eyebrow">Join SCSI Academy</p>
          <h1 className="h-serif" style={{ fontSize:'clamp(1.75rem,4vw,2.5rem)', fontWeight:700, marginBottom:'0.5rem' }}>
            Choose Your <span className="grad-text">Transformation</span>
          </h1>
          <p style={{ color:'var(--txt-3)', fontSize:'0.9375rem' }}>
            Already have an account? <Link href="/login" style={{ color:'var(--gold)', textDecoration:'none', fontWeight:600 }}>Log in →</Link>
          </p>
        </div>

        {/* STEP 1 — Plan selection */}
        {step === 'plan' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,210px),1fr))', gap:'1rem', marginBottom:'2rem' }}>
              {plans.map(plan => {
                const active = selected?.id === plan.id
                const color  = PLAN_COLORS[plan.id] || 'var(--gold)'
                const bv     = isBestValue(plan)
                return (
                  <button key={plan.id} onClick={() => setSelected(plan)}
                    style={{ textAlign:'left', background:'var(--bg-2)', border:`2px solid ${active ? color : 'var(--border)'}`, borderRadius:'16px', padding:0, cursor:'pointer', overflow:'hidden', transition:'all 0.2s', position:'relative',
                      boxShadow: active ? `0 0 0 1px ${color}44, 0 8px 24px rgba(0,0,0,0.18)` : 'none' }}>
                    {bv && <div style={{ background:color, padding:'0.375rem', textAlign:'center', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.1em', color:'#080506' }}>⭐ BEST VALUE</div>}
                    {plan.savingsBadge && !bv && (
                      <div style={{ position:'absolute', top:'0.625rem', right:'0.625rem', padding:'0.15rem 0.5rem', background:`${color}22`, border:`1px solid ${color}44`, borderRadius:'99px', fontSize:'0.58rem', fontWeight:700, color }}>
                        {plan.savingsBadge}
                      </div>
                    )}
                    <div style={{ padding:'1.125rem' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color, marginBottom:'0.875rem' }}>
                        {PLAN_ICONS[plan.id]}
                      </div>
                      <p style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color, marginBottom:'0.25rem' }}>{plan.durationLabel}</p>
                      <p style={{ fontFamily:'var(--font-serif)', fontSize:'0.9375rem', fontWeight:700, color:'var(--txt-1)', marginBottom:'0.375rem', lineHeight:1.3 }}>{plan.label}</p>
                      <p style={{ fontFamily:'var(--font-serif)', fontSize:'1.375rem', fontWeight:800, color, lineHeight:1, marginBottom:'0.375rem' }}>{plan.displayPrice}</p>
                      <p style={{ fontSize:'0.75rem', color:'var(--txt-3)', lineHeight:1.5 }}>{plan.description}</p>
                      {active && (
                        <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', marginTop:'0.75rem', padding:'0.3rem 0.625rem', background:`${color}12`, border:`1px solid ${color}33`, borderRadius:'99px', width:'fit-content' }}>
                          <Check size={11} color={color}/><span style={{ fontSize:'0.65rem', fontWeight:700, color }}>Selected</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected plan features */}
            {selected && (
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', marginBottom:'1.5rem', animation:'fadeUp 0.25s ease both' }}>
                <p style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--txt-3)', marginBottom:'0.875rem' }}>
                  What's included in {selected.label}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,240px),1fr))', gap:'0.5rem' }}>
                  {(PLAN_FEATURES[selected.id] || []).map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.5rem' }}>
                      <CheckCircle size={13} color={PLAN_COLORS[selected.id] || 'var(--gold)'} style={{ flexShrink:0, marginTop:'1px' }}/>
                      <span style={{ fontSize:'0.8125rem', color: f.startsWith('✅') ? '#50c880' : 'var(--txt-2)', fontWeight: f.startsWith('✅') ? 700 : 400, lineHeight:1.5 }}>
                        {f.replace('✅ ','')}
                      </span>
                    </div>
                  ))}
                </div>
                {selected.includesAllVideos && (
                  <div style={{ marginTop:'1rem', padding:'0.75rem 1rem', background:'rgba(80,200,128,0.08)', border:'1px solid rgba(80,200,128,0.25)', borderRadius:'10px', fontSize:'0.82rem', color:'#50c880', fontWeight:600 }}>
                    ✅ This plan includes ALL video categories — no separate unlocks needed.
                  </div>
                )}
                {!selected.includesAllVideos && (
                  <div style={{ marginTop:'1rem', padding:'0.75rem 1rem', background:'rgba(201,162,75,0.06)', border:'1px solid rgba(201,162,75,0.18)', borderRadius:'10px', fontSize:'0.82rem', color:'var(--txt-2)', lineHeight:1.5 }}>
                    💡 Video categories can be unlocked individually for ₦2,000 each. Upgrade to 3-Month or 6-Month to get all included.
                  </div>
                )}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'center' }}>
              <button onClick={() => setStep('details')} disabled={!selected}
                className="btn btn-gold" style={{ padding:'1rem 2.5rem', fontSize:'1rem', fontWeight:800, gap:'0.625rem' }}>
                Continue with {selected?.durationLabel || 'selected plan'} <ArrowRight size={16}/>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Account details */}
        {step === 'details' && selected && (
          <div style={{ maxWidth:'480px', margin:'0 auto' }}>
            {/* Plan summary */}
            <button onClick={() => setStep('plan')}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', background:'var(--bg-2)', border:`1.5px solid ${PLAN_COLORS[selected.id]}44`, borderRadius:'12px', marginBottom:'1.5rem', cursor:'pointer', textAlign:'left' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${PLAN_COLORS[selected.id]}18`, display:'flex', alignItems:'center', justifyContent:'center', color:PLAN_COLORS[selected.id], flexShrink:0 }}>
                  {PLAN_ICONS[selected.id]}
                </div>
                <div>
                  <p style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--txt-1)' }}>{selected.label}</p>
                  <p style={{ fontSize:'0.75rem', color:'var(--txt-3)' }}>{selected.durationLabel} · {selected.displayPrice}</p>
                </div>
              </div>
              <span style={{ fontSize:'0.75rem', color:'var(--gold)', fontWeight:600 }}>Change</span>
            </button>

            {/* Form */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1.125rem' }}>
              <h2 className="h-serif" style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'-0.25rem' }}>Create Your Account</h2>

              <div className="fgroup">
                <label className="fl">Full Name</label>
                <input value={form.fullName} onChange={e => setForm(p=>({...p,fullName:e.target.value}))} className="fi" placeholder="Your full name" autoFocus/>
              </div>
              <div className="fgroup">
                <label className="fl">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} className="fi" placeholder="you@example.com"/>
              </div>
              <div className="fgroup" style={{ position:'relative' }}>
                <label className="fl">Password</label>
                <input type={showPw.p?'text':'password'} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} className="fi" placeholder="Min. 6 characters" style={{ paddingRight:'3rem' }}/>
                <button type="button" onClick={()=>setShowPw(p=>({...p,p:!p.p}))} style={{ position:'absolute',right:'0.875rem',bottom:'0.875rem',background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',display:'flex' }}>
                  {showPw.p ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <div className="fgroup" style={{ position:'relative' }}>
                <label className="fl">Confirm Password</label>
                <input type={showPw.c?'text':'password'} value={form.confirmPassword} onChange={e=>setForm(p=>({...p,confirmPassword:e.target.value}))} className="fi" placeholder="Repeat password" style={{ paddingRight:'3rem' }}/>
                <button type="button" onClick={()=>setShowPw(p=>({...p,c:!p.c}))} style={{ position:'absolute',right:'0.875rem',bottom:'0.875rem',background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',display:'flex' }}>
                  {showPw.c ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
                {pwMatch   && <p style={{ marginTop:'0.375rem', fontSize:'0.75rem', color:'#50c880', display:'flex', alignItems:'center', gap:'0.25rem' }}><CheckCircle size={11}/>Passwords match</p>}
                {pwNoMatch && <p style={{ marginTop:'0.375rem', fontSize:'0.75rem', color:'#e07070' }}>Passwords do not match</p>}
              </div>

              {/* WhatsApp CTA (appears after success) */}
              {showWhatsApp && (
                <a href={`https://wa.me/2349018053015?text=${encodeURIComponent(`Hello Coach Precious! I just joined SCSI Academy on the ${selected.label} (${selected.durationLabel}) plan. I am ready to start my transformation!`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 1.125rem', borderRadius:'12px', background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.35)', color:'#25D366', textDecoration:'none', fontWeight:700, fontSize:'0.875rem', animation:'fadeUp 0.4s ease both' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chat with Coach Precious on WhatsApp →
                </a>
              )}

              {msg && (
                <div style={{ padding:'0.875rem 1rem', borderRadius:'10px', background:msgOk?'rgba(80,200,128,0.1)':'rgba(220,60,60,0.1)', border:`1px solid ${msgOk?'rgba(80,200,128,0.3)':'rgba(220,60,60,0.3)'}`, color:msgOk?'#50c880':'#e07070', fontSize:'0.875rem', fontWeight:600 }}>
                  {msg}
                </div>
              )}

              <button onClick={pay} disabled={busy||!!pwNoMatch}
                style={{ width:'100%', padding:'1rem', borderRadius:'12px', border:'none', background:'var(--gold)', color:'#080506', fontFamily:'var(--font-sans)', fontSize:'1rem', fontWeight:800, cursor:(busy||!!pwNoMatch)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', opacity:(busy||!!pwNoMatch)?.7:1, transition:'background 0.15s' }}
                onMouseEnter={e=>{if(!busy&&!pwNoMatch)e.currentTarget.style.background='#d4a93a'}}
                onMouseLeave={e=>e.currentTarget.style.background='var(--gold)'}>
                {busy ? <><RefreshCw size={16} style={{ animation:'spin 0.8s linear infinite' }}/>Processing…</> : `Pay ${selected.displayPrice} & Get Access`}
              </button>

              <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--txt-3)' }}>
                🔒 Secured by Paystack · Cancel anytime
              </p>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
