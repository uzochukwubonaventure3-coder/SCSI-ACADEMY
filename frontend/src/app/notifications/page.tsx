'use client'
import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, FileText, Video, Megaphone } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { useAccess } from '@/hooks/useAccess'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Notif {
  id:number; type:string; title:string; body:string; link:string; is_read:boolean; created_at:string
}

const typeIcon = (t:string) =>
  t==='video' ? <Video size={14}/> : t==='broadcast' ? <Megaphone size={14}/> : <FileText size={14}/>

const timeAgo = (d:string) => {
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short'})
}

export default function NotificationsPage() {
  const { token, hasAccess } = useAccess()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const getToken = useCallback(() =>
    token || (typeof window !== 'undefined' ? localStorage.getItem('scsi_access_token') : '') || ''
  , [token])

  const load = useCallback(async () => {
    const t = getToken()
    if (!t) { setLoading(false); return }
    try {
      const { data } = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${t}` }
      })
      if (data.success) setNotifs(data.data || [])
    } catch { /* silent fail */ }
    setLoading(false)
  }, [getToken])

  // Only fetch once we know we have a token
  useEffect(() => {
    if (hasAccess) load()
    else setLoading(false)
  }, [hasAccess, load])

  const markAllRead = async () => {
    const t = getToken(); if (!t) return
    try {
      await axios.patch(`${API}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${t}` }
      })
      setNotifs(p => p.map(n => ({ ...n, is_read: true })))
    } catch { /* silent */ }
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-0)', paddingTop:'90px' }}>
      <div className="wrap" style={{ padding:'2rem 1.25rem 4rem', maxWidth:'680px' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 className="h-serif" style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:700, marginBottom:'0.25rem' }}>Notifications</h1>
            {unread > 0 && <p style={{ fontSize:'0.85rem', color:'var(--txt-3)' }}>{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-ghost btn-sm" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
              <CheckCheck size={13}/>Mark all read
            </button>
          )}
        </div>

        {loading && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {Array(4).fill(0).map((_,i) => (
              <div key={i} className="skeleton" style={{ height:'72px', borderRadius:'var(--radius-md)' }}/>
            ))}
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem 2rem', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)' }}>
            <Bell size={36} color="rgba(201,162,75,0.3)" style={{ margin:'0 auto 1.25rem' }}/>
            <h3 className="h-serif" style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'0.5rem' }}>No notifications yet</h3>
            <p style={{ color:'var(--txt-3)', fontSize:'0.875rem' }}>You'll be notified when new content or announcements are posted.</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {notifs.map(n => (
            <Link key={n.id} href={n.link || '/content'}
              style={{ display:'flex', alignItems:'flex-start', gap:'0.875rem', padding:'1rem 1.125rem', background: n.is_read ? 'var(--bg-2)' : 'var(--bg-3)', border:`1px solid ${n.is_read ? 'var(--border)' : 'rgba(201,162,75,0.3)'}`, borderRadius:'var(--radius-md)', textDecoration:'none', transition:'all 0.18s', position:'relative' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = n.is_read ? 'var(--border)' : 'rgba(201,162,75,0.3)' }}>
              {!n.is_read && (
                <div style={{ position:'absolute', top:'0.875rem', right:'0.875rem', width:'7px', height:'7px', borderRadius:'50%', background:'var(--gold)' }}/>
              )}
              <div style={{ width:'36px', height:'36px', borderRadius:'9px', background: n.is_read ? 'var(--bg-3)' : 'var(--gold-dim)', border:`1px solid ${n.is_read ? 'var(--border)' : 'rgba(201,162,75,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', flexShrink:0 }}>
                {typeIcon(n.type)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight: n.is_read ? 500 : 700, fontSize:'0.9rem', color:'var(--txt-1)', marginBottom:'0.2rem', lineHeight:1.4 }}>{n.title}</p>
                {n.body && <p style={{ fontSize:'0.8rem', color:'var(--txt-2)', lineHeight:1.6 }}>{n.body}</p>}
              </div>
              <span style={{ fontSize:'0.68rem', color:'var(--txt-3)', flexShrink:0, paddingTop:'0.1rem' }}>{timeAgo(n.created_at)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
