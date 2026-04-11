'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Progress { blog: number[]; video: number[] }

export function useProgress() {
  const [progress, setProgress] = useState<Progress>({ blog: [], video: [] })

  const load = useCallback(async () => {
    const token = localStorage.getItem('scsi_access_token')
    if (!token) return
    try {
      const { data } = await axios.get(`${API}/api/progress`, { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) setProgress(data.data)
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = useCallback(async (contentType: 'blog' | 'video', contentId: number) => {
    const token = localStorage.getItem('scsi_access_token')
    if (!token) return
    try {
      await axios.post(`${API}/api/progress/mark`, { contentType, contentId }, { headers: { Authorization: `Bearer ${token}` } })
      setProgress(p => ({ ...p, [contentType]: [...new Set([...p[contentType], contentId])] }))
    } catch {}
  }, [])

  const isRead = useCallback((type: 'blog' | 'video', id: number) => {
    return progress[type]?.includes(id) ?? false
  }, [progress])

  const totalRead = progress.blog.length + progress.video.length

  return { progress, markRead, isRead, totalRead, reload: load }
}
