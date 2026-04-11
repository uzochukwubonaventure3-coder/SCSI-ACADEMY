'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface ContentUser {
  id?: number
  email: string
  fullName: string
  plan?: 'monthly' | 'quarterly'
  expiresAt?: string | null
  phone?: string
  bio?: string
  avatarUrl?: string
  role: 'student' | 'admin'
}

interface LoginResult {
  success: boolean
  message: string
  expired?: boolean
  needsPayment?: boolean
  role?: 'student' | 'admin'
}

interface AccessContextValue {
  user: ContentUser | null
  hasAccess: boolean
  isAdmin: boolean
  loading: boolean
  token: string | null                 // ← exposed so settings/admin can use it directly
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  setAccessFromPayment: (token: string, user: ContentUser) => void
  refreshUser: () => Promise<void>
  updateLocalUser: (patch: Partial<ContentUser>) => void
}

const AccessContext = createContext<AccessContextValue>({
  user: null, hasAccess: false, isAdmin: false, loading: true, token: null,
  login: async () => ({ success: false, message: '' }),
  logout: () => {},
  setAccessFromPayment: () => {},
  refreshUser: async () => {},
  updateLocalUser: () => {},
})

function setCookie(t: string) {
  if (typeof document === 'undefined') return
  document.cookie = `scsi_access_token=${t}; path=/; max-age=${30 * 24 * 3600}; SameSite=Strict`
}
function clearCookie() {
  if (typeof document === 'undefined') return
  document.cookie = 'scsi_access_token=; path=/; max-age=0; SameSite=Strict'
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<ContentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [token,   setToken]   = useState<string | null>(null)

  const verifyToken = useCallback(async () => {
    const t = localStorage.getItem('scsi_access_token')
    if (!t) { setLoading(false); return }
    try {
      const { data } = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (data.success) {
        // Prefer DB avatar (data.user.avatarUrl), fallback to localStorage
        const dbAvatar = data.user.avatarUrl
        const savedAvatar = localStorage.getItem('scsi_avatar')
        const finalAvatar = dbAvatar || savedAvatar || undefined
        setUser({ ...data.user, avatarUrl: finalAvatar })
        setToken(t)
      } else {
        localStorage.removeItem('scsi_access_token'); clearCookie(); setUser(null); setToken(null)
      }
    } catch {
      localStorage.removeItem('scsi_access_token'); clearCookie(); setUser(null); setToken(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { verifyToken() }, [verifyToken])

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, { email, password })
      if (data.success) {
        const t = data.token
        localStorage.setItem('scsi_access_token', t)
        if (data.role === 'admin') localStorage.setItem('scsi_admin_token', t)
        setCookie(t)
        setToken(t)
        // Prefer DB avatar (data.user.avatarUrl), fallback to localStorage
        const dbAvatar = data.user.avatarUrl
        const savedAvatar = localStorage.getItem('scsi_avatar')
        const finalAvatar = dbAvatar || savedAvatar || undefined
        setUser({ ...data.user, avatarUrl: finalAvatar })
        return { success: true, message: 'Welcome!', role: data.role }
      }
      return { success: false, message: data.message }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; expired?: boolean; needsPayment?: boolean } } }
      const d = err.response?.data
      return { success: false, message: d?.message || 'Login failed.', expired: d?.expired, needsPayment: d?.needsPayment }
    }
  }

  const logout = () => {
    localStorage.removeItem('scsi_access_token')
    localStorage.removeItem('scsi_admin_token')
    localStorage.removeItem('scsi_avatar')
    clearCookie()
    setUser(null)
    setToken(null)
  }

  const setAccessFromPayment = (t: string, newUser: ContentUser) => {
    localStorage.setItem('scsi_access_token', t)
    setCookie(t)
    setToken(t)
    const savedAvatar = localStorage.getItem('scsi_avatar')
    setUser({ ...newUser, avatarUrl: newUser.avatarUrl || savedAvatar || undefined })
  }

  const refreshUser = async () => { await verifyToken() }

  const updateLocalUser = (patch: Partial<ContentUser>) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev)
    if (patch.avatarUrl) localStorage.setItem('scsi_avatar', patch.avatarUrl)
  }

  return (
    <AccessContext.Provider value={{
      user, hasAccess: !!user, isAdmin: user?.role === 'admin',
      loading, token, login, logout, setAccessFromPayment, refreshUser, updateLocalUser,
    }}>
      {children}
    </AccessContext.Provider>
  )
}

export const useAccess = () => useContext(AccessContext)
