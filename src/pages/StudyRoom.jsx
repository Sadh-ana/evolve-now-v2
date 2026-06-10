import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { id: 'focusing', label: 'Deep focus', color: '#a8c4a0', icon: '◉' },
  { id: 'reading', label: 'Reading', color: '#9eb5d4', icon: '◆' },
  { id: 'writing', label: 'Writing', color: '#c9a87c', icon: '✦' },
  { id: 'revising', label: 'Revising', color: '#b8a8d4', icon: '◈' },
  { id: 'break', label: 'On break', color: '#8a7060', icon: '◌' },
]

const ANIMALS = ['bear', 'cat', 'fox', 'panda', 'bunny']

const ANIMAL_COLORS = {
  bear: { body: '#c9a87c', belly: '#e8d5b0', ear: '#b89060', accent: '#8a6040' },
  cat: { body: '#d4a5a5', belly: '#f0d8d8', ear: '#c08888', accent: '#906060' },
  fox: { body: '#e8a060', belly: '#f8d8b0', ear: '#c07840', accent: '#804020' },
  panda: { body: '#e8e0d8', belly: '#ffffff', ear: '#303030', accent: '#181818' },
  bunny: { body: '#b8a8d4', belly: '#ddd8f0', ear: '#9080b8', accent: '#604890' },
}

