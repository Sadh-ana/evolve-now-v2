import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays } from 'date-fns'

async function askCoach(messages, systemPrompt) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('Coach API error:', err)
      return 'Connection issue — check your Anthropic API key is set in your .env file as VITE_ANTHROPIC_KEY.'
    }
    const data = await res.json()
    return data.content?.[0]?.text || 'No response.'
  } catch (e) {
    console.error('Coach fetch error:', e)
    return 'Network error. Make sure you\'re running the app and your API key is configured.'
  }
}

export default function LifeCoach({ session }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [context, setContext] = useState('')
  const [initialized, setInitialized] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { init() }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function init() {
    const uid = session.user.id
    const start7 = format(subDays(new Date(), 7), 'yyyy-MM-dd')

    const [{ data: prof }, { data: tasks }, { data: habits }, { data: focusSessions }, { data: checkins }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('name, archetype, health_flags, peak_time, work_style, board').eq('id', uid).single(),
      supabase.from('tasks').select('title, status, priority').eq('user_id', uid).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(20),
      supabase.from('habits').select('name, category').eq('user_id', uid),
      supabase.from('focus_sessions').select('duration_minutes, emotion, subject, date').eq('user_id', uid).gte('date', start7),
      supabase.from('checkins').select('mood, energy, date').eq('user_id', uid).order('date', { ascending: false }).limit(7),
      supabase.from('life_coach_messages').select('*').eq('user_id', uid).order('created_at').limit(60),
    ])

    setProfile(prof)

    const totalFocus = (focusSessions || []).reduce((s, f) => s + (f.duration_minutes || 0), 0)
    const avgMood = (checkins || []).length
      ? ((checkins || []).reduce((s, c) => s + c.mood, 0) / checkins.length).toFixed(1)
      : 'unknown'
    const doneTasks = (tasks || []).filter(t => t.status === 'done').length
    const emotions = [...new Set((focusSessions || []).map(f => f.emotion).filter(Boolean))]

    const ctx = `User: ${prof?.name || 'Unknown'}
Board/curriculum: ${prof?.board || 'unknown'}
Archetype: ${prof?.archetype || 'unknown'}
Health context: ${(prof?.health_flags || []).join(', ') || 'none specified'}
Peak focus time: ${prof?.peak_time || 'unknown'}
Work style: ${prof?.work_style || 'unknown'}

Last 7 days data:
- Focus sessions: ${Math.round(totalFocus / 60 * 10) / 10}h total
- Tasks completed: ${doneTasks}
- Average mood: ${avgMood}/5
- Session emotions logged: ${emotions.join(', ') || 'not tracked'}
- Active habits: ${(habits || []).map(h => h.name).join(', ') || 'none'}

Today: ${format(new Date(), 'EEEE, MMMM d yyyy')}`

    setContext(ctx)

    if (msgs?.length) {
      setMessages(msgs)
      setInitialized(true)
    } else {
      setLoading(true)
      const systemPrompt = buildSystem(ctx)
      const reply = await askCoach([{ role: 'user', content: 'Hello' }], systemPrompt)
      const { data: saved } = await supabase.from('life_coach_messages')
        .insert({ user_id: uid, role: 'assistant', content: reply })
        .select().single()
      if (saved) setMessages([saved])
      setLoading(false)
      setInitialized(true)
    }
  }

  function buildSystem(ctx) {
    return `You are EVOLVE's Life Coach — a warm, evidence-based AI coach who combines cognitive science, behavioural psychology, and genuine human empathy. You have full context on this person's real life data.

${ctx}

Your approach:
- Be honest, sometimes uncomfortably so — but always kind and specific to THIS person
- Notice patterns they haven't seen: cross-reference their mood, focus, and habit data
- Ground every insight in evidence: ultradian rhythms, habit loops, SDT, spaced repetition, cognitive load
- Never give generic motivational fluff — if it could apply to anyone, rewrite it
- Ask one powerful question per response, not a list
- Keep responses to 3-5 sentences unless they explicitly ask for more
- You understand their archetype deeply and adapt your approach to it:
  - procrastinator: activation energy reduction, 2-minute rule
  - perfectionist: good enough frameworks, time-boxing
  - grinder: recovery science, diminishing returns
  - burnout-prone: periodisation, sustainable pacing
  - adhd: implementation intentions, environment design
- If they seem distressed, acknowledge briefly then offer one concrete next action`
  }

  async function send(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const txt = input.trim()
    setInput('')
    setLoading(true)

    const { data: uMsg } = await supabase.from('life_coach_messages')
      .insert({ user_id: session.user.id, role: 'user', content: txt })
      .select().single()
    if (uMsg) setMessages(p => [...p, uMsg])

    const history = [...messages, { role: 'user', content: txt }]
    const reply = await askCoach(history, buildSystem(context))

    const { data: aMsg } = await supabase.from('life_coach_messages')
      .insert({ user_id: session.user.id, role: 'assistant', content: reply })
      .select().single()
    if (aMsg) setMessages(p => [...p, aMsg])
    setLoading(false)
  }

  async function clearHistory() {
    await supabase.from('life_coach_messages').delete().eq('user_id', session.user.id)
    setMessages([])
    setInitialized(false)
    init()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '18px 28px', borderBottom: '0.5px solid var(--base-600)', background: 'var(--base-900)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--cream-200)', fontWeight: 400 }}>Life Coach</h2>
          <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>reads your actual data, not just your words ✦</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {profile && (
            <div style={{ padding: '6px 12px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '8px' }}>
              <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                coaching <span style={{ color: 'var(--gold-300)' }}>{profile.name}</span>
                {profile.archetype && <span> · <span style={{ textTransform: 'capitalize' }}>{profile.archetype.replace(/-/g, ' ')}</span></span>}
              </p>
            </div>
          )}
          <button onClick={clearHistory} style={{ background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)' }}>new session</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-300), var(--rose-300))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--base-950)', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>✦</div>
            )}
            <div style={{ maxWidth: '65%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? 'var(--gold-300)' : 'var(--base-800)', border: msg.role === 'assistant' ? '0.5px solid var(--base-600)' : 'none' }}>
              <p style={{ fontSize: '14px', color: msg.role === 'user' ? 'var(--base-950)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', lineHeight: 1.7, fontWeight: 300 }}>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-300), var(--rose-300))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--base-950)', fontWeight: 700, flexShrink: 0 }}>✦</div>
            <div style={{ padding: '14px 18px', borderRadius: '4px 18px 18px 18px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>thinking...</p>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} style={{ padding: '16px 28px', borderTop: '0.5px solid var(--base-600)', background: 'var(--base-900)', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder={initialized ? 'Talk to your coach...' : 'Loading your data...'}
          disabled={!initialized}
          style={{ flex: 1, background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '12px 18px', color: 'var(--cream-200)', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', opacity: initialized ? 1 : 0.5 }}
        />
        <button type="submit" disabled={loading || !input.trim() || !initialized} style={{ padding: '12px 24px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'all 0.2s' }}>Send</button>
      </form>
    </div>
  )
}