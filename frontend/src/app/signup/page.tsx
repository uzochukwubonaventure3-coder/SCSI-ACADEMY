'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Crown, CalendarClock, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import { useAccess } from '@/hooks/useAccess'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Plan { id:string; label:string; price:number; displayPrice:string; description:string; badge:string|null; durationDays:number; durationLabel:string }

declare global {
  interface Window { PaystackPop:{ setup:(c:{key:string;email:string;amount:number;ref:string;currency:string;onClose:()=>void;callback:(r:{reference:string})=>void})=>{openIframe:()=>void} } }
}

export default function SignupPage() {
  const router = useRouter()
  const { setAccessFromPayment, hasAccess } = useAccess()
  const [plans, setPlans]     = useState<Plan[]>([])
  const [selected, setSelected] = useState<Plan|null>(null)
  const [form, setForm]       = useState({ fullName:'', email:'', password:'', confirmPassword:'' })
  const [showPw, setShowPw]   = useState({ p:false, c:false })
  const [busy, setBusy]       = useState(false)
  const [msg, setMsg]         = useState('')
  const [msgOk, setMsgOk]     = useState(false)

  const pwMatch = form.password && form.confirmPassword && form.password === form.confirmPassword
  const pwNoMatch = form.confirmPassword && form.password !== form.confirmPassword

  useEffect(() => {
    if (hasAccess) router.replace('/content')
    axios.get(`${API}/api/paywall/plans`).then(r => {
      setPlans(r.data.data)
      setSelected(r.data.data.find((p:Plan)=>p.id==='quarterly') ?? r.data.data[0])
    }).catch(() => {
      const fb:Plan[]=[
        {id:'monthly',label:'Monthly Access',price:1000000,displayPrice:'₦10,000',description:'Full access for 30 days.',badge:null,durationDays:30,durationLabel:'30 days'},
        {id:'quarterly',label:'3-Month Bundle',price:2500000,displayPrice:'₦25,000',description:'Full access for 3 months — save ₦5,000.',badge:'Best Value',durationDays:90,durationLabel:'3 months'},
      ]
      setPlans(fb); setSelected(fb[1])
    })
    const s=document.createElement('script'); s.id='paystack-js'; s.src='https://js.paystack.co/v1/inline.js'; document.head.appendChild(s)
  }, [hasAccess, router])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setMsg('Passwords do not match.'); setMsgOk(false); return }
    if (form.password.length < 6) { setMsg('Password must be at least 6 characters.'); setMsgOk(false); return }
    if (!selected) return
    setBusy(true); setMsg('')
    try {
      const { data } = await axios.post(`${API}/api/paywall/register`, {
        fullName: form.fullName, email: form.email, password: form.password, plan: selected.id
      })
      if (!data.success) { setMsg(data.message); setMsgOk(false); setBusy(false); return }

      const handler = window.PaystackPop.setup({
        key:data.paystackKey, email:data.email, amount:data.amountKobo,
        ref:data.reference, currency:'NGN',
        onClose:()=>{ setMsg('Payment closed. Click Pay to complete your subscription.'); setMsgOk(false); setBusy(false) },
        callback:async(res)=>{
          setMsg('Verifying payment…'); setMsgOk(true)
          try {
            const v=await axios.post(`${API}/api/paywall/verify`,{reference:res.reference})
            if(v.data.success){
              setAccessFromPayment(v.data.accessToken,v.data.user)
              setMsg(`Access unlocked for ${v.data.daysGranted} days! Welcome to the Refinery.`); setMsgOk(true)
              setTimeout(()=>router.push('/content'),1800)
            } else { setMsg('Verification failed. Contact support.'); setMsgOk(false) }
          } catch { setMsg('Verification error. Contact support.'); setMsgOk(false) }
          setBusy(false)
        },
      })
      handler.openIframe()
    } catch(err:unknown) {
      const e=err as {response?:{data?:{message?:string}}}
      setMsg(e.response?.data?.message||'Something went wrong.'); setMsgOk(false); setBusy(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', padding:'7rem 1.25rem 3rem', background:'var(--bg-0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:'520px' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'rgba(201,162,75,0.1)', border:'1.5px solid rgba(201,162,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
            <Crown size={22} color="var(--gold)"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem', fontWeight:700, marginBottom:'0.375rem' }}>Get Full Access</h1>
          <p style={{ color:'var(--txt-3)', fontSize:'0.9rem' }}>Create your account and unlock all content</p>
        </div>

        <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          {/* Plan selector */}
          <div style={{ padding:'1.75rem 1.75rem 0' }}>
            <p className="fl" style={{ marginBottom:'1rem' }}>Choose Your Plan</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.5rem' }}>
              {plans.map(plan => {
                const active = selected?.id === plan.id
                return (
                  <button key={plan.id} onClick={()=>setSelected(plan)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.125rem', background:active?'var(--gold-dim)':'var(--bg-1)', border:`1.5px solid ${active?'rgba(201,162,75,0.5)':'var(--border)'}`, borderRadius:'10px', cursor:'pointer', transition:'all 0.2s', textAlign:'left' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px solid ${active?'var(--gold)':'var(--border)'}`, background:active?'var(--gold)':'transparent', transition:'all 0.2s', flexShrink:0 }}/>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem' }}>
                          <span style={{ fontWeight:700, fontSize:'0.9375rem', color:'var(--txt-1)' }}>{plan.label}</span>
                          {plan.badge && <span className="badge">{plan.badge}</span>}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                          <CalendarClock size={11} color="var(--txt-3)"/>
                          <span style={{ fontSize:'0.75rem', color:'var(--txt-3)' }}>{plan.durationLabel} · {plan.description}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:'0.75rem' }}>
                      <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.25rem', fontWeight:700, color:'var(--gold)' }}>{plan.displayPrice}</div>
                      <div style={{ fontSize:'0.62rem', color:'var(--txt-3)' }}>{plan.id==='monthly'?'per month':'one-time'}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            {selected?.id==='quarterly' && (
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 0.875rem', background:'rgba(201,162,75,0.06)', border:'1px dashed rgba(201,162,75,0.3)', borderRadius:'8px', marginBottom:'1.5rem' }}>
                <CheckCircle size={13} color="var(--gold)"/>
                <span style={{ fontSize:'0.78rem', color:'var(--gold)' }}>You save <strong>₦5,000</strong> vs monthly (₦30,000 total)</span>
              </div>
            )}
          </div>

          <div style={{ height:'1px', background:'var(--border)', margin:'0 1.75rem' }}/>

          {/* Form */}
          <form onSubmit={handlePay} style={{ padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1.125rem' }}>
            <p className="fl" style={{ marginBottom:'-0.25rem' }}>Your Details</p>

            <div className="fgroup">
              <label className="fl">Full Name</label>
              <input required value={form.fullName} className="fi" placeholder="Your full name"
                onChange={e=>setForm(p=>({...p,fullName:e.target.value}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Email Address</label>
              <input type="email" required value={form.email} className="fi" placeholder="you@email.com"
                onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
            </div>

            {/* Password */}
            <div className="fgroup" style={{ position:'relative' }}>
              <label className="fl">Password</label>
              <input type={showPw.p?'text':'password'} required value={form.password} className="fi"
                placeholder="Min. 6 characters" style={{ paddingRight:'3rem' }}
                onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
              <button type="button" onClick={()=>setShowPw(s=>({...s,p:!s.p}))}
                style={{ position:'absolute', right:'0.875rem', bottom:'0.875rem', background:'none', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', lineHeight:0 }}>
                {showPw.p?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>

            {/* Confirm password */}
            <div className="fgroup" style={{ position:'relative' }}>
              <label className="fl">Confirm Password</label>
              <input type={showPw.c?'text':'password'} required value={form.confirmPassword} className="fi"
                placeholder="Repeat your password" style={{ paddingRight:'3rem' }}
                onChange={e=>setForm(p=>({...p,confirmPassword:e.target.value}))}/>
              <button type="button" onClick={()=>setShowPw(s=>({...s,c:!s.c}))}
                style={{ position:'absolute', right:'0.875rem', bottom:'0.875rem', background:'none', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', lineHeight:0 }}>
                {showPw.c?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
              {form.confirmPassword && (
                <p style={{ marginTop:'0.375rem', fontSize:'0.78rem', color:pwMatch?'#50c880':'#e07070', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                  {pwMatch ? <><CheckCircle size={12}/>Passwords match</> : <><XCircle size={12}/>Passwords don't match</>}
                </p>
              )}
            </div>

            {msg && (
              <div style={{ padding:'0.75rem 1rem', background:msgOk?'rgba(201,162,75,0.08)':'rgba(220,60,60,0.08)', border:`1px solid ${msgOk?'rgba(201,162,75,0.3)':'rgba(220,60,60,0.3)'}`, borderRadius:'8px', color:msgOk?'var(--gold)':'#e07070', fontSize:'0.85rem' }}>
                {msg}
              </div>
            )}

            <button type="submit" disabled={busy||!!pwNoMatch} className="btn btn-gold"
              style={{ justifyContent:'center', width:'100%', padding:'0.9375rem', fontSize:'0.875rem', opacity:(busy||!!pwNoMatch)?.7:1 }}>
              {busy
                ? <><RefreshCw size={14} style={{animation:'spin 0.9s linear infinite'}}/>Processing…</>
                : <>Pay {selected?.displayPrice} · Unlock Access <ArrowRight size={14}/></>}
            </button>

            <p style={{ textAlign:'center', fontSize:'0.78rem', color:'var(--txt-3)' }}>
              Already have access?{' '}
              <Link href="/login" style={{ color:'var(--gold)', fontWeight:700 }}>Login →</Link>
            </p>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.72rem', color:'var(--txt-3)' }}>🔒 Secured by Paystack · Instant access after payment · 🇳🇬</p>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