function Animal({ animal = 'bear', size = 80, isTyping = false, status = 'focusing', name = '' }) {
  const c = ANIMAL_COLORS[animal] || ANIMAL_COLORS.bear
  const statusColor = STATUS_OPTIONS.find(s => s.id === status)?.color || '#a8c4a0'
  const [blink, setBlink] = useState(false)
  const [bounce, setBounce] = useState(0)

  useEffect(() => {
    const blinkIv = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(blinkIv)
  }, [])

  useEffect(() => {
    if (isTyping) {
      const iv = setInterval(() => setBounce(b => (b + 1) % 4), 200)
      return () => clearInterval(iv)
    } else {
      setBounce(0)
    }
  }, [isTyping])

  const breatheY = Math.sin(Date.now() / 1000) * 1.5
  const bounceY = isTyping ? [0, -4, -8, -4][bounce] : 0
  const s = size
  const cx = s / 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative' }}>
        {/* Typing indicator */}
        {isTyping && (
          <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px', background: 'var(--base-700)', padding: '4px 8px', borderRadius: '99px', border: '0.5px solid var(--base-600)' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: statusColor, animation: `typingDot 0.8s ${i * 0.15}s ease-in-out infinite` }} />
            ))}
          </div>
        )}

        <svg width={s} height={s * 1.1} style={{ transform: `translateY(${bounceY}px)`, transition: isTyping ? 'none' : 'transform 0.3s ease', filter: `drop-shadow(0 4px 12px ${c.body}44)` }}>

          {/* Body */}
          <ellipse cx={cx} cy={s * 0.68} rx={s * 0.34} ry={s * 0.3} fill={c.body} />

          {/* Belly */}
          <ellipse cx={cx} cy={s * 0.72} rx={s * 0.2} ry={s * 0.2} fill={c.belly} opacity="0.8" />

          {/* Ears */}
          {animal === 'bunny' ? (
            <>
              <ellipse cx={cx - s * 0.15} cy={s * 0.18} rx={s * 0.065} ry={s * 0.16} fill={c.body} />
              <ellipse cx={cx - s * 0.15} cy={s * 0.18} rx={s * 0.035} ry={s * 0.11} fill={c.ear} opacity="0.6" />
              <ellipse cx={cx + s * 0.15} cy={s * 0.18} rx={s * 0.065} ry={s * 0.16} fill={c.body} />
              <ellipse cx={cx + s * 0.15} cy={s * 0.18} rx={s * 0.035} ry={s * 0.11} fill={c.ear} opacity="0.6" />
            </>
          ) : (
            <>
              <circle cx={cx - s * 0.2} cy={s * 0.22} r={s * 0.1} fill={c.ear} />
              <circle cx={cx - s * 0.2} cy={s * 0.22} r={s * 0.06} fill={c.body} opacity="0.5" />
              <circle cx={cx + s * 0.2} cy={s * 0.22} r={s * 0.1} fill={c.ear} />
              <circle cx={cx + s * 0.2} cy={s * 0.22} r={s * 0.06} fill={c.body} opacity="0.5" />
            </>
          )}

          {/* Head */}
          <circle cx={cx} cy={s * 0.36} r={s * 0.26} fill={c.body} />

          {/* Face — panda patches */}
          {animal === 'panda' && (
            <>
              <ellipse cx={cx - s * 0.09} cy={s * 0.34} rx={s * 0.08} ry={s * 0.07} fill={c.accent} opacity="0.9" />
              <ellipse cx={cx + s * 0.09} cy={s * 0.34} rx={s * 0.08} ry={s * 0.07} fill={c.accent} opacity="0.9" />
            </>
          )}

          {/* Eyes */}
          {blink ? (
            <>
              <line x1={cx - s * 0.1} y1={s * 0.33} x2={cx - s * 0.05} y2={s * 0.33} stroke={animal === 'panda' ? '#fff' : c.accent} strokeWidth="2" strokeLinecap="round" />
              <line x1={cx + s * 0.05} y1={s * 0.33} x2={cx + s * 0.1} y2={s * 0.33} stroke={animal === 'panda' ? '#fff' : c.accent} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={cx - s * 0.09} cy={s * 0.33} r={s * 0.04} fill={animal === 'panda' ? '#fff' : c.accent} />
              <circle cx={cx - s * 0.085} cy={s * 0.325} r={s * 0.02} fill={animal === 'panda' ? c.accent : '#1a120b'} />
              <circle cx={cx + s * 0.09} cy={s * 0.33} r={s * 0.04} fill={animal === 'panda' ? '#fff' : c.accent} />
              <circle cx={cx + s * 0.085} cy={s * 0.325} r={s * 0.02} fill={animal === 'panda' ? c.accent : '#1a120b'} />
              {/* Eye shine */}
              <circle cx={cx - s * 0.075} cy={s * 0.315} r={s * 0.008} fill="rgba(255,255,255,0.8)" />
              <circle cx={cx + s * 0.1} cy={s * 0.315} r={s * 0.008} fill="rgba(255,255,255,0.8)" />
            </>
          )}

          {/* Nose */}
          {animal === 'fox' || animal === 'cat' ? (
            <polygon points={`${cx},${s*0.395} ${cx-s*0.025},${s*0.375} ${cx+s*0.025},${s*0.375}`} fill={c.accent} />
          ) : (
            <ellipse cx={cx} cy={s * 0.385} rx={s * 0.04} ry={s * 0.028} fill={c.accent} />
          )}

          {/* Mouth — smile when focusing, neutral on break */}
          {status === 'break' ? (
            <line x1={cx - s * 0.05} y1={s * 0.415} x2={cx + s * 0.05} y2={s * 0.415} stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d={`M ${cx - s*0.05} ${s*0.41} Q ${cx} ${s*0.435} ${cx + s*0.05} ${s*0.41}`} fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* Fox whiskers */}
          {animal === 'fox' && (
            <>
              <line x1={cx - s*0.06} y1={s*0.385} x2={cx - s*0.22} y2={s*0.375} stroke={c.accent} strokeWidth="0.8" opacity="0.5" />
              <line x1={cx + s*0.06} y1={s*0.385} x2={cx + s*0.22} y2={s*0.375} stroke={c.accent} strokeWidth="0.8" opacity="0.5" />
            </>
          )}

          {/* Cat whiskers */}
          {animal === 'cat' && (
            <>
              <line x1={cx - s*0.06} y1={s*0.39} x2={cx - s*0.24} y2={s*0.38} stroke={c.accent} strokeWidth="0.8" opacity="0.4" />
              <line x1={cx - s*0.06} y1={s*0.395} x2={cx - s*0.24} y2={s*0.4} stroke={c.accent} strokeWidth="0.8" opacity="0.4" />
              <line x1={cx + s*0.06} y1={s*0.39} x2={cx + s*0.24} y2={s*0.38} stroke={c.accent} strokeWidth="0.8" opacity="0.4" />
              <line x1={cx + s*0.06} y1={s*0.395} x2={cx + s*0.24} y2={s*0.4} stroke={c.accent} strokeWidth="0.8" opacity="0.4" />
            </>
          )}

          {/* Arms */}
          <ellipse cx={cx - s*0.35} cy={s*0.72} rx={s*0.1} ry={s*0.06} fill={c.body} transform={`rotate(-20, ${cx - s*0.35}, ${s*0.72})`} />
          <ellipse cx={cx + s*0.35} cy={s*0.72} rx={s*0.1} ry={s*0.06} fill={c.body} transform={`rotate(20, ${cx + s*0.35}, ${s*0.72})`} />

          {/* Legs */}
          <ellipse cx={cx - s*0.15} cy={s*0.95} rx={s*0.1} ry={s*0.06} fill={c.ear} />
          <ellipse cx={cx + s*0.15} cy={s*0.95} rx={s*0.1} ry={s*0.06} fill={c.ear} />

          {/* Status dot */}
          <circle cx={cx + s*0.22} cy={s*0.28} r={s*0.06} fill={statusColor} />
          <circle cx={cx + s*0.22} cy={s*0.28} r={s*0.035} fill="var(--base-950)" />
        </svg>
      </div>

      {/* Name tag */}
      <div style={{ background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '99px', padding: '3px 10px', maxWidth: '100px' }}>
        <p style={{ fontSize: '10px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{name}</p>
      </div>

      {/* Subject */}
      <div style={{ fontSize: '9px', color: statusColor, fontFamily: 'var(--font-sans)', textAlign: 'center', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {STATUS_OPTIONS.find(s => s.id === status)?.label}
      </div>
    </div>
  )
}

function AnimalPicker({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {ANIMALS.map(a => {
        const c = ANIMAL_COLORS[a]
        const isSelected = selected === a
        return (
          <button key={a} onClick={() => onChange(a)} style={{ background: isSelected ? c.body + '33' : 'var(--base-700)', border: `1.5px solid ${isSelected ? c.body : 'var(--base-600)'}`, borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
            <Animal animal={a} size={40} status="focusing" name="" />
            <span style={{ fontSize: '9px', color: isSelected ? c.body : 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>{a}</span>
          </button>
        )
      })}
    </div>
  )
}

function ElapsedTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [startTime])
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const phase = m < 15 ? 'warmup' : m < 75 ? 'peak' : m < 90 ? 'cooldown' : 'rest'
  const phases = {
    warmup: { label: 'Warming up', tip: 'First 15 min: review notes, ease in. Your prefrontal cortex needs time to load.', color: '#c9a87c' },
    peak: { label: 'Peak window ✦', tip: 'You\'re in the ultradian peak. Hardest problems only. Protect this window.', color: '#a8c4a0' },
    cooldown: { label: 'Cooldown', tip: 'Summarise what you learned — this consolidates memory during the post-peak window.', color: '#9eb5d4' },
    rest: { label: 'Rest needed', tip: '15–20 min rest required. Not optional. Skipping drops next cycle output ~50%.', color: '#d4a5a5' },
  }
  const p = phases[phase]
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '56px', fontStyle: 'italic', color: p.color, lineHeight: 1, transition: 'color 1s' }}>
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '10px', color: p.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '6px', transition: 'color 1s' }}>{p.label}</div>
      <div style={{ marginTop: '10px', padding: '10px 16px', background: 'var(--base-800)', borderRadius: '10px', border: `0.5px solid ${p.color}44`, maxWidth: '300px', margin: '10px auto 0' }}>
        <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.6 }}>{p.tip}</p>
      </div>
    </div>
  )
}

