'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Play, Clock, FileText, Video, Tag, CheckCircle2, Search, X, Calendar } from 'lucide-react'
import axios from 'axios'
import PaywallGate from '@/components/PaywallGate'
import { useProgress } from '@/hooks/useProgress'
import { useAccess } from '@/hooks/useAccess'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface BlogPost { id:number; title:string; slug:string; excerpt:string; content:string; cover_image?:string; tags:string[]; status:string; createdAt:string; created_at:string }
interface VideoPost { id:number; title:string; slug:string; description:string; video_url:string; thumbnailUrl?:string; duration:string; tags:string[]; status:string; createdAt:string; created_at:string }

const placeholderPosts: BlogPost[] = [
  {id:1,title:'Breaking the Busy Trap: Why Hard Work Alone is Not Enough',slug:'breaking-busy-trap',excerpt:'You have been told your whole life that if you just work hard enough, success will come. What if that is exactly the lie keeping you stuck?',content:'',tags:['Mindset','Productivity'],status:'published',createdAt:'2025-11-10T00:00:00Z',created_at:'2025-11-10T00:00:00Z'},
  {id:2,title:'Operational Blindness: The Silent Career Killer',slug:'operational-blindness',excerpt:'The most dangerous thing for a high-potential student is not failure—it is the inability to see why they are failing.',content:'',tags:['Coaching','Self-Awareness'],status:'published',createdAt:'2025-10-22T00:00:00Z',created_at:'2025-10-22T00:00:00Z'},
  {id:3,title:'The Architecture of a Balanced Giant',slug:'architecture-balanced-giant',excerpt:'True success is not about sacrificing your mental health. It is about building academic excellence and mental strength simultaneously.',content:'',tags:['Leadership','Balance'],status:'published',createdAt:'2025-10-05T00:00:00Z',created_at:'2025-10-05T00:00:00Z'},
  {id:4,title:'Professional Branding at 22: Why It Matters Now',slug:'professional-branding-22',excerpt:"Your LinkedIn is not just a resume—it is your first impression to every employer.",content:'',tags:['Branding','Career'],status:'published',createdAt:'2025-09-18T00:00:00Z',created_at:'2025-09-18T00:00:00Z'},
]
const placeholderVideos: VideoPost[] = [
  {id:1,title:'How to Break the Busy Trap',slug:'break-busy-trap',description:'Coach Precious breaks down the difference between being busy and being productive.',video_url:'https://www.youtube.com/embed/dQw4w9WgXcQ',duration:'18:32',tags:['Mindset','Productivity'],status:'published',createdAt:'2025-11-15T00:00:00Z',created_at:'2025-11-15T00:00:00Z'},
  {id:2,title:'The Architecture of Achievement',slug:'architecture-achievement',description:'A deep dive into the SCSI framework for building structured results instead of exhausted effort.',video_url:'https://www.youtube.com/embed/dQw4w9WgXcQ',duration:'24:10',tags:['Leadership','Strategy'],status:'published',createdAt:'2025-10-28T00:00:00Z',created_at:'2025-10-28T00:00:00Z'},
  {id:3,title:'Public Speaking Masterclass: The Hook',slug:'speaking-hook',description:'The first 30 seconds of any speech determines everything.',video_url:'https://www.youtube.com/embed/dQw4w9WgXcQ',duration:'15:45',tags:['Speaking','Communication'],status:'published',createdAt:'2025-10-10T00:00:00Z',created_at:'2025-10-10T00:00:00Z'},
]

type Tab = 'all'|'articles'|'videos'
const fmt = (d:string) => new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})

