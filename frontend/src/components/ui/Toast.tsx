'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Check, X, Info, AlertCircle } from 'lucide-react'

type ToastType = 'ok' | 'err' | 'info' | 'warn'
interface ToastItem { id: number; msg: string; type: ToastType }

interface ToastContextValue {
  toast: (msg: string, type?: ToastType) => void
  ok:   (msg: string) => void
  err:  (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {}, ok: () => {}, err: () => {}, info: () => {}
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let nextId = 0

  const add = useCallback((msg: string, type: ToastType = 'info') => {
    const id = ++nextId
    setToasts(p => [...p.slice(-3), { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const icons: Record<ToastType, React.ReactNode> = {
    ok:   <Check size={15}/>,
    err:  <X size={15}/>,
    info: <Info size={15}/>,
    warn: <AlertCircle size={15}/>,
  }
  const cls: Record<ToastType, string> = {
    ok: 'toast-ok', err: 'toast-err', info: 'toast-info', warn: 'toast-info'
  }

  return (
    <ToastContext.Provider value={{
      toast: add,
      ok:   (m) => add(m, 'ok'),
      err:  (m) => add(m, 'err'),
      info: (m) => add(m, 'info'),
    }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item ${cls[t.type]}`}>
            {icons[t.type]}
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
              <X size={13}/>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
