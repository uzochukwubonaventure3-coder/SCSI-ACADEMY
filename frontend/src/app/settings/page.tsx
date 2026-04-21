'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, User, Lock, Palette, Bell, Shield,
  LogOut, Camera, Check, Eye, EyeOff, Sun, Moon,
  Crown, RefreshCw, Download, Trash2, X, Phone,
  CreditCard, HelpCircle
} from 'lucide-react'
import { useAccess, ContentUser } from '@/hooks/useAccess'
import { useTheme } from '@/hooks/useTheme'
import { useExpiry } from '@/hooks/useExpiry'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
type Section = 'profile' | 'password' | 'appearance' | 'notifications' | 'subscription' | 'privacy' | 'phone'

// Helper to get plan display name – pure function, safe for server
function getPlanName(plan: string | undefined): string {
  const map: Record<string, string> = {
    academy: 'SCSI Mentorship Academy',
    '1on1_monthly': 'One-on-One Mentorship',
    '1on1_3months': '1-on-1 Coaching (3 Months)',
    '1on1_6months': '1-on-1 Coaching (6 Months)',
    monthly: 'Monthly Access',
    quarterly: '3-Month Bundle'
  }
  return map[plan || ''] || plan || 'Active Plan'
}

/* ── Toast (top-right) ──────────────────────────────────────────── */
function Toast({ msg, type, onDone }: { msg: string; type: 'ok' | 'err'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1.125rem', borderRadius: '12px', background: type === 'ok' ? 'rgba(40,180,100,0.14)' : 'rgba(220,60,60,0.14)', border: `1px solid ${type === 'ok' ? 'rgba(40,180,100,0.4)' : 'rgba(220,60,60,0.4)'}`, color: type === 'ok' ? '#50c880' : '#e07070', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'fadeUp 0.3s ease both', maxWidth: '320px' }}>
      <Check size={15} />{msg}
      <button onClick={onDone} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6, marginLeft: '0.25rem', display: 'flex' }}><X size={13} /></button>
    </div>
  )
}

/* ── Row item (like iOS settings row) ──────────────────────────── */
function SettingsRow({ icon, iconBg, label, sub, value, onClick, danger = false, last = false }: {
  icon: React.ReactNode; iconBg: string; label: string; sub?: string; value?: string;
  onClick?: () => void; danger?: boolean; last?: boolean
}) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: pressed ? 'var(--bg-3)' : 'var(--bg-2)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: danger ? '#e07070' : 'var(--txt-1)', marginBottom: sub ? '0.125rem' : 0 }}>{label}</p>
        {sub && <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)', lineHeight: 1.4 }}>{sub}</p>}
      </div>
      {value && <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', flexShrink: 0, marginRight: '0.25rem' }}>{value}</span>}
      <ChevronRight size={16} color="var(--txt-3)" style={{ flexShrink: 0, opacity: 0.5 }} />
    </button>
  )
}

/* ── Settings group (card with rounded corners) ─────────────────── */
function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

/* ── Full-screen panel (slides in from right) ─────────────────────── */
function Panel({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-0)', overflowY: 'auto', animation: 'slideInRight 0.28s cubic-bezier(.4,0,.2,1) both' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-0)', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} color="var(--txt-2)" />
        </button>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 700, flex: 1 }}>{title}</h2>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Toggle row ──────────────────────────────────────────────────── */
function ToggleRow({ icon, iconBg, label, sub, value, onChange, last = false }: {
  icon: React.ReactNode; iconBg: string; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--txt-1)', marginBottom: sub ? '0.125rem' : 0 }}>{label}</p>
        {sub && <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)' }}>{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)} style={{ width: '48px', height: '28px', borderRadius: '14px', background: value ? 'var(--gold)' : 'var(--bg-4)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.25s' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.25s cubic-bezier(.4,0,.2,1)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  )
}

