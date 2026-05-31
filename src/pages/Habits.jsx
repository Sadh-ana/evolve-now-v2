import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays, eachDayOfInterval } from 'date-fns'

const CATEGORIES = [
  { id: 'physical', label: 'Physical', color: '#d4a5a5', icon: '↑' },
  { id: 'mental', label: 'Mental', color: '#9eb5d4', icon: '◎' },
  { id: 'academic', label: 'Academic', color: '#c9a87c', icon: '✦' },
  { id: 'creative', label: 'Creative', color: '#a8c4a0', icon: '♡' },
  { id: 'spiritual', label: 'Spiritual', color: '#b8a8d4', icon: '◈' },
  { id: 'social', label: 'Social', color: '#d4b8a0', icon: '⊕' },
  { id: 'health', label: 'Health', color: '#7fc4b0', icon: '◷' },
]

const SUGGESTED = [
  { name: 'Morning movement (10 min)', category: 'physical', frequency: 'daily', why: 'Activates prefrontal cortex before the day starts' },
  { name: 'Read 20 pages', category: 'mental', frequency: 'daily', why: 'Reduces stress, builds sustained focus capacity' },
  { name: 'Revision flashcards', category: 'academic', frequency: 'daily', why: 'Spaced repetition is the most effective memory method' },
  { name: 'Gratitude (3 things)', category: 'spiritual', frequency: 'daily', why: 'Rewires the brain toward positive pattern recognition' },
  { name: 'Creative practice (15 min)', category: 'creative', frequency: 'daily', why: 'Creative output requires daily practice, not occasional bursts' },
  { name: 'No phone first 30 min', category: 'mental', frequency: 'daily', why: 'Preserves morning dopamine baseline for real work' },
  { name: 'Walk outside', category: 'physical', frequency: 'daily', why: 'Natural light + movement = best focus reset available' },
  { name: 'Weekly review (Sunday)', category: 'mental', frequency: 'weekly', why: 'GTD reflection doubles follow-through rate' },
  { name: 'Drink 2L water', category: 'health', frequency: 'daily', why: '2% dehydration reduces cognitive performance by 20%' },
  { name: 'Sleep by 10:30pm', category: 'health', frequency: 'daily', why: 'Sleep before midnight has 2x the restorative effect' },
  { name: 'Stretch / mobility (10 min)', category: 'physical', frequency: 'daily', why: 'Reduces cortisol, improves circulation and focus' },
  { name: 'One hard conversation', category: 'social', frequency: 'weekly', why: 'Avoidance compounds — small doses prevent big collapses' },
]

