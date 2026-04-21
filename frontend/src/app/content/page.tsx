'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Play, Clock, FileText, Video, Tag, CheckCircle2, Search, X,
  Calendar, Lock, Wallet, Crown, Star, TrendingUp, Sparkles,
  Users, Zap, ChevronRight, Copy, Check as CheckIcon, ExternalLink
} from 'lucide-react'
import axios from 'axios'
import PaywallGate     from '@/components/PaywallGate'
import VideoPaywall    from '@/components/VideoPaywall'
import FundWalletModal from '@/components/FundWalletModal'
import { useProgress } from '@/hooks/useProgress'
import { getBlogPostImage, getVideoThumbnail } from '@/utils/mediaHelpers'
import { useAccess }   from '@/hooks/useAccess'
import { useWallet }   from '@/hooks/useWallet'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface BlogPost {
  id:number; title:string; slug:string; excerpt:string; content:string
  cover_image?:string; tags:string[]; status:string; createdAt:string; created_at:string
}
interface VideoPost {
  id:number; 
  title:string; 
  slug:string; 
  description:string; 
  video_url?:string
  thumbnailUrl?:string; 
  thumbnail_url?:string; 
  duration:string; 
  tags:string[]
  status:string; 
  createdAt:string; 
  created_at:string
  price_kobo:number; 
  is_free:boolean; 
  category?:string; 
  purchased?:boolean
  preview_url?:string|null; 
  preview_end_seconds?:number
  purchase_count?:number;
   effective_price_kobo?:number
  discount_active?:boolean;
  active_discount_pct?:number
  outcomes?:string[]|null; 
  lessons?:string[]|null; 
  target_audience?:string|null
}

const placeholderVideos: VideoPost[] = [
  {id:1,title:'How to Break the Busy Trap',slug:'break-busy-trap',description:'Stop running on a hamster wheel. Learn the SCSI method for focused, high-impact action.',duration:'18:32',tags:['Mindset'],status:'published',createdAt:'2025-11-15T00:00:00Z',created_at:'2025-11-15T00:00:00Z',price_kobo:200000,is_free:false,category:'Mindset',purchased:false,purchase_count:142},
  {id:2,title:'The Architecture of Achievement',slug:'architecture-achievement',description:'A deep dive into the SCSI framework for building structured results.',duration:'24:10',tags:['Leadership'],status:'published',createdAt:'2025-10-28T00:00:00Z',created_at:'2025-10-28T00:00:00Z',price_kobo:0,is_free:true,category:'Leadership',purchased:true,purchase_count:0},
  {id:3,title:'Public Speaking Masterclass: The Hook',slug:'speaking-hook',description:'The first 30 seconds of any speech determines everything.',duration:'15:45',tags:['Speaking'],status:'published',createdAt:'2025-10-10T00:00:00Z',created_at:'2025-10-10T00:00:00Z',price_kobo:200000,is_free:false,category:'Speaking',purchased:false,purchase_count:87},
]
const placeholderPosts: BlogPost[] = [
  {id:1,title:'Breaking the Busy Trap',slug:'breaking-busy-trap',excerpt:'What if the thing keeping you stuck is the very effort you think is moving you forward?',content:'',tags:['Mindset'],status:'published',createdAt:'2025-11-10T00:00:00Z',created_at:'2025-11-10T00:00:00Z'},
  {id:2,title:'Operational Blindness: The Silent Career Killer',slug:'operational-blindness',excerpt:'The most dangerous thing for a high-potential student is not failure—it is the inability to see why they are failing.',content:'',tags:['Coaching'],status:'published',createdAt:'2025-10-22T00:00:00Z',created_at:'2025-10-22T00:00:00Z'},
]

type Tab = 'all'|'articles'|'videos'
const fmt   = (d:string) => new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})
const naira = (k:number) => `₦${(k/100).toLocaleString('en-NG')}`

