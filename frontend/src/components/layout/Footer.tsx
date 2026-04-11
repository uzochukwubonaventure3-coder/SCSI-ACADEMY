'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, ExternalLink, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const navLinks = [
  { href: '/',         label: 'Home'    },
  { href: '/about',    label: 'About'   },
  { href: '/services', label: 'Services'},
  { href: '/content', label: 'Content'    },
  { href: '/videos',   label: 'Videos'  },
  { href: '/gallery',  label: 'Gallery' },
  { href: '/contact',  label: 'Contact' },
]

const serviceLinks = [
  { href: '/services#mindset',   label: 'Mindset Engineering'   },
  { href: '/services#academic',  label: 'Academic Counseling'   },
  { href: '/services#speaking',  label: 'Public Speaking'       },
  { href: '/services#workshops', label: 'Leadership Workshops'  },
  { href: '/services#branding',  label: 'Professional Branding' },
  { href: '/services#healing',   label: 'Trauma Recovery'       },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subMsg, setSubMsg] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/api/newsletter`, { email })
      setSubMsg('Subscribed! Mindset Audits incoming.')
      setEmail('')
    } catch {
      setSubMsg('Already subscribed or error. Try again.')
    }
  }

  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>

      {/* Newsletter strip */}
      <div style={{ background: 'linear-gradient(135deg, #1A0808 0%, #2E1010 50%, #1A0808 100%)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '3.5rem 1.25rem' }}>
        <div className="wrap" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ justifyContent: 'center' }}>The Refinery Newsletter</p>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.375rem, 3vw, 1.875rem)', fontWeight: 700, color: '#F5EDD8', marginBottom: '0.5rem' }}>
            Weekly Mindset Audits
          </h3>
          <p style={{ color: '#9A7860', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Surgical insights for high-achievers. No fluff.
          </p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0', maxWidth: '420px', margin: '0 auto' }}>
            <input
              type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              style={{ flex: 1, padding: '0.875rem 1.125rem', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(201,168,76,0.25)', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#F5EDD8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '0.875rem 1.25rem', background: 'var(--gold)', color: '#0D0A0A', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Subscribe
            </button>
          </form>
          {subMsg && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--gold)' }}>{subMsg}</p>}
        </div>
      </div>

      {/* Main footer grid */}
      <div className="wrap" style={{ padding: '3.5rem 1.25rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>

          {/* Brand */}
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 900, color: 'var(--gold)', display: 'block' }}>SCSI Academy</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--txt-3)', display: 'block', marginTop: '0.2rem' }}>Student Counseling Services International</span>
            </div>
            <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
              Engineering Balanced Giants. Mindset Engineering & Strategic Counseling for the next generation of leaders.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { icon: <Mail size={13}/>, text: 'preciouseze156@gmail.com', href: 'mailto:preciouseze156@gmail.com' },
                { icon: <Phone size={13}/>, text: '+234 901 805 3015', href: 'https://wa.me/2349018053015' },
                { icon: <MapPin size={13}/>, text: 'Nigeria', href: '#' },
              ].map(({ icon, text, href }) => (
                <a key={text} href={href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--txt-3)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt-3)')}>
                  <span style={{ color: 'var(--gold)', flexShrink: 0 }}>{icon}</span>
                  {text}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>Navigate</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--txt-3)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--txt-1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt-3)')}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>Services</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {serviceLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--txt-3)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--txt-1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt-3)')}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>Take Action</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/refinery" className="btn btn-gold" style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.75rem' }}>
                Enter the Refinery <ArrowRight size={13}/>
              </Link>
              <Link href="/login" className="btn btn-ghost" style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.75rem' }}>
                Member Login
              </Link>
              <a href="https://wa.me/2349018053015" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid var(--border)', color: 'var(--txt-3)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,211,102,0.5)'; e.currentTarget.style.color = '#25D366' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--txt-3)' }}>
                <ExternalLink size={12}/> WhatsApp Channel
              </a>
            </div>
            <p style={{ marginTop: '1.25rem', fontSize: '0.72rem', color: 'var(--txt-3)', fontStyle: 'italic', lineHeight: 1.6 }}>
              All counseling sessions are handled with the strictest professional confidentiality.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>
            © {year} SCSI Academy · Eze Tochukwu Precious. All rights reserved.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontStyle: 'italic' }}>
            Stop running in circles. Start engineering your legacy.
          </p>
        </div>
      </div>
    </footer>
  )
}
