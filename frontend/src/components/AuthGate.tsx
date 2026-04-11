'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAccess, isPublicRoute } from '@/hooks/useAccess'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { hasAccess, loading } = useAccess()
  const pathname = usePathname()
  const router   = useRouter()

  const isPublic = isPublicRoute(pathname)
  // Admin has its own auth — let it handle itself
  const isAdmin  = pathname.startsWith('/admin')

  useEffect(() => {
    if (loading) return
    if (!hasAccess && !isPublic && !isAdmin) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [hasAccess, loading, isPublic, isAdmin, pathname, router])

  // Show spinner while checking auth on protected routes
  if (loading && !isPublic && !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-0)',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
        }}>
          <div style={{
            width: '36px', height: '36px',
            border: '2.5px solid var(--bg-3)',
            borderTop: '2.5px solid var(--gold)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', letterSpacing: '0.08em' }}>
            Verifying access…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Block render until redirected
  if (!loading && !hasAccess && !isPublic && !isAdmin) return null

  return <>{children}</>
}