export default function StudyRoom({ session }) {
  const [presence, setPresence] = useState([])
  const [username, setUsername] = useState('')
  const [myAnimal, setMyAnimal] = useState('bear')
  const [status, setStatus] = useState('focusing')
  const [subject, setSubject] = useState('')
  const [inRoom, setInRoom] = useState(false)
  const [sessionStart, setSessionStart] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [setupStep, setSetupStep] = useState('entry')
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const pingRef = useRef(null)
  const channelRef = useRef(null)
  const typingRef = useRef(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchProfile()
    fetchMessages()
    return () => { leaveRoom(); if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('username, name, avatar_animal').eq('id', session.user.id).single()
    if (data?.username) setUsername(data.username)
    else if (data?.name) {
      const base = data.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 24)
      setUsername(base)
    }
    if (data?.avatar_animal) setMyAnimal(data.avatar_animal)
  }

  async function fetchMessages() {
    const { data } = await supabase.from('study_room_messages').select('*').order('created_at', { ascending: true }).limit(100)
    setMessages(data || [])
  }

  function setupRealtime() {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const channel = supabase.channel('study-room-global', {
      config: { broadcast: { self: true }, presence: { key: session.user.id } }
    })

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== session.user.id) {
          setTypingUsers(prev => ({ ...prev, [payload.user_id]: { username: payload.username, typing: payload.typing } }))
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_room_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_room_presence' }, () => {
        fetchPresence()
      })
      .subscribe()

    channelRef.current = channel
  }

  async function fetchPresence() {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data } = await supabase.from('study_room_presence').select('*').gte('last_seen', cutoff).order('last_seen', { ascending: false })
    setPresence(data || [])
  }

  async function saveUsername() {
    const u = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24)
    if (!u) { setUsernameError('Enter a username'); return }
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', u).neq('id', session.user.id).single()
    if (existing) { setUsernameError('That username is taken'); return }
    await supabase.from('profiles').update({ username: u }).eq('id', session.user.id)
    setUsername(u)
    setUsernameError('')
    setSetupStep('animal')
  }

  async function enterRoom() {
    await supabase.from('profiles').update({ avatar_animal: myAnimal }).eq('id', session.user.id)
    await supabase.from('study_room_presence').upsert({
      user_id: session.user.id, username, status, subject: subject || null,
      avatar_animal: myAnimal, last_seen: new Date().toISOString()
    }, { onConflict: 'user_id' })
    setInRoom(true)
    setSessionStart(Date.now())
    setupRealtime()
    fetchPresence()
    pingRef.current = setInterval(async () => {
      await supabase.from('study_room_presence').update({ last_seen: new Date().toISOString(), status, subject: subject || null }).eq('user_id', session.user.id)
      fetchPresence()
    }, 20000)
  }

  async function leaveRoom() {
    clearInterval(pingRef.current)
    setInRoom(false)
    setSessionStart(null)
    if (session?.user?.id) {
      await supabase.from('study_room_presence').delete().eq('user_id', session.user.id)
    }
  }

  async function sendMessage(e) {
    e?.preventDefault()
    if (!msgInput.trim() || !inRoom) return
    const msg = msgInput.trim()
    setMsgInput('')
    broadcastTyping(false)
    await supabase.from('study_room_messages').insert({
      user_id: session.user.id, username, message: msg, avatar_animal: myAnimal
    })
  }

  function broadcastTyping(typing) {
    if (!channelRef.current) return
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: session.user.id, username, typing } })
  }

  function handleTyping(e) {
    setMsgInput(e.target.value)
    if (!isTyping && e.target.value) {
      setIsTyping(true)
      broadcastTyping(true)
    }
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => {
      setIsTyping(false)
      broadcastTyping(false)
    }, 1500)
    if (!e.target.value) { setIsTyping(false); broadcastTyping(false) }
  }

  const others = presence.filter(p => p.user_id !== session.user.id)
  const myPresenceInRoom = presence.find(p => p.user_id === session.user.id)
  const activeTypers = Object.values(typingUsers).filter(u => u.typing)

  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '9px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }

  // SETUP FLOW
  if (!inRoom) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', background: 'var(--base-950)' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px' }}>
            {ANIMALS.slice(0, 3).map((a, i) => (
              <div key={a} style={{ animation: `floatAnim ${2 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}>
                <Animal animal={a} size={60} status="focusing" name="" />
              </div>
            ))}
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '8px' }}>Study Room ✦</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto' }}>
            Focus together. The social facilitation effect is real — you work harder when others can see you're working.
          </p>
        </div>

        {/* Step 1 — username */}
        {(setupStep === 'entry' || setupStep === 'username') && (
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '28px', marginBottom: '16px' }}>
            {username && setupStep === 'entry' ? (
              <div>
                <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>You'll appear as</p>
                <p style={{ fontSize: '18px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: '16px' }}>@{username}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setSetupStep('animal')} style={{ flex: 2, padding: '11px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>Continue →</button>
                  <button onClick={() => setSetupStep('username')} style={{ flex: 1, padding: '11px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted)' }}>Change</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '10px' }}>Choose your username</p>
                <input value={newUsername || username} onChange={e => setNewUsername(e.target.value)} placeholder="sadhana_studies" style={{ ...iStyle, marginBottom: '8px' }} autoFocus onKeyDown={e => e.key === 'Enter' && saveUsername()} />
                {usernameError && <p style={{ fontSize: '11px', color: 'var(--rose-300)', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{usernameError}</p>}
                <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>lowercase, underscores ok, max 24 chars</p>
                <button onClick={saveUsername} style={{ width: '100%', padding: '11px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>Set username →</button>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — pick animal */}
        {setupStep === 'animal' && (
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '28px', marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '16px' }}>Pick your character</p>
            <AnimalPicker selected={myAnimal} onChange={setMyAnimal} />
            <button onClick={() => setSetupStep('status')} style={{ width: '100%', padding: '11px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)', marginTop: '16px' }}>Continue →</button>
          </div>
        )}

        {/* Step 3 — status + enter */}
        {setupStep === 'status' && (
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '28px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <Animal animal={myAnimal} size={80} status={status} name={username} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>Status</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s.id} onClick={() => setStatus(s.id)} style={{ padding: '6px 14px', borderRadius: '99px', border: `0.5px solid ${status === s.id ? s.color : 'var(--base-600)'}`, background: status === s.id ? s.color + '22' : 'transparent', color: status === s.id ? s.color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', transition: 'all 0.15s' }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>Working on (optional)</p>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Physics ch4, Essay draft..." style={iStyle} />
            </div>
            <button onClick={enterRoom} style={{ width: '100%', padding: '14px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', fontWeight: 400, color: 'var(--base-950)' }}>
              enter the room ✦
            </button>
          </div>
        )}

        {/* Who's in the room preview */}
        {presence.length > 0 && (
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{presence.length} {presence.length === 1 ? 'person' : 'people'} focusing right now</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {presence.slice(0, 5).map(p => (
                <Animal key={p.user_id} animal={p.avatar_animal || 'bear'} size={40} status={p.status} name={p.username} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes typingDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )

  // IN ROOM
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: '100vh', overflow: 'hidden' }}>

      {/* MAIN — characters + timer */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--base-600)', background: 'var(--base-900)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a8c4a0', boxShadow: '0 0 8px #a8c4a0', animation: 'orbPulse 2s infinite' }} />
            <span style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Study Room</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>· {presence.length} focusing</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {STATUS_OPTIONS.map(s => (
              <button key={s.id} onClick={async () => {
                setStatus(s.id)
                await supabase.from('study_room_presence').update({ status: s.id }).eq('user_id', session.user.id)
                fetchPresence()
              }} style={{ padding: '4px 12px', borderRadius: '99px', border: `0.5px solid ${status === s.id ? s.color : 'var(--base-600)'}`, background: status === s.id ? s.color + '22' : 'transparent', color: status === s.id ? s.color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', transition: 'all 0.15s' }}>
              {s.icon} {s.label}
            </button>
            ))}
            <button onClick={leaveRoom} style={{ padding: '6px 14px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted)', transition: 'all 0.2s' }}>leave</button>
          </div>
        </div>

        {/* Characters area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '32px', overflowY: 'auto' }}>
          <ElapsedTimer startTime={sessionStart} />

          {/* All characters */}
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
            {/* Me */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ animation: 'breathe 4s ease-in-out infinite' }}>
                <Animal animal={myAnimal} size={100} isTyping={isTyping} status={status} name={username} />
              </div>
              {subject && <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', maxWidth: '100px', textAlign: 'center' }}>{subject}</p>}
            </div>

            {/* Others */}
            {others.map((p, i) => {
              const isOtherTyping = typingUsers[p.user_id]?.typing
              return (
                <div key={p.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ animation: `breathe ${3.5 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.8}s` }}>
                    <Animal animal={p.avatar_animal || 'cat'} size={90} isTyping={isOtherTyping} status={p.status} name={p.username} />
                  </div>
                  {p.subject && <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', maxWidth: '100px', textAlign: 'center' }}>{p.subject}</p>}
                </div>
              )
            })}

            {/* Empty spots hint */}
            {presence.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.3 }}>
                <div style={{ width: '80px', height: '88px', borderRadius: '16px', border: '1.5px dashed var(--base-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '24px', color: 'var(--muted)' }}>?</span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>invite a friend</p>
              </div>
            )}
          </div>

          {activeTypers.length > 0 && (
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
              {activeTypers.map(t => `@${t.username}`).join(', ')} {activeTypers.length === 1 ? 'is' : 'are'} typing...
            </p>
          )}
        </div>
      </div>

      {/* RIGHT — chat */}
      <div style={{ borderLeft: '0.5px solid var(--base-600)', background: 'var(--base-900)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '0.5px solid var(--base-700)', flexShrink: 0 }}>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Room chat</p>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>no messages yet ✦<br />say hi to the room</p>
          )}
          {messages.map(msg => {
            const isMe = msg.user_id === session.user.id
            const c = ANIMAL_COLORS[msg.avatar_animal || 'bear']
            return (
              <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                {/* Mini avatar */}
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: c.body + '44', border: `1px solid ${c.body}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                  {msg.avatar_animal === 'bear' ? '🐻' : msg.avatar_animal === 'cat' ? '🐱' : msg.avatar_animal === 'fox' ? '🦊' : msg.avatar_animal === 'panda' ? '🐼' : '🐰'}
                </div>
                <div style={{ maxWidth: '75%' }}>
                  {!isMe && <p style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '3px' }}>@{msg.username}</p>}
                  <div style={{ padding: '8px 12px', borderRadius: isMe ? '12px 12px 4px 12px' : '4px 12px 12px 12px', background: isMe ? 'var(--gold-300)' : 'var(--base-800)', border: isMe ? 'none' : '0.5px solid var(--base-600)' }}>
                    <p style={{ fontSize: '13px', color: isMe ? 'var(--base-950)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{msg.message}</p>
                  </div>
                  <p style={{ fontSize: '8px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '2px', textAlign: isMe ? 'right' : 'left' }}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px', borderTop: '0.5px solid var(--base-700)', flexShrink: 0 }}>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              value={msgInput}
              onChange={handleTyping}
              placeholder="say something..."
              style={{ flex: 1, background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '9px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
            />
            <button type="submit" disabled={!msgInput.trim()} style={{ padding: '9px 16px', background: msgInput.trim() ? 'var(--gold-300)' : 'var(--base-700)', border: 'none', borderRadius: '10px', cursor: msgInput.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-sans)', fontSize: '13px', color: msgInput.trim() ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.2s' }}>↗</button>
          </form>
          <p style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '6px', textAlign: 'center' }}>
            ✦ social facilitation — you focus harder when others see you
          </p>
        </div>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scaleY(1) translateY(0); }
          50% { transform: scaleY(1.02) translateY(-3px); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes typingDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}