'use client'
import Link from 'next/link'
import { Mail, Phone, ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function Footer() {
  const [email,   setEmail]   = useState('')
  const [subMsg,  setSubMsg]  = useState('')
  const [open,    setOpen]    = useState<string | null>(null)
  const year = new Date().getFullYear()

  const toggle = (key: string) => setOpen(o => o === key ? null : key)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/api/newsletter`, { email })
      setSubMsg('Subscribed! Mindset Audits incoming.'); setEmail('')
    } catch { setSubMsg('Already subscribed or error.') }
  }

  const sections = [
    {
      key: 'navigate', title: 'Navigate',
      links: [
        { href:'/',          label:'Home'        },
        { href:'/about',     label:'About'       },
        { href:'/services',  label:'Services'    },
        { href:'/content',   label:'Content'     },
        { href:'/gallery',   label:'Gallery'     },
        { href:'/contact',   label:'Contact'     },
      ],
    },
    {
      key: 'services', title: 'Services',
      links: [
        { href:'/services#mindset',   label:'Mindset Engineering'   },
        { href:'/services#academic',  label:'Academic Counseling'   },
        { href:'/services#speaking',  label:'Public Speaking'       },
        { href:'/services#workshops', label:'Leadership Workshops'  },
        { href:'/services#healing',   label:'Trauma Recovery'       },
      ],
    },
  ]

  return (
    <footer style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border)' }}>

      {/* Newsletter strip */}
      <div style={{ background: 'linear-gradient(135deg,#1A0808 0%,#2E1010 50%,#1A0808 100%)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: 'clamp(2rem,4vw,3.5rem) 1.25rem' }}>
        <div className="wrap" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ justifyContent: 'center' }}>The Refinery Newsletter</p>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem,3vw,1.75rem)', fontWeight: 700, color: '#F5EDD8', marginBottom: '0.375rem' }}>
            Weekly Mindset Audits
          </h3>
          <p style={{ color: '#9A7860', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Surgical insights for high-achievers. No fluff.
          </p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 0, maxWidth: '400px', margin: '0 auto' }}>
            <input type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              style={{ flex: 1, padding: '0.8125rem 1rem', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(201,168,76,0.25)', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#F5EDD8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', minWidth: 0 }}/>
            <button type="submit" style={{ padding: '0.8125rem 1rem', background: 'var(--gold)', color: '#0D0A0A', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Subscribe
            </button>
          </form>
          {subMsg && <p style={{ marginTop: '0.625rem', fontSize: '0.78rem', color: 'var(--gold)' }}>{subMsg}</p>}
        </div>
      </div>

      {/* Main grid */}
      <div className="wrap" style={{ padding: 'clamp(1.75rem,4vw,3rem) 1.25rem 1.5rem' }}>
        <div className="footer-grid">

          {/* Brand column */}
          <div className="footer-brand">
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold)', display: 'block', lineHeight: 1.2 }}>SCSI Academy</span>
              <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--txt-3)', display: 'block', marginTop: '0.2rem' }}>Student Counseling Services Intl.</span>
            </div>
            <p style={{ color: 'var(--txt-3)', fontSize: '0.8125rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Engineering Balanced Giants. Mindset coaching for the next generation of leaders.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { icon: <Mail size={12}/>, text: 'preciouseze156@gmail.com', href: 'mailto:preciouseze156@gmail.com' },
                { icon: <Phone size={12}/>, text: '+234 901 805 3015', href: 'https://wa.me/2349018053015' },
              ].map(({ icon, text, href }) => (
                <a key={text} href={href} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--txt-3)', fontSize: '0.78rem', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-3)'}>
                  <span style={{ color: 'var(--gold)', flexShrink: 0 }}>{icon}</span>{text}
                </a>
              ))}
            </div>
          </div>

          {/* Accordion sections — collapse on mobile, always open on desktop */}
          {sections.map(sec => (
            <div key={sec.key} className="footer-section">
              {/* Desktop: always visible heading */}
              <h4 className="footer-heading-desktop" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
                {sec.title}
              </h4>
              {/* Mobile: accordion button */}
              <button className="footer-heading-mobile" onClick={() => toggle(sec.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                {sec.title}
                <ChevronDown size={13} style={{ transform: open === sec.key ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--txt-3)' }}/>
              </button>
              <ul className={`footer-links${open === sec.key ? ' open' : ''}`} style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sec.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} style={{ color: 'var(--txt-3)', fontSize: '0.825rem', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-1)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-3)'}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA column */}
          <div className="footer-section">
            <h4 className="footer-heading-desktop" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
              Take Action
            </h4>
            <button className="footer-heading-mobile" onClick={() => toggle('cta')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Take Action <ChevronDown size={13} style={{ transform: open === 'cta' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--txt-3)' }}/>
            </button>
            <div className={`footer-links${open === 'cta' ? ' open' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <Link href="/refinery" className="btn btn-gold" style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.75rem' }}>
                Enter the Refinery <ArrowRight size={12}/>
              </Link>
              <Link href="/login" className="btn btn-ghost" style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.75rem' }}>
                Member Login
              </Link>
              <a href="https://wa.me/2349018053015" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: '8px', border: '1.5px solid var(--border)', color: 'var(--txt-3)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(37,211,102,0.5)'; e.currentTarget.style.color='#25D366' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--txt-3)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>
            © {year} SCSI Academy · Eze Tochukwu Precious.
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--txt-3)', fontStyle: 'italic' }}>
            Stop running in circles. Start engineering your legacy.
          </p>
        </div>
      </div>

      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        /* Mobile accordion */
        .footer-heading-mobile { display: none !important; }
        .footer-links { display: flex !important; }
        @media(max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .footer-brand { margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
          .footer-section { border-bottom: 1px solid var(--border); padding: 0.25rem 0; }
          .footer-heading-desktop { display: none !important; }
          .footer-heading-mobile  { display: flex !important; }
          .footer-links { display: none !important; padding: 0 0 0.75rem; }
          .footer-links.open { display: flex !important; }
        }
      `}</style>
    </footer>
  )
}