/* ── Phone Edit Panel ────────────────────────────────────────────── */
function PhonePanel({ user, token, onSuccess, onBack }: { user: ContentUser; token: string | null; onSuccess: (p: string) => void; onBack: () => void }) {
  const [phone, setPhone] = useState(user.phone || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const editCount = (user as { phoneEditCount?: number }).phoneEditCount ?? 0
  const canEdit = editCount < 2

  const save = async () => {
    if (!phone.trim()) { setErr('Enter a phone number'); return }
    setSaving(true); setErr('')
    try {
      const t = token || (typeof window !== 'undefined' ? localStorage.getItem('scsi_access_token') : null) || ''
      await axios.put(`${API}/api/paywall/phone`, { phone }, { headers: { Authorization: `Bearer ${t}` } })
      onSuccess(phone); onBack()
    } catch (e: unknown) {
      const er = e as { response?: { data?: { message?: string } } }
      setErr(er.response?.data?.message || 'Failed to update phone')
    }
    setSaving(false)
  }

  return (
    <Panel title="Phone / WhatsApp" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {!canEdit && (
          <div style={{ padding: '1rem', background: 'rgba(220,60,60,0.08)', border: '1px solid rgba(220,60,60,0.25)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.875rem', color: '#e07070', lineHeight: 1.6 }}>You've reached the maximum edits (2). Contact support to change your phone number.</p>
          </div>
        )}
        {canEdit && editCount > 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{2 - editCount} edit{2 - editCount !== 1 ? 's' : ''} remaining</p>
        )}
        <div className="fgroup">
          <label className="fl">Phone / WhatsApp Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} className="fi" placeholder="+234 xxx xxx xxxx" disabled={!canEdit} autoFocus style={{ opacity: canEdit ? 1 : 0.55 }} />
        </div>
        {err && <p style={{ color: '#e07070', fontSize: '0.875rem' }}>{err}</p>}
        {canEdit && (
          <button onClick={save} disabled={saving} className="btn btn-gold" style={{ justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />Saving…</> : <><Check size={14} />Save Phone Number</>}
          </button>
        )}
      </div>
    </Panel>
  )
}

