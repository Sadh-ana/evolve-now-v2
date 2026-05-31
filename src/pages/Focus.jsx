import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const EMOTIONS = [
  { id: 'flowing', label: 'Flowing', color: '#a8c4a0', desc: 'In the zone — clear and easy', protocol: 'Extend or tackle your next hardest task immediately. You\'re primed.' },
  { id: 'grinding', label: 'Grinding', color: '#c9a87c', desc: 'Hard work, steady progress', protocol: '10 min rest then continue. Grinding is sustainable with recovery built in.' },
  { id: 'stuck', label: 'Stuck', color: '#9eb5d4', desc: 'Not moving, ideas not coming', protocol: 'Change method. Teach the concept back to yourself aloud — even to a wall.' },
  { id: 'anxious', label: 'Anxious', color: '#d4a5a5', desc: 'Uncertain energy, knows it\'s possible', protocol: 'End on one solved problem — even tiny. Never let the session end on failure.' },
  { id: 'drained', label: 'Drained', color: '#b8a8d4', desc: 'Running on empty', protocol: 'Mandatory rest. Eat, move, hydrate. No more sessions for 45 minutes minimum.' },
  { id: 'hollow', label: 'Hollow', color: '#8a7060', desc: 'Did the work but nothing stuck', protocol: 'Close your notes and write what you remember. Even 40% confirms real encoding.' },
  { id: 'disconnected', label: 'Disconnected', color: '#7fc4b0', desc: 'Topic feels pointless, too far', protocol: 'Find a real-world anchor. Where does this concept exist in your actual life?' },
  { id: 'numb', label: 'Numb', color: '#d4b8a0', desc: 'Overloaded, brain full, not processing', protocol: 'Teach-back method: explain one concept out loud to an imaginary person right now.' },
]

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Biology', 'English', 'History', 'Economics', 'General Study', 'Creative Work', 'Physical Training', 'Other']

