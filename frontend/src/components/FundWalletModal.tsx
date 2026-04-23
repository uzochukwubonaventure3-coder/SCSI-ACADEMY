'use client'
import { useState, useEffect } from 'react'
import { X, Wallet, RefreshCw, CheckCircle, Sparkles } from 'lucide-react'
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

const PRESETS = [100000, 200000, 500000, 1000000] // ₦1k, ₦2k, ₦5k, ₦10k
const naira = (k: number) => `₦${(k / 100).toLocaleString('en-NG')}`

interface Props {
  userEmail:            string
  token:                string
  suggestedAmountKobo?: number
  onClose:              () => void
  onFunded:             (newBalance: number) => void
}

export default function FundWalletModal({ userEmail, token, suggestedAmountKobo, onClose, onFunded }: Props) {
  const [amount,  setAmount]  = useState(suggestedAmountKobo ? String(suggestedAmountKobo / 100) : '')
  const [busy,    setBusy]    = useState(false)
  const [status,  setStatus]  = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [newBal,  setNewBal]  = useState(0)

  useEffect(() => {
    if (suggestedAmountKobo) setAmount(String(suggestedAmountKobo / 100))
  }, [suggestedAmountKobo])

  const kobo  = () => Math.round(parseFloat(amount || '0') * 100)
  const isMin = kobo() >= 10000

  const fund = async (): Promise<void> => {
    const k = kobo()
    if (k < 10000) { setStatus('error'); setMessage('Minimum is ₦100'); return }
    setBusy(true); setStatus('idle')

    try {
      const { data } = await axios.post(
        `${API}/api/wallet/fund/initialize`,
        { amount_kobo: k },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!data.success) throw new Error(data.message)
      if (!data.paystackKey) throw new Error('Paystack public key is missing on the server')

      const paystack = await loadPaystack()
      if (!paystack || typeof paystack.setup !== 'function') {
        throw new Error('Payment system unavailable. Please refresh the page and try again.')
      }

      const handlePaymentCallback = (res: { reference: string }) => {
        void (async () => {
          setStatus('success'); setMessage('Verifying…')
          try {
            const verify = await axios.post(
              `${API}/api/wallet/fund/verify`,
              { reference: res.reference },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            if (verify.data.success) {
              setNewBal(verify.data.new_balance)
              setMessage(`Wallet credited with ${naira(verify.data.amount_kobo)}!`)
              onFunded(verify.data.new_balance)
            } else if (verify.data.alreadyProcessed) {
              setMessage('Already credited.')
            }
          } catch {
            setStatus('error'); setMessage('Verification failed. Contact support.')
          }
          setBusy(false)
        })()
      }

      const handler = paystack.setup({
        key:      data.paystackKey,
        email:    data.email || userEmail,
        amount:   data.amountKobo,
        ref:      data.reference,
        currency: 'NGN',
        onClose:  () => { setStatus('error'); setMessage('Payment was not completed.'); setBusy(false) },
        callback: handlePaymentCallback,
      })
      handler.openIframe()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setMessage(err.response?.data?.message || err.message || 'Failed to initialize payment')
      setStatus('error')
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Static modal — no internal scroll */}
      <div style={{ width: '100%', maxWidth: '360px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '20px', animation: 'fadeUp 0.3s ease both' }}>

        {/* Header */}
        <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={17} color="var(--gold)"/>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Fund Wallet</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}>
            <X size={17}/>
          </button>
        </div>

        <div style={{ padding: '1.125rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '1.25rem 0' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(80,200,128,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
                <CheckCircle size={26} color="#50c880"/>
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--txt-1)', marginBottom: '0.25rem' }}>{message}</p>
              {newBal > 0 && <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginBottom: '1rem' }}>New balance: <strong style={{ color: 'var(--gold)' }}>{naira(newBal)}</strong></p>}
              <button onClick={onClose} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>Done</button>
            </div>
          ) : (
            <>
              {/* Suggested banner */}
              {suggestedAmountKobo && (
                <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(201,162,75,0.07)', border: '1px solid rgba(201,162,75,0.22)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={13} color="var(--gold)" style={{ flexShrink: 0 }}/>
                  <p style={{ fontSize: '0.78rem', color: 'var(--txt-2)', lineHeight: 1.4, margin: 0 }}>
                    Top up <strong style={{ color: 'var(--gold)' }}>{naira(suggestedAmountKobo)}</strong> to unlock the video.
                  </p>
                </div>
              )}

              {/* Presets — compact 4-grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.375rem' }}>
                {PRESETS.map(k => (
                  <button key={k} onClick={() => setAmount(String(k / 100))}
                    style={{ padding: '0.5rem 0.25rem', borderRadius: '8px', border: `1.5px solid ${amount === String(k/100) ? 'var(--gold)' : 'var(--border)'}`, background: amount === String(k/100) ? 'var(--gold-dim)' : 'var(--bg-1)', color: amount === String(k/100) ? 'var(--gold)' : 'var(--txt-2)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                    {naira(k)}
                  </button>
                ))}
              </div>

              {/* Custom input — compact */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem', color: 'var(--txt-3)', fontWeight: 700, pointerEvents: 'none' }}>₦</span>
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="fi" placeholder="Other amount" min="100" step="100"
                    style={{ paddingLeft: '1.75rem' }}
                  />
                </div>
              </div>

              {status === 'error' && (
                <p style={{ fontSize: '0.8rem', color: '#e07070', background: 'rgba(220,60,60,0.06)', border: '1px solid rgba(220,60,60,0.2)', borderRadius: '8px', padding: '0.625rem 0.75rem', margin: 0 }}>{message}</p>
              )}

              <button onClick={fund} disabled={busy || !isMin} className="btn btn-gold"
                style={{ justifyContent: 'center', width: '100%', opacity: (busy || !isMin) ? .6 : 1 }}>
                {busy
                  ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }}/>Processing…</>
                  : `Fund ${isMin ? naira(kobo()) : 'Wallet'}`}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--txt-3)', margin: 0 }}>
                🔒 Secured by Paystack
              </p>
            </>
          )}
        </div>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  )
}
