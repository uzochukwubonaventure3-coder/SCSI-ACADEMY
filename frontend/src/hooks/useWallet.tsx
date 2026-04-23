'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Wallet {
  balance_kobo: number
  updated_at: string
}

export function useWallet(token: string | null, hasAccess: boolean) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    const t = token || (typeof window !== 'undefined' ? localStorage.getItem('scsi_access_token') : null)
    if (!t || !hasAccess) return
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/api/wallet`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (data.success) setWallet(data.data)
    } catch {
      // silent fail — wallet not critical
    } finally {
      setLoading(false)
    }
  }, [token, hasAccess])

  useEffect(() => {
    reload()
  }, [reload])

  return { wallet, loading, reload }
}