export default function Focus({ session }) {
  const [phase, setPhase] = useState('setup')
  const [timerMode, setTimerMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25)
  const [subject, setSubject] = useState('General Study')
  const [sessionPhase, setSessionPhase] = useState('warmup')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionNote, setSessionNote] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [sessions, setSessions] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => { fetchSessions(); return () => clearInterval(intervalRef.current) }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); setIsRunning(false); setPhase('emotion'); return 0 }
          const total = duration * 60
          const elapsed = total - prev + 1
          if (elapsed < total * 0.15) setSessionPhase('warmup')
          else if (elapsed < total * 0.85) setSessionPhase('peak')
          else setSessionPhase('cooldown')
          return prev - 1
        })
      }, 1000)
    } else clearInterval(intervalRef.current)
    return () => clearInterval(intervalRef.current)
  }, [isRunning, duration])

  async function fetchSessions() {
    const { data } = await supabase.from('focus_sessions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10)
    setSessions(data || [])
  }

  function startSession() {
    setTimeLeft(duration * 60)
    setIsRunning(true)
    setPhase('active')
    setSessionPhase('warmup')
  }

  async function saveSession() {
    if (!selectedEmotion) return
    const elapsed = Math.max(Math.round((duration * 60 - timeLeft) / 60), 1)
    const { data } = await supabase.from('focus_sessions').insert({ user_id: session.user.id, duration_minutes: elapsed, task_label: subject, date: format(new Date(), 'yyyy-MM-dd'), emotion: selectedEmotion, notes: sessionNote, subject }).select().single()
    if (data) setSessions(p => [data, ...p].slice(0, 10))
    setPhase('done')
  }

  function reset() {
    setPhase('setup'); setTimeLeft(duration * 60); setIsRunning(false)
    setSelectedEmotion(null); setSessionNote(''); setSessionPhase('warmup')
  }

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const pct = () => Math.round(((duration * 60 - timeLeft) / (duration * 60)) * 100)
  const phaseColors = { warmup: '#d4b896', peak: '#c9a87c', cooldown: '#d4a5a5' }
  const phaseLabels = { warmup: '◌ warming up', peak: '● peak focus', cooldown: '◎ winding down' }
  const todaySessions = sessions.filter(s => s.date === format(new Date(), 'yyyy-MM-dd'))
  const todayMins = todaySessions.reduce((s, x) => s + (x.duration_minutes || 0), 0)

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Focus</h2>
        <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
          {todayMins > 0 ? `${todayMins} min focused today ✦` : 'start your first session'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        <div>
          {phase === 'setup' && (
            <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '20px' }}>Setup your session</p>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>Timer mode</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[{ id: 'pomodoro', label: 'Pomodoro', mins: 25 }, { id: 'deep', label: 'Deep work', mins: 90 }, { id: 'custom', label: 'Custom', mins: null }].map(m => (
                    <button key={m.id} onClick={() => { setTimerMode(m.id); if (m.mins) { setDuration(m.mins); setTimeLeft(m.mins * 60) } }} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--base-600)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', background: timerMode === m.id ? 'var(--gold-300)' : 'var(--base-700)', color: timerMode === m.id ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s' }}>
                      {m.label}{m.mins ? ` (${m.mins}m)` : ''}
                    </button>
                  ))}
                </div>
                {timerMode === 'custom' && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="number" value={duration} onChange={e => { const v = Math.max(5, Math.min(180, parseInt(e.target.value) || 25)); setDuration(v); setTimeLeft(v * 60) }} min={5} max={180} style={{ background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '8px 14px', color: 'var(--cream-200)', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', width: '100px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>minutes</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>Working on</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SUBJECTS.map(s => (
                    <button key={s} onClick={() => setSubject(s)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--base-600)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: subject === s ? 'var(--base-600)' : 'transparent', color: subject === s ? 'var(--cream-200)' : 'var(--muted)', transition: 'all 0.15s' }}>{s}</button>
                  ))}
                </div>
              </div>

              <button onClick={startSession} style={{ width: '100%', padding: '16px', background: 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', fontWeight: 400, color: 'var(--base-950)' }}>
                begin ✦
              </button>
            </div>
          )}

          {phase === 'active' && (
            <div style={{ background: 'var(--base-900)', border: `1px solid ${phaseColors[sessionPhase]}33`, borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', transition: 'border-color 0.5s' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: phaseColors[sessionPhase], fontFamily: 'var(--font-sans)', marginBottom: '28px', transition: 'color 0.5s' }}>
                {phaseLabels[sessionPhase]}
              </p>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="110" cy="110" r="96" fill="none" stroke="var(--base-700)" strokeWidth="3" />
                  <circle cx="110" cy="110" r="96" fill="none" stroke={phaseColors[sessionPhase]} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 96}`}
                    strokeDashoffset={`${2 * Math.PI * 96 * (1 - pct() / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '52px', fontWeight: 400, color: 'var(--cream-200)', lineHeight: 1 }}>{fmt(timeLeft)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '6px' }}>{subject}</div>
                </div>
              </div>
              <div style={{ background: 'var(--base-800)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', marginBottom: '20px' }}>
                {sessionPhase === 'warmup' && <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>Warm-up: review last session or copy key formulas. Let your brain ease in.</p>}
                {sessionPhase === 'peak' && <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>Peak window: this is your deep work time. Protect it completely.</p>}
                {sessionPhase === 'cooldown' && <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>Cool-down: summarise what you learned. This consolidates memory.</p>}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => setIsRunning(p => !p)} style={{ padding: '12px 28px', background: 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>
                  {isRunning ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => { clearInterval(intervalRef.current); setIsRunning(false); setPhase('emotion') }} style={{ padding: '12px 20px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--muted)' }}>
                  End early
                </button>
              </div>
            </div>
          )}

          {phase === 'emotion' && (
            <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '6px', fontWeight: 400 }}>Session done ✦</h3>
              <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '20px' }}>How did that actually feel? This becomes your pattern data.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
                {EMOTIONS.map(e => (
                  <button key={e.id} onClick={() => setSelectedEmotion(e.id)} style={{ padding: '10px 8px', borderRadius: 'var(--radius-md)', border: `1px solid ${selectedEmotion === e.id ? e.color : 'var(--base-600)'}`, background: selectedEmotion === e.id ? e.color + '22' : 'var(--base-700)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: selectedEmotion === e.id ? e.color : 'var(--cream-200)', fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>{e.label}</p>
                    <p style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>{e.desc}</p>
                  </button>
                ))}
              </div>
              {selectedEmotion && (
                <div style={{ background: 'var(--base-700)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '16px', borderLeft: `3px solid ${EMOTIONS.find(e => e.id === selectedEmotion)?.color}` }}>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>Protocol for right now</p>
                  <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>{EMOTIONS.find(e => e.id === selectedEmotion)?.protocol}</p>
                </div>
              )}
              <textarea value={sessionNote} onChange={e => setSessionNote(e.target.value)} placeholder="What happened? What clicked or didn't? (optional)" rows={2} style={{ width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', resize: 'vertical', marginBottom: '14px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={reset} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Skip</button>
                <button onClick={saveSession} disabled={!selectedEmotion} style={{ flex: 2, padding: '11px', borderRadius: 'var(--radius-md)', border: 'none', background: selectedEmotion ? 'var(--gold-300)' : 'var(--base-700)', color: selectedEmotion ? 'var(--base-950)' : 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: selectedEmotion ? 'pointer' : 'default', transition: 'all 0.2s' }}>Save session ✦</button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--gold-300)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', fontStyle: 'italic', fontWeight: 400, color: 'var(--gold-300)', marginBottom: '8px' }}>well done ✦</h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '24px' }}>Session logged. Your patterns are being tracked.</p>
              <button onClick={reset} style={{ padding: '12px 28px', background: 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>New session</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '14px' }}>Recent sessions</p>
            {sessions.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>no sessions yet</p> : sessions.map(s => {
              const em = EMOTIONS.find(e => e.id === s.emotion)
              return (
                <div key={s.id} style={{ padding: '9px 0', borderBottom: '0.5px solid var(--base-700)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{s.task_label || s.subject}</span>
                    <span style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{s.duration_minutes}m</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{s.date}</span>
                    {em && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '99px', background: em.color + '22', color: em.color, fontFamily: 'var(--font-sans)' }}>{em.label}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          {todaySessions.length > 0 && (
            <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>Today</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[{ val: todaySessions.length, label: 'sessions' }, { val: `${todayMins}m`, label: 'focused' }].map((s, i) => (
                  <div key={i} style={{ background: 'var(--base-700)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--gold-300)', lineHeight: 1, marginBottom: '3px' }}>{s.val}</div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}