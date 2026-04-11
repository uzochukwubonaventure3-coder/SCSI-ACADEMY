'use client'
import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Upload Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true); setError('')
    try {
      // Get signed params from backend
      const token = localStorage.getItem('scsi_admin_token')
      const { data: sigData } = await axios.get(`${API}/api/upload/cloudinary-signature`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!sigData.success) throw new Error(sigData.message)

      const { cloudName, apiKey, timestamp, signature, folder, uploadUrl } = sigData

      const form = new FormData()
      form.append('file', file)
      form.append('api_key', apiKey)
      form.append('timestamp', timestamp)
      form.append('signature', signature)
      form.append('folder', folder)

      const { data: cloudData } = await axios.post(uploadUrl, form)
      onChange(cloudData.secure_url)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err.response?.data?.message || err.message || 'Upload failed. Check Cloudinary credentials in .env')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.5rem' }}>
        {label}
      </label>

      {value ? (
        <div style={{ position:'relative', width:'100%', maxWidth:'320px' }}>
          <img src={value} alt="Uploaded" style={{ width:'100%', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', objectFit:'cover', maxHeight:'180px' }}/>
          <button onClick={() => onChange('')} style={{ position:'absolute', top:'0.5rem', right:'0.5rem', width:'28px', height:'28px', borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'none', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ width:'100%', maxWidth:'320px', height:'120px', borderRadius:'var(--radius-md)', border:'2px dashed var(--border)', background:'var(--bg-1)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.625rem', cursor:'pointer', transition:'all 0.2s', color:'var(--txt-3)' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hover)';e.currentTarget.style.color='var(--gold)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--txt-3)'}}
        >
          {uploading
            ? <><Loader size={22} style={{ animation:'spin 0.8s linear infinite' }}/><span style={{ fontSize:'0.8rem' }}>Uploading…</span></>
            : <><Upload size={22}/><span style={{ fontSize:'0.8rem' }}>Click to upload</span><span style={{ fontSize:'0.7rem', opacity:0.7 }}>PNG, JPG, WebP · Max 5MB</span></>}
          <ImageIcon size={12} style={{ opacity:0.4 }}/>
        </button>
      )}

      {error && <p style={{ marginTop:'0.5rem', fontSize:'0.78rem', color:'#e07070' }}>{error}</p>}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display:'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
