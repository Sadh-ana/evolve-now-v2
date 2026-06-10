import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function Search({ session, onNavigate, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults({}); return }
    const timer = setTimeout(() => doSearch(query), 200)
    return () => clearTimeout(timer)
  }, [query])

  async function doSearch(q) {
    setLoading(true)
    const uid = session.user.id
    const [{ data: tasks }, { data: habits }, { data: journal }, { data: pages }] = await Promise.all([
      supabase.from('tasks').select('id, title, status, category, priority').eq('user_id', uid).ilike('title', `%${q}%`).limit(5),
      supabase.from('habits').select('id, name, category').eq('user_id', uid).ilike('name', `%${q}%`).limit(4),
      supabase.from('journal_entries').select('id, content, date').eq('user_id', uid).ilike('content', `%${q}%`).limit(4),
      supabase.from('brainstorm_pages').select('id, title, content, project_id').eq('user_id', uid).or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(4),
    ])
    setResults({ tasks: tasks || [], habits: habits || [], journal: journal || [], pages: pages || [] })
    setLoading(false)
  }

  const total = Object.values(results).flat().length

  const catColor = { academic: '#c9a87c', physical: '#d4a5a5', mental: '#9eb5d4', creative: '#a8c4a0', spiritual: '#b8a8d4', social: '#d4b8a0', health: '#7fc4b0', general: '#8a7060' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, padding: '80px 20px 20px', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '0.5px solid var(--base-600)' }}>
          <span style={{ fontSize: '16px', color: 'var(--muted)' }}>⌕</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, habits, journal, notes..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream-200)', fontSize: '15px', fontFamily: 'var(--font-sans)', fontWeight: 300 }} />
          {loading && <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>searching...</span>}
          <button onClick={onClose} style={{ background: 'var(--base-700)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>esc</button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
          {query.length < 2 && (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--muted)' }}>start typing to search everything ✦</p>
            </div>
          )}

          {query.length >= 2 && total === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--muted)' }}>No results for "{query}"</p>
            </div>
          )}

          {results.tasks?.length > 0 && (
            <div style={{ padding: '12px 16px 8px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>Tasks</p>
              {results.tasks.map(t => (
                <div key={t.id} onClick={() => { onNavigate('tasks'); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', transition: 'background 0.15s', marginBottom: '2px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--base-700)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: catColor[t.category] || '#8a7060', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: t.status === 'done' ? 'var(--muted)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', flex: 1, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                  <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}

          {results.habits?.length > 0 && (
            <div style={{ padding: '8px 16px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>Habits</p>
              {results.habits.map(h => (
                <div key={h.id} onClick={() => { onNavigate('habits'); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s', marginBottom: '2px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--base-700)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>◎</span>
                  <span style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{h.name}</span>
                  <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '99px', background: (catColor[h.category] || '#8a7060') + '22', color: catColor[h.category] || '#8a7060', fontFamily: 'var(--font-sans)', marginLeft: 'auto' }}>{h.category}</span>
                </div>
              ))}
            </div>
          )}

          {results.journal?.length > 0 && (
            <div style={{ padding: '8px 16px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>Journal</p>
              {results.journal.map(j => (
                <div key={j.id} onClick={() => { onNavigate('journal'); onClose() }} style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s', marginBottom: '2px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--base-700)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{j.date}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)', fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.content?.slice(0, 80)}...</p>
                </div>
              ))}
            </div>
          )}

          {results.pages?.length > 0 && (
            <div style={{ padding: '8px 16px 12px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>Brainstorm notes</p>
              {results.pages.map(p => (
                <div key={p.id} onClick={() => { onNavigate('brainstorm'); onClose() }} style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s', marginBottom: '2px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--base-700)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{p.title}</span>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content?.slice(0, 60)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}