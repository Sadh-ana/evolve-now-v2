import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format, differenceInDays, parseISO } from 'date-fns'

const HOBBY_CATS = [
  { id: 'physical', label: 'Physical', color: '#d4a5a5', icon: '↑' },
  { id: 'creative', label: 'Creative', color: '#a8c4a0', icon: '♡' },
  { id: 'intellectual', label: 'Intellectual', color: '#9eb5d4', icon: '✦' },
  { id: 'cozy', label: 'Cozy', color: '#d4b8a0', icon: '◎' },
  { id: 'social', label: 'Social', color: '#c9a87c', icon: '◈' },
  { id: 'music', label: 'Music', color: '#7fc4b0', icon: '◷' },
  { id: 'digital', label: 'Digital', color: '#b8a8d4', icon: '◆' },
  { id: 'other', label: 'Other', color: '#8a7060', icon: '—' },
]

const SUGGESTED = [
  { name: 'Chess', category: 'intellectual' },
  { name: 'Guitar', category: 'music' },
  { name: 'Running', category: 'physical' },
  { name: 'Drawing', category: 'creative' },
  { name: 'Journaling', category: 'cozy' },
  { name: 'Photography', category: 'creative' },
  { name: 'Coding side project', category: 'digital' },
  { name: 'Yoga', category: 'physical' },
  { name: 'Reading', category: 'cozy' },
  { name: 'Language learning', category: 'intellectual' },
]

