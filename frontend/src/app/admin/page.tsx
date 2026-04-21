'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import {
  LayoutDashboard, FileText, Video, Users, Mail, MessageSquare,
  LogOut, Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronRight, Wallet, TrendingUp,
  Send, BookOpen, UserCheck, Eye, Activity, Search, ImageIcon, Tag, Menu, Crown,
  BarChart2, Camera, User, Moon, Sun, Icons,
  Shield, CreditCard, Bell, RefreshCw, Upload, Link as LinkIcon
} from 'lucide-react'

// hooks
import { useTheme } from '@/hooks/useTheme'
//import RichEditor from '@/components/ui/RichEditor'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
type Tab = 'dashboard'|'blog'|'videos'|'gallery'|'students'|'contacts'|'registrations'|'testimonials'|'subscribers'|'broadcast'|'coupons'|'system'|'settings'

// ── Types ──
interface Stats { totalContacts:number; totalRegistrations:number; activeSubscribers:number; publishedPosts:number; publishedVideos:number; pendingTestimonials:number }
interface Revenue { total_kobo:number; successful_payments:number; monthly_count:number; quarterly_count:number; last_30_days_kobo:number; last_30_days_count:number }
interface Analytics {
  total_revenue:number; subscription_revenue:number; video_revenue:number; wallet_funding_total:number
  revenue_last_7_days:number; revenue_last_30_days:number
  subscription_count:number; video_purchase_count:number
  last_30_sub_count:number; last_30_vid_count:number
  top_earning_videos:{id:number;title:string;price_kobo:number;purchase_count:number;total_revenue_kobo:number}[]
  daily_chart:{day:string;total_kobo:number}[]
}
interface BlogPost { id:number; title:string; slug:string; excerpt:string; content:string; cover_image:string; tags:string[]; status:string; created_at:string }
interface VideoPost { id:number; title:string; slug:string; description:string; video_url:string; duration:string; tags:string[]; status:string; created_at:string }
interface Student { id:number; full_name:string; email:string; plan:string; expires_at:string; is_active:boolean; created_at:string; phone:string; bio:string }
interface Contact { id:number; full_name:string; email:string; phone:string; inquiry_type:string; message:string; created_at:string }

const fmt    = (d:string) => new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})
const naira  = (k:number) => `₦${(k/100).toLocaleString('en-NG')}`
const slug   = (s:string) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
const authH  = (t:string) => ({ Authorization:`Bearer ${t}` })

// ── Toast (top-right, no alert()) ──
function useToast() {
  const [toasts, setToasts] = useState<{id:number;msg:string;type:'ok'|'err'|'info'}[]>([])
  let id = useRef(0)
  const add = useCallback((msg:string, type:'ok'|'err'|'info'='info') => {
    const i = ++id.current
    setToasts(p=>[...p.slice(-3),{id:i,msg,type}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==i)),4000)
  },[])
  const ok  = useCallback((m:string)=>add(m,'ok'),[add])
  const err = useCallback((m:string)=>add(m,'err'),[add])
  const dismiss = (i:number) => setToasts(p=>p.filter(t=>t.id!==i))
  const ToastUI = (
    <div style={{position:'fixed',top:'1.25rem',right:'1.25rem',zIndex:9999,display:'flex',flexDirection:'column',gap:'0.5rem',pointerEvents:'none'}}>
      {toasts.map(t=>(
        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1rem',borderRadius:'10px',fontSize:'0.875rem',fontWeight:600,minWidth:'240px',maxWidth:'340px',boxShadow:'0 8px 24px rgba(0,0,0,0.35)',animation:'toastIn 0.3s ease both',pointerEvents:'all',background:t.type==='ok'?'rgba(40,180,100,0.14)':t.type==='err'?'rgba(220,60,60,0.14)':'rgba(201,162,75,0.14)',border:`1px solid ${t.type==='ok'?'rgba(40,180,100,0.4)':t.type==='err'?'rgba(220,60,60,0.4)':'rgba(201,162,75,0.35)'}`,color:t.type==='ok'?'#50c880':t.type==='err'?'#e07070':'var(--gold)'}}>
          {t.type==='ok'?<Check size={14}/>:t.type==='err'?<X size={14}/>:<Bell size={14}/>}
          <span style={{flex:1}}>{t.msg}</span>
          <button onClick={()=>dismiss(t.id)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',opacity:0.6,display:'flex',padding:0,pointerEvents:'all'}}><X size={12}/></button>
        </div>
      ))}
    </div>
  )
  return { ok, err, info:add, ToastUI }
}

