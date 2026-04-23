'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Bell, CheckCheck, Video, Megaphone,
  Tag, TrendingDown, Sparkles, X
} from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccess } from '@/hooks/useAccess'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Notif {
  id: number
  type: string
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode
  accent: string
  bg: string
  label: string
}> = {
  content:    { icon: <Video size={14}/>, accent:'var(--gold)', bg:'var(--gold-dim)', label:'New Content' },
  broadcast:  { icon: <Megaphone size={14}/>, accent:'#5B5BD6', bg:'rgba(91,91,214,0.12)', label:'Announcement' },
  price_drop: { icon: <TrendingDown size={14}/>, accent:'#50c880', bg:'rgba(80,200,128,0.12)', label:'Price Drop' },
  promo:      { icon: <Tag size={14}/>, accent:'#E89B1A', bg:'rgba(232,155,26,0.12)', label:'Promo' },
  video:      { icon: <Video size={14}/>, accent:'var(--gold)', bg:'var(--gold-dim)', label:'Video' },
  default:    { icon: <Bell size={14}/>, accent:'var(--txt-3)', bg:'var(--bg-3)', label:'Notification' },
}

const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(value).toLocaleDateString('en-NG', { day:'numeric', month:'short' })
}

function NotifCard({
  n,
  onDismiss,
  onOpen,
}: {
  n: Notif
  onDismiss: (id: number) => void
  onOpen: (notif: Notif) => void
}) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default
  const [hovered, setHovered] = useState(false)
  const isLinkable = !!n.link && n.link !== '#'

  return (
    <div
      role={isLinkable ? 'button' : undefined}
      tabIndex={isLinkable ? 0 : -1}
      style={{
        display:'flex',
        gap:'0.875rem',
        padding:'1rem 1.125rem',
        background: n.is_read ? 'var(--bg-2)' : 'var(--bg-3)',
        border: `1px solid ${n.is_read ? 'var(--border)' : cfg.accent + '44'}`,
        borderRadius:'var(--radius-md)',
        transition:'all 0.18s',
        position:'relative',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
        cursor: isLinkable ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (isLinkable) onOpen(n) }}
      onKeyDown={(e) => {
        if (isLinkable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen(n)
        }
      }}
    >
      {!n.is_read && (
        <div style={{ position:'absolute', top:'0.875rem', right:'2.75rem', width:'7px', height:'7px', borderRadius:'50%', background: cfg.accent, flexShrink:0 }}/>
      )}

      <div style={{ width:'38px', height:'38px', borderRadius:'10px', background: cfg.bg, border:`1px solid ${cfg.accent}22`, display:'flex', alignItems:'center', justifyContent:'center', color: cfg.accent, flexShrink:0 }}>
        {cfg.icon}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.6rem', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color: cfg.accent, padding:'0.1rem 0.45rem', borderRadius:'4px', background: cfg.bg, border:`1px solid ${cfg.accent}28`, flexShrink:0 }}>
            {cfg.label}
          </span>
          <span style={{ fontSize:'0.68rem', color:'var(--txt-3)', marginLeft:'auto', flexShrink:0 }}>{timeAgo(n.created_at)}</span>
        </div>
        <p style={{ fontWeight: n.is_read ? 500 : 700, fontSize:'0.9rem', color:'var(--txt-1)', marginBottom: n.body ? '0.25rem' : 0, lineHeight:1.4 }}>
          {n.title}
        </p>
        {n.body && (
          <p style={{ fontSize:'0.8rem', color:'var(--txt-2)', lineHeight:1.6 }} dangerouslySetInnerHTML={{ __html: n.body }}/>
        )}
        {isLinkable && (
          <Link
            href={n.link}
            onClick={(e) => {
              e.preventDefault()
              onOpen(n)
            }}
            style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', marginTop:'0.5rem', fontSize:'0.78rem', fontWeight:700, color: cfg.accent, textDecoration:'none' }}
          >
            View
          </Link>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDismiss(n.id)
        }}
        style={{ width:'24px', height:'24px', borderRadius:'50%', background:'transparent', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity: hovered ? 1 : 0, transition:'opacity 0.15s' }}
      >
        <X size={12}/>
      </button>
    </div>
  )
}

