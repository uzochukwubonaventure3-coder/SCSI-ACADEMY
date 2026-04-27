'use client'


import { useState } from 'react'
import { ArrowRight, CheckCircle, Clock, MessageCircle, BookOpen } from 'lucide-react'
import { submitRefineryRegistration } from '@/lib/api'
import type { SessionTime } from '@/types'

export default function RefineryPage() {
  const [form, setForm] = useState({
    fullName: '',
    levelOrProfession: '',
    primaryGoal: '',
    biggestHurdle: '',
    whatsappNumber: '',
    preferredSession: 'Morning Cohort' as SessionTime,
    email: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await submitRefineryRegistration(form)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1.125rem',
    background: 'var(--bg-0)',
    border: '1px solid var(--border)',
    color: 'var(--txt-1)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '0.5rem',
    display: 'block',
  }

  if (status === 'success') {
    return (
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '7rem 1.5rem 4rem',
          background: 'linear-gradient(135deg, #0D0A0A 0%, #1A0808 100%)',
        }}
      >
        <div style={{ maxWidth: '640px', width: '100%', textAlign: 'center' }}>
          {/* Confirmation content */}
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'rgba(212,175,55,0.1)',
              border: '2px solid rgba(212,175,55,0.5)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
            }}
          >
            <CheckCircle size={36} style={{ color: 'var(--gold)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '0.75rem' }}>
            Application Received.
          </h1>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 600, fontStyle: 'italic', color: 'var(--gold)', marginBottom: '1.5rem' }}>
            Your Transformation Has Begun.
          </h2>
          <p style={{ color: 'var(--txt-2)', lineHeight: 1.85, fontSize: '1rem', marginBottom: '3rem' }}>
            By filling out this form, you have already done what 90% of people fail to do: you have acknowledged that your current "Busy" cycle isn't enough.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', textAlign: 'left' }}>
            {[
              { icon: <CheckCircle size={18} />, title: 'Diagnostic Review', desc: 'Our team will review your application to ensure you are a fit for this high-intensity cohort.' },
              { icon: <Clock size={18} />, title: 'Interview Link', desc: 'If selected, you will receive a WhatsApp message within 24–48 hours to schedule a 10-minute diagnostic call.' },
              { icon: <BookOpen size={18} />, title: 'Onboarding Kit', desc: 'Once cleared, you will receive your official SCSI Mentorship Manual to begin your pre-class study.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{title}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--txt-2)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href="https://wa.me/2349018053015"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold"
            style={{ textDecoration: 'none', justifyContent: 'center', display: 'inline-flex', width: '100%', maxWidth: '360px' }}
          >
            <MessageCircle size={15} /> Join the Private Channel
          </a>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Hero */}
      <section
        style={{
          paddingTop: '120px',
          paddingBottom: '0',
          background: 'linear-gradient(135deg, #2d0505 0%, #6b0f0f 60%, #1A0808 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '500px', height: '500px', border: '1px solid rgba(212,175,55,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 1.5rem 5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem', padding: '0.375rem 0.875rem', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4AF37', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#D4AF37' }}>
                Limited Spots · Next Cohort Starting Soon
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.05, color: '#FDFAF5', marginBottom: '1.25rem' }}>
              Enter<br />The Refinery
            </h1>
            <p style={{ color: 'rgba(253,250,245,0.75)', fontSize: '1.0625rem', lineHeight: 1.85, marginBottom: '2rem', maxWidth: '480px' }}>
              The SCSI Mentorship Class is a high-intensity, structured environment designed for students and young leaders who are tired of being "average." This is not a classroom—it is a laboratory.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                'The Mindset Audit — identify your Operational Blindness',
                'Strategic Architecture — build your daily execution map',
                'The Voice of Authority — master communication & influence',
                'Elite Community — network with serious high-achievers',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <CheckCircle size={15} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '3px' }} />
                  <p style={{ fontSize: '0.9rem', color: 'rgba(253,250,245,0.8)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coach quote */}
          <div style={{ padding: '2.5rem', background: 'rgba(13,10,10,0.6)', border: '1px solid rgba(212,175,55,0.2)', backdropFilter: 'blur(8px)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontStyle: 'italic', lineHeight: 1.8, color: '#FDFAF5', marginBottom: '1.75rem' }}>
              "I don't mentor everyone. I only mentor those who are brave enough to face the truth about their progress. If you are ready to put in the surgical work required to change your life, I am ready to show you the way. Space in the Refinery is limited—apply with intention."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                👤
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FDFAF5' }}>Eze Tochukwu Precious</p>
                <p style={{ fontSize: '0.75rem', color: '#D4AF37', letterSpacing: '0.1em' }}>Lead Coach · SCSI Academy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="section" style={{ background: 'var(--bg-0)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, marginBottom: '0.75rem' }}>
              Registration Form
            </h2>
            <p style={{ color: 'var(--txt-2)' }}>
              Apply for the next cohort. Fill out every field with intention.
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '3rem', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input name="fullName" required value={form.fullName} onChange={handle} placeholder="Your full name" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={labelStyle}>Current Level / Profession</label>
                <input name="levelOrProfession" required value={form.levelOrProfession} onChange={handle} placeholder="e.g. 400-Level Student" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Primary Goal</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                What is the one big result you want to achieve in the next 90 days?
              </p>
              <textarea name="primaryGoal" required value={form.primaryGoal} onChange={handle} rows={3} placeholder="Describe your 90-day goal..." style={{ ...inputStyle, resize: 'vertical' as const }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div>
              <label style={labelStyle}>Biggest Hurdle</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                What is the main thing currently stopping you from moving forward?
              </p>
              <textarea name="biggestHurdle" required value={form.biggestHurdle} onChange={handle} rows={3} placeholder="Be honest. This is your safe space..." style={{ ...inputStyle, resize: 'vertical' as const }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>WhatsApp Number</label>
                <input name="whatsappNumber" required value={form.whatsappNumber} onChange={handle} placeholder="+234 xxx xxx xxxx" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={labelStyle}>Preferred Session Time</label>
                <select
                  name="preferredSession"
                  value={form.preferredSession}
                  onChange={handle}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="Morning Cohort">Morning Cohort</option>
                  <option value="Evening Cohort">Evening Cohort</option>
                </select>
              </div>
            </div>

            {/* Email for follow-up broadcasts */}
            <div>
              <label style={labelStyle}>
                Email Address <span style={{ opacity: 0.6, fontWeight: 400 }}>(for programme updates)</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handle}
                placeholder="your@email.com"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {status === 'error' && (
              <p style={{ color: '#f07070', fontSize: '0.875rem' }}>
                Something went wrong. Please try WhatsApp instead.
              </p>
            )}

            <button type="submit" disabled={status === 'loading'} className="btn btn-gold" style={{ justifyContent: 'center', padding: '1.125rem', fontSize: '0.875rem', opacity: status === 'loading' ? 0.7 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
              {status === 'loading' ? 'Submitting Application...' : <>Secure My Seat in the Refinery <ArrowRight size={15} /></>}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)', textAlign: 'center' as const, fontStyle: 'italic' }}>
              By applying, you commit to showing up. Space is limited and intentional.
            </p>
          </form>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </>
  )
}
