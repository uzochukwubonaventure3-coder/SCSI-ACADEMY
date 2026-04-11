'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccess } from '@/hooks/useAccess'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { hasAccess, loading } = useAccess()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !hasAccess) router.push('/login')
  }, [hasAccess, loading, router])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'32px', height:'32px', border:'2px solid var(--bg-3)', borderTop:'2px solid var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )

  if (!hasAccess) return null
  return <>{children}</>
}
