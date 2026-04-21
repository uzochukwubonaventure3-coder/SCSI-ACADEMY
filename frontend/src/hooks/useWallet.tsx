'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface WalletTx {
  id: number
  type: 'credit' | 'debit'
  amount_kobo: number
  reference?: string
  description: string
  created_at: string
}

export interface WalletState {
  balance_kobo: number
  transactions: WalletTx[]
}

export function useWallet(token: string | null, hasAccess: boolean) {
  const [wallet,  setWallet]  = useState<WalletState | null>(null)
  const [loading, setLoading] = useState(false)

  const getT = useCallback(() =>
    token || (typeof window !== 'undefined' ? localStorage.getItem('scsi_access_token') : '') || ''
  , [token])

  const load = useCallback(async () => {
    const t = getT()
    if (!t || !hasAccess) return
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/api/wallet`, {
        headers: { Authorization: `Bearer ${t}` }
      })
      if (data.success) setWallet(data.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [getT, hasAccess])

  useEffect(() => { if (hasAccess) load() }, [hasAccess, load])

  const naira = (k: number) => `₦${(k / 100).toLocaleString('en-NG')}`

  return { wallet, loading, reload: load, naira }
}