// Inline search bar component
function InlineSearch({ onResult, onClose }: { onResult:(posts:BlogPost[],videos:VideoPost[])=>void; onClose:()=>void }) {
  const [q, setQ]         = useState('')
  const [busy, setBusy]   = useState(false)
  const inputRef          = useRef<HTMLInputElement>(null)
  const debounce          = useRef<NodeJS.Timeout>()

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])
  // Keyboard shortcut
  useEffect(() => {
    const fn = (e:KeyboardEvent) => { if(e.key==='Escape'){onClose();} }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const doSearch = (val: string) => {
    clearTimeout(debounce.current)
    if (!val.trim() || val.length < 2) { onResult([], []); return }
    setBusy(true)
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/api/search?q=${encodeURIComponent(val)}`)
        onResult(data.data?.posts || [], data.data?.videos || [])
      } catch { onResult([], []) }
      finally { setBusy(false) }
    }, 350)
  }

  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 1rem', background:'var(--bg-1)', border:'1.5px solid rgba(201,162,75,0.4)', borderRadius:'var(--radius-md)', flex:1 }}>
      <Search size={15} color="var(--gold)" style={{ flexShrink:0 }}/>
      <input ref={inputRef} value={q}
        onChange={e=>{ setQ(e.target.value); doSearch(e.target.value) }}
        placeholder="Search articles and videos… (Esc to close)"
        style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--txt-1)', fontSize:'0.9375rem', fontFamily:'var(--font-sans)' }}/>
      {busy && <div style={{ width:'15px', height:'15px', border:'2px solid var(--border)', borderTop:'2px solid var(--gold)', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }}/>}
      {q && <button onClick={()=>{ setQ(''); onResult([],[]); }} style={{ background:'none', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', flexShrink:0 }}><X size={14}/></button>}
      <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--txt-3)', cursor:'pointer', display:'flex', flexShrink:0, padding:'0 0.25rem' }}>
        <span style={{ fontSize:'0.65rem', color:'var(--txt-3)', border:'1px solid var(--border)', borderRadius:'4px', padding:'0.1rem 0.3rem' }}>Esc</span>
      </button>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export default function ContentPage() {
  const [tab, setTab]         = useState<Tab>('all')
  const [posts, setPosts]     = useState<BlogPost[]>(placeholderPosts)
  const [videos, setVideos]   = useState<VideoPost[]>(placeholderVideos)
  const [player, setPlayer]   = useState<VideoPost|null>(null)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{posts:BlogPost[];videos:VideoPost[]}|null>(null)
  const { markRead, isRead, totalRead } = useProgress()
  const { hasAccess, token } = useAccess()

  useEffect(() => {
    const t = token || localStorage.getItem('scsi_access_token') || ''
    const h = t ? { Authorization:`Bearer ${t}` } : {}
    axios.get(`${API}/api/blog`, { headers:h }).then(r => {
      if (r.data?.success && r.data.data?.posts?.length) setPosts(r.data.data.posts)
    }).catch(()=>{})
    axios.get(`${API}/api/videos`, { headers:h }).then(r => {
      if (r.data?.success && r.data.data?.videos?.length) setVideos(r.data.data.videos)
    }).catch(()=>{})
  }, [token])

  const openVideo = useCallback((v: VideoPost) => {
    setPlayer(v); window.scrollTo({ top:0, behavior:'smooth' })
    if (hasAccess) markRead('video', v.id)
  }, [hasAccess, markRead])

  const displayPosts  = searchResults ? searchResults.posts  : posts
  const displayVideos = searchResults ? searchResults.videos : videos
  const isSearching   = searchResults !== null

  const TabBtn = ({ t, label, Icon }: { t:Tab; label:string; Icon:React.ElementType }) => (
    <button onClick={()=>setTab(t)} style={{ display:'flex', alignItems:'center', gap:'0.375rem', padding:'0.5rem 1rem', borderRadius:'99px', fontSize:'0.8125rem', fontWeight:600, border:tab===t?'1.5px solid var(--gold)':'1.5px solid var(--border)', background:tab===t?'var(--gold-dim)':'transparent', color:tab===t?'var(--gold)':'var(--txt-2)', cursor:'pointer', transition:'all 0.2s' }}>
      <Icon size={13}/>{label}
    </button>
  )

  return (
    <PaywallGate>
      {/* Hero - fixed padding so navbar doesn't overlap */}
      <section style={{ paddingTop:'clamp(88px, 10vh, 110px)', paddingBottom:'2.5rem', background:'linear-gradient(175deg,var(--bg-2) 0%,var(--bg-0) 100%)', borderBottom:'1px solid var(--border)' }}>
        <div className="wrap">
          <p className="eyebrow">Content Library</p>
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-end', justifyContent:'space-between', gap:'1rem', marginBottom:'1.25rem' }}>
            <div>
              <h1 className="h-serif" style={{ fontSize:'clamp(1.75rem,4vw,2.75rem)', fontWeight:700, marginBottom:'0.375rem' }}>
                Articles & <span className="grad-text">Video Masterclasses</span>
              </h1>
              {hasAccess && totalRead > 0 && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.25rem 0.75rem', background:'rgba(80,200,128,0.08)', border:'1px solid rgba(80,200,128,0.25)', borderRadius:'99px' }}>
                  <CheckCircle2 size={12} color="#50c880"/>
                  <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#50c880' }}>{totalRead} completed</span>
                </div>
              )}
            </div>
            {/* Search toggle button */}
            {!searching && (
              <button onClick={()=>setSearching(true)}
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5625rem 1rem', background:'var(--bg-1)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--txt-3)', fontSize:'0.8125rem', cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.color='var(--txt-1)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}>
                <Search size={14}/>Search content
                <span style={{ fontSize:'0.62rem', padding:'0.1rem 0.35rem', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'4px' }}>⌘K</span>
              </button>
            )}
          </div>

          {/* Inline search bar */}
          {searching && (
            <div style={{ marginBottom:'1.25rem', animation:'fadeUp 0.2s ease both' }}>
              <InlineSearch
                onResult={(p,v)=>setSearchResults(p.length||v.length?{posts:p,videos:v}:null)}
                onClose={()=>{ setSearching(false); setSearchResults(null) }}/>
              {searchResults && (
                <p style={{ marginTop:'0.5rem', fontSize:'0.78rem', color:'var(--txt-3)' }}>
                  {searchResults.posts.length + searchResults.videos.length} result{(searchResults.posts.length+searchResults.videos.length)!==1?'s':''} found
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          {!isSearching && (
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              <TabBtn t="all"      label="All Content" Icon={FileText}/>
              <TabBtn t="articles" label="Articles"    Icon={FileText}/>
              <TabBtn t="videos"   label="Videos"      Icon={Video}/>
            </div>
          )}
        </div>
      </section>

      {/* Video player */}
      {player && (
        <div style={{ background:'var(--bg-1)', borderBottom:'1px solid var(--border)', padding:'2rem 1.25rem' }}>
          <div className="wrap" style={{ maxWidth:'860px' }}>
            <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)' }}>
              <iframe src={player.video_url} title={player.title} allowFullScreen
                style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}/>
            </div>
            <div style={{ marginTop:'1.125rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <h3 className="h-serif" style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'0.375rem' }}>{player.title}</h3>
                <p style={{ color:'var(--txt-2)', fontSize:'0.875rem', lineHeight:1.7 }}>{player.description}</p>
              </div>
              <button onClick={()=>setPlayer(null)} className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}>Close ×</button>
            </div>
          </div>
        </div>
      )}

      {/* Content grid */}
      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap">
          {isSearching && <p style={{ marginBottom:'1.5rem', fontSize:'0.875rem', color:'var(--txt-3)' }}>Showing search results</p>}

          {/* Articles */}
          {(!isSearching ? (tab==='all'||tab==='articles') : displayPosts.length>0) && (
            <div style={{ marginBottom:tab==='all'&&!isSearching?'4rem':0 }}>
              {tab==='all'&&!isSearching && (
                <div className="section-divider" style={{ marginBottom:'1.5rem' }}><FileText size={13}/> Articles</div>
              )}
              {displayPosts.length === 0
                ? <p style={{ color:'var(--txt-3)', textAlign:'center', padding:'3rem', fontStyle:'italic' }}>No articles yet.</p>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap:'1rem' }}>
                    {displayPosts.map(post => {
                      const read = isRead('blog', post.id)
                      const date = post.created_at || post.createdAt
                      return (
                        <Link key={post.id} href={`/blog/${post.slug}`}
                          onClick={()=>hasAccess&&markRead('blog',post.id)}
                          style={{ textDecoration:'none', display:'block' }}>
                          <article className="card" style={{ height:'100%', overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
                            {read && <div style={{ position:'absolute', top:'0.75rem', right:'0.75rem', zIndex:2, width:'22px', height:'22px', borderRadius:'50%', background:'rgba(80,200,128,0.15)', border:'1px solid rgba(80,200,128,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle2 size={12} color="#50c880"/></div>}
                            <div style={{ height:'170px', background:'linear-gradient(135deg,var(--bg-3),var(--bg-4))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative', overflow:'hidden' }}>
                              {post.cover_image
                                ? <img src={post.cover_image} alt={post.title} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }}/>
                                : <FileText size={28} color="rgba(201,162,75,0.18)"/>}
                            </div>
                            <div style={{ padding:'1.25rem', flex:1, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                              <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                                {(post.tags||[]).map(t=><span key={t} className="badge"><Tag size={9}/>{t}</span>)}
                              </div>
                              <h3 className="h-serif" style={{ fontSize:'0.9375rem', fontWeight:700, lineHeight:1.35, color:'var(--txt-1)', flex:1 }}>{post.title}</h3>
                              <p style={{ fontSize:'0.8125rem', color:'var(--txt-2)', lineHeight:1.65 }}>{post.excerpt}</p>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.625rem', borderTop:'1px solid var(--border)' }}>
                                <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.68rem', color:'var(--txt-3)' }}><Calendar size={10}/>{fmt(date)}</span>
                                <span style={{ fontSize:'0.72rem', color:'var(--gold)', fontWeight:600 }}>Read →</span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      )
                    })}
                  </div>}
            </div>
          )}

          {/* Videos */}
          {(!isSearching ? (tab==='all'||tab==='videos') : displayVideos.length>0) && (
            <div>
              {tab==='all'&&!isSearching && (
                <div className="section-divider" style={{ marginBottom:'1.5rem' }}><Video size={13}/> Videos</div>
              )}
              {displayVideos.length === 0
                ? <p style={{ color:'var(--txt-3)', textAlign:'center', padding:'3rem', fontStyle:'italic' }}>No videos yet.</p>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap:'1rem' }}>
                    {displayVideos.map(v => {
                      const read = isRead('video', v.id)
                      const date = v.created_at || v.createdAt
                      return (
                        <button key={v.id} onClick={()=>openVideo(v)}
                          style={{ textAlign:'left', background:'var(--bg-2)', border:`1px solid ${read?'rgba(80,200,128,0.25)':'var(--border)'}`, borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer', padding:0, display:'flex', flexDirection:'column', width:'100%', transition:'all 0.25s ease', position:'relative' }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.transform='translateY(-3px)'}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=read?'rgba(80,200,128,0.25)':'var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
                          {read && <div style={{ position:'absolute', top:'0.75rem', right:'0.75rem', zIndex:2, width:'22px', height:'22px', borderRadius:'50%', background:'rgba(80,200,128,0.15)', border:'1px solid rgba(80,200,128,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle2 size={12} color="#50c880"/></div>}
                          <div style={{ position:'relative', height:'170px', background:'linear-gradient(135deg,var(--bg-3),var(--bg-4))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {v.thumbnailUrl && <img src={v.thumbnailUrl} alt={v.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>}
                            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'rgba(201,162,75,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
                              <Play size={18} fill="#080506" color="#080506" style={{ marginLeft:'2px' }}/>
                            </div>
                            {v.duration && <span style={{ position:'absolute', bottom:'0.5rem', right:'0.5rem', padding:'0.18rem 0.45rem', background:'rgba(0,0,0,0.75)', color:'#F0E6D0', fontSize:'0.65rem', fontWeight:600, borderRadius:'5px', display:'flex', alignItems:'center', gap:'0.2rem', zIndex:1 }}><Clock size={8}/>{v.duration}</span>}
                          </div>
                          <div style={{ padding:'1.25rem', flex:1, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                            <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                              {(v.tags||[]).map(t=><span key={t} className="badge"><Tag size={9}/>{t}</span>)}
                            </div>
                            <h3 className="h-serif" style={{ fontSize:'0.9375rem', fontWeight:700, lineHeight:1.35, color:'var(--txt-1)' }}>{v.title}</h3>
                            <p style={{ fontSize:'0.8125rem', color:'var(--txt-2)', lineHeight:1.65, flex:1 }}>{v.description}</p>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.625rem', borderTop:'1px solid var(--border)' }}>
                              <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.68rem', color:'var(--txt-3)' }}><Calendar size={10}/>{fmt(date)}</span>
                              <span style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.72rem', color:'var(--gold)', fontWeight:600 }}><Play size={9} fill="currentColor"/>Watch</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>}
            </div>
          )}
        </div>
      </section>
    </PaywallGate>
  )
}