export default function NotificationsPage() {
  const { token, hasAccess } = useAccess()
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'content' | 'promo'>('all')
  const [loading, setLoading] = useState(true)

  const getToken = useCallback(
    () => token || (typeof window !== 'undefined' ? localStorage.getItem('scsi_access_token') : '') || '',
    [token]
  )

  const load = useCallback(async () => {
    const authToken = getToken()
    if (!authToken) {
      setLoading(false)
      return
    }

    try {
      const { data } = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (data.success) setNotifs(data.data || [])
    } catch {
      // silent
    }

    setLoading(false)
  }, [getToken])

  useEffect(() => {
    if (hasAccess) {
      void load()
    } else {
      setLoading(false)
    }
  }, [hasAccess, load])

  const markAllRead = async () => {
    const authToken = getToken()
    if (!authToken) return

    try {
      await axios.patch(`${API}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      setNotifs((prev) => prev.map((notif) => ({ ...notif, is_read: true })))
    } catch {
      // silent
    }
  }

  const markOneRead = useCallback(async (id: number) => {
    const authToken = getToken()
    if (!authToken) return

    try {
      await axios.patch(`${API}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      setNotifs((prev) => prev.map((notif) => (
        notif.id === id ? { ...notif, is_read: true } : notif
      )))
    } catch {
      // silent
    }
  }, [getToken])

  const dismiss = async (id: number) => {
    await markOneRead(id)
    setNotifs((prev) => prev.filter((notif) => notif.id !== id))
  }

  const openNotification = async (notif: Notif) => {
    if (!notif.is_read) await markOneRead(notif.id)
    if (notif.link && notif.link !== '#') router.push(notif.link)
  }

  const filtered = notifs.filter((notif) => {
    if (filter === 'unread') return !notif.is_read
    if (filter === 'content') return ['content', 'video', 'price_drop'].includes(notif.type)
    if (filter === 'promo') return ['promo', 'broadcast'].includes(notif.type)
    return true
  })

  const unread = notifs.filter((notif) => !notif.is_read).length
  const promoCount = notifs.filter((notif) => ['promo', 'broadcast'].includes(notif.type) && !notif.is_read).length
  const contentCount = notifs.filter((notif) => ['content', 'video', 'price_drop'].includes(notif.type) && !notif.is_read).length

  type FilterKey = 'all' | 'unread' | 'content' | 'promo'
  const filters: { key: FilterKey; label: string; count?: number }[] = [
    { key:'all', label:'All', count:notifs.length },
    { key:'unread', label:'Unread', count:unread },
    { key:'content', label:'Content', count:contentCount },
    { key:'promo', label:'Promos', count:promoCount },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-0)', paddingTop:'80px' }}>
      <div className="wrap" style={{ padding:'2rem 1.25rem 4rem', maxWidth:'700px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.75rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:700, marginBottom:'0.25rem' }}>Notifications</h1>
            <p style={{ fontSize:'0.875rem', color:'var(--txt-3)' }}>
              {unread > 0 ? <><strong style={{ color:'var(--txt-1)' }}>{unread}</strong> unread</> : 'All caught up'}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-ghost btn-sm" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
              <CheckCheck size={13}/>Mark all read
            </button>
          )}
        </div>

        <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
          {filters.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              style={{ display:'flex', alignItems:'center', gap:'0.375rem', padding:'0.375rem 0.875rem', borderRadius:'99px', border:`1.5px solid ${filter===item.key ? 'var(--gold)' : 'var(--border)'}`, background: filter===item.key ? 'var(--gold-dim)' : 'transparent', color: filter===item.key ? 'var(--gold)' : 'var(--txt-2)', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
            >
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span style={{ width:'18px', height:'18px', borderRadius:'50%', background: filter===item.key ? 'var(--gold)' : 'var(--bg-3)', color: filter===item.key ? '#080506' : 'var(--txt-2)', fontSize:'0.6rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height:'80px', borderRadius:'var(--radius-md)' }}/>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem 2rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)' }}>
            {filter === 'all' ? (
              <>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
                  <Bell size={24} color="rgba(201,162,75,0.4)"/>
                </div>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.125rem', fontWeight:700, marginBottom:'0.5rem' }}>No notifications yet</h3>
                <p style={{ color:'var(--txt-3)', fontSize:'0.875rem' }}>You'll be notified when Coach Precious posts new content, drops prices, or shares special promos.</p>
              </>
            ) : (
              <>
                <Sparkles size={28} color="rgba(201,162,75,0.3)" style={{ margin:'0 auto 1rem', display:'block' }}/>
                <p style={{ color:'var(--txt-3)', fontSize:'0.875rem' }}>No {filter} notifications.</p>
              </>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {filtered.map((notif) => (
              <NotifCard key={notif.id} n={notif} onDismiss={dismiss} onOpen={openNotification}/>
            ))}
          </div>
        )}

        {!loading && notifs.length > 0 && (
          <p style={{ textAlign:'center', marginTop:'2rem', fontSize:'0.72rem', color:'var(--txt-3)' }}>
            Showing last {notifs.length} notification{notifs.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <style>{`
        .skeleton {
          background: linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 50%,var(--bg-2) 75%);
          background-size:200% 100%;
          animation: shimmer 1.5s ease infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  )
}