export default function Habits({ session }) {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: '', category: 'mental', frequency: 'daily' })
  const [filterCat, setFilterCat] = useState('all')
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const uid = session.user.id
    const { data: h } = await supabase.from('habits').select('*').eq('user_id', uid).order('created_at')
    setHabits(h || [])
    const startDate = format(subDays(new Date(), 84), 'yyyy-MM-dd')
    const { data: l } = await supabase.from('habit_logs').select('*').eq('user_id', uid).gte('completed_on', startDate)
    setLogs(l || [])
  }

  async function addHabit(e) {
    e.preventDefault()
    if (!newHabit.name.trim()) return
    const { data } = await supabase.from('habits').insert({ user_id: session.user.id, ...newHabit }).select().single()
    if (data) setHabits(p => [...p, data])
    setNewHabit({ name: '', category: 'mental', frequency: 'daily' })
    setShowAdd(false)
  }

  async function addSuggested(s) {
    if (habits.some(h => h.name === s.name)) return
    const { data } = await supabase.from('habits').insert({ user_id: session.user.id, name: s.name, category: s.category, frequency: s.frequency }).select().single()
    if (data) setHabits(p => [...p, data])
  }

  async function toggleHabit(habitId) {
    const uid = session.user.id
    const existing = logs.find(l => l.habit_id === habitId && l.completed_on === today)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setLogs(p => p.filter(l => l.id !== existing.id))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: uid, completed_on: today }).select().single()
      if (data) setLogs(p => [...p, data])
    }
  }

  async function deleteHabit(id) {
    await supabase.from('habits').delete().eq('id', id)
    setHabits(p => p.filter(h => h.id !== id))
    setLogs(p => p.filter(l => l.habit_id !== id))
  }

  const isDoneToday = id => logs.some(l => l.habit_id === id && l.completed_on === today)

  const getStreak = id => {
    let streak = 0
    let d = new Date()
    if (!isDoneToday(id)) d = subDays(d, 1)
    while (true) {
      const ds = format(d, 'yyyy-MM-dd')
      if (!logs.some(l => l.habit_id === id && l.completed_on === ds)) break
      streak++
      d = subDays(d, 1)
    }
    return streak
  }

  const getHeatmap = id => eachDayOfInterval({ start: subDays(new Date(), 83), end: new Date() }).map(day => ({
    date: day, done: logs.some(l => l.habit_id === id && l.completed_on === format(day, 'yyyy-MM-dd'))
  }))

  const getCat = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[0]
  const filtered = filterCat === 'all' ? habits : habits.filter(h => h.category === filterCat)
  const doneCount = habits.filter(h => isDoneToday(h.id)).length
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0

  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Habits</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
            {doneCount}/{habits.length} done today {doneCount === habits.length && habits.length > 0 ? '✦ perfect day' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSuggestions(true)} style={{ padding: '10px 16px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted)' }}>✦ Suggestions</button>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ New Habit</button>
        </div>
      </div>

      {habits.length > 0 && (
        <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>Today's completion</span>
            <span style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{pct}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, var(--gold-300), var(--rose-300))', width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCat('all')} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--base-600)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: filterCat === 'all' ? 'var(--gold-300)' : 'transparent', color: filterCat === 'all' ? 'var(--base-950)' : 'var(--muted)' }}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: `0.5px solid ${c.color}44`, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: filterCat === c.id ? c.color : 'transparent', color: filterCat === c.id ? 'var(--base-950)' : c.color }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>no habits yet ✦</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Add one above or try the science-backed suggestions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(habit => {
            const cat = getCat(habit.category)
            const streak = getStreak(habit.id)
            const done = isDoneToday(habit.id)
            const heatmap = getHeatmap(habit.id)
            return (
              <div key={habit.id} style={{ background: 'var(--base-800)', border: `0.5px solid ${done ? cat.color + '60' : 'var(--base-600)'}`, borderRadius: 'var(--radius-lg)', padding: '18px 20px', transition: 'all 0.25s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <button onClick={() => toggleHabit(habit.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${done ? cat.color : 'var(--base-500)'}`, background: done ? cat.color : 'transparent', cursor: 'pointer', fontSize: '12px', color: 'var(--base-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {done && '✓'}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: done ? 'var(--muted)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, textDecoration: done ? 'line-through' : 'none' }}>{habit.name}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                      <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '99px', background: cat.color + '22', color: cat.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat.label}</span>
                      <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{habit.frequency}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '40px' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: streak > 0 ? 'var(--gold-300)' : 'var(--base-600)', lineHeight: 1 }}>{streak}</div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>streak</div>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '16px', flexShrink: 0 }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                  {heatmap.map((d, i) => (
                    <div key={i} title={format(d.date, 'MMM d')} style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.done ? cat.color : 'var(--base-700)', opacity: d.done ? 1 : 0.5, transition: 'background 0.2s' }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Habit</h3>
            <form onSubmit={addHabit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Habit name</label><input value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Morning movement" autoFocus required style={iStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Category</label>
                  <select value={newHabit.category} onChange={e => setNewHabit(p => ({ ...p, category: e.target.value }))} style={iStyle}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div><label style={lStyle}>Frequency</label>
                  <select value={newHabit.frequency} onChange={e => setNewHabit(p => ({ ...p, frequency: e.target.value }))} style={iStyle}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="3x-week">3× per week</option>
                    <option value="weekdays">Weekdays only</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add Habit ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuggestions && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowSuggestions(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px' }}>Science-backed habits</h3>
            <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '20px' }}>Each grounded in research. One tap to add.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SUGGESTED.map((s, i) => {
                const cat = getCat(s.category)
                const added = habits.some(h => h.name === s.name)
                return (
                  <div key={i} style={{ background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: '3px' }}>{s.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', marginBottom: '5px' }}>{s.why}</p>
                      <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '99px', background: cat.color + '22', color: cat.color, fontFamily: 'var(--font-sans)' }}>{cat.label} · {s.frequency}</span>
                    </div>
                    <button onClick={() => addSuggested(s)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: added ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, background: added ? 'var(--base-600)' : 'var(--gold-300)', color: added ? 'var(--muted)' : 'var(--base-950)', flexShrink: 0 }}>
                      {added ? '✓ added' : '+ add'}
                    </button>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowSuggestions(false)} style={{ width: '100%', marginTop: '16px', padding: '11px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}