'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('scsi_cookie_consent')
    if (!consent) setTimeout(() => setShow(true), 1500)
  }, [])

  const accept = () => {
    localStorage.setItem('scsi_cookie_consent', 'accepted')
    setShow(false)
  }
  const decline = () => {
    localStorage.setItem('scsi_cookie_consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 998,
      width: 'min(560px, calc(100vw - 2rem))',
      background: 'rgba(22,10,12,0.96)',
      border: '1px solid rgba(201,162,75,0.2)',
      borderRadius: '14px',
      padding: '1.25rem 1.5rem',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.4s cubic-bezier(.4,0,.2,1) both',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--txt-1)', fontWeight: 600, marginBottom: '0.25rem' }}>
          🍪 We use cookies
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', lineHeight: 1.6 }}>
          We use cookies to improve your experience. By continuing, you agree to our{' '}
          <Link href="/privacy" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
        <button onClick={decline} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--txt-3)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
          Decline
        </button>
        <button onClick={accept} style={{ padding: '0.5rem 1.125rem', background: 'var(--gold)', border: 'none', borderRadius: '7px', color: '#080506', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
          Accept All
        </button>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  )
}
