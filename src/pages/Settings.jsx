import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ARCHETYPES = [
  { id: 'procrastinator', label: 'The Procrastinator', icon: '⏳', desc: 'Delays starting, even when wanting to' },
  { id: 'perfectionist', label: 'The Perfectionist', icon: '◎', desc: 'Redoes endlessly or doesn\'t start' },
  { id: 'grinder', label: 'The Grinder', icon: '↑', desc: 'Pushes until crashing' },
  { id: 'burnout-prone', label: 'Burnout-prone', icon: '◌', desc: 'All in, then completely gone' },
  { id: 'self-sabotager', label: 'Self-sabotager', icon: '✕', desc: 'Undermines self at the key moment' },
  { id: 'adhd', label: 'ADHD brain', icon: '◈', desc: 'Hyperfocus or complete inability to start' },
  { id: 'committed', label: 'The Committed', icon: '✦', desc: 'Shows up — needs better systems' },
]

const HEALTH_FLAGS = [
  { id: 'adhd', label: 'ADHD' },
  { id: 'iron-deficiency', label: 'Iron deficiency' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'chronic-fatigue', label: 'Chronic fatigue' },
  { id: 'irregular-sleep', label: 'Irregular sleep' },
  { id: 'period-tracking', label: 'Period tracking' },
  { id: 'injury', label: 'Injury / physical limitation' },
  { id: 'social-anxiety', label: 'Social anxiety' },
]

const PEAK_TIMES = [
  { id: 'early-morning', label: 'Early morning (5–8am)' },
  { id: 'morning', label: 'Morning (8–12pm)' },
  { id: 'afternoon', label: 'Afternoon (12–5pm)' },
  { id: 'evening', label: 'Evening (5–9pm)' },
  { id: 'night', label: 'Late night (9pm+)' },
]

export default function Settings({ session }) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [board, setBoard] = useState('')
  const [archetype, setArchetype] = useState('')
  const [healthFlags, setHealthFlags] = useState([])
  const [peakTime, setPeakTime] = useState('morning')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setName(data.name || '')
      setUsername(data.username || '')
      setBoard(data.board || '')
      setArchetype(data.archetype || '')
      setHealthFlags(data.health_flags || [])
      setPeakTime(data.peak_time || 'morning')
    }
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name, username, archetype, health_flags: healthFlags, board, peak_time: peakTime,
    }).eq('id', session.user.id)
    if (error) {
      console.error('Save error:', error)
      alert('Save failed: ' + error.message)
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const s = {
    card: { background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1.5rem', marginBottom: '14px' },
    title: { fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px', fontWeight: 400 },
    sub: { fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '18px' },
    lbl: { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' },
    input: { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' },
    tag: (active, color = 'var(--gold-300)') => ({ padding: '6px 14px', borderRadius: '99px', border: `0.5px solid ${active ? color : 'var(--base-600)'}`, background: active ? color + '22' : 'transparent', color: active ? color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', transition: 'all 0.15s' }),
  }

  const sections = [
    { id: 'profile', label: 'Profile' },
    { id: 'archetype', label: 'Archetype' },
    { id: 'health', label: 'Health' },
    { id: 'rhythm', label: 'Rhythm' },
    { id: 'account', label: 'Account' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '780px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Settings</h2>
        <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>your EVOLVE, configured ✦</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', background: activeSection === sec.id ? 'var(--gold-300)' : 'var(--base-800)', color: activeSection === sec.id ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s' }}>
            {sec.label}
          </button>
        ))}
      </div>

      {activeSection === 'profile' && (
        <div style={s.card}>
          <p style={s.title}>Profile</p>
          <p style={s.sub}>How EVOLVE addresses you</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={s.lbl}>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="Your name" />
            </div>
            <div>
              <label style={s.lbl}>Username — share with friends for Study Room</label>
              <div style={{ display: 'flex', gap: '0' }}>
                <span style={{ padding: '10px 10px 10px 14px', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRight: 'none', borderRadius: '10px 0 0 10px', color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>@</span>
                <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24))} style={{ ...s.input, borderRadius: '0 10px 10px 0', flex: 1 }} placeholder="your_username" />
              </div>
              <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>lowercase, underscores ok, max 24 chars</p>
            </div>
            <div>
              <label style={s.lbl}>Board / curriculum</label>
              <select value={board} onChange={e => setBoard(e.target.value)} style={s.input}>
                <option value="">Select...</option>
                {['CBSE','ICSE','IB','A-Levels','SAT/ACT','GCSE','University','Working professional','Other'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'archetype' && (
        <div style={s.card}>
          <p style={s.title}>Your archetype</p>
          <p style={s.sub}>EVOLVE uses this to adapt when you struggle. Pick what resonates most.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {ARCHETYPES.map(a => (
              <button key={a.id} onClick={() => setArchetype(a.id)} style={{ padding: '14px', borderRadius: '10px', border: `0.5px solid ${archetype === a.id ? 'var(--gold-300)' : 'var(--base-600)'}`, background: archetype === a.id ? 'rgba(201,168,124,0.1)' : 'var(--base-700)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '18px', marginBottom: '5px' }}>{a.icon}</div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: archetype === a.id ? 'var(--gold-300)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', marginBottom: '3px' }}>{a.label}</p>
                <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>{a.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'health' && (
        <div style={s.card}>
          <p style={s.title}>Health & context</p>
          <p style={s.sub}>Helps EVOLVE protect your streaks on hard days. All optional, never judged.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {HEALTH_FLAGS.map(f => {
              const active = healthFlags.includes(f.id)
              return (
                <button key={f.id} onClick={() => setHealthFlags(active ? healthFlags.filter(h => h !== f.id) : [...healthFlags, f.id])} style={s.tag(active)}>
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeSection === 'rhythm' && (
        <div style={s.card}>
          <p style={s.title}>Your brain rhythm</p>
          <p style={s.sub}>EVOLVE uses this to suggest when to schedule deep work vs light tasks.</p>
          <label style={s.lbl}>When do you focus best?</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PEAK_TIMES.map(t => (
              <button key={t.id} onClick={() => setPeakTime(t.id)} style={s.tag(peakTime === t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'account' && (
        <div style={s.card}>
          <p style={s.title}>Account</p>
          <p style={s.sub}>Manage your EVOLVE account.</p>
          <div style={{ padding: '14px 16px', background: 'var(--base-700)', borderRadius: '10px', marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>Signed in as</p>
            <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{session.user.email}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ padding: '10px 20px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--muted)' }}>
            Sign out
          </button>
        </div>
      )}

      {activeSection !== 'account' && (
        <button onClick={save} disabled={saving} style={{ padding: '12px 28px', background: saved ? 'var(--base-700)' : 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: saved ? 'var(--muted)' : 'var(--base-950)', transition: 'all 0.2s', marginTop: '4px' }}>
          {saving ? 'saving...' : saved ? '✓ saved' : 'Save changes ✦'}
        </button>
      )}
    </div>
  )
}