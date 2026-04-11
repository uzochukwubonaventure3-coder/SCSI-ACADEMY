'use client'
import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: 500, suffix: '+', label: 'Students Impacted',     sub: 'Across Nigeria'       },
  { value: 6,   suffix: '',  label: 'Service Pillars',        sub: 'Holistic coverage'    },
  { value: 90,  suffix: '%', label: 'Transformation Rate',    sub: 'Client-reported'      },
  { value: 3,   suffix: '+', label: 'Years of Excellence',    sub: 'Proven results'       },
]

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!started) return
    let frame = 0
    const total = 60
    const timer = setInterval(() => {
      frame++
      setCount(Math.round(target * (frame / total)))
      if (frame >= total) clearInterval(timer)
    }, 1800 / total)
    return () => clearInterval(timer)
  }, [started, target])
  return <span ref={ref}>{count}{suffix}</span>
}

export default function StatsSection() {
  return (
    <section style={{ background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '3.5rem 1.25rem' }}>
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0' }}>
          {stats.map(({ value, suffix, label, sub }, i) => (
            <div key={label} style={{ textAlign: 'center', padding: '1.5rem 1rem', borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
              <div className="stat-num" style={{ fontSize: 'clamp(2.25rem,4vw,3rem)', marginBottom: '0.375rem' }}>
                <Counter target={value} suffix={suffix} />
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--txt-3)', letterSpacing: '0.06em' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
