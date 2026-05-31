import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'

const HOBBY_CATS = [
  { id: 'physical', label: 'Physical', color: '#d4a5a5' },
  { id: 'creative', label: 'Creative', color: '#a8c4a0' },
  { id: 'intellectual', label: 'Intellectual', color: '#9eb5d4' },
  { id: 'cozy', label: 'Cozy', color: '#d4b8a0' },
  { id: 'social', label: 'Social', color: '#c9a87c' },
  { id: 'digital', label: 'Digital', color: '#b8a8d4' },
  { id: 'music', label: 'Music', color: '#7fc4b0' },
  { id: 'other', label: 'Other', color: '#8a7060' },
]

async function askAI(messages, hobbyName) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        system: `You are EVOLVE's Side Quest AI — a warm, knowledgeable companion for someone exploring ${hobbyName}. You're like a passionate friend who genuinely knows this hobby well. Your goal:
- Help them get started or go deeper with ${hobbyName}
- Suggest specific next steps, resources, techniques
- Keep motivation alive with genuine enthusiasm
- Answer questions with real expertise, not generic advice
- Connect the hobby to their broader growth

Keep responses concise (2-4 sentences). Always be specific, never generic. End with a concrete suggestion or question. Treat them as an intelligent person who wants to actually DO things.`
      })
    })
    const data = await res.json()
    return data.text || 'Couldn\'t connect. Check your API setup!'
  } catch {
    return 'AI connection failed. Make sure your API key is set up in Vercel environment variables.'
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
  const endRef = useRef(null)

  useEffect(() => { fetchHobbies() }, [])
  useEffect(() => { if (activeHobby) fetchMessages(activeHobby.id) }, [activeHobby])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function fetchHobbies() {
    const { data } = await supabase.from('hobbies').select('*').eq('user_id', session.user.id).order('created_at')
    setHobbies(data || [])
  }

  async function fetchMessages(hobbyId) {
    const { data } = await supabase.from('side_quest_messages').select('*').eq('hobby_id', hobbyId).eq('user_id', session.user.id).order('created_at').limit(50)
    const msgs = data || []
    setMessages(msgs)
    if (msgs.length === 0) {
      const hobby = hobbies.find(h => h.id === hobbyId)
      if (!hobby) return
      setLoading(true)
      const reply = await askAI([{ role: 'user', content: `I want to explore ${hobby.name}. This is our first conversation — introduce yourself and help me get started.` }], hobby.name)
      const { data: saved } = await supabase.from('side_quest_messages').insert({ user_id: session.user.id, hobby_id: hobbyId, role: 'assistant', content: reply }).select().single()
      if (saved) setMessages([saved])
      setLoading(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !activeHobby || loading) return
    const txt = input.trim(); setInput(''); setLoading(true)
    const { data: uMsg } = await supabase.from('side_quest_messages').insert({ user_id: session.user.id, hobby_id: activeHobby.id, role: 'user', content: txt }).select().single()
    if (uMsg) setMessages(p => [...p, uMsg])
    const history = [...messages, { role: 'user', content: txt }].map(m => ({ role: m.role, content: m.content }))
    const reply = await askAI(history, activeHobby.name)
    const { data: aMsg } = await supabase.from('side_quest_messages').insert({ user_id: session.user.id, hobby_id: activeHobby.id, role: 'assistant', content: reply }).select().single()
    if (aMsg) setMessages(p => [...p, aMsg])
    await supabase.from('hobbies').update({ last_engaged: format(new Date(), 'yyyy-MM-dd') }).eq('id', activeHobby.id)
    setHobbies(p => p.map(h => h.id === activeHobby.id ? { ...h, last_engaged: format(new Date(), 'yyyy-MM-dd') } : h))
    setLoading(false)
  }

  async function addHobby(e) {
    e.preventDefault()
    const { data } = await supabase.from('hobbies').insert({ user_id: session.user.id, ...newHobby }).select().single()
    if (data) { setHobbies(p => [...p, data]); setActiveHobby(data); setMessages([]) }
    setNewHobby({ name: '', category: 'other' }); setShowAdd(false)
  }

  const getCat = id => HOBBY_CATS.find(c => c.id === id) || HOBBY_CATS[7]
  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', height: '100vh', overflow: 'hidden' }}>
      <div style={{ background: 'var(--base-900)', borderRight: '0.5px solid var(--base-600)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 16px 16px', borderBottom: '0.5px solid var(--base-700)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '2px' }}>Hobbies</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>your side quests + AI guide ✦</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {hobbies.map(hobby => {
            const cat = getCat(hobby.category)
            const daysSince = hobby.last_engaged ? differenceInDays(new Date(), parseISO(hobby.last_engaged)) : null
            const isActive = activeHobby?.id === hobby.id
            return (
              <div key={hobby.id} onClick={() => setActiveHobby(hobby)} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: isActive ? 'var(--base-700)' : 'transparent', marginBottom: '2px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0, marginTop: '4px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: isActive ? 'var(--cream-200)' : 'var(--cream-300)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hobby.name}</p>
                  {daysSince !== null && <p style={{ fontSize: '10px', color: daysSince > 7 ? '#d4a5a5' : 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{daysSince === 0 ? 'today' : `${daysSince}d ago`}{daysSince > 7 ? ' · reconnect?' : ''}</p>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '12px' }}>
          <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '9px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>+ Add hobby</button>
        </div>
      </div>

      {activeHobby ? (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--base-600)', background: 'var(--base-900)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--cream-200)', fontWeight: 400 }}>{activeHobby.name}</h3>
            <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Side Quest AI — your personal guide</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '72%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'var(--gold-300)' : 'var(--base-800)', border: msg.role === 'assistant' ? '0.5px solid var(--base-600)' : 'none' }}>
                  <p style={{ fontSize: '13px', color: msg.role === 'user' ? 'var(--base-950)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', lineHeight: 1.65, fontWeight: 300 }}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>thinking...</p>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={sendMessage} style={{ padding: '16px 24px', borderTop: '0.5px solid var(--base-600)', background: 'var(--base-900)', display: 'flex', gap: '10px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask about ${activeHobby.name}...`} style={{ flex: 1, background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 16px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }} />
            <button type="submit" disabled={loading || !input.trim()} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)', opacity: loading || !input.trim() ? 0.5 : 1 }}>Send</button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>your side quests await ✦</p>
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Select a hobby to chat with your AI guide.</p>
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Hobby</h3>
            <form onSubmit={addHobby} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Hobby name</label><input value={newHobby.name} onChange={e => setNewHobby(p => ({ ...p, name: e.target.value }))} placeholder="Chess, Drawing, Running..." required autoFocus style={iStyle} /></div>
              <div><label style={lStyle}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {HOBBY_CATS.map(c => <button key={c.id} type="button" onClick={() => setNewHobby(p => ({ ...p, category: c.id }))} style={{ padding: '5px 12px', borderRadius: '6px', border: `0.5px solid ${newHobby.category === c.id ? c.color : 'var(--base-600)'}`, background: newHobby.category === c.id ? c.color + '22' : 'transparent', color: newHobby.category === c.id ? c.color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px' }}>{c.label}</button>)}
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