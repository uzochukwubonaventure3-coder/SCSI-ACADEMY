'use client'
import { useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Link2, Quote, Code } from 'lucide-react'

interface RichEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichEditor({ value, onChange, placeholder = 'Write your content here…', minHeight = '280px' }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Set initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, []) // eslint-disable-line

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange])

  const handleInput = useCallback(() => {
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange])

  const toolBtns = [
    { icon: <Bold size={14}/>,         cmd: 'bold',            title: 'Bold (Ctrl+B)' },
    { icon: <Italic size={14}/>,       cmd: 'italic',          title: 'Italic (Ctrl+I)' },
    { icon: <Heading2 size={14}/>,     cmd: 'formatBlock',     val: 'h2', title: 'Heading 2' },
    { icon: <Heading3 size={14}/>,     cmd: 'formatBlock',     val: 'h3', title: 'Heading 3' },
    { icon: <List size={14}/>,         cmd: 'insertUnorderedList', title: 'Bullet list' },
    { icon: <ListOrdered size={14}/>,  cmd: 'insertOrderedList',   title: 'Numbered list' },
    { icon: <Quote size={14}/>,        cmd: 'formatBlock',     val: 'blockquote', title: 'Quote' },
    { icon: <Code size={14}/>,         cmd: 'formatBlock',     val: 'pre',        title: 'Code block' },
    { icon: <Link2 size={14}/>,        cmd: 'createLink',      title: 'Insert link', prompt: 'https://' },
  ]

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-1)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.625rem 0.875rem', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
        {toolBtns.map(btn => (
          <button
            key={btn.cmd + (btn.val || '')}
            type="button"
            title={btn.title}
            onMouseDown={e => {
              e.preventDefault()
              if (btn.prompt !== undefined) {
                const url = window.prompt(btn.title, btn.prompt)
                if (url) exec(btn.cmd, url)
              } else {
                exec(btn.cmd, btn.val)
              }
            }}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--txt-2)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            {btn.icon}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--txt-3)', display: 'flex', alignItems: 'center' }}>
          Rich Text Editor
        </div>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ padding: '1.125rem', minHeight, outline: 'none', color: 'var(--txt-1)', fontSize: '0.9375rem', lineHeight: 1.8, fontFamily: 'var(--font-sans)' }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--txt-3);
          pointer-events: none;
        }
        [contenteditable] h2 { font-family: var(--font-serif); font-size: 1.375rem; font-weight: 700; margin: 1rem 0 0.5rem; color: var(--txt-1); }
        [contenteditable] h3 { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 700; margin: 0.875rem 0 0.375rem; color: var(--txt-1); }
        [contenteditable] blockquote { border-left: 3px solid var(--gold); padding-left: 1rem; margin: 1rem 0; color: var(--txt-2); font-style: italic; }
        [contenteditable] pre { background: var(--bg-3); padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.875rem; overflow-x: auto; margin: 0.875rem 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5rem; margin: 0.5rem 0; color: var(--txt-2); }
        [contenteditable] li { margin: 0.25rem 0; }
        [contenteditable] a { color: var(--gold); text-decoration: underline; }
        [contenteditable] strong { color: var(--txt-1); font-weight: 700; }
      `}</style>
    </div>
  )
}