/* ── Main Settings Page ──────────────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter()
  const { user, logout, hasAccess, loading, updateLocalUser, token } = useAccess()
  const { isDark, toggleTheme } = useTheme()
  const { label: expiryLabel, urgency, days } = useExpiry(user?.expiresAt)

  const [section, setSection] = useState<Section | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Profile form
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('') // Start empty, load from localStorage on client only

  // Password form
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ c: false, n: false, cf: false })
  const [pwBusy, setPwBusy] = useState(false)

  // Notifications
  const [notifs, setNotifs] = useState({ newContent: true, announcements: true, reminders: false })

  // Guard to avoid localStorage on server
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !hasAccess) router.replace('/login')
    if (user && isMounted) {
      setName(user.fullName || '')
      setBio(user.bio || '')
      // Only access localStorage on the client
      const storedAvatar = localStorage.getItem('scsi_avatar') || ''
      setAvatar(user.avatarUrl || storedAvatar)
    }
  }, [user, loading, hasAccess, router, isMounted])

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) }
  }, [toast])

  const ok = useCallback((m: string) => setToast({ msg: m, type: 'ok' }), [])
  const err = useCallback((m: string) => setToast({ msg: m, type: 'err' }), [])
  const getT = useCallback(() => {
    if (typeof window === 'undefined') return ''
    return token || localStorage.getItem('scsi_access_token') || ''
  }, [token])
  const authH = useCallback(() => ({ Authorization: `Bearer ${getT()}` }), [getT])

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 3 * 1024 * 1024) { err('Image must be under 3MB'); return }
    const reader = new FileReader()
    reader.onload = async ev => {
      const url = ev.target?.result as string
      setAvatar(url)
      if (typeof window !== 'undefined') localStorage.setItem('scsi_avatar', url)
      updateLocalUser({ avatarUrl: url })
      try {
        await axios.put(`${API}/api/paywall/profile`, { fullName: name, bio, avatarUrl: url }, { headers: authH() })
        ok('Photo updated!')
      } catch {
        ok('Photo saved locally')
      }
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    if (!name.trim()) { err('Name is required'); return }
    setSaving(true)
    try {
      await axios.put(`${API}/api/paywall/profile`, { fullName: name, bio, avatarUrl: avatar }, { headers: authH() })
      updateLocalUser({ fullName: name, bio, avatarUrl: avatar })
      ok('Profile saved!')
    } catch {
      err('Save failed. Please try again.')
    }
    setSaving(false)
  }

  const changePassword = async () => {
    if (!pw.current) { err('Enter your current password'); return }
    if (pw.next.length < 6) { err('New password must be 6+ characters'); return }
    if (pw.next !== pw.confirm) { err('Passwords do not match'); return }
    setPwBusy(true)
    try {
      await axios.put(`${API}/api/paywall/password`, { currentPassword: pw.current, newPassword: pw.next }, { headers: authH() })
      setPw({ current: '', next: '', confirm: '' })
      ok('Password changed!')
    } catch (e: unknown) {
      const er = e as { response?: { data?: { message?: string } } }
      err(er.response?.data?.message || 'Incorrect current password')
    }
    setPwBusy(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)' }}>
      <div style={{ width: '28px', height: '28px', border: '2px solid var(--bg-3)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
  if (!user) return null

  const expiryColor = urgency === 'urgent' ? '#e07070' : urgency === 'warn' ? '#FFA500' : '#50c880'

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg-0)', paddingTop: '70px', paddingBottom: '3rem' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Page title */}
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.625rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--txt-1)' }}>Settings</h1>

          {/* ── Profile card ── */}
          <SettingsGroup>
            <div style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(201,162,75,0.3)', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatar
                    ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.75rem' }}>👤</span>}
                </div>
                <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--gold)', border: '2px solid var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Camera size={10} color="#080506" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--txt-1)', marginBottom: '0.15rem' }}>{user.fullName}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                {expiryLabel && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.375rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: `${expiryColor}15`, border: `1px solid ${expiryColor}40` }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: expiryColor, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: expiryColor }}>{expiryLabel}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setSection('profile')} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', cursor: 'pointer', display: 'flex' }}>
                <ChevronRight size={16} />
              </button>
            </div>
            {/* Plan row */}
            <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginBottom: '0.15rem' }}>Current Plan</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--txt-1)' }}>{getPlanName(user.plan)}</p>
              </div>
              <button onClick={() => setSection('subscription')} style={{ padding: '0.4rem 0.875rem', borderRadius: '99px', background: 'var(--gold-dim)', border: '1px solid rgba(201,162,75,0.3)', color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                Manage
              </button>
            </div>
          </SettingsGroup>

          <div style={{ height: '1.5rem' }} />

          {/* ── Account group ── */}
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>Account</p>
          <SettingsGroup>
            <SettingsRow icon={<User size={16} color="white" />} iconBg="#5B5BD6" label="Edit Profile" sub="Name, bio, avatar" onClick={() => setSection('profile')} />
            <SettingsRow icon={<Phone size={16} color="white" />} iconBg="#2AAC7A" label="Phone / WhatsApp" sub={user.phone || 'Not set'} onClick={() => setSection('phone')} />
            <SettingsRow icon={<Lock size={16} color="white" />} iconBg="#E0484B" label="Password" sub="Change your password" onClick={() => setSection('password')} last />
          </SettingsGroup>

          <div style={{ height: '1.5rem' }} />

          {/* ── Preferences group ── */}
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>Preferences</p>
          <SettingsGroup>
            <SettingsRow icon={isDark ? <Moon size={16} color="white" /> : <Sun size={16} color="white" />} iconBg={isDark ? '#3B3B5C' : '#E89B1A'} label="Appearance" sub={isDark ? 'Dark Mode' : 'Light Mode'} onClick={() => setSection('appearance')} />
            <SettingsRow icon={<Bell size={16} color="white" />} iconBg="#D97706" label="Notifications" sub="Content alerts & reminders" onClick={() => setSection('notifications')} last />
          </SettingsGroup>

          <div style={{ height: '1.5rem' }} />

          {/* ── More group ── */}
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>More</p>
          <SettingsGroup>
            <SettingsRow icon={<CreditCard size={16} color="white" />} iconBg="#059669" label="Subscription" sub="Manage your plan" onClick={() => setSection('subscription')} />
            <SettingsRow icon={<Shield size={16} color="white" />} iconBg="#7C3AED" label="Privacy & Security" onClick={() => setSection('privacy')} />
            <SettingsRow icon={<HelpCircle size={16} color="white" />} iconBg="#0284C7" label="Help & Support" sub="preciouseze156@gmail.com" onClick={() => { window.location.href = 'mailto:preciouseze156@gmail.com' }} last />
          </SettingsGroup>

          <div style={{ height: '1.5rem' }} />

          {/* ── Sign out ── */}
          <SettingsGroup>
            <button onClick={() => { logout(); router.push('/login') }}
              style={{ width: '100%', padding: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#e07070', fontSize: '0.9375rem', fontWeight: 600, transition: 'background 0.15s', borderRadius: '16px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,60,60,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <LogOut size={17} />Sign Out
            </button>
          </SettingsGroup>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.72rem', color: 'var(--txt-3)' }}>SCSI Academy · v2.0</p>
        </div>
      </div>

      {/* ── Slide-in panels ── */}

      {section === 'profile' && (
        <Panel title="Edit Profile" onBack={() => setSection(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(201,162,75,0.3)', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>👤</span>}
                </div>
                <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--gold)', border: '2px solid var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Camera size={12} color="#080506" />
                </button>
              </div>
            </div>
            <div className="fgroup"><label className="fl">Full Name</label><input value={name} onChange={e => setName(e.target.value)} className="fi" placeholder="Your full name" /></div>
            <div className="fgroup"><label className="fl">Email</label><input value={user.email} className="fi" disabled style={{ opacity: .55, cursor: 'not-allowed' }} /><p style={{ fontSize: '0.72rem', color: 'var(--txt-3)', marginTop: '0.25rem' }}>Email cannot be changed</p></div>
            <div className="fgroup"><label className="fl">Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} className="fi" rows={3} placeholder="Tell us about yourself…" style={{ resize: 'vertical' }} /></div>
            <button onClick={saveProfile} disabled={saving} className="btn btn-gold" style={{ justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />Saving…</> : <><Check size={14} />Save Changes</>}
            </button>
          </div>
        </Panel>
      )}

      {section === 'phone' && (
        <PhonePanel user={user} token={token} onSuccess={phone => { updateLocalUser({ phone }); ok('Phone updated!') }} onBack={() => setSection(null)} />
      )}

      {section === 'password' && (
        <Panel title="Change Password" onBack={() => setSection(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {(['current', 'next', 'confirm'] as const).map(k => {
              const labels = { current: 'Current Password', next: 'New Password', confirm: 'Confirm New Password' }
              const sk = k === 'current' ? 'c' : k === 'next' ? 'n' : 'cf'
              const show = showPw[sk as 'c' | 'n' | 'cf']
              return (
                <div key={k} className="fgroup" style={{ position: 'relative' }}>
                  <label className="fl">{labels[k]}</label>
                  <input type={show ? 'text' : 'password'} value={pw[k]} className="fi" style={{ paddingRight: '3rem' }} placeholder="••••••••" onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))} />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [sk]: !p[sk as 'c' | 'n' | 'cf'] }))} style={{ position: 'absolute', right: '0.875rem', bottom: '0.875rem', background: 'none', border: 'none', color: 'var(--txt-3)', cursor: 'pointer', display: 'flex' }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {k === 'confirm' && pw.confirm && (
                    <p style={{ marginTop: '0.375rem', fontSize: '0.78rem', color: pw.next === pw.confirm ? '#50c880' : '#e07070', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {pw.next === pw.confirm ? <><Check size={11} />Passwords match</> : 'Passwords don\'t match'}
                    </p>
                  )}
                </div>
              )
            })}
            <button onClick={changePassword} disabled={pwBusy} className="btn btn-gold" style={{ justifyContent: 'center', opacity: pwBusy ? 0.7 : 1 }}>
              {pwBusy ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />Updating…</> : <><Lock size={14} />Update Password</>}
            </button>
            <p style={{ fontSize: '0.82rem', color: 'var(--txt-2)', textAlign: 'center' }}>
              <a href="/forgot-password" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Forgot current password? Reset it →</a>
            </p>
          </div>
        </Panel>
      )}

      {section === 'appearance' && (
        <Panel title="Appearance" onBack={() => setSection(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Choose how SCSI Academy looks on this device.</p>
            {[
              { id: 'dark', label: 'Dark Mode', sub: 'Deep oxblood & gold — easy on the eyes at night', icon: <Moon size={20} color="white" />, bg: '#3B3B5C', active: isDark },
              { id: 'light', label: 'Light Mode', sub: 'Warm parchment — great for daytime reading', icon: <Sun size={20} color="white" />, bg: '#E89B1A', active: !isDark },
            ].map(opt => (
              <button key={opt.id} onClick={() => { if (!opt.active) toggleTheme() }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.125rem', borderRadius: '16px', border: `2px solid ${opt.active ? 'var(--gold)' : 'var(--border)'}`, background: opt.active ? 'var(--gold-dim)' : 'var(--bg-2)', cursor: opt.active ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--txt-1)', marginBottom: '0.2rem' }}>{opt.label}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{opt.sub}</p>
                </div>
                {opt.active && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} color="#080506" /></div>}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {section === 'notifications' && (
        <Panel title="Notifications" onBack={() => setSection(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <SettingsGroup>
              <ToggleRow icon={<Bell size={16} color="white" />} iconBg="#D97706" label="New Content" sub="Articles and videos from Coach Precious" value={notifs.newContent} onChange={v => setNotifs(p => ({ ...p, newContent: v }))} />
              <ToggleRow icon={<Bell size={16} color="white" />} iconBg="#5B5BD6" label="Announcements" sub="SCSI programs and cohort updates" value={notifs.announcements} onChange={v => setNotifs(p => ({ ...p, announcements: v }))} />
              <ToggleRow icon={<Bell size={16} color="white" />} iconBg="#2AAC7A" label="Study Reminders" sub="Weekly nudges to stay on track" value={notifs.reminders} onChange={v => setNotifs(p => ({ ...p, reminders: v }))} last />
            </SettingsGroup>
            <button onClick={() => ok('Preferences saved!')} className="btn btn-gold" style={{ justifyContent: 'center' }}>
              <Check size={14} />Save Preferences
            </button>
          </div>
        </Panel>
      )}

      {section === 'subscription' && (
        <Panel title="Subscription" onBack={() => setSection(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg,var(--bg-3),var(--bg-4))', border: '1px solid rgba(201,162,75,0.2)', borderRadius: '16px' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>Active Plan</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '0.25rem' }}>{getPlanName(user.plan)}</p>
              {user.expiresAt && (
                <p style={{ fontSize: '0.875rem', color: urgency === 'urgent' ? '#e07070' : urgency === 'warn' ? '#FFA500' : 'var(--txt-3)' }}>
                  {days !== null ? `${days} day${days !== 1 ? 's' : ''} remaining` : ''} · Expires {new Date(user.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <SettingsGroup>
              {[
                { id: 'academy', label: 'SCSI Mentorship Academy', price: '₦15,000', desc: '1 month · Group coaching + community', videos: 'Video categories: ₦2,000 each' },
                { id: '1on1_monthly', label: 'One-on-One Mentorship', price: '₦15,000', desc: '1 month · Private 1-on-1 sessions', videos: 'Video categories: ₦2,000 each' },
                { id: '1on1_3months', label: '1-on-1 Coaching — 3 Months', price: '₦40,000', desc: '3 months · Save ₦5,000', videos: 'All video categories included' },
                { id: '1on1_6months', label: '1-on-1 Coaching — 6 Months', price: '₦60,000', desc: '6 months · Best value — Save 33%', videos: 'All video categories included', best: true },
              ].map((p, i, arr) => (
                <div key={p.id} style={{ padding: '1rem', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: p.id === user.plan ? 'rgba(201,162,75,0.05)' : 'transparent' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>{p.label}</p>
                      {p.best && <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#080506', background: '#E89B1A', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>BEST VALUE</span>}
                      {p.id === user.plan && <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#50c880', background: 'rgba(80,200,128,0.1)', border: '1px solid rgba(80,200,128,0.3)', borderRadius: '5px', padding: '0.1rem 0.45rem' }}>Current</span>}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)', margin: 0 }}>{p.desc}</p>
                    <p style={{ fontSize: '0.7rem', color: p.videos.startsWith('All') ? '#50c880' : 'var(--txt-3)', margin: 0, marginTop: '0.1rem' }}>{p.videos}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{p.price}</span>
                </div>
              ))}
            </SettingsGroup>
            <a href="/signup" className="btn btn-gold" style={{ textDecoration: 'none', justifyContent: 'center', display: 'flex' }}>
              <Crown size={15} />Renew or Upgrade Plan
            </a>
          </div>
        </Panel>
      )}

      {section === 'privacy' && (
        <Panel title="Privacy & Security" onBack={() => setSection(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1.125rem', background: 'rgba(201,162,75,0.06)', border: '1px solid rgba(201,162,75,0.2)', borderRadius: '12px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>🔒 Confidentiality Promise</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--txt-2)', lineHeight: 1.75 }}>All data is encrypted and handled with professional counseling confidentiality. We never sell your data.</p>
            </div>
            <SettingsGroup>
              <SettingsRow icon={<Download size={16} color="white" />} iconBg="#0284C7" label="Export My Data" sub="Download your data as JSON" onClick={() => {
                const d = { user: { email: user.email, name: user.fullName, plan: user.plan }, at: new Date().toISOString() }
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })); a.download = 'scsi-my-data.json'; a.click(); ok('Data exported!')
              }} />
              <SettingsRow icon={<Trash2 size={16} color="white" />} iconBg="#E0484B" label="Delete Account" sub="Permanently delete your account" onClick={() => err('Email preciouseze156@gmail.com to delete your account')} danger last />
            </SettingsGroup>
            <a href="/privacy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--gold)', textDecoration: 'none' }}>
              Read Privacy Policy <ChevronRight size={14} />
            </a>
          </div>
        </Panel>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  )
}