'use client'
import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, RefreshCw, Check } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  /** pass token directly so admin pages work */
  token?: string
}

export default function ImageUpload({ value, onChange, label = 'Cover Image', token }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const getToken = () =>
    token ||
    localStorage.getItem('scsi_admin_token') ||
    localStorage.getItem('scsi_access_token') ||
    ''

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return }
    setUploading(true); setError(''); setProgress(0)
    try {
      const t = getToken()
      const { data: sig } = await axios.get(`${API}/api/upload/cloudinary-signature`, {
        headers: { Authorization: `Bearer ${t}` }
      })
      if (!sig.success) throw new Error(sig.message)

      const fd = new FormData()
      fd.append('file',      file)
      fd.append('api_key',   sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder',    sig.folder)

      const { data: cloud } = await axios.post(sig.uploadUrl, fd, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100))
      })

      onChange(cloud.secure_url)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      const msg = err.response?.data?.message || err.message || 'Upload failed'
      setError(msg)
      console.error('[ImageUpload]', msg)
    } finally {
      setUploading(false); setProgress(0)
    }
  }

  return (
    <div>
      {label && <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.5rem' }}>{label}</label>}

      {value ? (
        <div style={{ position:'relative', width:'100%', maxWidth:'280px' }}>
          <img src={value} alt="Uploaded" style={{ width:'100%', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', objectFit:'cover', maxHeight:'180px', display:'block' }}/>
          <button onClick={() => onChange('')}
            style={{ position:'absolute', top:'0.375rem', right:'0.375rem', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'none', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13}/>
          </button>
          <div style={{ position:'absolute', bottom:'0.375rem', left:'0.375rem', display:'flex', alignItems:'center', gap:'0.25rem', padding:'0.2rem 0.5rem', background:'rgba(40,180,100,0.9)', borderRadius:'4px' }}>
            <Check size={10} color="white"/><span style={{ fontSize:'0.6rem', color:'white', fontWeight:700 }}>Uploaded</span>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ width:'100%', maxWidth:'280px', height:'120px', borderRadius:'var(--radius-md)', border:'2px dashed var(--border)', background:'var(--bg-1)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem', cursor:'pointer', color:'var(--txt-3)', transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-hover)'; e.currentTarget.style.color='var(--gold)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--txt-3)' }}>
          {uploading ? (
            <>
              <RefreshCw size={20} style={{ animation:'spin 0.8s linear infinite' }}/>
              <span style={{ fontSize:'0.8rem' }}>Uploading… {progress}%</span>
              <div style={{ width:'80%', height:'3px', background:'var(--bg-3)', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ height:'100%', background:'var(--gold)', width:`${progress}%`, transition:'width 0.3s' }}/>
              </div>
            </>
          ) : (
            <>
              <Upload size={20}/>
              <span style={{ fontSize:'0.8rem', fontWeight:600 }}>Click to upload</span>
              <span style={{ fontSize:'0.68rem', opacity:0.7 }}>PNG, JPG, WebP · Max 10MB</span>
            </>
          )}
        </button>
      )}

      {error && <p style={{ marginTop:'0.375rem', fontSize:'0.75rem', color:'#e07070', maxWidth:'280px', lineHeight:1.4 }}>{error}</p>}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display:'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