// ── Skeleton card ───────────────────────────────────────────────────
function VideoSkeleton() {
  return (
    <div style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
      <div className="skeleton" style={{height:'170px'}}/>
      <div style={{padding:'1.125rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        <div className="skeleton" style={{height:'12px',borderRadius:'4px',width:'40%'}}/>
        <div className="skeleton" style={{height:'16px',borderRadius:'4px'}}/>
        <div className="skeleton" style={{height:'12px',borderRadius:'4px',width:'70%'}}/>
        <div className="skeleton" style={{height:'12px',borderRadius:'4px',width:'55%'}}/>
      </div>
    </div>
  )
}

// ── Inline search ───────────────────────────────────────────────────
function InlineSearch({ onResult, onClose }: { onResult:(p:BlogPost[],v:VideoPost[])=>void; onClose:()=>void }) {
  const [q,setQ]       = useState('')
  const [busy,setBusy] = useState(false)
  const inputRef       = useRef<HTMLInputElement>(null)
  const debounce       = useRef<NodeJS.Timeout>()
  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),50) },[])
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  },[onClose])
  const doSearch=(val:string)=>{
    clearTimeout(debounce.current)
    if(!val.trim()||val.length<2){onResult([],[]);return}
    setBusy(true)
    debounce.current=setTimeout(async()=>{
      try{const{data}=await axios.get(`${API}/api/search?q=${encodeURIComponent(val)}`);onResult(data.data?.posts||[],data.data?.videos||[])}
      catch{onResult([],[])}
      finally{setBusy(false)}
    },350)
  }
  return (
    <div style={{position:'relative',display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.625rem 1rem',background:'var(--bg-1)',border:'1.5px solid rgba(201,162,75,0.4)',borderRadius:'var(--radius-md)',flex:1}}>
      <Search size={15} color="var(--gold)" style={{flexShrink:0}}/>
      <input ref={inputRef} value={q} onChange={e=>{setQ(e.target.value);doSearch(e.target.value)}} placeholder="Search content… (Esc to close)"
        style={{flex:1,background:'transparent',border:'none',outline:'none',color:'var(--txt-1)',fontSize:'0.9375rem',fontFamily:'var(--font-sans)'}}/>
      {busy&&<div style={{width:'14px',height:'14px',border:'2px solid var(--border)',borderTop:'2px solid var(--gold)',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}}/>}
      {q&&<button onClick={()=>{setQ('');onResult([],[])}} style={{background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',display:'flex',flexShrink:0}}><X size={14}/></button>}
      <button onClick={onClose} style={{background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',display:'flex',flexShrink:0}}>
        <span style={{fontSize:'0.63rem',border:'1px solid var(--border)',borderRadius:'4px',padding:'0.1rem 0.3rem'}}>Esc</span>
      </button>
    </div>
  )
}

// ── Video card ──────────────────────────────────────────────────────
function VideoCard({ v, onPlay, isRead, compact=false }: {
  v: VideoPost; onPlay: (v:VideoPost)=>void; isRead:boolean; compact?:boolean
}) {
  const owned    = v.purchased || v.is_free
  const price    = v.effective_price_kobo ?? v.price_kobo
  const thumb    = getVideoThumbnail(v.video_url, v.thumbnailUrl || v.thumbnail_url)
  const [copied, setCopied] = useState(false)

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/videos/${v.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button onClick={()=>onPlay(v)}
      style={{textAlign:'left',background:'var(--bg-2)',border:`1px solid ${isRead?'rgba(80,200,128,0.22)':owned?'rgba(201,162,75,0.15)':'var(--border)'}`,borderRadius:'var(--radius-lg)',overflow:'hidden',cursor:'pointer',padding:0,display:'flex',flexDirection:'column',width:'100%',transition:'all 0.22s ease',position:'relative'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)';e.currentTarget.style.borderColor=owned?'rgba(201,162,75,0.35)':'var(--border-hover)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor=isRead?'rgba(80,200,128,0.22)':owned?'rgba(201,162,75,0.15)':'var(--border)'}}>

      {/* Thumbnail */}
      <div style={{position:'relative',height: compact?'140px':'170px',background:'linear-gradient(135deg,var(--bg-3),var(--bg-4))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
        {thumb&&<img src={thumb} alt={v.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>}

        {/* Play/lock button */}
        <div style={{width:'48px',height:'48px',borderRadius:'50%',background:owned?'rgba(201,162,75,0.92)':'rgba(0,0,0,0.58)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1,boxShadow:'0 4px 16px rgba(0,0,0,0.4)',transition:'transform 0.2s'}}>
          {owned ? <Play size={18} fill="#080506" color="#080506" style={{marginLeft:'2px'}}/> : <Lock size={15} color="white"/>}
        </div>

        {/* Duration */}
        {v.duration&&<span style={{position:'absolute',bottom:'0.5rem',right:'0.5rem',padding:'0.15rem 0.4rem',background:'rgba(0,0,0,0.78)',color:'#F0E6D0',fontSize:'0.62rem',fontWeight:600,borderRadius:'5px',display:'flex',alignItems:'center',gap:'0.2rem',zIndex:1}}><Clock size={8}/>{v.duration}</span>}

        {/* Social proof */}
        {(v.purchase_count ?? 0) > 0 && (
          <span style={{position:'absolute',bottom:'0.5rem',left:'0.5rem',padding:'0.15rem 0.4rem',background:'rgba(0,0,0,0.72)',color:'rgba(255,255,255,0.85)',fontSize:'0.6rem',fontWeight:600,borderRadius:'5px',display:'flex',alignItems:'center',gap:'0.25rem',zIndex:1,backdropFilter:'blur(4px)'}}>
            <Users size={8}/>{v.purchase_count}
          </span>
        )}

        {/* Badge: Free / Owned / Discounted / Price */}
        <div style={{position:'absolute',top:'0.5rem',left:'0.5rem',zIndex:1}}>
          {v.is_free
            ? <span style={{padding:'0.15rem 0.5rem',borderRadius:'99px',background:'rgba(80,200,128,0.9)',color:'#080506',fontSize:'0.58rem',fontWeight:800,letterSpacing:'0.06em',display:'flex',alignItems:'center',gap:'0.2rem'}}><Star size={8} fill="currentColor"/>FREE</span>
            : owned
            ? <span style={{padding:'0.15rem 0.5rem',borderRadius:'99px',background:'rgba(201,162,75,0.9)',color:'#080506',fontSize:'0.58rem',fontWeight:800,display:'flex',alignItems:'center',gap:'0.2rem'}}><CheckCircle2 size={8}/>OWNED</span>
            : v.discount_active
            ? <div style={{display:'flex',flexDirection:'column',gap:'0.15rem'}}>
                <span style={{padding:'0.15rem 0.4rem',borderRadius:'99px',background:'rgba(220,60,60,0.9)',color:'white',fontSize:'0.58rem',fontWeight:800,display:'flex',alignItems:'center',gap:'0.2rem'}}><Zap size={8} fill="currentColor"/>{v.active_discount_pct}% OFF</span>
                <span style={{padding:'0.12rem 0.4rem',borderRadius:'4px',background:'rgba(0,0,0,0.75)',color:'white',fontSize:'0.58rem',fontWeight:700}}>{naira(price)}</span>
              </div>
            : <span style={{padding:'0.15rem 0.5rem',borderRadius:'99px',background:'rgba(0,0,0,0.75)',color:'white',fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.06em',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',gap:'0.2rem'}}><Crown size={8}/>{naira(price)}</span>}
        </div>

        {/* Read check */}
        {isRead&&<div style={{position:'absolute',top:'0.6rem',right:'0.6rem',zIndex:2,width:'22px',height:'22px',borderRadius:'50%',background:'rgba(80,200,128,0.15)',border:'1px solid rgba(80,200,128,0.4)',display:'flex',alignItems:'center',justifyContent:'center'}}><CheckCircle2 size={11} color="#50c880"/></div>}
      </div>

      {/* Info */}
      <div style={{padding:'1.0625rem',flex:1,display:'flex',flexDirection:'column',gap:'0.4rem'}}>
        <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',alignItems:'center'}}>
          {v.category&&<span style={{padding:'0.1rem 0.4rem',borderRadius:'99px',background:'rgba(201,162,75,0.08)',border:'1px solid rgba(201,162,75,0.18)',fontSize:'0.6rem',fontWeight:700,color:'var(--gold)',letterSpacing:'0.06em'}}>{v.category}</span>}
          {(v.tags||[]).slice(0,2).map(t=><span key={t} className="badge" style={{fontSize:'0.58rem'}}><Tag size={8}/>{t}</span>)}
        </div>
        <h3 style={{fontFamily:'var(--font-serif)',fontSize:'0.9rem',fontWeight:700,lineHeight:1.35,color:'var(--txt-1)'}}>{v.title}</h3>
        {!compact&&<p style={{fontSize:'0.78rem',color:'var(--txt-2)',lineHeight:1.6,flex:1,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{v.description}</p>}
        {/* Value framing */}
        {!owned&&!v.is_free&&(
          <p style={{fontSize:'0.67rem',color:'var(--txt-3)',lineHeight:1.4}}>
            {naira(price)} · {Math.round(price/100/30) < 100
              ? `Less than ₦${Math.round(price/100/30)}/day`
              : 'One-time investment'}
          </p>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'0.5rem',borderTop:'1px solid var(--border)',marginTop:'auto'}}>
          <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.65rem',color:'var(--txt-3)'}}><Calendar size={9}/>{fmt(v.created_at||v.createdAt)}</span>
          <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.72rem',color:owned?'#50c880':'var(--gold)',fontWeight:700}}>
            {owned?<><Play size={9} fill="currentColor"/>Watch now</>:<><Lock size={9}/>Unlock</>}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Section header ──────────────────────────────────────────────────
function SectionHeader({ icon, title, sub }: { icon:React.ReactNode; title:string; sub?:string }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'0.625rem',marginBottom:'1.25rem'}}>
      <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'var(--gold-dim)',border:'1px solid rgba(201,162,75,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',flexShrink:0}}>{icon}</div>
      <div>
        <h2 style={{fontFamily:'var(--font-serif)',fontSize:'1.0625rem',fontWeight:700,color:'var(--txt-1)',lineHeight:1}}>{title}</h2>
        {sub&&<p style={{fontSize:'0.72rem',color:'var(--txt-3)',marginTop:'0.15rem'}}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Recommendations row ─────────────────────────────────────────────
function RecommendationsRow({ videoId, token, onPlay, isRead }: {
  videoId:number; token:string; onPlay:(v:VideoPost)=>void; isRead:(type:string,id:number)=>boolean
}) {
  const [recs,setRecs]       = useState<VideoPost[]>([])
  const [loading,setLoading] = useState(true)
  useEffect(()=>{
    setLoading(true)
    axios.get(`${API}/api/videos/${videoId}/recommendations`,{headers:token?{Authorization:`Bearer ${token}`}:{}})
      .then(r=>{if(r.data.success)setRecs(r.data.data)}).catch(()=>{})
      .finally(()=>setLoading(false))
  },[videoId,token])

  if(!loading&&recs.length===0) return null
  return (
    <div style={{background:'var(--bg-1)',borderBottom:'1px solid var(--border)',padding:'1.5rem 1.25rem'}}>
      <div className="wrap" style={{maxWidth:'1000px'}}>
        <SectionHeader icon={<Sparkles size={15}/>} title="You Might Also Like" sub="Based on what you just watched"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,220px),1fr))',gap:'0.875rem'}}>
          {loading
            ? Array(4).fill(0).map((_,i)=><VideoSkeleton key={i}/>)
            : recs.map(v=><VideoCard key={v.id} v={v} onPlay={onPlay} isRead={isRead('video',v.id)} compact/>)}
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────
export default function ContentPage() {
  const [tab,setTab]               = useState<Tab>('all')
  const [posts,setPosts]           = useState<BlogPost[]>(placeholderPosts)
  const [videos,setVideos]         = useState<VideoPost[]>(placeholderVideos)
  const [trending,setTrending]     = useState<VideoPost[]>([])
  const [recent,setRecent]         = useState<VideoPost[]>([])
  const [categories,setCategories] = useState<string[]>([])
  const [activeCategory,setActiveCat] = useState<string>('All')
  const [loadingVideos,setLoadingVideos] = useState(true)
  const [player,setPlayer]         = useState<{url:string;title:string;description:string;videoId:number}|null>(null)
  const [searching,setSearching]   = useState(false)
  const [searchResults,setSearchResults] = useState<{posts:BlogPost[];videos:VideoPost[]}|null>(null)
  const [paywallVideo,setPaywallVideo]         = useState<VideoPost|null>(null)
  const [fundModal,setFundModal]               = useState(false)
  const [fundSuggestedKobo,setFundSuggestedKobo] = useState<number|undefined>()

  const { markRead, isRead, totalRead } = useProgress()
  const { hasAccess, token, user }      = useAccess()
  const { wallet, reload: reloadWallet } = useWallet(token, hasAccess)

  const getT = useCallback(()=> token || localStorage.getItem('scsi_access_token') || '', [token])
  const authH = useCallback(()=> getT() ? {Authorization:`Bearer ${getT()}`} : {}, [getT])

  const loadContent = useCallback(()=>{
    const h = authH()
    // Main videos (filtered)
    const catParam = activeCategory!=='All' ? `&category=${encodeURIComponent(activeCategory)}` : ''
    setLoadingVideos(true)
    axios.get(`${API}/api/videos?limit=30${catParam}`,{headers:h}).then(r=>{
      if(r.data?.success){
        setVideos(r.data.data.videos||[])
        if(r.data.data.categories?.length) setCategories(r.data.data.categories)
      }
    }).catch(()=>{}).finally(()=>setLoadingVideos(false))
    // Blog
    axios.get(`${API}/api/blog`,{headers:h}).then(r=>{
      if(r.data?.success&&r.data.data?.posts?.length) setPosts(r.data.data.posts)
    }).catch(()=>{})
    // Trending + Recent (parallel, only once)
    if(trending.length===0){
      axios.get(`${API}/api/videos/trending?limit=6`,{headers:h}).then(r=>{if(r.data?.success)setTrending(r.data.data)}).catch(()=>{})
      axios.get(`${API}/api/videos/recent?limit=6`,{headers:h}).then(r=>{if(r.data?.success)setRecent(r.data.data)}).catch(()=>{})
    }
  },[authH, activeCategory])

  useEffect(()=>{ loadContent() },[loadContent])

  const handleVideoClick = useCallback(async(v:VideoPost)=>{
    if(!hasAccess) return
    try {
      const {data} = await axios.get(`${API}/api/videos/${v.id}/access`,{headers:authH()})
      if(data.success&&data.canWatch&&data.video?.video_url){
        setPlayer({url:data.video.video_url,title:data.video.title,description:data.video.description||'',videoId:v.id})
        markRead('video',v.id)
        setVideos(prev=>prev.map(x=>x.id===v.id?{...x,purchased:true}:x))
        window.scrollTo({top:0,behavior:'smooth'})
      } else if(!data.canWatch&&data.reason==='not_purchased'){
        setPaywallVideo({...v,preview_url:data.preview_url??null,preview_end_seconds:data.preview_end_seconds??60,
          effective_price_kobo:data.effective_price_kobo??v.price_kobo,
          discount_active:data.discount_active??false,active_discount_pct:data.active_discount_pct??0,
          outcomes:data.outcomes||v.outcomes||null,lessons:data.lessons||v.lessons||null})
        // Record view intent for follow-up notifications
        axios.post(`${API}/api/videos/${v.id}/intent`,{},{headers:authH()}).catch(()=>{})
      }
    } catch(e:unknown){
      const err=e as {response?:{data?:{reason?:string;price_kobo?:number;effective_price_kobo?:number;preview_url?:string|null;preview_end_seconds?:number;discount_active?:boolean;active_discount_pct?:number;outcomes?:string[];lessons?:string[]}}}
      const d=err.response?.data
      if(d?.reason==='not_purchased'){
        setPaywallVideo({...v,price_kobo:d.price_kobo??v.price_kobo,effective_price_kobo:d.effective_price_kobo??v.price_kobo,
          preview_url:d.preview_url??null,preview_end_seconds:d.preview_end_seconds??60,
          discount_active:d.discount_active??false,active_discount_pct:d.active_discount_pct??0,
          outcomes:d.outcomes||null,lessons:d.lessons||null})
        axios.post(`${API}/api/videos/${v.id}/intent`,{},{headers:authH()}).catch(()=>{})
      }
    }
  },[hasAccess,authH,markRead])

  const displayPosts  = searchResults ? searchResults.posts  : posts
  const displayVideos = searchResults ? searchResults.videos : videos
  const isSearching   = searchResults !== null

  const TabBtn=({t,label,Icon}:{t:Tab;label:string;Icon:React.ElementType})=>(
    <button onClick={()=>setTab(t)} style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.5rem 1rem',borderRadius:'99px',fontSize:'0.8125rem',fontWeight:600,border:tab===t?'1.5px solid var(--gold)':'1.5px solid var(--border)',background:tab===t?'var(--gold-dim)':'transparent',color:tab===t?'var(--gold)':'var(--txt-2)',cursor:'pointer',transition:'all 0.2s'}}>
      <Icon size={13}/>{label}
    </button>
  )

  const priceDisplay = paywallVideo
    ? (paywallVideo.effective_price_kobo ?? paywallVideo.price_kobo)
    : 0

  return (
    <PaywallGate>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .skeleton{background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 50%,var(--bg-2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      {/* Modals */}
      {paywallVideo&&user&&(
        <VideoPaywall
          videoId={paywallVideo.id}
          videoTitle={paywallVideo.title}
          priceKobo={paywallVideo.price_kobo}
          walletBalance={wallet?.balance_kobo??0}
          userEmail={user.email}
          token={getT()}
          previewUrl={paywallVideo.preview_url??null}
          previewEndSeconds={paywallVideo.preview_end_seconds??60}
          mainVideoUrl={paywallVideo.video_url??null}
          thumbnailUrl={paywallVideo.thumbnail_url??null}
          outcomes={paywallVideo.outcomes||null}
          lessons={paywallVideo.lessons||null}
          purchaseCount={paywallVideo.purchase_count??0}
          discountActive={paywallVideo.discount_active??false}
          discountPct={paywallVideo.active_discount_pct??0}
          onPurchased={(videoUrl)=>{
            const vid=paywallVideo; setPaywallVideo(null)
            setVideos(prev=>prev.map(x=>x.id===vid.id?{...x,purchased:true}:x))
            reloadWallet()
            if(videoUrl){
              setPlayer({url:videoUrl,title:vid.title,description:vid.description||'',videoId:vid.id})
              markRead('video',vid.id)
              window.scrollTo({top:0,behavior:'smooth'})
            }
          }}
          onClose={()=>setPaywallVideo(null)}
          onFundWallet={(suggested)=>{setFundSuggestedKobo(suggested);setPaywallVideo(null);setFundModal(true)}}
        />
      )}
      {fundModal&&user&&(
        <FundWalletModal
          userEmail={user.email} token={getT()}
          suggestedAmountKobo={fundSuggestedKobo}
          onClose={()=>{setFundModal(false);setFundSuggestedKobo(undefined)}}
          onFunded={(bal)=>{reloadWallet();setFundModal(false);setFundSuggestedKobo(undefined)}}
        />
      )}

      {/* Hero */}
      <section style={{paddingTop:'clamp(88px,10vh,110px)',paddingBottom:'2rem',background:'linear-gradient(175deg,var(--bg-2) 0%,var(--bg-0) 100%)',borderBottom:'1px solid var(--border)'}}>
        <div className="wrap">
          <p className="eyebrow">Content Library</p>
          <div style={{display:'flex',flexWrap:'wrap',alignItems:'flex-end',justifyContent:'space-between',gap:'1rem',marginBottom:'1rem'}}>
            <div>
              <h1 style={{fontFamily:'var(--font-serif)',fontSize:'clamp(1.75rem,4vw,2.75rem)',fontWeight:700,marginBottom:'0.375rem'}}>
                Articles & <span className="grad-text">Video Masterclasses</span>
              </h1>
              <div style={{display:'flex',alignItems:'center',gap:'0.875rem',flexWrap:'wrap'}}>
                {hasAccess&&totalRead>0&&(
                  <div style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',padding:'0.2rem 0.625rem',background:'rgba(80,200,128,0.08)',border:'1px solid rgba(80,200,128,0.25)',borderRadius:'99px'}}>
                    <CheckCircle2 size={11} color="#50c880"/>
                    <span style={{fontSize:'0.68rem',fontWeight:700,color:'#50c880'}}>{totalRead} completed</span>
                  </div>
                )}
                {wallet&&(
                  <button onClick={()=>setFundModal(true)} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',padding:'0.2rem 0.625rem',background:'rgba(201,162,75,0.08)',border:'1px solid rgba(201,162,75,0.22)',borderRadius:'99px',cursor:'pointer'}}>
                    <Wallet size={11} color="var(--gold)"/>
                    <span style={{fontSize:'0.68rem',fontWeight:700,color:'var(--gold)'}}>{naira(wallet.balance_kobo)}</span>
                  </button>
                )}
              </div>
            </div>
            {!searching&&(
              <button onClick={()=>setSearching(true)}
                style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 0.875rem',background:'var(--bg-1)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--txt-3)',fontSize:'0.8125rem',cursor:'pointer',transition:'all 0.2s',whiteSpace:'nowrap'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.color='var(--txt-1)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}>
                <Search size={13}/>Search<span style={{fontSize:'0.6rem',padding:'0.1rem 0.3rem',background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:'4px'}}>⌘K</span>
              </button>
            )}
          </div>

          {searching&&(
            <div style={{marginBottom:'1rem',animation:'fadeUp 0.2s ease both'}}>
              <InlineSearch onResult={(p,v)=>setSearchResults(p.length||v.length?{posts:p,videos:v}:null)} onClose={()=>{setSearching(false);setSearchResults(null)}}/>
              {searchResults&&<p style={{marginTop:'0.375rem',fontSize:'0.75rem',color:'var(--txt-3)'}}>{searchResults.posts.length+searchResults.videos.length} results</p>}
            </div>
          )}

          {/* Category chips + tabs */}
          {!isSearching&&(
            <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
              {(tab==='all'||tab==='videos')&&categories.length>0&&(
                <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap'}}>
                  {['All',...categories].map(cat=>(
                    <button key={cat} onClick={()=>setActiveCat(cat)}
                      style={{padding:'0.3rem 0.75rem',borderRadius:'99px',border:`1px solid ${activeCategory===cat?'var(--gold)':'var(--border)'}`,background:activeCategory===cat?'var(--gold-dim)':'transparent',color:activeCategory===cat?'var(--gold)':'var(--txt-3)',fontSize:'0.75rem',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                <TabBtn t="all"      label="All"      Icon={FileText}/>
                <TabBtn t="articles" label="Articles" Icon={FileText}/>
                <TabBtn t="videos"   label="Videos"   Icon={Video}/>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Inline player + recommendations */}
      {player&&(
        <>
          <div style={{background:'var(--bg-1)',borderBottom:'1px solid var(--border)',padding:'1.75rem 1.25rem'}}>
            <div className="wrap" style={{maxWidth:'860px'}}>
              <div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)',background:'#000'}}>
                <iframe src={player.url} title={player.title} allowFullScreen style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}/>
              </div>
              <div style={{marginTop:'1rem',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <h3 style={{fontFamily:'var(--font-serif)',fontSize:'1.0625rem',fontWeight:700,marginBottom:'0.3rem'}}>{player.title}</h3>
                  <p style={{color:'var(--txt-2)',fontSize:'0.85rem',lineHeight:1.7}}>{player.description}</p>
                </div>
                <button onClick={()=>setPlayer(null)} className="btn btn-ghost btn-sm" style={{flexShrink:0}}>Close ×</button>
              </div>
            </div>
          </div>
          <RecommendationsRow videoId={player.videoId} token={getT()} onPlay={handleVideoClick} isRead={(type, id) => isRead('video', id)} />
        </>
      )}

      <section className="section" style={{background:'var(--bg-0)'}}>
        <div className="wrap">
          {isSearching&&<p style={{marginBottom:'1.5rem',fontSize:'0.875rem',color:'var(--txt-3)'}}>Showing search results</p>}

          {/* ── Trending Videos (only on all/videos, not searching) ── */}
          {!isSearching&&(tab==='all'||tab==='videos')&&trending.length>0&&(
            <div style={{marginBottom:'3rem'}}>
              <SectionHeader icon={<TrendingUp size={15}/>} title="Trending Videos" sub="Most purchased by students"/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,270px),1fr))',gap:'0.875rem'}}>
                {trending.map(v=><VideoCard key={v.id} v={v} onPlay={handleVideoClick} isRead={isRead('video',v.id)}/>)}
              </div>
            </div>
          )}

          {/* ── Recently Added ── */}
          {!isSearching&&(tab==='all'||tab==='videos')&&recent.length>0&&(
            <div style={{marginBottom:'3rem'}}>
              <SectionHeader icon={<Sparkles size={15}/>} title="Recently Added" sub="Fresh from Coach Precious"/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,270px),1fr))',gap:'0.875rem'}}>
                {recent.map(v=><VideoCard key={v.id} v={v} onPlay={handleVideoClick} isRead={isRead('video',v.id)}/>)}
              </div>
            </div>
          )}

          {/* ── Articles ── */}
          {(!isSearching?(tab==='all'||tab==='articles'):displayPosts.length>0)&&(
            <div style={{marginBottom:tab==='all'&&!isSearching?'3rem':0}}>
              {!isSearching&&<div className="section-divider" style={{marginBottom:'1.25rem'}}><FileText size={13}/> Articles</div>}
              {displayPosts.length===0
                ? <EmptyState icon="📝" title="No articles yet" body="Coach Precious hasn't published articles yet. Check back soon!"/>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,290px),1fr))',gap:'1rem'}}>
                    {displayPosts.map(post=>{
                      const read=isRead('blog',post.id)
                      return (
                        <Link key={post.id} href={`/blog/${post.slug}`} onClick={()=>hasAccess&&markRead('blog',post.id)} style={{textDecoration:'none',display:'block'}}>
                          <article className="card" style={{height:'100%',overflow:'hidden',display:'flex',flexDirection:'column',position:'relative',transition:'all 0.22s ease'}}
                            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.18)'}}
                            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                            {read&&<div style={{position:'absolute',top:'0.6rem',right:'0.6rem',zIndex:2,width:'22px',height:'22px',borderRadius:'50%',background:'rgba(80,200,128,0.15)',border:'1px solid rgba(80,200,128,0.4)',display:'flex',alignItems:'center',justifyContent:'center'}}><CheckCircle2 size={11} color="#50c880"/></div>}
                            <div style={{height:'160px',background:'linear-gradient(135deg,var(--bg-3),var(--bg-4))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',overflow:'hidden'}}>
                              {getBlogPostImage(post)?<img src={getBlogPostImage(post)!} alt={post.title} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}} loading="lazy"/>:<FileText size={26} color="rgba(201,162,75,0.15)"/>}
                            </div>
                            <div style={{padding:'1.125rem',flex:1,display:'flex',flexDirection:'column',gap:'0.4rem'}}>
                              <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>{(post.tags||[]).map(t=><span key={t} className="badge" style={{fontSize:'0.58rem'}}><Tag size={8}/>{t}</span>)}</div>
                              <h3 style={{fontFamily:'var(--font-serif)',fontSize:'0.9375rem',fontWeight:700,lineHeight:1.35,color:'var(--txt-1)',flex:1}}>{post.title}</h3>
                              <p style={{fontSize:'0.8rem',color:'var(--txt-2)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{post.excerpt}</p>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'0.5rem',borderTop:'1px solid var(--border)'}}>
                                <span style={{fontSize:'0.65rem',color:'var(--txt-3)'}}>{fmt(post.created_at||post.createdAt)}</span>
                                <span style={{fontSize:'0.72rem',color:'var(--gold)',fontWeight:600}}>Read →</span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      )
                    })}
                  </div>}
            </div>
          )}

          {/* ── All Videos (unfiltered section) ── */}
          {(!isSearching?(tab==='all'||tab==='videos'):displayVideos.length>0)&&(
            <div>
              {!isSearching&&<div className="section-divider" style={{marginBottom:'1.25rem'}}><Video size={13}/> {activeCategory!=='All'?activeCategory+' Videos':'All Videos'}</div>}
              {loadingVideos
                ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,270px),1fr))',gap:'0.875rem'}}>
                    {Array(6).fill(0).map((_,i)=><VideoSkeleton key={i}/>)}
                  </div>
                : displayVideos.length===0
                ? <EmptyState icon="🎥" title={activeCategory!=='All'?`No ${activeCategory} videos yet`:"No videos yet"} body="Check back soon — Coach Precious is recording masterclasses for you."/>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,270px),1fr))',gap:'0.875rem'}}>
                    {displayVideos.map(v=><VideoCard key={v.id} v={v} onPlay={handleVideoClick} isRead={isRead('video',v.id)}/>)}
                  </div>}
            </div>
          )}
        </div>
      </section>
    </PaywallGate>
  )
}

function EmptyState({icon,title,body}:{icon:string;title:string;body:string}) {
  return (
    <div style={{textAlign:'center',padding:'3.5rem 2rem',background:'var(--bg-2)',border:'1px dashed var(--border)',borderRadius:'var(--radius-xl)'}}>
      <p style={{fontSize:'2.5rem',marginBottom:'0.875rem'}}>{icon}</p>
      <h3 style={{fontFamily:'var(--font-serif)',fontSize:'1rem',fontWeight:700,color:'var(--txt-1)',marginBottom:'0.375rem'}}>{title}</h3>
      <p style={{color:'var(--txt-3)',fontSize:'0.85rem',lineHeight:1.6,maxWidth:'280px',margin:'0 auto'}}>{body}</p>
    </div>
  )
}
