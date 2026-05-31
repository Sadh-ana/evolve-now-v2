import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const ACTIVITIES = [
  { id: 'run', label: 'Running', icon: '→', color: '#d4a5a5' },
  { id: 'calisthenics', label: 'Calisthenics', icon: '↑', color: '#c9a87c' },
  { id: 'workout', label: 'Workout', icon: '◎', color: '#9eb5d4' },
  { id: 'football', label: 'Football', icon: '◈', color: '#a8c4a0' },
  { id: 'badminton', label: 'Badminton', icon: '✦', color: '#b8a8d4' },
  { id: 'chess', label: 'Chess Match', icon: '◷', color: '#d4b8a0' },
  { id: 'yoga', label: 'Yoga', icon: '◌', color: '#7fc4b0' },
  { id: 'swim', label: 'Swimming', icon: '≈', color: '#9eb5d4' },
  { id: 'sprint', label: 'Sprinting', icon: '»', color: '#d4a5a5' },
  { id: 'stretch', label: 'Stretch/Mobility', icon: '∿', color: '#a8c4a0' },
  { id: 'other', label: 'Other', icon: '—', color: '#8a7060' },
]

export default function Physical({ session }) {
  const [workouts, setWorkouts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [nw, setNw] = useState({ activity: 'calisthenics', duration_minutes: 30, intensity: 'moderate', notes: '', date: format(new Date(), 'yyyy-MM-dd') })

  useEffect(() => { fetchWorkouts() }, [])

  async function fetchWorkouts() {
    const { data } = await supabase.from('workouts').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(25)
    setWorkouts(data || [])
  }

  async function add(e) {
    e.preventDefault()
    const { data } = await supabase.from('workouts').insert({ user_id: session.user.id, ...nw }).select().single()
    if (data) setWorkouts(p => [data, ...p])
    setShowAdd(false); setNw({ activity: 'calisthenics', duration_minutes: 30, intensity: 'moderate', notes: '', date: format(new Date(), 'yyyy-MM-dd') })
  }

  const getAct = id => ACTIVITIES.find(a => a.id === id) || ACTIVITIES[10]
  const totalMins = workouts.reduce((s, w) => s + (w.duration_minutes || 0), 0)
  const thisWeek = workouts.filter(w => w.date >= format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd')).length
  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Physical</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>movement is medicine ✦</p></div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Log session</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[{ val: thisWeek, label: 'sessions this week' }, { val: workouts.length, label: 'total logged' }, { val: `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`, label: 'total time' }].map((s, i) => (
          <div key={i} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--gold-300)', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {workouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>no sessions yet ✦</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Log your first session — chess counts too.</p>
        </div>
      ) : workouts.map(w => {
        const act = getAct(w.activity)
        return (
          <div key={w.id} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: act.color + '22', border: `1px solid ${act.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: act.color, flexShrink: 0 }}>{act.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: '3px' }}>{act.label}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '99px', background: act.color + '22', color: act.color, fontFamily: 'var(--font-sans)' }}>{w.intensity}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{w.duration_minutes} min</span>
                {w.notes && <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>{w.notes}</span>}
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>{w.date}</span>
          </div>
        )
      })}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Log Session</h3>
            <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Activity</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ACTIVITIES.map(a => <button key={a.id} type="button" onClick={() => setNw(p => ({ ...p, activity: a.id }))} style={{ padding: '6px 12px', borderRadius: '8px', border: `0.5px solid ${nw.activity === a.id ? a.color : 'var(--base-600)'}`, background: nw.activity === a.id ? a.color + '22' : 'transparent', color: nw.activity === a.id ? a.color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px' }}>{a.icon} {a.label}</button>)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Duration (min)</label><input type="number" value={nw.duration_minutes} onChange={e => setNw(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} min={1} style={iStyle} /></div>
                <div><label style={lStyle}>Intensity</label>
                  <select value={nw.intensity} onChange={e => setNw(p => ({ ...p, intensity: e.target.value }))} style={iStyle}>
                    {['light','moderate','intense'].map(i => <option key={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Date</label><input type="date" value={nw.date} onChange={e => setNw(p => ({ ...p, date: e.target.value }))} style={{ ...iStyle, colorScheme: 'dark' }} /></div>
                <div><label style={lStyle}>Notes</label><input value={nw.notes} onChange={e => setNw(p => ({ ...p, notes: e.target.value }))} placeholder="PR, how it felt..." style={iStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Log Session ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}