async function askAI(messages, hobbyName) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are EVOLVE's Side Quest AI — a brilliant, passionate companion for someone exploring ${hobbyName}. You're like a knowledgeable friend who genuinely loves this hobby. Be specific, not generic. Give real actionable advice. Keep responses to 2-4 sentences max. Always end with either a concrete next step or an interesting question. Be warm but direct.`,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    })
    const data = await res.json()
    return data.content?.[0]?.text || 'Something went wrong — try again.'
  } catch {
    return 'Connection failed. Check your network and try again.'
  }
}

export default function Hobbies({ session }) {
  const [hobbies, setHobbies] = useState([])
  const [activeHobby, setActiveHobby] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newHobby, setNewHobby] = useState({ name: '', category: 'other' })
  const [view, setView] = useState('quests') // 'quests' | 'chat'
  const endRef = useRef(null)

  useEffect(() => { fetchHobbies() }, [])
  useEffect(() => {
    if (activeHobby) fetchMessages(activeHobby.id)
  }, [activeHobby])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchHobbies() {
    const { data } = await supabase.from('hobbies').select('*')
      .eq('user_id', session.user.id).order('created_at')
    setHobbies(data || [])
  }

  async function fetchMessages(hobbyId) {
    const { data } = await supabase.from('side_quest_messages').select('*')
      .eq('hobby_id', hobbyId).eq('user_id', session.user.id)
      .order('created_at').limit(50)
    const msgs = data || []
    setMessages(msgs)

    if (msgs.length === 0) {
      const hobby = hobbies.find(h => h.id === hobbyId)
      if (!hobby) return
      setLoading(true)
      const reply = await askAI([{
        role: 'user',
        content: `I'm starting to explore ${hobby.name}. This is our first conversation — give me a genuinely exciting intro and help me figure out my first real step.`
      }], hobby.name)
      const { data: saved } = await supabase.from('side_quest_messages').insert({
        user_id: session.user.id, hobby_id: hobbyId, role: 'assistant', content: reply
      }).select().single()
      if (saved) setMessages([saved])
      setLoading(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !activeHobby || loading) return
    const txt = input.trim()
    setInput('')
    setLoading(true)

    const { data: uMsg } = await supabase.from('side_quest_messages').insert({
      user_id: session.user.id, hobby_id: activeHobby.id, role: 'user', content: txt
    }).select().single()
    if (uMsg) setMessages(p => [...p, uMsg])

    const history = [...messages, { role: 'user', content: txt }]
    const reply = await askAI(history, activeHobby.name)

    const { data: aMsg } = await supabase.from('side_quest_messages').insert({
      user_id: session.user.id, hobby_id: activeHobby.id, role: 'assistant', content: reply
    }).select().single()
    if (aMsg) setMessages(p => [...p, aMsg])

    await supabase.from('hobbies').update({ last_engaged: format(new Date(), 'yyyy-MM-dd') }).eq('id', activeHobby.id)
    setHobbies(p => p.map(h => h.id === activeHobby.id ? { ...h, last_engaged: format(new Date(), 'yyyy-MM-dd') } : h))
    setLoading(false)
  }

  async function addHobby(e) {
    e.preventDefault()
    if (!newHobby.name.trim()) return
    const { data } = await supabase.from('hobbies').insert({
      user_id: session.user.id, ...newHobby
    }).select().single()
    if (data) {
      setHobbies(p => [...p, data])
      setActiveHobby(data)
      setMessages([])
      setView('chat')
    }
    setNewHobby({ name: '', category: 'other' })
    setShowAdd(false)
  }

  async function quickAdd(suggested) {
    const { data } = await supabase.from('hobbies').insert({
      user_id: session.user.id, name: suggested.name, category: suggested.category
    }).select().single()
    if (data) {
      setHobbies(p => [...p, data])
      setActiveHobby(data)
      setMessages([])
      setView('chat')
    }
  }

  const getCat = id => HOBBY_CATS.find(c => c.id === id) || HOBBY_CATS[7]
  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* LEFT SIDEBAR */}
      <div style={{ width: '260px', minWidth: '260px', background: 'var(--base-900)', borderRight: '0.5px solid var(--base-600)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 16px 16px', borderBottom: '0.5px solid var(--base-700)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '2px' }}>Side Quests</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>hobbies + AI guide ✦</p>
        </div>

        {/* View toggle */}
        <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--base-700)', display: 'flex', gap: '4px' }}>
          {[{ id: 'quests', label: 'Quests' }, { id: 'chat', label: 'AI Chat' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '11px',
              background: view === v.id ? 'var(--gold-300)' : 'transparent',
              color: view === v.id ? 'var(--base-950)' : 'var(--muted)',
              transition: 'all 0.15s'
            }}>{v.label}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {hobbies.length === 0 && (
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', padding: '12px 8px' }}>No side quests yet. Add one below ✦</p>
          )}
          {hobbies.map(hobby => {
            const cat = getCat(hobby.category)
            const daysSince = hobby.last_engaged
              ? differenceInDays(new Date(), parseISO(hobby.last_engaged)) : null
            const isActive = activeHobby?.id === hobby.id
            return (
              <div key={hobby.id} onClick={() => { setActiveHobby(hobby); setView('chat') }} style={{
                padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                background: isActive ? 'var(--base-700)' : 'transparent',
                marginBottom: '2px', display: 'flex', gap: '10px', alignItems: 'flex-start',
                borderLeft: isActive ? `2px solid ${cat.color}` : '2px solid transparent',
                transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: isActive ? 'var(--cream-200)' : 'var(--cream-300)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 500 : 400 }}>{hobby.name}</p>
                  <p style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', color: daysSince !== null && daysSince > 7 ? '#d4a5a5' : 'var(--muted)' }}>
                    {daysSince === null ? 'never engaged' : daysSince === 0 ? 'active today' : `${daysSince}d ago`}
                    {daysSince !== null && daysSince > 7 ? ' · reconnect?' : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '12px', borderTop: '0.5px solid var(--base-700)' }}>
          <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '9px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>+ New side quest</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* QUESTS VIEW */}
        {view === 'quests' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Your Side Quests</h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Every interest deserves a home. Click any quest to chat with your AI guide.</p>
            </div>

            {hobbies.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', marginBottom: '32px' }}>
                {hobbies.map(hobby => {
                  const cat = getCat(hobby.category)
                  const daysSince = hobby.last_engaged ? differenceInDays(new Date(), parseISO(hobby.last_engaged)) : null
                  const isStale = daysSince !== null && daysSince > 7
                  return (
                    <div key={hobby.id} onClick={() => { setActiveHobby(hobby); setView('chat') }} style={{
                      background: 'var(--base-800)',
                      border: `0.5px solid ${cat.color}44`,
                      borderLeft: `3px solid ${cat.color}`,
                      borderRadius: '14px', padding: '1.25rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                      position: 'relative', overflow: 'hidden'
                    }}>
                      {isStale && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '6px', height: '6px', borderRadius: '50%', background: '#d4a5a5' }} />
                      )}
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{cat.icon}</div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px', fontWeight: 400 }}>{hobby.name}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '99px', background: cat.color + '22', color: cat.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>{cat.label}</span>
                        <span style={{ fontSize: '10px', color: isStale ? '#d4a5a5' : 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                          {daysSince === null ? 'not started' : daysSince === 0 ? 'active today ✦' : `${daysSince}d ago`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* SUGGESTED */}
            <div>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>Suggested quests</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTED.filter(s => !hobbies.some(h => h.name.toLowerCase() === s.name.toLowerCase())).map(s => {
                  const cat = getCat(s.category)
                  return (
                    <button key={s.name} onClick={() => quickAdd(s)} style={{
                      padding: '8px 16px', borderRadius: '99px',
                      border: `0.5px solid ${cat.color}66`,
                      background: cat.color + '11',
                      color: cat.color, cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', fontSize: '12px',
                      transition: 'all 0.2s'
                    }}>+ {s.name}</button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && (
          <>
            {activeHobby ? (
              <>
                <div style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--base-600)', background: 'var(--base-900)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{getCat(activeHobby.category).icon}</span>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--cream-200)', fontWeight: 400 }}>{activeHobby.name}</h3>
                      <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>AI guide — powered by Claude ✦</p>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.role === 'assistant' && (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gold-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontWeight: 600, flexShrink: 0, marginRight: '8px', marginTop: '2px' }}>✦</div>
                      )}
                      <div style={{
                        maxWidth: '68%', padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                        background: msg.role === 'user' ? 'var(--gold-300)' : 'var(--base-800)',
                        border: msg.role === 'assistant' ? '0.5px solid var(--base-600)' : 'none'
                      }}>
                        <p style={{ fontSize: '13px', color: msg.role === 'user' ? 'var(--base-950)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', lineHeight: 1.7, fontWeight: 300 }}>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gold-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--base-950)', fontWeight: 600 }}>✦</div>
                      <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)' }}>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>thinking...</p>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                <form onSubmit={sendMessage} style={{ padding: '16px 24px', borderTop: '0.5px solid var(--base-600)', background: 'var(--base-900)', display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    placeholder={`Ask about ${activeHobby.name}...`}
                    style={{ flex: 1, background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 16px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }} />
                  <button type="submit" disabled={loading || !input.trim()} style={{
                    padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                    color: 'var(--base-950)', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'opacity 0.2s'
                  }}>Send ↗</button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>choose a side quest ✦</p>
                  <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Select one from the sidebar to start chatting with your AI guide.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Side Quest</h3>
            <form onSubmit={addHobby} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Name</label><input value={newHobby.name} onChange={e => setNewHobby(p => ({ ...p, name: e.target.value }))} placeholder="Chess, Guitar, Running..." required autoFocus style={iStyle} /></div>
              <div><label style={lStyle}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {HOBBY_CATS.map(c => (
                    <button key={c.id} type="button" onClick={() => setNewHobby(p => ({ ...p, category: c.id }))} style={{
                      padding: '5px 12px', borderRadius: '6px',
                      border: `0.5px solid ${newHobby.category === c.id ? c.color : 'var(--base-600)'}`,
                      background: newHobby.category === c.id ? c.color + '22' : 'transparent',
                      color: newHobby.category === c.id ? c.color : 'var(--muted)',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px'
                    }}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}