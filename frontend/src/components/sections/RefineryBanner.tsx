'use client'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'

export default function RefineryBanner() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '6rem 1.25rem', background: 'linear-gradient(135deg, #150305 0%, #2E0808 40%, #3D0F0F 70%, #150305 100%)' }}>
      {/* Grid overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(201,162,75,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,75,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,75,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,26,26,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="wrap-sm" style={{ position: 'relative', textAlign: 'center' }}>
        {/* Pulse dot */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', background: 'rgba(201,162,75,0.1)', border: '1px solid rgba(201,162,75,0.3)', borderRadius: '99px', marginBottom: '1.75rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 1.5s ease infinite', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Limited Spots · Next Cohort Starting Soon
          </span>
        </div>

        <h2 className="h-serif" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 700, color: '#F0E6D0', lineHeight: 1.1, marginBottom: '1.25rem' }}>
          Are You Ready to Enter<br />
          <span className="grad-text">The Refinery?</span>
        </h2>

        <p style={{ fontSize: 'clamp(0.9375rem,1.5vw,1.0625rem)', color: 'rgba(240,230,208,0.72)', lineHeight: 1.85, marginBottom: '2.5rem', maxWidth: '560px', margin: '0 auto 2.5rem' }}>
          Don't just work harder — work smarter. The SCSI Mentorship Class is a high-intensity environment for students and young leaders who are tired of being average.{' '}
          <strong style={{ color: '#F0E6D0' }}>Space is limited.</strong>
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', justifyContent: 'center' }}>
          <Link href="/refinery" className="btn btn-gold" style={{ padding: '0.9375rem 2.25rem', fontSize: '0.875rem', textDecoration: 'none' }}>
            Secure My Seat <ArrowRight size={15}/>
          </Link>
          <a href="https://wa.me/2349018053015" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9375rem 2.25rem', background: 'transparent', color: '#F0E6D0', border: '1.5px solid rgba(240,230,208,0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,230,208,0.6)'; e.currentTarget.style.background = 'rgba(240,230,208,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,230,208,0.25)'; e.currentTarget.style.background = 'transparent' }}>
            <MessageCircle size={15}/> Join WhatsApp Channel
          </a>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(240,230,208,0.35)', fontStyle: 'italic' }}>
          All sessions handled with strict professional confidentiality.
        </p>
      </div>
    </section>
  )
}
