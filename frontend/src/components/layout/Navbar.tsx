'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Sun, Moon, Settings, LogOut, User, Bell } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useAccess } from '@/hooks/useAccess'
import { useExpiry } from '@/hooks/useExpiry'

const links = [
  { href:'/',         label:'Home'     },
  { href:'/about',    label:'About'    },
  { href:'/services', label:'Services' },
  { href:'/content',  label:'Content'  },
  { href:'/gallery',  label:'Gallery'  },
  { href:'/contact',  label:'Contact'  },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [visible,  setVisible]  = useState(true)
  const [mob,      setMob]      = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const lastY = useRef(0)
  const path  = usePathname()
  const { toggleTheme, isDark } = useTheme()
  const { hasAccess, user, logout } = useAccess()
  const { label: expiryLabel, urgency } = useExpiry(user?.expiresAt)
  const router = useRouter()

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY
      setScrolled(y > 50)
      setVisible(y < lastY.current || y < 80)
      lastY.current = y
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMob(false); setUserMenu(false) }, [path])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenu) return
    const fn = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('.user-menu-wrap')) setUserMenu(false)
    }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [userMenu])

  const isOn = (h: string) => h === '/' ? path === '/' : path.startsWith(h)
  const handleLogout = () => { logout(); router.push('/login') }

  return (
    <>
      <header className={`nav-shell ${scrolled ? 'floating' : 'at-top'} ${!visible ? 'hidden-nav' : ''}`}>
        <div className={`nav-inner ${scrolled ? 'floating' : 'at-top'}`}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:scrolled?'0.6rem 1.125rem':'0.875rem 1.5rem', gap:'1rem', maxWidth:scrolled?'100%':'1180px', margin:'0 auto', transition:'padding 0.4s ease' }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration:'none', flexShrink:0 }}>
              <div>
                <span style={{ fontFamily:'var(--font-serif)', fontSize:'1.1875rem', fontWeight:700, color:'var(--gold)', display:'block', lineHeight:1 }}>SCSI</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.5rem', fontWeight:600, color:'var(--txt-3)', letterSpacing:'0.22em', textTransform:'uppercase' }}>Academy</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="show-md" style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
              {links.map(l => (
                <Link key={l.href} href={l.href} className={`nl${isOn(l.href)?' on':''}`}>{l.label}</Link>
              ))}
            </nav>

            {/* Right controls */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
              {hasAccess ? (
                <div className="user-menu-wrap" style={{ position:'relative' }}>
                  <button onClick={() => setUserMenu(!userMenu)} className="btn btn-ghost btn-sm"
                    style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt="avatar" style={{ width:'22px', height:'22px', borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
                      : <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'var(--gold-dim)', border:'1px solid rgba(201,162,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.65rem' }}>👤</div>}
                    <span className="show-md" style={{ maxWidth:'80px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.8rem' }}>
                      {user?.fullName?.split(' ')[0] ?? 'Account'}
                    </span>
                  </button>
                  {userMenu && (
                    <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'0.5rem', minWidth:'200px', boxShadow:'var(--shadow-md)', zIndex:200 }}>
                      {/* Expiry */}
                      {expiryLabel && (
                        <div className={`expiry-badge ${urgency==='urgent'?'expiry-urgent':urgency==='warn'?'expiry-warn':'expiry-ok'}`}
                          style={{ width:'100%', marginBottom:'0.5rem', justifyContent:'center' }}>
                          ⏱ {expiryLabel}
                        </div>
                      )}
                      <div style={{ padding:'0.5rem 0.75rem', marginBottom:'0.375rem' }}>
                        <p style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--txt-1)' }}>{user?.fullName}</p>
                        <p style={{ fontSize:'0.72rem', color:'var(--txt-3)' }}>{user?.email}</p>
                      </div>
                      <div style={{ height:'1px', background:'var(--border)', margin:'0.25rem 0' }}/>
                      {[
                        { icon:<User size={14}/>, label:'My Profile', href:'/settings' },
                        { icon:<Settings size={14}/>, label:'Settings', href:'/settings?tab=appearance' },
                        { icon:<Bell size={14}/>, label:'Notifications', href:'/notifications' },
                      ].map(item => (
                        <Link key={item.href} href={item.href}
                          style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.625rem 0.75rem', borderRadius:'var(--radius-sm)', color:'var(--txt-2)', fontSize:'0.85rem', textDecoration:'none', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-3)';e.currentTarget.style.color='var(--txt-1)'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--txt-2)'}}>
                          {item.icon}{item.label}
                        </Link>
                      ))}
                      <div style={{ height:'1px', background:'var(--border)', margin:'0.25rem 0' }}/>
                      <button onClick={handleLogout}
                        style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.625rem 0.75rem', borderRadius:'var(--radius-sm)', color:'#e07070', fontSize:'0.85rem', width:'100%', background:'none', border:'none', cursor:'pointer', transition:'all 0.15s', textAlign:'left' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,60,60,0.08)'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                        <LogOut size={14}/>Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login"  className="btn btn-ghost btn-sm show-md">Login</Link>
                  <Link href="/signup" className="btn btn-gold  btn-sm show-md">Get Access</Link>
                </>
              )}
              <button onClick={toggleTheme} className="btn btn-icon" aria-label="Theme">
                {isDark ? <Sun size={15}/> : <Moon size={15}/>}
              </button>
              <button onClick={() => setMob(!mob)} className="btn btn-icon hide-md" aria-label="Menu">
                {mob ? <X size={17}/> : <Menu size={17}/>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu - full screen, uses CSS vars so light/dark both work */}
      <div className={`mob-menu ${mob ? 'show' : 'hide'}`}>
        <button onClick={() => setMob(false)}
          style={{ position:'absolute', top:'1.25rem', right:'1.25rem', width:'42px', height:'42px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg-2)', color:'var(--txt-2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <X size={18}/>
        </button>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <span style={{ fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:700, color:'var(--gold)' }}>SCSI</span>
          <p style={{ fontSize:'0.55rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--txt-3)', marginTop:'0.25rem' }}>Academy</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', padding:'0 2rem' }}>
          {links.map((l, i) => (
            <Link key={l.href} href={l.href}
              style={{
                fontFamily:'var(--font-serif)', fontSize:'clamp(1.375rem,4.5vw,1.875rem)', fontWeight:700,
                color: isOn(l.href) ? 'var(--gold)' : 'var(--txt-1)',
                textDecoration:'none', padding:'0.625rem 0',
                opacity: mob ? 1 : 0,
                transform: mob ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.35s ease ${i*0.04+0.05}s, transform 0.35s ease ${i*0.04+0.05}s`,
                width:'100%', textAlign:'center', borderBottom:'1px solid var(--border)',
              }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ display:'flex', gap:'0.75rem', marginTop:'2rem', flexWrap:'wrap', justifyContent:'center', padding:'0 1.5rem' }}>
          {hasAccess ? (
            <>
              <Link href="/settings" className="btn btn-ghost" style={{ color:'var(--txt-1)' }}>Settings</Link>
              <button onClick={handleLogout} className="btn btn-ghost" style={{ color:'#e07070', borderColor:'rgba(220,60,60,0.3)' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login"  className="btn btn-ghost" style={{ color:'var(--txt-1)' }}>Login</Link>
              <Link href="/signup" className="btn btn-gold">Get Access</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