// ── Stat Card ──
function StatCard({label,value,sub,icon,color='var(--gold)'}:{label:string;value:string|number;sub?:string;icon:React.ReactNode;color?:string}) {
  return (
    <div style={{padding:'1.375rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',position:'relative',overflow:'hidden',transition:'border-color 0.2s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-hover)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
      <div style={{position:'absolute',top:0,right:0,width:'70px',height:'70px',borderRadius:'0 0 0 70px',background:`${color}08`}}/>
      <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',color,marginBottom:'0.875rem'}}>{icon}</div>
      <div style={{fontFamily:'var(--font-serif)',fontSize:'1.75rem',fontWeight:700,color:'var(--txt-1)',lineHeight:1,marginBottom:'0.25rem'}}>{value}</div>
      <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--txt-2)'}}>{label}</div>
      {sub&&<div style={{fontSize:'0.72rem',color:'var(--txt-3)',marginTop:'0.15rem'}}>{sub}</div>}
    </div>
  )
}

// ── Image Upload for admin ──
function AdminImageUpload({value,onChange,token}:{value:string;onChange:(u:string)=>void;token:string}) {
  const [busy,setBusy] = useState(false)
  const [err,setErr]   = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const upload = async (file:File) => {
    setBusy(true); setErr('')
    try {
      const {data:sig} = await axios.get(`${API}/api/upload/cloudinary-signature`,{headers:authH(token)})
      if(!sig.success) throw new Error(sig.message)
      const fd = new FormData(); fd.append('file',file); fd.append('api_key',sig.apiKey); fd.append('timestamp',sig.timestamp); fd.append('signature',sig.signature); fd.append('folder',sig.folder)
      const {data:cloud} = await axios.post(sig.uploadUrl,fd)
      onChange(cloud.secure_url)
    } catch(e:unknown) {
      const er = e as {response?:{data?:{message?:string}};message?:string}
      setErr(er.response?.data?.message||er.message||'Upload failed')
    }
    setBusy(false)
  }

  return (
    <div>
      <label className="fl">Cover Image</label>
      {value ? (
        <div style={{position:'relative',width:'100%',maxWidth:'280px'}}>
          <img src={value} alt="Cover" style={{width:'100%',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',objectFit:'cover',maxHeight:'160px'}}/>
          <button onClick={()=>onChange('')} style={{position:'absolute',top:'0.375rem',right:'0.375rem',width:'24px',height:'24px',borderRadius:'50%',background:'rgba(0,0,0,0.7)',border:'none',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={12}/></button>
        </div>
      ) : (
        <button type="button" onClick={()=>ref.current?.click()} disabled={busy}
          style={{width:'100%',maxWidth:'280px',height:'100px',borderRadius:'var(--radius-md)',border:'2px dashed var(--border)',background:'var(--bg-1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.5rem',cursor:'pointer',transition:'all 0.2s',color:'var(--txt-3)'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.color='var(--gold)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}>
          {busy?<><RefreshCw size={18} style={{animation:'spin 0.8s linear infinite'}}/><span style={{fontSize:'0.78rem'}}>Uploading…</span></>
               :<><Upload size={18}/><span style={{fontSize:'0.78rem'}}>Click to upload image</span><span style={{fontSize:'0.68rem',opacity:0.7}}>PNG, JPG, WebP · Max 5MB</span></>}
        </button>
      )}
      {err&&<p style={{marginTop:'0.375rem',fontSize:'0.75rem',color:'#e07070'}}>{err}</p>}
      <input ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)upload(f)}}/>
    </div>
  )
}

// ── Video Upload (file OR YouTube) ──
function VideoUploadField({value,onChange,token,onToast}:{value:string;onChange:(u:string)=>void;token:string;onToast:(m:string,t:'ok'|'err'|'info')=>void}) {
  const [mode,setMode]     = useState<'youtube'|'file'>('youtube')
  const [uploading,setUploading] = useState(false)
  const [progress,setProgress]  = useState(0)
  const ref = useRef<HTMLInputElement>(null)

  const uploadVideo = async (file:File) => {
    if(file.size > 500*1024*1024){onToast('Video must be under 500MB','err');return}
    setUploading(true); setProgress(0)
    try {
      const {data:sig} = await axios.get(`${API}/api/upload/video-signature`,{headers:authH(token)})
      if(!sig.success) throw new Error(sig.message)
      const fd = new FormData(); fd.append('file',file); fd.append('api_key',sig.apiKey); fd.append('timestamp',sig.timestamp); fd.append('signature',sig.signature); fd.append('folder',sig.folder); fd.append('resource_type','video')
      const {data:cloud} = await axios.post(sig.uploadUrl,fd,{
        onUploadProgress:(e)=>setProgress(Math.round((e.loaded/(e.total||1))*100))
      })
      // Convert Cloudinary URL to embeddable format
      onChange(cloud.secure_url)
      onToast('Video uploaded successfully!','ok')
    } catch(e:unknown) {
      const er = e as {response?:{data?:{message?:string}};message?:string}
      onToast(er.response?.data?.message||'Video upload failed. Check Cloudinary credentials.','err')
    }
    setUploading(false); setProgress(0)
  }

  return (
    <div>
      <label className="fl">Video Source</label>
      {/* Mode toggle */}
      <div style={{display:'flex',gap:'0.375rem',marginBottom:'0.75rem'}}>
        {(['youtube','file'] as const).map(m=>(
          <button key={m} type="button" onClick={()=>setMode(m)}
            style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.4rem 0.875rem',borderRadius:'99px',fontSize:'0.78rem',fontWeight:600,border:`1.5px solid ${mode===m?'var(--gold)':'var(--border)'}`,background:mode===m?'var(--gold-dim)':'transparent',color:mode===m?'var(--gold)':'var(--txt-2)',cursor:'pointer',transition:'all 0.18s'}}>
            {m==='youtube'?<LinkIcon size={12}/>:<Upload size={12}/>}
            {m==='youtube'?'YouTube Link':'Upload File'}
          </button>
        ))}
      </div>

      {mode==='youtube' ? (
        <div>
          <input value={value} className="fi" placeholder="https://www.youtube.com/embed/VIDEO_ID"
            onChange={e=>onChange(e.target.value)}/>
          <p style={{marginTop:'0.375rem',fontSize:'0.72rem',color:'var(--txt-3)'}}>
            Go to YouTube → Share → Embed → copy the src URL (starts with https://www.youtube.com/embed/)
          </p>
        </div>
      ) : (
        <div>
          {value && value.includes('cloudinary') ? (
            <div style={{padding:'0.875rem',background:'rgba(80,200,128,0.08)',border:'1px solid rgba(80,200,128,0.3)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.75rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <Check size={14} color="#50c880"/>
                <span style={{fontSize:'0.8rem',color:'#50c880',fontWeight:600}}>Video uploaded to Cloudinary</span>
              </div>
              <button onClick={()=>onChange('')} style={{background:'none',border:'none',color:'#e07070',cursor:'pointer',fontSize:'0.75rem'}}>Remove</button>
            </div>
          ) : (
            <button type="button" onClick={()=>ref.current?.click()} disabled={uploading}
              style={{width:'100%',padding:'1.5rem',borderRadius:'var(--radius-md)',border:'2px dashed var(--border)',background:'var(--bg-1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.625rem',cursor:'pointer',color:'var(--txt-3)',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.color='var(--gold)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}>
              {uploading ? (
                <>
                  <RefreshCw size={22} style={{animation:'spin 0.8s linear infinite'}}/>
                  <span style={{fontSize:'0.85rem',fontWeight:600}}>Uploading… {progress}%</span>
                  <div style={{width:'100%',maxWidth:'200px',height:'4px',background:'var(--bg-3)',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{height:'100%',background:'var(--gold)',borderRadius:'2px',width:`${progress}%`,transition:'width 0.3s ease'}}/>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={22}/>
                  <span style={{fontSize:'0.85rem',fontWeight:600}}>Click to upload video file</span>
                  <span style={{fontSize:'0.72rem',opacity:0.7}}>MP4, MOV, AVI · Max 500MB · Uploads to Cloudinary</span>
                </>
              )}
            </button>
          )}
          <input ref={ref} type="file" accept="video/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)uploadVideo(f)}}/>
        </div>
      )}
    </div>
  )
}

// ── Blog Manager ──
function BlogManager({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const [posts,setPosts]   = useState<BlogPost[]>([])
  const [form,setForm]     = useState({title:'',slug:'',excerpt:'',content:'',cover_image:'',tags:'',status:'draft'})
  const [editing,setEditing] = useState<number|null>(null)
  const [showForm,setShowForm] = useState(false)
  const [saving,setSaving] = useState(false)

  const load = useCallback(async()=>{
    try{const{data}=await axios.get(`${API}/api/admin/blog`,{headers:authH(token)});setPosts(data.data||[])}catch{}
  },[token])
  useEffect(()=>{load()},[load])

  const save = async()=>{
    if(!form.title.trim()){toast.err('Title is required');return}
    setSaving(true)
    const payload={...form,tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean),videoUrl:form.video_url}
    try{
      if(editing) await axios.put(`${API}/api/admin/blog/${editing}`,payload,{headers:authH(token)})
      else await axios.post(`${API}/api/admin/blog`,payload,{headers:authH(token)})
      toast.ok(editing?'Post updated!':'Post published!')
      setForm({title:'',slug:'',excerpt:'',content:'',cover_image:'',tags:'',status:'draft'})
      setEditing(null); setShowForm(false); load()
    }catch(e:unknown){const er=e as {response?:{data?:{message?:string}}};toast.err(er.response?.data?.message||'Save failed')}
    setSaving(false)
  }
  const del = async(id:number)=>{
    try{await axios.delete(`${API}/api/admin/blog/${id}`,{headers:authH(token)});toast.ok('Post deleted');load()}catch{toast.err('Delete failed')}
  }
  const editPost = (p:BlogPost)=>{setForm({title:p.title,slug:p.slug,excerpt:p.excerpt||'',content:p.content||'',cover_image:p.cover_image||'',tags:(p.tags||[]).join(', '),status:p.status});setEditing(p.id);setShowForm(true)}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700}}>Blog Posts</h2>
        <button onClick={()=>{setShowForm(!showForm);setEditing(null);setForm({title:'',slug:'',excerpt:'',content:'',cover_image:'',tags:'',status:'draft'})}}
          className="btn btn-gold btn-sm" style={{gap:'0.375rem'}}><Plus size={14}/>New Post</button>
      </div>

      {showForm && (
        <div style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'1.75rem',marginBottom:'1.75rem',display:'flex',flexDirection:'column',gap:'1.125rem',animation:'fadeUp 0.3s ease both'}}>
          <h3 style={{fontFamily:'var(--font-serif)',fontSize:'1.0625rem',fontWeight:700}}>{editing?'Edit Post':'New Post'}</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="fgroup">
              <label className="fl">Title</label>
              <input value={form.title} className="fi" placeholder="Post title" onChange={e=>setForm(p=>({...p,title:e.target.value,slug:editing?p.slug:slug(e.target.value)}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Slug (URL)</label>
              <input value={form.slug} className="fi" placeholder="auto-generated" onChange={e=>setForm(p=>({...p,slug:e.target.value}))}/>
            </div>
          </div>
          <div className="fgroup">
            <label className="fl">Excerpt (shown in listing)</label>
            <textarea value={form.excerpt} className="fi" rows={2} style={{resize:'vertical'}} placeholder="Short compelling summary…" onChange={e=>setForm(p=>({...p,excerpt:e.target.value}))}/>
          </div>
          <div className="fgroup">
            <label className="fl">Content</label>
            <RichEditor value={form.content} onChange={v=>setForm(p=>({...p,content:v}))} placeholder="Write your full post content here…" minHeight="280px"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'1rem',alignItems:'start'}}>
            <AdminImageUpload value={form.cover_image} onChange={url=>setForm(p=>({...p,cover_image:url}))} token={token}/>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div className="fgroup">
                <label className="fl">Tags (comma separated)</label>
                <input value={form.tags} className="fi" placeholder="Mindset, Leadership" onChange={e=>setForm(p=>({...p,tags:e.target.value}))}/>
              </div>
              <div className="fgroup">
                <label className="fl">Status</label>
                <select value={form.status} className="fi" onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>
          {/* Preview settings */}
          {!form.isFree && (
            <div style={{padding:'1rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--txt-1)',marginBottom:'-0.25rem'}}>Preview Settings</p>
              <p style={{fontSize:'0.75rem',color:'var(--txt-3)',lineHeight:1.5}}>Allow non-purchasers to see a short clip before buying.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div className="fgroup">
                  <label className="fl">Preview clip URL (optional)</label>
                  <input value={form.previewUrl||''} className="fi" placeholder="YouTube embed or Cloudinary URL" onChange={e=>setForm(p=>({...p,previewUrl:e.target.value}))}/>
                  <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Leave blank to auto-preview the main video.</p>
                </div>
                <div className="fgroup">
                  <label className="fl">Preview duration (seconds)</label>
                  <input type="number" value={form.previewEndSeconds||60} min={15} max={300} className="fi" onChange={e=>setForm(p=>({...p,previewEndSeconds:parseInt(e.target.value)||60}))}/>
                  <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>How many seconds to show (15–300s). Default: 60s.</p>
                </div>
              </div>
            </div>
          )}
          {/* Conversion fields */}
          {!form.isFree&&(
            <div style={{padding:'1rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--txt-1)',marginBottom:'-0.25rem'}}>Conversion & Value</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div className="fgroup">
                  <label className="fl">Discount % (optional)</label>
                  <input type="number" value={(form as {discountPercent?:number}).discountPercent||''} min={0} max={100} className="fi" placeholder="e.g. 20" onChange={e=>setForm(p=>({...p,discountPercent:parseInt(e.target.value)||0}))}/>
                </div>
                <div className="fgroup">
                  <label className="fl">Discount expires (optional)</label>
                  <input type="datetime-local" value={(form as {discountExpiresAt?:string}).discountExpiresAt||''} className="fi" onChange={e=>setForm(p=>({...p,discountExpiresAt:e.target.value}))}/>
                </div>
              </div>
              <div className="fgroup">
                <label className="fl">Target Audience</label>
                <input value={(form as {targetAudience?:string}).targetAudience||''} className="fi" placeholder="e.g. Students preparing for NYSC, Aspiring leaders" onChange={e=>setForm(p=>({...p,targetAudience:e.target.value}))}/>
              </div>
              <div className="fgroup">
                <label className="fl">Outcomes (one per line)</label>
                <textarea value={(form as {outcomes?:string}).outcomes||''} className="fi" rows={3} placeholder="Speak confidently in any room&#10;Structure a 5-minute speech&#10;Overcome stage fright" style={{resize:'vertical'}} onChange={e=>setForm(p=>({...p,outcomes:e.target.value}))}/>
                <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Shown in the paywall "What you'll gain" section.</p>
              </div>
              <div className="fgroup">
                <label className="fl">Lesson List (one per line)</label>
                <textarea value={(form as {lessons?:string}).lessons||''} className="fi" rows={4} placeholder="Lesson 1: Overcoming Fear&#10;Lesson 2: The Perfect Hook&#10;Lesson 3: Body Language Mastery" style={{resize:'vertical'}} onChange={e=>setForm(p=>({...p,lessons:e.target.value}))}/>
                <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Shown locked in the paywall to create urgency.</p>
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:'0.625rem'}}>
            <button onClick={save} disabled={saving} className="btn btn-gold" style={{opacity:saving?.7:1}}>
              {saving?<><RefreshCw size={13} style={{animation:'spin 0.8s linear infinite'}}/>Saving…</>:<><Send size={13}/>{editing?'Update':'Publish'}</>}
            </button>
            <button onClick={()=>{setShowForm(false);setEditing(null)}} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {posts.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No posts yet. Create your first post above.</p>}
        {posts.map(p=>(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.875rem 1rem',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',transition:'border-color 0.18s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-hover)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:600,fontSize:'0.9rem',color:'var(--txt-1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:'0.15rem'}}>{p.title}</p>
              <p style={{fontSize:'0.7rem',color:'var(--txt-3)'}}>{fmt(p.created_at)} · /{p.slug}</p>
            </div>
            <span style={{padding:'0.15rem 0.5rem',borderRadius:'5px',background:p.status==='published'?'rgba(201,162,75,0.1)':'rgba(255,255,255,0.04)',border:`1px solid ${p.status==='published'?'rgba(201,162,75,0.3)':'var(--border)'}`,color:p.status==='published'?'var(--gold)':'var(--txt-3)',fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{p.status}</span>
            <div style={{display:'flex',gap:'0.25rem'}}>
              <button onClick={()=>editPost(p)} title="Edit" style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--txt-3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}><Edit3 size={12}/></button>
              <button onClick={()=>del(p.id)} title="Delete" style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--txt-3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#e07070';e.currentTarget.style.color='#e07070'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Video Manager ──
function VideoManager({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const [videos,setVideos] = useState<VideoPost[]>([])
  const [form,setForm]     = useState({title:'',slug:'',description:'',video_url:'',duration:'',tags:'',status:'draft'})
  const [editing,setEditing] = useState<number|null>(null)
  const [showForm,setShowForm] = useState(false)
  const [saving,setSaving] = useState(false)

  const load = useCallback(async()=>{
    try{const{data}=await axios.get(`${API}/api/admin/videos`,{headers:authH(token)});setVideos(data.data||[])}catch{}
  },[token])
  useEffect(()=>{load()},[load])

  const save = async()=>{
    if(!form.title.trim()){toast.err('Title is required');return}
    if(!form.video_url.trim()){toast.err('Video URL or file is required');return}
    setSaving(true)
    const f = form as {discountPercent?:number;discountExpiresAt?:string;outcomes?:string;targetAudience?:string;lessons?:string}
    const payload={...form,
      tags:form.tags.split(',').map((t:string)=>t.trim()).filter(Boolean),
      discountPercent:f.discountPercent||null,
      discountExpiresAt:f.discountExpiresAt||null,
      outcomes:f.outcomes?f.outcomes.split('\n').map((s:string)=>s.trim()).filter(Boolean):null,
      targetAudience:f.targetAudience||null,
      lessons:f.lessons?f.lessons.split('\n').map((s:string)=>s.trim()).filter(Boolean):null,
    }
    try{
      if(editing) await axios.put(`${API}/api/admin/videos/${editing}`,payload,{headers:authH(token)})
      else await axios.post(`${API}/api/admin/videos`,payload,{headers:authH(token)})
      toast.ok(editing?'Video updated!':'Video saved!')
      setForm({title:'',slug:'',description:'',video_url:'',duration:'',tags:'',status:'draft',priceKobo:200000,isFree:false,category:'',previewUrl:'',previewEndSeconds:60,discountPercent:0,discountExpiresAt:'',outcomes:'',targetAudience:'',lessons:''})
      setEditing(null); setShowForm(false); load()
    }catch(e:unknown){const er=e as {response?:{data?:{message?:string}}};toast.err(er.response?.data?.message||'Save failed')}
    setSaving(false)
  }
  const del = async(id:number)=>{
    try{await axios.delete(`${API}/api/admin/videos/${id}`,{headers:authH(token)});toast.ok('Video deleted');load()}catch{toast.err('Delete failed')}
  }
  const editVid = (v:VideoPost)=>{const vv=v as {price_kobo?:number;is_free?:boolean;category?:string;preview_url?:string;preview_end_seconds?:number;discount_percent?:number;discount_expires_at?:string;outcomes?:string[];target_audience?:string;lessons?:string[]};setForm({title:v.title,slug:v.slug,description:v.description||'',video_url:v.video_url,duration:v.duration||'',tags:(v.tags||[]).join(', '),status:v.status,priceKobo:vv.price_kobo??200000,isFree:vv.is_free??false,category:vv.category||'',previewUrl:vv.preview_url||'',previewEndSeconds:vv.preview_end_seconds??60,discountPercent:vv.discount_percent||0,discountExpiresAt:vv.discount_expires_at||'',outcomes:(vv.outcomes||[]).join('\n'),targetAudience:vv.target_audience||'',lessons:(vv.lessons||[]).join('\n')});setEditing(v.id);setShowForm(true)}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700}}>Videos</h2>
        <button onClick={()=>{setShowForm(!showForm);setEditing(null);setForm({title:'',slug:'',description:'',video_url:'',duration:'',tags:'',status:'draft',priceKobo:200000,isFree:false,category:'',previewUrl:'',previewEndSeconds:60,discountPercent:0,discountExpiresAt:'',outcomes:'',targetAudience:'',lessons:''})}}
          className="btn btn-gold btn-sm" style={{gap:'0.375rem'}}><Plus size={14}/>Add Video</button>
      </div>

      {showForm && (
        <div style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'1.75rem',marginBottom:'1.75rem',display:'flex',flexDirection:'column',gap:'1.125rem',animation:'fadeUp 0.3s ease both'}}>
          <h3 style={{fontFamily:'var(--font-serif)',fontSize:'1.0625rem',fontWeight:700}}>{editing?'Edit':'Add'} Video</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="fgroup">
              <label className="fl">Title</label>
              <input value={form.title} className="fi" placeholder="Video title" onChange={e=>setForm(p=>({...p,title:e.target.value,slug:editing?p.slug:slug(e.target.value)}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Duration (e.g. 18:32)</label>
              <input value={form.duration} className="fi" placeholder="18:32" onChange={e=>setForm(p=>({...p,duration:e.target.value}))}/>
            </div>
          </div>
          <VideoUploadField value={form.video_url} onChange={u=>setForm(p=>({...p,video_url:u}))} token={token} onToast={toast.info}/>
          <div className="fgroup">
            <label className="fl">Description</label>
            <textarea value={form.description} className="fi" rows={3} style={{resize:'vertical'}} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="fgroup">
              <label className="fl">Tags</label>
              <input value={form.tags} className="fi" placeholder="Mindset, Leadership" onChange={e=>setForm(p=>({...p,tags:e.target.value}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Category</label>
              <input value={form.category} className="fi" placeholder="e.g. Mindset, Speaking" onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Price (₦)</label>
              <input type="number" value={form.isFree?0:form.priceKobo/100} disabled={form.isFree} className="fi" placeholder="2000" min="0" step="100" style={{opacity:form.isFree?.5:1}} onChange={e=>setForm(p=>({...p,priceKobo:Math.round(parseFloat(e.target.value||'0')*100)}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Status & Access</label>
              <select value={form.status} className="fi" onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.875rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>
            <button type="button" onClick={()=>setForm(p=>({...p,isFree:!p.isFree}))}
              style={{width:'40px',height:'24px',borderRadius:'12px',background:form.isFree?'var(--gold)':'var(--bg-4)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.25s',flexShrink:0}}>
              <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'white',position:'absolute',top:'3px',left:form.isFree?'19px':'3px',transition:'left 0.25s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>
            </button>
            <div>
              <p style={{fontSize:'0.875rem',fontWeight:600,color:'var(--txt-1)',marginBottom:'0.1rem'}}>Free video</p>
              <p style={{fontSize:'0.75rem',color:'var(--txt-3)'}}>Subscribers can watch without purchasing</p>
            </div>
          </div>
          {/* Preview settings */}
          {!form.isFree && (
            <div style={{padding:'1rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--txt-1)',marginBottom:'-0.25rem'}}>Preview Settings</p>
              <p style={{fontSize:'0.75rem',color:'var(--txt-3)',lineHeight:1.5}}>Allow non-purchasers to see a short clip before buying.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div className="fgroup">
                  <label className="fl">Preview clip URL (optional)</label>
                  <input value={form.previewUrl||''} className="fi" placeholder="YouTube embed or Cloudinary URL" onChange={e=>setForm(p=>({...p,previewUrl:e.target.value}))}/>
                  <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Leave blank to auto-preview the main video.</p>
                </div>
                <div className="fgroup">
                  <label className="fl">Preview duration (seconds)</label>
                  <input type="number" value={form.previewEndSeconds||60} min={15} max={300} className="fi" onChange={e=>setForm(p=>({...p,previewEndSeconds:parseInt(e.target.value)||60}))}/>
                  <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>How many seconds to show (15–300s). Default: 60s.</p>
                </div>
              </div>
            </div>
          )}
          {/* Conversion fields */}
          {!form.isFree&&(
            <div style={{padding:'1rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--txt-1)',marginBottom:'-0.25rem'}}>Conversion & Value</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div className="fgroup">
                  <label className="fl">Discount % (optional)</label>
                  <input type="number" value={(form as {discountPercent?:number}).discountPercent||''} min={0} max={100} className="fi" placeholder="e.g. 20" onChange={e=>setForm(p=>({...p,discountPercent:parseInt(e.target.value)||0}))}/>
                </div>
                <div className="fgroup">
                  <label className="fl">Discount expires (optional)</label>
                  <input type="datetime-local" value={(form as {discountExpiresAt?:string}).discountExpiresAt||''} className="fi" onChange={e=>setForm(p=>({...p,discountExpiresAt:e.target.value}))}/>
                </div>
              </div>
              <div className="fgroup">
                <label className="fl">Target Audience</label>
                <input value={(form as {targetAudience?:string}).targetAudience||''} className="fi" placeholder="e.g. Students preparing for NYSC, Aspiring leaders" onChange={e=>setForm(p=>({...p,targetAudience:e.target.value}))}/>
              </div>
              <div className="fgroup">
                <label className="fl">Outcomes (one per line)</label>
                <textarea value={(form as {outcomes?:string}).outcomes||''} className="fi" rows={3} placeholder="Speak confidently in any room&#10;Structure a 5-minute speech&#10;Overcome stage fright" style={{resize:'vertical'}} onChange={e=>setForm(p=>({...p,outcomes:e.target.value}))}/>
                <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Shown in the paywall "What you'll gain" section.</p>
              </div>
              <div className="fgroup">
                <label className="fl">Lesson List (one per line)</label>
                <textarea value={(form as {lessons?:string}).lessons||''} className="fi" rows={4} placeholder="Lesson 1: Overcoming Fear&#10;Lesson 2: The Perfect Hook&#10;Lesson 3: Body Language Mastery" style={{resize:'vertical'}} onChange={e=>setForm(p=>({...p,lessons:e.target.value}))}/>
                <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Shown locked in the paywall to create urgency.</p>
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:'0.625rem'}}>
            <button onClick={save} disabled={saving} className="btn btn-gold" style={{opacity:saving?.7:1}}>
              {saving?<><RefreshCw size={13} style={{animation:'spin 0.8s linear infinite'}}/>Saving…</>:<><Send size={13}/>{editing?'Update':'Save Video'}</>}
            </button>
            <button onClick={()=>{setShowForm(false);setEditing(null)}} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {videos.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No videos yet.</p>}
        {videos.map(v=>(
          <div key={v.id} style={{display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.875rem 1rem',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)'}}>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:600,fontSize:'0.9rem',color:'var(--txt-1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:'0.15rem'}}>{v.title}</p>
              <p style={{fontSize:'0.7rem',color:'var(--txt-3)'}}>{fmt(v.created_at)}{v.duration?` · ${v.duration}`:''}</p>
            </div>
            <span style={{padding:'0.15rem 0.5rem',borderRadius:'5px',background:v.status==='published'?'rgba(201,162,75,0.1)':'rgba(255,255,255,0.04)',border:`1px solid ${v.status==='published'?'rgba(201,162,75,0.3)':'var(--border)'}`,color:v.status==='published'?'var(--gold)':'var(--txt-3)',fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{v.status}</span>
            <div style={{display:'flex',gap:'0.25rem'}}>
              <button onClick={()=>editVid(v)} style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--txt-3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}><Edit3 size={12}/></button>
              <button onClick={()=>del(v.id)} style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--txt-3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#e07070';e.currentTarget.style.color='#e07070'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Broadcast Messaging ──
function BroadcastManager({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const [form,setForm]     = useState({subject:'',body:'',audience:'all'})
  const [sending,setSending] = useState(false)
  const [history,setHistory] = useState<{id:number;subject:string;audience:string;sent_count:number;sent_at:string}[]>([])

  const loadHistory = useCallback(async()=>{
    try{const{data}=await axios.get(`${API}/api/notifications/broadcasts`,{headers:authH(token)});setHistory(data.data||[])}catch{}
  },[token])
  useEffect(()=>{loadHistory()},[loadHistory])

  const send = async()=>{
    if(!form.subject.trim()||!form.body.trim()){toast.err('Subject and message are required');return}
    setSending(true)
    try{
      const{data}=await axios.post(`${API}/api/notifications/broadcast`,form,{headers:authH(token)})
      toast.ok(data.message||'Message sent!')
      setForm({subject:'',body:'',audience:'all'})
      loadHistory()
    }catch(e:unknown){const er=e as {response?:{data?:{message?:string}}};toast.err(er.response?.data?.message||'Send failed')}
    setSending(false)
  }

  return (
    <div>
      <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700,marginBottom:'1.5rem'}}>Broadcast Message</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,400px),1fr))',gap:'1.5rem',alignItems:'start'}}>

        {/* Compose */}
        <div style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'1.75rem',display:'flex',flexDirection:'column',gap:'1.125rem'}}>
          <p style={{fontWeight:700,fontSize:'0.875rem',color:'var(--txt-1)',marginBottom:'-0.25rem'}}>Compose Message</p>

          <div className="fgroup">
            <label className="fl">Audience</label>
            <select value={form.audience} className="fi" onChange={e=>setForm(p=>({...p,audience:e.target.value}))}>
              <option value="all">All Active Students</option>
              <option value="inactive">Inactive / Lapsed Students</option>
              <option value="low_wallet">Low Wallet Balance (&lt;₦2,000)</option>
              <option value="non_purchasers">Active — Never Bought a Video</option>
              <option value="newsletter">Newsletter Subscribers Only</option>
              <option value="intake_registrants">Intake / Refinery Form Applicants</option>
            </select>
            <p style={{marginTop:'0.375rem',fontSize:'0.72rem',color:'var(--txt-3)'}}>
              {form.audience==='inactive'?'Students who registered but are no longer active.':form.audience==='newsletter'?'Newsletter subscribers only.':form.audience==='low_wallet'?'Active students with less than ₦2,000 in their wallet.':form.audience==='non_purchasers'?'Active subscribers who have never purchased a video.':form.audience==='intake_registrants'?'Everyone who submitted the Refinery intake form — great for follow-up messages.':'All students with active subscriptions.'}
            </p>
          </div>

          <div className="fgroup">
            <label className="fl">Subject</label>
            <input value={form.subject} className="fi" placeholder="e.g. New content just dropped 🔥" onChange={e=>setForm(p=>({...p,subject:e.target.value}))}/>
          </div>
          <div className="fgroup">
            <label className="fl">Message Body</label>
            <textarea value={form.body} className="fi" rows={5} style={{resize:'vertical'}} placeholder="Write your message here. HTML is supported." onChange={e=>setForm(p=>({...p,body:e.target.value}))}/>
          </div>

          <button onClick={send} disabled={sending} className="btn btn-gold" style={{alignSelf:'flex-start',opacity:sending?.7:1}}>
            {sending?<><RefreshCw size={13} style={{animation:'spin 0.8s linear infinite'}}/>Sending…</>:<><Send size={13}/>Send Message</>}
          </button>
        </div>

        {/* History */}
        <div>
          <p style={{fontWeight:700,fontSize:'0.875rem',color:'var(--txt-1)',marginBottom:'1rem'}}>Sent Messages</p>
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {history.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',fontSize:'0.875rem'}}>No messages sent yet.</p>}
            {history.map(h=>(
              <div key={h.id} style={{padding:'0.875rem 1rem',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)'}}>
                <p style={{fontWeight:600,fontSize:'0.875rem',color:'var(--txt-1)',marginBottom:'0.2rem'}}>{h.subject}</p>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
                  <span className="badge">{h.audience}</span>
                  <span style={{fontSize:'0.7rem',color:'var(--txt-3)'}}>{h.sent_count} recipients · {fmt(h.sent_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Students Manager ──
function StudentsManager({token,toast,onImpersonate}:{token:string;toast:ReturnType<typeof useToast>;onImpersonate:(s:Student)=>void}) {
  const [students,setStudents] = useState<Student[]>([])
  const [search,setSearch]     = useState('')
  const [expanded,setExpanded] = useState<number|null>(null)
  const [note,setNote]         = useState('')

  useEffect(()=>{
    axios.get(`${API}/api/admin/paywall/users`,{headers:authH(token)}).then(r=>setStudents(r.data.data||[])).catch(()=>{})
  },[token])

  const filtered = students.filter(s=>
    s.full_name?.toLowerCase().includes(search.toLowerCase())||s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const addNote = async(sid:number)=>{
    if(!note.trim()){toast.err('Note cannot be empty');return}
    try{await axios.post(`${API}/api/admin/students/${sid}/notes`,{note},{headers:authH(token)});toast.ok('Note saved!');setNote('')}
    catch{toast.err('Failed to save note')}
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700}}>Students ({students.length})</h2>
        <div style={{position:'relative',width:'220px'}}>
          <Search size={13} style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:'var(--txt-3)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="fi" placeholder="Search…" style={{paddingLeft:'2.25rem',padding:'0.5625rem 1rem 0.5625rem 2.25rem'}}/>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {filtered.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No students found.</p>}
        {filtered.map(s=>{
          const days = s.expires_at ? Math.max(0,Math.ceil((new Date(s.expires_at).getTime()-Date.now())/86400000)) : null
          return (
            <div key={s.id} style={{background:'var(--bg-1)',border:`1px solid ${days!==null&&days<=7?'rgba(220,60,60,0.25)':'var(--border)'}`,borderRadius:'var(--radius-md)',overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.875rem 1rem',cursor:'pointer'}} onClick={()=>setExpanded(expanded===s.id?null:s.id)}>
                <div style={{width:'34px',height:'34px',borderRadius:'50%',background:'var(--gold-dim)',border:'1px solid rgba(201,162,75,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.9rem',flexShrink:0}}>👤</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:600,fontSize:'0.9rem',color:'var(--txt-1)',marginBottom:'0.1rem'}}>{s.full_name}</p>
                  <p style={{fontSize:'0.7rem',color:'var(--txt-3)'}}>{s.email}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.375rem',flexShrink:0}}>
                  {days!==null&&days<=7&&<span style={{fontSize:'0.58rem',fontWeight:700,color:'#e07070',background:'rgba(220,60,60,0.1)',border:'1px solid rgba(220,60,60,0.3)',padding:'0.1rem 0.4rem',borderRadius:'99px'}}>Expiring</span>}
                  <span style={{fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:s.is_active?'#50c880':'var(--txt-3)',background:s.is_active?'rgba(80,200,128,0.1)':'rgba(255,255,255,0.04)',border:`1px solid ${s.is_active?'rgba(80,200,128,0.3)':'var(--border)'}`,padding:'0.1rem 0.4rem',borderRadius:'5px'}}>{s.is_active?'Active':'Inactive'}</span>
                  {expanded===s.id?<ChevronDown size={13} color="var(--txt-3)"/>:<ChevronRight size={13} color="var(--txt-3)"/>}
                </div>
              </div>

              {expanded===s.id&&(
                <div style={{padding:'1.125rem',borderTop:'1px solid var(--border)',background:'rgba(255,255,255,0.02)',display:'flex',flexDirection:'column',gap:'1rem',animation:'fadeUp 0.2s ease both'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.625rem'}}>
                    {[['Plan',s.plan==='quarterly'?'3-Month':'Monthly'],['Expires',s.expires_at?`${fmt(s.expires_at)} (${days}d)`:'—'],['Phone',s.phone||'—'],['Joined',fmt(s.created_at)]].map(([k,v])=>(
                      <div key={k} style={{padding:'0.625rem 0.75rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>
                        <p style={{fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.2rem'}}>{k}</p>
                        <p style={{fontSize:'0.8rem',color:'var(--txt-1)',fontWeight:500}}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {s.bio&&<p style={{fontSize:'0.8rem',color:'var(--txt-2)',lineHeight:1.65,padding:'0.625rem 0.75rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>{s.bio}</p>}

                  {/* Note */}
                  <div>
                    <label className="fl">Add Coaching Note</label>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      <input value={note} onChange={e=>setNote(e.target.value)} className="fi" placeholder="Session notes, observations…" style={{flex:1}}
                        onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addNote(s.id)}}}/>
                      <button onClick={()=>addNote(s.id)} className="btn btn-gold btn-sm" style={{flexShrink:0}}><Send size={13}/></button>
                    </div>
                  </div>

                  <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                    <button onClick={()=>onImpersonate(s)}
                      style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.5rem 0.875rem',borderRadius:'var(--radius-sm)',border:'1px solid rgba(201,162,75,0.4)',background:'rgba(201,162,75,0.08)',color:'var(--gold)',fontSize:'0.78rem',fontWeight:600,cursor:'pointer',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(201,162,75,0.15)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(201,162,75,0.08)'}>
                      <Eye size={13}/>View as Student
                    </button>
                    <a href={`mailto:${s.email}`} style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.5rem 0.875rem',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--txt-2)',fontSize:'0.78rem',fontWeight:600,cursor:'pointer',textDecoration:'none'}}>
                      <Mail size={13}/>Email
                    </a>
                    {s.phone&&<a href={`https://wa.me/${s.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.5rem 0.875rem',borderRadius:'var(--radius-sm)',border:'1px solid rgba(37,211,102,0.3)',background:'rgba(37,211,102,0.06)',color:'#25D366',fontSize:'0.78rem',fontWeight:600,textDecoration:'none'}}>
                      WhatsApp
                    </a>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Contacts ──
function ContactsView({token}:{token:string}) {
  const [contacts,setContacts] = useState<Contact[]>([])
  const [expanded,setExpanded] = useState<number|null>(null)
  useEffect(()=>{axios.get(`${API}/api/admin/contacts`,{headers:authH(token)}).then(r=>setContacts(r.data.data||[])).catch(()=>{})},[token])
  return (
    <div>
      <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700,marginBottom:'1.5rem'}}>Contact Submissions ({contacts.length})</h2>
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {contacts.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No submissions yet.</p>}
        {contacts.map(c=>(
          <div key={c.id} style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',overflow:'hidden'}}>
            <button onClick={()=>setExpanded(expanded===c.id?null:c.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.875rem 1rem',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
              <div style={{flex:1}}>
                <p style={{fontWeight:600,fontSize:'0.9rem',color:'var(--txt-1)',marginBottom:'0.1rem'}}>{c.full_name}</p>
                <p style={{fontSize:'0.7rem',color:'var(--txt-3)'}}>{c.email} · {fmt(c.created_at)}</p>
              </div>
              <span className="badge">{c.inquiry_type}</span>
              {expanded===c.id?<ChevronDown size={13} color="var(--txt-3)"/>:<ChevronRight size={13} color="var(--txt-3)"/>}
            </button>
            {expanded===c.id&&(
              <div style={{padding:'1.125rem',borderTop:'1px solid var(--border)',animation:'fadeUp 0.2s ease both'}}>
                {c.phone&&<p style={{fontSize:'0.8rem',color:'var(--txt-2)',marginBottom:'0.625rem'}}>📞 {c.phone}</p>}
                <p style={{fontSize:'0.875rem',color:'var(--txt-2)',lineHeight:1.75}}>{c.message}</p>
                <a href={`mailto:${c.email}`} className="btn btn-gold btn-sm" style={{textDecoration:'none',display:'inline-flex',marginTop:'0.875rem'}}><Mail size={12}/>Reply</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Impersonation student view ──
function ImpersonatedView({student,onExit}:{student:Student;onExit:()=>void}) {
  const days = student.expires_at ? Math.max(0,Math.ceil((new Date(student.expires_at).getTime()-Date.now())/86400000)) : null
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem',animation:'fadeUp 0.3s ease both'}}>
      <div style={{padding:'1rem 1.5rem',background:'linear-gradient(90deg,rgba(201,162,75,0.12),rgba(201,162,75,0.06))',border:'1px solid rgba(201,162,75,0.3)',borderRadius:'var(--radius-md)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <Eye size={16} color="var(--gold)"/>
          <span style={{fontWeight:700,color:'var(--gold)',fontSize:'0.9rem'}}>
            👀 Viewing as: <strong>{student.full_name}</strong>
          </span>
          <span style={{fontSize:'0.75rem',color:'var(--txt-3)',fontStyle:'italic'}}>— Student view mode</span>
        </div>
        <button onClick={onExit} style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.5rem 1rem',borderRadius:'var(--radius-sm)',border:'1px solid rgba(201,162,75,0.35)',background:'rgba(201,162,75,0.08)',color:'var(--gold)',fontSize:'0.8rem',fontWeight:600,cursor:'pointer'}}>
          ← Exit Student View
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'1rem'}}>
        <StatCard label="Plan" value={student.plan==='quarterly'?'3-Month':'Monthly'} icon={<CreditCard size={16}/>}/>
        <StatCard label="Status" value={student.is_active?'Active':'Inactive'} icon={<Activity size={16}/>} color={student.is_active?'#50c880':'#e07070'}/>
        <StatCard label="Days Left" value={days??'—'} icon={<Bell size={16}/>} color={days!==null&&days<=7?'#e07070':'var(--gold)'}/>
      </div>

      <div style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'1.75rem'}}>
        <h3 className="h-serif" style={{fontSize:'1.125rem',fontWeight:700,marginBottom:'1.25rem'}}>Student Profile</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.875rem'}}>
          {[['Full Name',student.full_name],['Email',student.email],['Phone',student.phone||'—'],['Bio',student.bio||'—'],['Plan',student.plan==='quarterly'?'3-Month Bundle':'Monthly Access'],['Expires',student.expires_at?fmt(student.expires_at):'—'],['Joined',fmt(student.created_at)],['Status',student.is_active?'Active':'Inactive']].map(([k,v])=>(
            <div key={k} style={{padding:'0.875rem',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>
              <p style={{fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.25rem'}}>{k}</p>
              <p style={{fontSize:'0.875rem',color:'var(--txt-1)',fontWeight:500,wordBreak:'break-word'}}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Admin Settings (native app style) ──
function AdminSettings({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const {isDark,toggleTheme} = useTheme()
  const [sec,setSec]   = useState<'profile'|'appearance'|'system'|null>(null)
  const [name,setName] = useState('Coach Precious')
  const [bio,setBio]   = useState('')
  const [avatar,setAvatar] = useState(typeof window!=='undefined'?localStorage.getItem('scsi_admin_avatar')||'':'')
  const [pw,setPw]     = useState({current:'',next:'',confirm:''})
  const [showPw,setShowPw] = useState({c:false,n:false,cf:false})
  const [saving,setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatar=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f)return
    const r=new FileReader();r.onload=ev=>{const u=ev.target?.result as string;setAvatar(u);localStorage.setItem('scsi_admin_avatar',u);toast.ok('Photo updated!')};r.readAsDataURL(f)
  }

  // Settings row component (inline for admin)
  const Row=({iconBg,icon,label,sub,onClick,danger=false,last=false}:{iconBg:string;icon:React.ReactNode;label:string;sub?:string;onClick:()=>void;danger?:boolean;last?:boolean})=>(
    <button onClick={onClick} style={{width:'100%',display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.875rem 1rem',background:'transparent',border:'none',cursor:'pointer',textAlign:'left',borderBottom:last?'none':'1px solid var(--border)',transition:'background 0.12s'}}
      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{width:'36px',height:'36px',borderRadius:'9px',background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <p style={{fontSize:'0.9375rem',fontWeight:500,color:danger?'#e07070':'var(--txt-1)',marginBottom:sub?'0.1rem':0}}>{label}</p>
        {sub&&<p style={{fontSize:'0.78rem',color:'var(--txt-3)'}}>{sub}</p>}
      </div>
      <ChevronRight size={16} color="var(--txt-3)" style={{opacity:0.5}}/>
    </button>
  )

  // Panel component (inline for admin)
  const Panel=({title,onBack,children}:{title:string;onBack:()=>void;children:React.ReactNode})=>(
    <div style={{position:'fixed',inset:0,zIndex:200,background:'var(--bg-0)',overflowY:'auto',animation:'fadeUp 0.25s ease both'}}>
      <div style={{position:'sticky',top:0,zIndex:10,background:'var(--bg-0)',borderBottom:'1px solid var(--border)',padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:'0.75rem'}}>
        <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'var(--bg-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
          <ChevronRight size={16} style={{transform:'rotate(180deg)'}} color="var(--txt-2)"/>
        </button>
        <h2 style={{fontFamily:'var(--font-serif)',fontSize:'1rem',fontWeight:700,flex:1}}>{title}</h2>
      </div>
      <div style={{padding:'1.25rem',maxWidth:'520px',margin:'0 auto'}}>{children}</div>
    </div>
  )

  return (
    <div style={{maxWidth:'520px'}}>
      <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700,marginBottom:'1.5rem'}}>Settings</h2>

      {/* Profile card */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'16px',overflow:'hidden',marginBottom:'1rem'}}>
        <div style={{padding:'1.125rem 1rem',display:'flex',alignItems:'center',gap:'1rem',borderBottom:'1px solid var(--border)'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:'56px',height:'56px',borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(201,162,75,0.3)',background:'var(--bg-3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {avatar?<img src={avatar} alt="Admin" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} onError={e=>{e.currentTarget.style.display='none'}}/>:<img src="/coach-photo.jpg" alt="Coach" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} onError={e=>{e.currentTarget.style.display='none'}}/>}
            </div>
            <button onClick={()=>fileRef.current?.click()} style={{position:'absolute',bottom:'-2px',right:'-2px',width:'22px',height:'22px',borderRadius:'50%',background:'var(--gold)',border:'2px solid var(--bg-2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Camera size={10} color="#080506"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,fontSize:'1rem',color:'var(--txt-1)',marginBottom:'0.15rem'}}>Eze Tochukwu Precious</p>
            <p style={{fontSize:'0.75rem',color:'var(--gold)'}}>Administrator</p>
          </div>
          <button onClick={()=>setSec('profile')} style={{background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',display:'flex'}}><ChevronRight size={16}/></button>
        </div>
        <Row iconBg="#5B5BD6" icon={<User size={16} color="white"/>} label="Edit Profile" sub="Name, bio, avatar" onClick={()=>setSec('profile')} last/>
      </div>

      {/* Preferences */}
      <p style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--txt-3)',marginBottom:'0.5rem',paddingLeft:'0.25rem'}}>Preferences</p>
      <div style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'16px',overflow:'hidden',marginBottom:'1rem'}}>
        <Row iconBg={isDark?'#3B3B5C':'#E89B1A'} icon={isDark?<Moon size={16} color="white"/>:<Sun size={16} color="white"/>} label="Appearance" sub={isDark?'Dark Mode':'Light Mode'} onClick={()=>setSec('appearance')}/>
        <Row iconBg="#E0484B" icon={<Lock size={16} color="white"/>} label="Password" sub="Change your password" onClick={()=>setSec('profile')} last/>
      </div>

      {/* System */}
      <p style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--txt-3)',marginBottom:'0.5rem',paddingLeft:'0.25rem'}}>System</p>
      <div style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'16px',overflow:'hidden',marginBottom:'1.5rem'}}>
        <Row iconBg="#059669" icon={<Shield size={16} color="white"/>} label="Deployment Config" sub="Cloudinary, Paystack, SMTP" onClick={()=>setSec('system')} last/>
      </div>

      {/* Sign out */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'16px',overflow:'hidden'}}>
        <button onClick={()=>{localStorage.removeItem('scsi_admin_token');localStorage.removeItem('scsi_access_token');window.location.href='/login'}}
          style={{width:'100%',padding:'1rem',background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',color:'#e07070',fontSize:'0.9375rem',fontWeight:600}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(220,60,60,0.06)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <LogOut size={17}/>Sign Out
        </button>
      </div>

      {/* Slide-in panels */}
      {sec==='profile'&&(
        <Panel title="Admin Profile" onBack={()=>setSec(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:'1.125rem'}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:'0.5rem'}}>
              <div style={{position:'relative'}}>
                <div style={{width:'72px',height:'72px',borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(201,162,75,0.3)',background:'var(--bg-3)'}}>
                  {avatar?<img src={avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>:<img src="/coach-photo.jpg" alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>}
                </div>
                <button onClick={()=>fileRef.current?.click()} style={{position:'absolute',bottom:'-2px',right:'-2px',width:'24px',height:'24px',borderRadius:'50%',background:'var(--gold)',border:'2px solid var(--bg-0)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  <Camera size={11} color="#080506"/>
                </button>
              </div>
            </div>
            <div className="fgroup"><label className="fl">Display Name</label><input value={name} onChange={e=>setName(e.target.value)} className="fi"/></div>
            <div className="fgroup"><label className="fl">Bio</label><textarea value={bio} onChange={e=>setBio(e.target.value)} className="fi" rows={3} style={{resize:'vertical'}}/></div>
            {/* Password section */}
            <p style={{fontWeight:700,fontSize:'0.875rem',color:'var(--txt-1)',marginTop:'0.5rem'}}>Change Password</p>
            <p style={{fontSize:'0.8rem',color:'var(--txt-3)',marginTop:'-0.75rem',lineHeight:1.6}}>Admin password is managed via environment variable. Run <code style={{background:'var(--bg-3)',padding:'0.1rem 0.35rem',borderRadius:'4px',fontSize:'0.75rem'}}>npm run hash-password NewPassword</code> on your server, then update ADMIN_PASSWORD_HASH in .env</p>
            <button onClick={()=>{setSec(null);toast.ok('Profile saved!')}} className="btn btn-gold" style={{justifyContent:'center'}}><Check size={14}/>Save Profile</button>
          </div>
        </Panel>
      )}

      {sec==='appearance'&&(
        <Panel title="Appearance" onBack={()=>setSec(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
            {[{id:'dark',label:'Dark Mode',sub:'Oxblood & gold',icon:<Moon size={20} color="white"/>,bg:'#3B3B5C',active:isDark},{id:'light',label:'Light Mode',sub:'Warm parchment',icon:<Sun size={20} color="white"/>,bg:'#E89B1A',active:!isDark}].map(opt=>(
              <button key={opt.id} onClick={()=>{if(!opt.active)toggleTheme()}}
                style={{display:'flex',alignItems:'center',gap:'1rem',padding:'1.125rem',borderRadius:'16px',border:`2px solid ${opt.active?'var(--gold)':'var(--border)'}`,background:opt.active?'var(--gold-dim)':'var(--bg-2)',cursor:opt.active?'default':'pointer',transition:'all 0.2s',textAlign:'left',width:'100%'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:opt.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{opt.icon}</div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:'0.9375rem',color:'var(--txt-1)',marginBottom:'0.15rem'}}>{opt.label}</p>
                  <p style={{fontSize:'0.78rem',color:'var(--txt-3)'}}>{opt.sub}</p>
                </div>
                {opt.active&&<div style={{width:'20px',height:'20px',borderRadius:'50%',background:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Check size={12} color="#080506"/></div>}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {sec==='system'&&(
        <Panel title="System Config" onBack={()=>setSec(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
            {[{label:'Admin Email',desc:'ADMIN_EMAIL in .env'},{label:'Paystack',desc:'PAYSTACK_PUBLIC_KEY + PAYSTACK_SECRET_KEY'},{label:'Cloudinary',desc:'CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET'},{label:'Email SMTP',desc:'EMAIL_HOST + EMAIL_USER + EMAIL_PASS'}].map(item=>(
              <div key={item.label} style={{padding:'1rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'12px'}}>
                <p style={{fontWeight:700,fontSize:'0.875rem',color:'var(--txt-1)',marginBottom:'0.2rem'}}>{item.label}</p>
                <p style={{fontSize:'0.78rem',color:'var(--txt-3)',lineHeight:1.6}}>{item.desc}</p>
              </div>
            ))}
            <div style={{padding:'1rem',background:'rgba(201,162,75,0.06)',border:'1px solid rgba(201,162,75,0.2)',borderRadius:'12px'}}>
              <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--gold)',marginBottom:'0.5rem'}}>After deploy:</p>
              <code style={{fontSize:'0.78rem',color:'var(--txt-2)',display:'block',marginBottom:'0.25rem'}}>npm run db:migrate:all</code>
              <code style={{fontSize:'0.78rem',color:'var(--txt-2)'}}>npm run hash-password YourPassword</code>
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}


// ── Gallery Manager ──
function GalleryManager({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const [images,setImages] = useState<{id:number;title:string;image_url:string;category:string;created_at:string}[]>([])
  const [uploading,setUploading] = useState(false)
  const [progress,setProgress]  = useState(0)
  const [form,setForm]   = useState({title:'',category:'General'})
  const [mode,setMode]   = useState<'file'|'url'>('file')
  const [urlVal,setUrlVal] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async()=>{
    try{const{data}=await axios.get(`${API}/api/gallery`);setImages(data.data||[])}catch{}
  },[])
  useEffect(()=>{load()},[load])

  const uploadFile = async(file:File)=>{
    if(file.size>10*1024*1024){toast.err('Image must be under 10MB');return}
    setUploading(true);setProgress(0)
    try{
      const{data:sig}=await axios.get(`${API}/api/upload/cloudinary-signature`,{headers:authH(token)})
      if(!sig.success) throw new Error(sig.message)
      const fd=new FormData();fd.append('file',file);fd.append('api_key',sig.apiKey);fd.append('timestamp',sig.timestamp);fd.append('signature',sig.signature);fd.append('folder',sig.folder)
      const{data:cloud}=await axios.post(sig.uploadUrl,fd,{onUploadProgress:(e)=>setProgress(Math.round((e.loaded/(e.total||1))*100))})
      // Save to gallery
      await axios.post(`${API}/api/gallery`,{title:form.title,imageUrl:cloud.secure_url,altText:form.title,category:form.category},{headers:authH(token)})
      toast.ok('Image added to gallery!');setForm({title:'',category:'General'});load()
    }catch(e:unknown){const er=e as {response?:{data?:{message?:string}};message?:string};toast.err(er.response?.data?.message||er.message||'Upload failed')}
    setUploading(false);setProgress(0)
  }

  const addByUrl = async()=>{
    if(!urlVal.trim()){toast.err('Enter an image URL');return}
    try{
      await axios.post(`${API}/api/gallery`,{title:form.title,imageUrl:urlVal,altText:form.title,category:form.category},{headers:authH(token)})
      toast.ok('Image added!');setUrlVal('');setForm({title:'',category:'General'});load()
    }catch{toast.err('Failed to add image')}
  }

  const del=async(id:number)=>{
    try{await axios.delete(`${API}/api/admin/gallery/${id}`,{headers:authH(token)});toast.ok('Deleted');load()}
    catch{toast.err('Delete failed')}
  }

  const categories=['General','Mentorship','Events','Portraits','Workshops','Coaching']

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700}}>Gallery ({images.length} images)</h2>
      </div>

      {/* Upload form */}
      <div style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'1.75rem',marginBottom:'2rem',display:'flex',flexDirection:'column',gap:'1.125rem'}}>
        <p style={{fontWeight:700,fontSize:'0.9375rem',color:'var(--txt-1)'}}>Add New Image</p>

        {/* Details */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <div className="fgroup">
            <label className="fl">Title (optional)</label>
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="fi" placeholder="Mentorship Session 2025"/>
          </div>
          <div className="fgroup">
            <label className="fl">Category</label>
            <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="fi">
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Source toggle */}
        <div style={{display:'flex',gap:'0.375rem'}}>
          {(['file','url'] as const).map(m=>(
            <button key={m} type="button" onClick={()=>setMode(m)}
              style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.4rem 0.875rem',borderRadius:'99px',fontSize:'0.78rem',fontWeight:600,border:`1.5px solid ${mode===m?'var(--gold)':'var(--border)'}`,background:mode===m?'var(--gold-dim)':'transparent',color:mode===m?'var(--gold)':'var(--txt-2)',cursor:'pointer',transition:'all 0.18s'}}>
              {m==='file'?<><Upload size={12}/>Upload File</>:<><LinkIcon size={12}/>Image URL</>}
            </button>
          ))}
        </div>

        {mode==='file'?(
          <button type="button" onClick={()=>fileRef.current?.click()} disabled={uploading}
            style={{width:'100%',padding:'2rem',borderRadius:'var(--radius-md)',border:'2px dashed var(--border)',background:'var(--bg-2)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.625rem',cursor:'pointer',color:'var(--txt-3)',transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.color='var(--gold)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}>
            {uploading?(
              <><RefreshCw size={22} style={{animation:'spin 0.8s linear infinite'}}/><span style={{fontWeight:600}}>Uploading to Cloudinary… {progress}%</span>
              <div style={{width:'200px',height:'4px',background:'var(--bg-3)',borderRadius:'2px',overflow:'hidden'}}><div style={{height:'100%',background:'var(--gold)',borderRadius:'2px',width:`${progress}%`,transition:'width 0.3s ease'}}/></div></>
            ):(
              <><ImageIcon size={24}/><span style={{fontWeight:600}}>Click to upload image</span><span style={{fontSize:'0.72rem',opacity:0.7}}>PNG, JPG, WebP · Max 10MB · Saves to Cloudinary</span></>
            )}
          </button>
        ):(
          <div style={{display:'flex',gap:'0.625rem'}}>
            <input value={urlVal} onChange={e=>setUrlVal(e.target.value)} className="fi" placeholder="https://res.cloudinary.com/…" style={{flex:1}}/>
            <button onClick={addByUrl} className="btn btn-gold btn-sm" style={{flexShrink:0}}><Check size={13}/>Add</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)uploadFile(f)}}/>
      </div>

      {/* Gallery grid */}
      {images.length===0
        ?<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No gallery images yet. Upload your first image above.</p>
        :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'0.75rem'}}>
          {images.map(img=>(
            <div key={img.id} style={{position:'relative',borderRadius:'var(--radius-md)',overflow:'hidden',border:'1px solid var(--border)',aspectRatio:'1',background:'var(--bg-2)',group:true} as React.CSSProperties}>
              <img src={img.image_url} alt={img.title||'Gallery'} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} loading="lazy"/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(8,5,6,0.85) 0%,transparent 50%)',opacity:0,transition:'opacity 0.25s'}}
                onMouseEnter={e=>{e.currentTarget.style.opacity='1'}}
                onMouseLeave={e=>{e.currentTarget.style.opacity='0'}}>
                <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'0.75rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'0.5rem'}}>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:'0.78rem',fontWeight:600,color:'white',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{img.title||'Untitled'}</p>
                    <p style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.6)'}}>{img.category}</p>
                  </div>
                  <button onClick={()=>del(img.id)} style={{width:'28px',height:'28px',borderRadius:'50%',background:'rgba(220,60,60,0.85)',border:'none',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>}
    </div>
  )
}

// ── Coupons Manager ──
function CouponsManager({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const [coupons,setCoupons]   = useState<{id:number;code:string;discount_percent:number;expires_at:string|null;usage_limit:number|null;used_count:number;is_active:boolean;created_at:string}[]>([])
  const [form,setForm]         = useState({code:'',discount_percent:10,expires_at:'',usage_limit:''})
  const [showForm,setShowForm] = useState(false)
  const [saving,setSaving]     = useState(false)

  const load = useCallback(async()=>{
    try{const{data}=await axios.get(`${API}/api/admin/coupons`,{headers:authH(token)});setCoupons(data.data||[])}catch{}
  },[token])
  useEffect(()=>{load()},[load])

  const save = async()=>{
    if(!form.code.trim()){toast.err('Code required');return}
    if(form.discount_percent<1||form.discount_percent>100){toast.err('Discount must be 1–100%');return}
    setSaving(true)
    try{
      await axios.post(`${API}/api/admin/coupons`,{
        code:form.code.trim().toUpperCase(),
        discount_percent:form.discount_percent,
        expires_at:form.expires_at||null,
        usage_limit:form.usage_limit?parseInt(form.usage_limit):null
      },{headers:authH(token)})
      toast.ok('Coupon created!')
      setForm({code:'',discount_percent:10,expires_at:'',usage_limit:''})
      setShowForm(false); load()
    }catch(e:unknown){const er=e as {response?:{data?:{message?:string}}};toast.err(er.response?.data?.message||'Failed')}
    setSaving(false)
  }
  const toggle=async(id:number)=>{
    try{await axios.patch(`${API}/api/admin/coupons/${id}/toggle`,{},{headers:authH(token)});load()}catch{toast.err('Failed')}
  }
  const del=async(id:number)=>{
    try{await axios.delete(`${API}/api/admin/coupons/${id}`,{headers:authH(token)});toast.ok('Deleted');load()}catch{toast.err('Failed')}
  }

  const fmt=(d:string)=>new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700}}>Coupon Codes ({coupons.length})</h2>
        <button onClick={()=>setShowForm(!showForm)} className="btn btn-gold btn-sm" style={{gap:'0.375rem'}}><Plus size={14}/>New Coupon</button>
      </div>

      {showForm&&(
        <div style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'1.75rem',marginBottom:'1.75rem',display:'flex',flexDirection:'column',gap:'1rem',animation:'fadeUp 0.3s ease both'}}>
          <h3 style={{fontFamily:'var(--font-serif)',fontSize:'1rem',fontWeight:700}}>Create Coupon</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'1rem'}}>
            <div className="fgroup">
              <label className="fl">Code</label>
              <input value={form.code} className="fi" placeholder="e.g. SAVE20" style={{textTransform:'uppercase',letterSpacing:'0.1em'}} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Discount %</label>
              <input type="number" value={form.discount_percent} className="fi" min={1} max={100} onChange={e=>setForm(p=>({...p,discount_percent:parseInt(e.target.value)||10}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Expires (optional)</label>
              <input type="date" value={form.expires_at} className="fi" onChange={e=>setForm(p=>({...p,expires_at:e.target.value}))}/>
            </div>
            <div className="fgroup">
              <label className="fl">Usage Limit (optional)</label>
              <input type="number" value={form.usage_limit} className="fi" placeholder="Unlimited" min={1} onChange={e=>setForm(p=>({...p,usage_limit:e.target.value}))}/>
            </div>
          </div>
          {form.code&&form.discount_percent>0&&(
            <div style={{padding:'0.75rem 1rem',background:'rgba(201,162,75,0.06)',border:'1px solid rgba(201,162,75,0.2)',borderRadius:'var(--radius-sm)',fontSize:'0.82rem',color:'var(--txt-2)'}}>
              Preview: Students enter <strong style={{color:'var(--gold)',letterSpacing:'0.08em'}}>{form.code||'CODE'}</strong> → get <strong style={{color:'var(--gold)'}}>{form.discount_percent}% off</strong>{form.usage_limit?` · max ${form.usage_limit} uses`:' · unlimited uses'}{form.expires_at?` · expires ${new Date(form.expires_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}`:' · no expiry'}
            </div>
          )}
          {/* Conversion fields */}
          {!form.isFree&&(
            <div style={{padding:'1rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--txt-1)',marginBottom:'-0.25rem'}}>Conversion & Value</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div className="fgroup">
                  <label className="fl">Discount % (optional)</label>
                  <input type="number" value={(form as {discountPercent?:number}).discountPercent||''} min={0} max={100} className="fi" placeholder="e.g. 20" onChange={e=>setForm(p=>({...p,discountPercent:parseInt(e.target.value)||0}))}/>
                </div>
                <div className="fgroup">
                  <label className="fl">Discount expires (optional)</label>
                  <input type="datetime-local" value={(form as {discountExpiresAt?:string}).discountExpiresAt||''} className="fi" onChange={e=>setForm(p=>({...p,discountExpiresAt:e.target.value}))}/>
                </div>
              </div>
              <div className="fgroup">
                <label className="fl">Target Audience</label>
                <input value={(form as {targetAudience?:string}).targetAudience||''} className="fi" placeholder="e.g. Students preparing for NYSC, Aspiring leaders" onChange={e=>setForm(p=>({...p,targetAudience:e.target.value}))}/>
              </div>
              <div className="fgroup">
                <label className="fl">Outcomes (one per line)</label>
                <textarea value={(form as {outcomes?:string}).outcomes||''} className="fi" rows={3} placeholder="Speak confidently in any room&#10;Structure a 5-minute speech&#10;Overcome stage fright" style={{resize:'vertical'}} onChange={e=>setForm(p=>({...p,outcomes:e.target.value}))}/>
                <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Shown in the paywall "What you'll gain" section.</p>
              </div>
              <div className="fgroup">
                <label className="fl">Lesson List (one per line)</label>
                <textarea value={(form as {lessons?:string}).lessons||''} className="fi" rows={4} placeholder="Lesson 1: Overcoming Fear&#10;Lesson 2: The Perfect Hook&#10;Lesson 3: Body Language Mastery" style={{resize:'vertical'}} onChange={e=>setForm(p=>({...p,lessons:e.target.value}))}/>
                <p style={{fontSize:'0.68rem',color:'var(--txt-3)',marginTop:'0.25rem'}}>Shown locked in the paywall to create urgency.</p>
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:'0.625rem'}}>
            <button onClick={save} disabled={saving} className="btn btn-gold" style={{opacity:saving?.7:1}}>
              {saving?<><RefreshCw size={13} style={{animation:'spin 0.8s linear infinite'}}/>Saving…</>:<><Tag size={13}/>Create Coupon</>}
            </button>
            <button onClick={()=>setShowForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {coupons.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No coupons yet.</p>}
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {coupons.map(cp=>{
          const expired = cp.expires_at&&new Date(cp.expires_at)<new Date()
          const maxed   = cp.usage_limit!==null&&cp.used_count>=cp.usage_limit
          const status  = !cp.is_active?'inactive':expired?'expired':maxed?'maxed':'active'
          const statusColor = status==='active'?'#50c880':status==='inactive'?'var(--txt-3)':'#e07070'
          return (
            <div key={cp.id} style={{display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.875rem 1rem',background:'var(--bg-1)',border:`1px solid ${status==='active'?'rgba(201,162,75,0.15)':'var(--border)'}`,borderRadius:'var(--radius-md)',flexWrap:'wrap',gap:'0.75rem'}}>
              {/* Code + discount */}
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flex:'0 0 auto'}}>
                <div style={{padding:'0.375rem 0.75rem',background:'rgba(201,162,75,0.08)',border:'1px solid rgba(201,162,75,0.2)',borderRadius:'6px'}}>
                  <code style={{fontSize:'0.85rem',fontWeight:800,color:'var(--gold)',letterSpacing:'0.1em'}}>{cp.code}</code>
                </div>
                <span style={{fontFamily:'var(--font-serif)',fontSize:'1.125rem',fontWeight:700,color:'var(--txt-1)'}}>{cp.discount_percent}% off</span>
              </div>
              {/* Stats */}
              <div style={{flex:1,minWidth:'120px',display:'flex',gap:'0.875rem',flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:'0.72rem',color:'var(--txt-3)'}}>{cp.used_count}{cp.usage_limit?`/${cp.usage_limit}`:''} uses</span>
                {cp.expires_at&&<span style={{fontSize:'0.72rem',color:expired?'#e07070':'var(--txt-3)'}}>Expires {fmt(cp.expires_at)}</span>}
                <span style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:statusColor,background:`${statusColor}18`,padding:'0.15rem 0.5rem',borderRadius:'4px'}}>{status}</span>
              </div>
              {/* Actions */}
              <div style={{display:'flex',gap:'0.375rem',flexShrink:0}}>
                <button onClick={()=>toggle(cp.id)} title={cp.is_active?'Deactivate':'Activate'}
                  style={{padding:'0.4rem 0.75rem',borderRadius:'var(--radius-sm)',border:`1px solid ${cp.is_active?'rgba(220,60,60,0.3)':'rgba(80,200,128,0.3)'}`,background:'transparent',color:cp.is_active?'#e07070':'#50c880',fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}>
                  {cp.is_active?'Deactivate':'Activate'}
                </button>
                <button onClick={()=>del(cp.id)} style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--txt-3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#e07070';e.currentTarget.style.color='#e07070'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}><Trash2 size={12}/></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── System Status ──
function SystemStatus({token}:{token:string}) {
  const [data,setData] = useState<{
    api?:{status:string;uptime:number;env:string}
    database?:{status:string;response_ms:number;size:string}
    paystack?:{configured:boolean}
    cloudinary?:{configured:boolean}
    email?:{configured:boolean}
    last_webhook?:{created_at:string;type:string}|null
    last_payment?:{created_at:string;plan:string;amount_kobo:number}|null
    last_video?:{created_at:string;title:string}|null
    memory_mb?:number
    timestamp?:string
  }|null>(null)
  const [loading,setLoading] = useState(true)

  const load=useCallback(async()=>{
    setLoading(true)
    try{
      const{data:r}=await axios.get(`${API}/api/admin/system/status`,{headers:authH(token)})
      if(r.success) setData(r.data)
    }catch{}
    setLoading(false)
  },[token])
  useEffect(()=>{load()},[load])

  const StatusDot=({ok,label}:{ok:boolean;label:string})=>(
    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:ok?'#50c880':'#e07070',boxShadow:`0 0 6px ${ok?'rgba(80,200,128,0.6)':'rgba(220,60,60,0.6)'}`,flexShrink:0,animation:ok?'none':'pulse 1.5s ease infinite'}}/>
      <span style={{fontSize:'0.8rem',color:ok?'#50c880':'#e07070',fontWeight:600}}>{label}</span>
    </div>
  )

  const fmt=(d:string)=>new Date(d).toLocaleString('en-NG',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700}}>System Status</h2>
        <button onClick={load} disabled={loading} className="btn btn-ghost btn-sm" style={{gap:'0.375rem'}}>
          <RefreshCw size={13} style={{animation:loading?'spin 0.8s linear infinite':'none'}}/>Refresh
        </button>
      </div>

      {loading&&!data&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.875rem'}}>
          {Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:'100px',borderRadius:'var(--radius-lg)'}}/>)}
        </div>
      )}

      {data&&(
        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
          {/* Services grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.875rem'}}>
            {[
              {label:'API Server',     ok:data.api?.status==='ok',    sub:data.api?`${Math.floor((data.api.uptime||0)/60)}m uptime · ${data.api.env}`:''},
              {label:'Database',       ok:data.database?.status==='ok',sub:data.database?`${data.database.response_ms}ms · ${data.database.size}`:''},
              {label:'Paystack',       ok:!!data.paystack?.configured, sub:data.paystack?.configured?'Keys configured':'Not configured'},
              {label:'Cloudinary',     ok:!!data.cloudinary?.configured,sub:data.cloudinary?.configured?'Keys configured':'Not configured'},
              {label:'Email (SMTP)',   ok:!!data.email?.configured,    sub:data.email?.configured?'SMTP configured':'Not configured'},
              {label:'Memory',         ok:(data.memory_mb||0)<400,     sub:data.memory_mb?`${data.memory_mb} MB used`:'N/A'},
            ].map(item=>(
              <div key={item.label} style={{padding:'1.125rem',background:'var(--bg-1)',border:`1px solid ${item.ok?'rgba(80,200,128,0.2)':'rgba(220,60,60,0.2)'}`,borderRadius:'var(--radius-lg)',transition:'border-color 0.15s'}}>
                <StatusDot ok={item.ok} label={item.label}/>
                <p style={{fontSize:'0.72rem',color:'var(--txt-3)',marginTop:'0.5rem',lineHeight:1.5}}>{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Recent events */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'0.875rem'}}>
            {[
              {label:'Last Webhook',   val:data.last_webhook,  icon:'🔗', desc:(d:typeof data.last_webhook)=>d?`${d.type} · ${fmt(d.created_at)}`:'No webhook received'},
              {label:'Last Payment',   val:data.last_payment,  icon:'💳', desc:(d:typeof data.last_payment)=>d?`${d.plan} · ₦${((d.amount_kobo||0)/100).toLocaleString()} · ${fmt(d.created_at)}`:'No payments yet'},
              {label:'Last Video',     val:data.last_video,    icon:'🎥', desc:(d:typeof data.last_video)=>d?`${d.title} · ${fmt(d.created_at)}`:'No videos published'},
            ].map(item=>(
              <div key={item.label} style={{padding:'1.125rem',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)'}}>
                <p style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--txt-3)',marginBottom:'0.5rem'}}>{item.icon} {item.label}</p>
                <p style={{fontSize:'0.82rem',color:item.val?'var(--txt-1)':'var(--txt-3)',lineHeight:1.5}}>{item.desc(item.val as null)}</p>
              </div>
            ))}
          </div>

          {data.timestamp&&<p style={{fontSize:'0.7rem',color:'var(--txt-3)'}}>Last checked: {fmt(data.timestamp)}</p>}
        </div>
      )}
    </div>
  )
}

// ── MAIN ADMIN PAGE ──
export default function AdminPage() {
  const [token,    setToken]    = useState<string|null>(null)
  const [tab,      setTab]      = useState<Tab>('dashboard')
  const [stats,    setStats]    = useState<Stats|null>(null)
  const [revenue,  setRevenue]  = useState<Revenue|null>(null)
  const [analytics,setAnalytics] = useState<Analytics|null>(null)
  const [impersonating, setImpersonating] = useState<Student|null>(null)
  const [sidebarOpen, setSidebarOpen]     = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const toast = useToast()

  useEffect(()=>{
    const t = localStorage.getItem('scsi_admin_token')||localStorage.getItem('scsi_access_token')
    if(!t){window.location.href='/login';return}
    try{
      const payload=JSON.parse(atob(t.split('.')[1]))
      if(payload.role==='admin') setToken(t)
      else window.location.href='/login'
    }catch{window.location.href='/login'}
  },[])

  useEffect(()=>{
    if(!token||tab!=='dashboard') return
    Promise.all([
      axios.get(`${API}/api/admin/dashboard`,{headers:authH(token)}),
      axios.get(`${API}/api/admin/revenue`,{headers:authH(token)}),
      axios.get(`${API}/api/admin/analytics/revenue`,{headers:authH(token)}),
    ]).then(([d,r,a])=>{setStats(d.data.data);setRevenue(r.data.data);setAnalytics(a.data.data)}).catch(()=>{})
  },[token,tab])

  const logout=()=>{localStorage.removeItem('scsi_admin_token');localStorage.removeItem('scsi_access_token');window.location.href='/login'}

  if(!token) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-0)'}}><div style={{width:'28px',height:'28px',border:'2px solid var(--bg-3)',borderTop:'2px solid var(--gold)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>

  const navItems:[Tab,React.ReactNode,string][] = [
    ['dashboard',    <LayoutDashboard size={15}/>, 'Dashboard'],
    ['blog',         <FileText size={15}/>,        'Blog Posts'],
    ['videos',       <Video size={15}/>,           'Videos'],
    ['gallery',      <ImageIcon size={15}/>,       'Gallery'],
    ['students',     <Users size={15}/>,           'Students'],
    ['contacts',     <MessageSquare size={15}/>,   'Contacts'],
    ['registrations',<UserCheck size={15}/>,       'Registrations'],
    ['testimonials', <BookOpen size={15}/>,        'Testimonials'],
    ['subscribers',  <Mail size={15}/>,            'Subscribers'],
    ['broadcast',    <Send size={15}/>,            'Broadcast'],
    ['coupons',      <Tag size={15}/>,              'Coupons'],
    ['system',       <Activity size={15}/>,         'System'],
    ['settings',     <Shield size={15}/>,          'Settings'],
  ]

  return (
    <div style={{minHeight:'100vh',display:'flex',background:'var(--bg-0)',fontFamily:'var(--font-sans)'}}>
      {toast.ToastUI}

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar" style={{width:'240px',flexShrink:0,background:'var(--bg-1)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,overflow:'hidden'}}>
        {/* Logo */}
        <div style={{padding:'1.375rem 1rem 1rem',borderBottom:'1px solid var(--border)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem',overflow:'hidden'}}>
            <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,162,75,0.12)',border:'1px solid rgba(201,162,75,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Shield size={14} color="var(--gold)"/>
            </div>
            {sidebarOpen&&<div style={{overflow:'hidden',whiteSpace:'nowrap'}}>
              <p style={{fontFamily:'var(--font-serif)',fontSize:'0.875rem',fontWeight:700,color:'var(--gold)',lineHeight:1}}>SCSI Admin</p>
              <p style={{fontSize:'0.5rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--txt-3)',marginTop:'0.1rem'}}>Panel</p>
            </div>}
          </div>

        </div>

        {/* Coach profile mini */}
        {sidebarOpen&&(
          <div style={{padding:'0.875rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'0.625rem',flexShrink:0}}>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',overflow:'hidden',flexShrink:0,border:'1.5px solid rgba(201,162,75,0.3)'}}>
              <img src="/coach-photo.jpg" alt="Coach" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} onError={e=>{e.currentTarget.style.display='none'}}/>
            </div>
            <div style={{minWidth:0}}>
              <p style={{fontSize:'0.78rem',fontWeight:700,color:'var(--txt-1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Coach Precious</p>
              <p style={{fontSize:'0.6rem',color:'var(--gold)',letterSpacing:'0.06em'}}>Administrator</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{flex:1,overflowY:'auto',padding:'0.5rem 0.375rem'}}>
          {navItems.map(([id,icon,label])=>(
            <button key={id} onClick={()=>{setTab(id);setImpersonating(null)}}
              
              style={{width:'100%',display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.625rem 0.75rem',justifyContent:'flex-start',borderRadius:'var(--radius-sm)',background:tab===id?'var(--gold-dim)':'transparent',color:tab===id?'var(--gold)':'var(--txt-2)',fontFamily:'var(--font-sans)',fontSize:'0.8125rem',fontWeight:tab===id?600:400,border:tab===id?'1px solid rgba(201,162,75,0.2)':'1px solid transparent',cursor:'pointer',transition:'all 0.15s',textAlign:'left',marginBottom:'0.1rem',whiteSpace:'nowrap',overflow:'hidden'}}
              onMouseEnter={e=>{if(tab!==id){e.currentTarget.style.background='var(--bg-2)';e.currentTarget.style.color='var(--txt-1)'}}}
              onMouseLeave={e=>{if(tab!==id){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--txt-2)'}}}>
              <span style={{flexShrink:0}}>{icon}</span>
              {sidebarOpen&&label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{padding:'0.5rem 0.375rem',borderTop:'1px solid var(--border)',flexShrink:0}}>
          <a href="/" target="_blank" style={{width:'100%',display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 0.75rem',justifyContent:'flex-start',borderRadius:'var(--radius-sm)',color:'var(--txt-3)',fontSize:'0.78rem',textDecoration:'none',transition:'all 0.15s',whiteSpace:'nowrap',overflow:'hidden',marginBottom:'0.1rem'}}
            onMouseEnter={e=>e.currentTarget.style.color='var(--txt-1)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--txt-3)'}>
            <Eye size={14} style={{flexShrink:0}}/>{sidebarOpen&&'View Site'}
          </a>
          <button onClick={logout} style={{width:'100%',display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 0.75rem',justifyContent:'flex-start',borderRadius:'var(--radius-sm)',border:'none',background:'transparent',color:'var(--txt-3)',fontSize:'0.78rem',cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap',overflow:'hidden'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,60,60,0.08)';e.currentTarget.style.color='#e07070'}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--txt-3)'}}>
            <LogOut size={14} style={{flexShrink:0}}/>{sidebarOpen&&'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'auto'}}>

        {/* Mobile header bar */}
        <div className="admin-mob-hdr" style={{display:'none',alignItems:'center',justifyContent:'space-between',padding:'0.875rem 1.25rem',background:'var(--bg-1)',borderBottom:'1px solid var(--border)',flexShrink:0,position:'sticky',top:0,zIndex:10}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
            <button onClick={()=>setMobileSidebarOpen(true)} style={{background:'none',border:'none',color:'var(--txt-2)',cursor:'pointer',display:'flex',padding:'0.25rem'}}>
              <Menu size={20}/>
            </button>
            <span style={{fontFamily:'var(--font-serif)',fontSize:'0.9375rem',fontWeight:700,color:'var(--gold)'}}>SCSI Admin</span>
          </div>
          <div style={{width:'28px',height:'28px',borderRadius:'50%',overflow:'hidden',border:'1.5px solid rgba(201,162,75,0.3)'}}>
            <img src="/coach-photo.jpg" alt="Coach" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} onError={e=>{e.currentTarget.style.display='none'}}/>
          </div>
        </div>

        {/* Mobile slide-over sidebar */}
        <aside style={{position:'fixed',top:0,left:mobileSidebarOpen?0:'-260px',width:'240px',height:'100vh',background:'var(--bg-1)',borderRight:'1px solid var(--border)',zIndex:80,display:'flex',flexDirection:'column',transition:'left 0.3s cubic-bezier(.4,0,.2,1)',overflowY:'auto'}} className="admin-mob-nav">
          <div style={{padding:'1.25rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontFamily:'var(--font-serif)',fontSize:'1rem',fontWeight:700,color:'var(--gold)'}}>SCSI Admin</span>
            <button onClick={()=>setMobileSidebarOpen(false)} style={{background:'none',border:'none',color:'var(--txt-3)',cursor:'pointer',display:'flex'}}><X size={18}/></button>
          </div>
          <nav style={{flex:1,padding:'0.5rem 0.375rem'}}>
            {navItems.map(([id,icon,label])=>(
              <button key={id} onClick={()=>{setTab(id);setImpersonating(null);setMobileSidebarOpen(false)}}
                style={{width:'100%',display:'flex',alignItems:'center',gap:'0.625rem',padding:'0.625rem 0.875rem',borderRadius:'var(--radius-sm)',background:tab===id?'var(--gold-dim)':'transparent',color:tab===id?'var(--gold)':'var(--txt-2)',fontFamily:'var(--font-sans)',fontSize:'0.8125rem',fontWeight:tab===id?600:400,border:tab===id?'1px solid rgba(201,162,75,0.2)':'1px solid transparent',cursor:'pointer',transition:'all 0.15s',textAlign:'left',marginBottom:'0.1rem'}}>
                {icon}{label}
              </button>
            ))}
          </nav>
          <div style={{padding:'0.5rem 0.375rem',borderTop:'1px solid var(--border)'}}>
            <button onClick={logout} style={{width:'100%',display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.625rem 0.875rem',borderRadius:'var(--radius-sm)',border:'none',background:'transparent',color:'var(--txt-3)',fontSize:'0.8rem',cursor:'pointer',transition:'all 0.15s',textAlign:'left'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,60,60,0.08)';e.currentTarget.style.color='#e07070'}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--txt-3)'}}>
              <LogOut size={14}/>Sign Out
            </button>
          </div>
        </aside>

        {/* Impersonation banner */}
        {impersonating&&(
          <div style={{padding:'0.75rem 1.5rem',background:'linear-gradient(90deg,rgba(201,162,75,0.15),rgba(201,162,75,0.06))',borderBottom:'2px solid rgba(201,162,75,0.4)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexShrink:0,flexWrap:'wrap',position:'sticky',top:0,zIndex:10}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
              <Eye size={16} color="var(--gold)"/>
              <span style={{fontWeight:700,color:'var(--gold)',fontSize:'0.9rem'}}>👀 Viewing as: <strong>{impersonating.full_name}</strong></span>
              <span style={{fontSize:'0.75rem',color:'var(--txt-3)',fontStyle:'italic'}}>({impersonating.email})</span>
            </div>
            <button onClick={()=>setImpersonating(null)}
              style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 1.125rem',borderRadius:'var(--radius-sm)',border:'1.5px solid rgba(201,162,75,0.5)',background:'rgba(201,162,75,0.12)',color:'var(--gold)',fontSize:'0.8rem',fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(201,162,75,0.22)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(201,162,75,0.12)'}}>
              <ArrowLeft size={14}/>Back to Admin Panel
            </button>
          </div>
        )}

        {/* Impersonating overlay - full screen */}
        {impersonating && (
          <div style={{position:'fixed',inset:0,zIndex:70,background:'var(--bg-0)',overflowY:'auto',animation:'fadeUp 0.3s ease both'}}>
            {/* Sticky header */}
            <div style={{position:'sticky',top:0,zIndex:5,background:'var(--bg-1)',borderBottom:'1px solid var(--border)',padding:'0.875rem 1.5rem',display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
              <button onClick={()=>setImpersonating(null)}
                style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 1rem',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'var(--bg-2)',color:'var(--txt-2)',fontSize:'0.8125rem',fontWeight:600,cursor:'pointer',transition:'all 0.15s',textDecoration:'none'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.color='var(--txt-1)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-2)'}}>
                ← Back to Admin Panel
              </button>
              <div style={{display:'flex',alignItems:'center',gap:'0.625rem',padding:'0.4rem 0.875rem',background:'rgba(201,162,75,0.1)',border:'1px solid rgba(201,162,75,0.3)',borderRadius:'99px'}}>
                <Eye size={13} color="var(--gold)"/>
                <span style={{fontSize:'0.8rem',fontWeight:700,color:'var(--gold)'}}>👀 Viewing as: {impersonating.full_name}</span>
              </div>
            </div>
            {/* Content */}
            <div style={{padding:'1.75rem 2rem',maxWidth:'860px',margin:'0 auto'}}>
              <ImpersonatedView student={impersonating} onExit={()=>setImpersonating(null)}/>
            </div>
          </div>
        )}

        {/* Content */}
        <main style={{flex:1,overflowY:'auto',padding:'1.75rem 2rem',maxWidth:'1100px',margin:'0 auto',width:'100%',boxSizing:'border-box'}}>
          {impersonating
            ? null
            : <>
                {tab==='dashboard'&&(
                  <div style={{display:'flex',flexDirection:'column',gap:'1.5rem',animation:'fadeUp 0.4s ease both'}}>

                    {/* ── Hero revenue card ── */}
                    {analytics ? (
                      <div style={{padding:'1.75rem',background:'linear-gradient(135deg,var(--bg-3),var(--bg-4))',border:'1px solid rgba(201,162,75,0.2)',borderRadius:'var(--radius-xl)',position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:'-30px',right:'-30px',width:'140px',height:'140px',borderRadius:'50%',background:'rgba(201,162,75,0.05)',pointerEvents:'none'}}/>
                        <p style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.375rem'}}>Total Revenue (All Time)</p>
                        <p style={{fontFamily:'var(--font-serif)',fontSize:'clamp(2rem,4vw,3rem)',fontWeight:700,color:'var(--txt-1)',lineHeight:1,marginBottom:'0.375rem'}}>{naira(analytics.total_revenue)}</p>
                        <p style={{fontSize:'0.78rem',color:'var(--txt-3)',marginBottom:'1.5rem'}}>{analytics.subscription_count + analytics.video_purchase_count} total transactions</p>
                        {/* Revenue breakdown row */}
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'0.75rem'}}>
                          {[
                            {label:'Subscriptions',val:analytics.subscription_revenue,icon:<Crown size={13}/>,sub:`${analytics.subscription_count} payments`},
                            {label:'Video Sales',val:analytics.video_revenue,icon:<Video size={13}/>,sub:`${analytics.video_purchase_count} purchases`},
                            {label:'Wallet Funded',val:analytics.wallet_funding_total,icon:<Wallet size={13}/>,sub:'Total top-ups'},
                            {label:'Last 7 Days',val:analytics.revenue_last_7_days,icon:<TrendingUp size={13}/>,sub:'Combined'},
                            {label:'Last 30 Days',val:analytics.revenue_last_30_days,icon:<BarChart2 size={13}/>,sub:`${analytics.last_30_sub_count+analytics.last_30_vid_count} txns`},
                          ].map(item=>(
                            <div key={item.label} style={{padding:'0.875rem',background:'rgba(201,162,75,0.06)',border:'1px solid rgba(201,162,75,0.12)',borderRadius:'var(--radius-md)'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'0.35rem',color:'var(--gold)',marginBottom:'0.375rem'}}>{item.icon}<span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>{item.label}</span></div>
                              <p style={{fontFamily:'var(--font-serif)',fontWeight:700,fontSize:'1.0625rem',color:'var(--txt-1)',marginBottom:'0.1rem'}}>{naira(item.val)}</p>
                              <p style={{fontSize:'0.68rem',color:'var(--txt-3)'}}>{item.sub}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{height:'200px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)'}} className="skeleton"/>
                    )}

                    {/* ── Top Earning Videos ── */}
                    {analytics && analytics.top_earning_videos.length > 0 && (
                      <div style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'1.5rem'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1.25rem'}}>
                          <TrendingUp size={15} color="var(--gold)"/>
                          <h3 style={{fontFamily:'var(--font-serif)',fontSize:'1rem',fontWeight:700}}>Top Earning Videos</h3>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                          {analytics.top_earning_videos.map((v,i)=>(
                            <div key={v.id} style={{display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.75rem 0.875rem',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',transition:'border-color 0.15s'}}
                              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-hover)'}
                              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                              <div style={{width:'26px',height:'26px',borderRadius:'6px',background:'rgba(201,162,75,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <span style={{fontFamily:'var(--font-serif)',fontSize:'0.75rem',fontWeight:700,color:'var(--gold)'}}>{i+1}</span>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontWeight:600,fontSize:'0.875rem',color:'var(--txt-1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:'0.1rem'}}>{v.title}</p>
                                <p style={{fontSize:'0.68rem',color:'var(--txt-3)'}}>{v.purchase_count} purchase{v.purchase_count!==1?'s':''} · {naira(v.price_kobo)} each</p>
                              </div>
                              <div style={{textAlign:'right',flexShrink:0}}>
                                <p style={{fontFamily:'var(--font-serif)',fontWeight:700,fontSize:'1rem',color:'var(--gold)'}}>{naira(v.total_revenue_kobo)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Platform stats grid ── */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.875rem'}}>
                      {stats ? <>
                        <StatCard label="Contact Submissions"   value={stats.totalContacts}        icon={<MessageSquare size={15}/>}/>
                        <StatCard label="Refinery Applications"  value={stats.totalRegistrations}   icon={<BookOpen size={15}/>}/>
                        <StatCard label="Newsletter Subs"        value={stats.activeSubscribers}    icon={<Mail size={15}/>}/>
                        <StatCard label="Published Articles"     value={stats.publishedPosts}       icon={<FileText size={15}/>}/>
                        <StatCard label="Published Videos"       value={stats.publishedVideos}      icon={<Video size={15}/>}/>
                        <StatCard label="Pending Testimonials"   value={stats.pendingTestimonials}  icon={<UserCheck size={15}/>} color={stats.pendingTestimonials>0?'#e07070':'var(--gold)'}/>
                      </> : Array(6).fill(0).map((_,i)=><div key={i} style={{height:'110px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)'}} className="skeleton"/>)}
                    </div>
                  </div>
                )}
                {tab==='blog'          && <BlogManager token={token} toast={toast}/>}
                {tab==='gallery'        && <GalleryManager token={token} toast={toast}/>}
                {tab==='videos'        && <VideoManager token={token} toast={toast}/>}
                {tab==='students'      && <StudentsManager token={token} toast={toast} onImpersonate={setImpersonating}/>}
                {tab==='contacts'      && <ContactsView token={token}/>}
                {tab==='registrations' && <RegistrationsView token={token}/>}
                {tab==='testimonials'  && <TestimonialsManager token={token} toast={toast}/>}
                {tab==='subscribers'   && <SubscribersView token={token} toast={toast}/>}
                {tab==='coupons'       && <CouponsManager token={token} toast={toast}/>}
                {tab==='system'        && <SystemStatus token={token}/>}
                {tab==='broadcast'     && <BroadcastManager token={token} toast={toast}/>}
                {tab==='settings'      && <AdminSettings token={token} toast={toast}/>}
              </>}
        </main>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .skeleton{background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 50%,var(--bg-2) 75%);background-size:200% 100%;animation:skeletonShimmer 1.5s ease infinite}
        @keyframes skeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .skeleton{background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3) 50%,var(--bg-2) 75%);background-size:200% 100%;animation:skeletonShimmer 1.5s ease infinite}
        @keyframes skeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        /* Desktop: show sidebar, hide mobile header */
        .admin-sidebar   { display:flex !important; }
        .admin-mob-hdr   { display:none !important; }
        .admin-mob-nav   { display:flex !important; flex-direction:column; }
        /* Mobile: hide sidebar, show mobile header */
        @media(max-width:768px) {
          .admin-sidebar { display:none !important; }
          .admin-mob-hdr { display:flex !important; }
        }
        @media(min-width:769px) {
          .admin-mob-nav { display:none !important; }
        }
      `}</style>
    </div>
  )
}

// Remaining views
function TestimonialsManager({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const [items,setItems] = useState<{id:number;name:string;role:string;quote:string;approved:boolean;created_at:string}[]>([])
  const load = useCallback(async()=>{try{const{data}=await axios.get(`${API}/api/admin/testimonials`,{headers:authH(token)});setItems(data.data||[])}catch{}},[token])
  useEffect(()=>{load()},[load])
  const approve=async(id:number)=>{try{await axios.patch(`${API}/api/admin/testimonials/${id}/approve`,{},{headers:authH(token)});toast.ok('Approved!');load()}catch{toast.err('Failed')}}
  const del=async(id:number)=>{try{await axios.delete(`${API}/api/admin/testimonials/${id}`,{headers:authH(token)});toast.ok('Deleted');load()}catch{toast.err('Failed')}}
  return (
    <div>
      <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700,marginBottom:'1.5rem'}}>Testimonials ({items.length})</h2>
      <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
        {items.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No testimonials yet.</p>}
        {items.map(t=>(
          <div key={t.id} style={{padding:'1.125rem',background:'var(--bg-1)',border:`1px solid ${t.approved?'rgba(201,162,75,0.2)':'var(--border)'}`,borderRadius:'var(--radius-md)',display:'flex',gap:'1rem',alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <p style={{fontStyle:'italic',color:'var(--txt-2)',lineHeight:1.75,fontSize:'0.875rem',marginBottom:'0.625rem'}}>"{t.quote}"</p>
              <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--txt-1)'}}>{t.name}</p>
              <p style={{fontSize:'0.7rem',color:'var(--gold)'}}>{t.role}</p>
            </div>
            <div style={{display:'flex',gap:'0.25rem',flexShrink:0}}>
              {!t.approved&&<button onClick={()=>approve(t.id)} title="Approve" style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid rgba(80,200,128,0.3)',background:'rgba(80,200,128,0.08)',color:'#50c880',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={12}/></button>}
              {!t.approved&&<button onClick={()=>del(t.id)} title="Reject" style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid rgba(220,60,60,0.3)',background:'rgba(220,60,60,0.08)',color:'#e07070',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={12}/></button>}
              <button onClick={()=>del(t.id)} style={{width:'30px',height:'30px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--txt-3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#e07070';e.currentTarget.style.color='#e07070'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SubscribersView({token,toast}:{token:string;toast:ReturnType<typeof useToast>}) {
  const [subs,setSubs] = useState<{id:number;email:string;created_at:string}[]>([])
  useEffect(()=>{axios.get(`${API}/api/admin/subscribers`,{headers:authH(token)}).then(r=>setSubs(r.data.data||[])).catch(()=>{})},[token])
  const exportCSV=()=>{const c='Email,Date\n'+subs.map(s=>`${s.email},${fmt(s.created_at)}`).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:'text/csv'}));a.download='subscribers.csv';a.click();toast.ok('CSV exported!')}
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700}}>Subscribers ({subs.length})</h2>
        <button onClick={exportCSV} className="btn btn-ghost btn-sm">Export CSV</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'0.5rem'}}>
        {subs.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem',gridColumn:'1/-1'}}>No subscribers yet.</p>}
        {subs.map(s=>(
          <div key={s.id} style={{padding:'0.75rem 1rem',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.5rem'}}>
            <p style={{fontSize:'0.85rem',color:'var(--txt-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.email}</p>
            <p style={{fontSize:'0.68rem',color:'var(--txt-3)',flexShrink:0}}>{fmt(s.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegistrationsView({token}:{token:string}) {
  const [regs,setRegs] = useState<{id:number;full_name:string;level_or_profession:string;primary_goal:string;biggest_hurdle:string;whatsapp_number:string;preferred_session:string;created_at:string}[]>([])
  const [exp,setExp]   = useState<number|null>(null)
  useEffect(()=>{axios.get(`${API}/api/admin/registrations`,{headers:authH(token)}).then(r=>setRegs(r.data.data||[])).catch(()=>{})},[token])
  return (
    <div>
      <h2 className="h-serif" style={{fontSize:'1.25rem',fontWeight:700,marginBottom:'1.5rem'}}>Registrations ({regs.length})</h2>
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {regs.length===0&&<p style={{color:'var(--txt-3)',fontStyle:'italic',textAlign:'center',padding:'3rem'}}>No registrations yet.</p>}
        {regs.map(r=>(
          <div key={r.id} style={{background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',overflow:'hidden'}}>
            <button onClick={()=>setExp(exp===r.id?null:r.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.875rem 1rem',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
              <div style={{flex:1}}>
                <p style={{fontWeight:600,fontSize:'0.9rem',color:'var(--txt-1)',marginBottom:'0.1rem'}}>{r.full_name}</p>
                <p style={{fontSize:'0.7rem',color:'var(--txt-3)'}}>{r.level_or_profession} · {fmt(r.created_at)}</p>
              </div>
              <span className="badge">{r.preferred_session}</span>
              {exp===r.id?<ChevronDown size={13} color="var(--txt-3)"/>:<ChevronRight size={13} color="var(--txt-3)"/>}
            </button>
            {exp===r.id&&(
              <div style={{padding:'1.125rem',borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:'0.75rem',animation:'fadeUp 0.2s ease both'}}>
                <div style={{padding:'0.75rem',background:'var(--bg-2)',borderLeft:'3px solid var(--gold)',borderRadius:'0 var(--radius-sm) var(--radius-sm) 0'}}>
                  <p className="fl" style={{marginBottom:'0.25rem'}}>90-Day Goal</p>
                  <p style={{fontSize:'0.85rem',color:'var(--txt-2)',lineHeight:1.7}}>{r.primary_goal}</p>
                </div>
                <div style={{padding:'0.75rem',background:'var(--bg-2)',borderLeft:'3px solid #7C1A1A',borderRadius:'0 var(--radius-sm) var(--radius-sm) 0'}}>
                  <p className="fl" style={{marginBottom:'0.25rem'}}>Biggest Hurdle</p>
                  <p style={{fontSize:'0.85rem',color:'var(--txt-2)',lineHeight:1.7}}>{r.biggest_hurdle}</p>
                </div>
                <a href={`https://wa.me/${r.whatsapp_number.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',padding:'0.5rem 1rem',background:'rgba(37,211,102,0.1)',border:'1px solid rgba(37,211,102,0.3)',borderRadius:'var(--radius-sm)',color:'#25D366',fontSize:'0.8rem',fontWeight:600,textDecoration:'none',width:'fit-content'}}>
                  WhatsApp: {r.whatsapp_number}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
