'use client'
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastCtx {
  ok:   (msg: string) => void
  err:  (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastCtx>({ ok: () => {}, err: () => {}, info: () => {} })

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++nextId
    setToasts(prev => [...prev.slice(-3), { id, message, type }])
    // Auto-dismiss after 4 seconds
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])

  const ok   = useCallback((msg: string) => add(msg, 'success'), [add])
  const err  = useCallback((msg: string) => add(msg, 'error'),   [add])
  const info = useCallback((msg: string) => add(msg, 'info'),    [add])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ ok, err, info }}>
      {children}
      {/* Fixed top-right — stays visible on scroll */}
      <div style={{
        position: 'fixed', top: '1.25rem', right: '1.25rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        gap: '0.5rem', pointerEvents: 'none',
        width: 'min(340px, calc(100vw - 2.5rem))',
      }}>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const cfg = {
    success: { bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.35)',  color: '#50c880', Icon: CheckCircle },
    error:   { bg: 'rgba(220,60,60,0.12)',  border: 'rgba(220,60,60,0.35)',  color: '#e07070', Icon: AlertCircle },
    info:    { bg: 'rgba(201,162,75,0.12)', border: 'rgba(201,162,75,0.35)', color: 'var(--gold)', Icon: Info },
  }[toast.type]

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
        padding: '0.875rem 1rem',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: '12px', color: cfg.color,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
        pointerEvents: 'all',
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s ease',
      }}
    >
      <cfg.Icon size={16} style={{ flexShrink: 0, marginTop: '1px' }}/>
      <p style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
        {toast.message}
      </p>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6, display: 'flex', flexShrink: 0, padding: 0, marginTop: '1px' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
      >
        <X size={14}/>
      </button>
    </div>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
