'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, X, FileText, Video, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface SearchResult {
  id: number; title: string; slug: string
  excerpt?: string; description?: string
  content_type: 'blog' | 'video'; tags: string[]
}

export default function SearchBar() {
  const [open,    setOpen]    = useState(false)
  const [q,       setQ]       = useState('')
  const [results, setResults] = useState<{ posts: SearchResult[]; videos: SearchResult[] }>({ posts: [], videos: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true) }
      if (e.key === 'Escape') { setOpen(false); setQ('') }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const doSearch = (val: string) => {
    clearTimeout(debounce.current)
    if (val.length < 2) { setResults({ posts: [], videos: [] }); return }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/api/search?q=${encodeURIComponent(val)}`)
        setResults(data.data)
      } catch { setResults({ posts: [], videos: [] }) }
      finally { setLoading(false) }
    }, 350)
  }

  const total = results.posts.length + results.videos.length

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.875rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--txt-3)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', width: '100%', maxWidth: '200px' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--txt-1)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--txt-3)' }}>
        <Search size={13}/>
        <span style={{ flex: 1, textAlign: 'left' }}>Search content…</span>
        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--bg-3)', borderRadius: '4px', color: 'var(--txt-3)' }}>⌘K</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={() => { setOpen(false); setQ('') }}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 1.25rem 2rem' }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '580px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.2s ease both' }}>

            {/* Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <Search size={17} color="var(--gold)"/>
              <input
                ref={inputRef}
                value={q}
                onChange={e => { setQ(e.target.value); doSearch(e.target.value) }}
                placeholder="Search articles and videos…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--txt-1)', fontSize: '1rem', fontFamily: 'var(--font-sans)' }}
              />
              {q && <button onClick={() => { setQ(''); setResults({ posts: [], videos: [] }) }} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', cursor: 'pointer', display: 'flex' }}><X size={16}/></button>}
              {loading && <div style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>}
            </div>

            {/* Results */}
            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
              {q.length < 2 && (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                  Type to search articles and videos…
                </div>
              )}
              {q.length >= 2 && total === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                  No results found for "<strong style={{ color: 'var(--txt-2)' }}>{q}</strong>"
                </div>
              )}
              {results.posts.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--txt-3)', padding: '0.375rem 0.625rem', marginBottom: '0.375rem' }}>Articles</p>
                  {results.posts.map(p => (
                    <Link key={p.id} href={`/blog/${p.slug}`} onClick={() => { setOpen(false); setQ('') }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <FileText size={15} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--txt-1)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.excerpt}</p>
                      </div>
                      <ArrowRight size={13} color="var(--txt-3)" style={{ flexShrink: 0 }}/>
                    </Link>
                  ))}
                </div>
              )}
              {results.videos.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--txt-3)', padding: '0.375rem 0.625rem', marginBottom: '0.375rem' }}>Videos</p>
                  {results.videos.map(v => (
                    <Link key={v.id} href={`/content`} onClick={() => { setOpen(false); setQ('') }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Video size={15} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--txt-1)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.description}</p>
                      </div>
                      <ArrowRight size={13} color="var(--txt-3)" style={{ flexShrink: 0 }}/>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--txt-3)' }}>Press <kbd style={{ padding: '0.1rem 0.375rem', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.65rem' }}>Esc</kbd> to close</span>
              {total > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--txt-3)' }}>{total} result{total !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
