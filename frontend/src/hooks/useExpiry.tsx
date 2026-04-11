'use client'
import { useState, useEffect } from 'react'

export function useExpiry(expiresAt?: string | null) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt) { setDays(null); return }

    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      setDays(Math.max(0, Math.ceil(diff / 86400000)))
    }

    calc()
    // Recalculate every hour
    const t = setInterval(calc, 3600000)
    return () => clearInterval(t)
  }, [expiresAt])

  const urgency = days === null ? 'ok'
    : days <= 3  ? 'urgent'
    : days <= 7  ? 'warn'
    : 'ok'

  const label = days === null ? ''
    : days === 0 ? 'Expires today!'
    : `${days} day${days !== 1 ? 's' : ''} left`

  return { days, urgency, label }
}
