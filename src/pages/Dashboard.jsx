import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const quotes = [
  "Small steps every day lead to big changes.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't rise to the level of your goals, you fall to the level of your systems.",
  "Rest is not a reward. It is part of the work.",
  "Progress, not perfection.",
]

export default function Dashboard({ session }) {
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [checkin, setCheckin] = useState(null)
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [checkinSaved, setCheckinSaved] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [userName, setUserName] = useState('')
  const quote = quotes[new Date().getDay() % quotes.length]
  const today = format(new Date(), 'EEEE, MMMM d')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const uid = session.user.id

    const { data: profile } = await supabase
      .from('profiles').select('name').eq('id', uid).single()
    if (profile) setUserName(profile.name || '')

    const { data: taskData } = await supabase
      .from('tasks').select('*')
      .eq('user_id', uid)
      .eq('status', 'todo')
      .order('created_at', { ascending: false })
      .limit(5)
    setTasks(taskData || [])

    const { data: habitData } = await supabase
      .from('habits').select('*')
      .eq('user_id', uid)
      .limit(5)
    setHabits(habitData || [])

    const { data: checkinData } = await supabase
      .from('checkins').select('*')
      .eq('user_id', uid)
      .eq('date', format(new Date(), 'yyyy-MM-dd'))
      .single()
    if (checkinData) {
      setCheckin(checkinData)
      setMood(checkinData.mood)
      setEnergy(checkinData.energy)
      setCheckinSaved(true)
    }
  }

  async function saveCheckin() {
    const uid = session.user.id
    const date = format(new Date(), 'yyyy-MM-dd')
    if (checkin) {
      await supabase.from('checkins').update({ mood, energy }).eq('id', checkin.id)
    } else {
      await supabase.from('checkins').insert({ user_id: uid, mood, energy, date })
    }
    setCheckinSaved(true)
  }

  async function addTask(e) {
    e.preventDefault()
    if (!newTask.trim()) return
    const { data } = await supabase.from('tasks').insert({
      user_id: session.user.id,
      title: newTask.trim(),
      status: 'todo',
      priority: 'medium',
    }).select().single()
    if (data) setTasks(prev => [data, ...prev].slice(0, 5))
    setNewTask('')
  }

  async function completeTask(id) {
    await supabase.from('tasks').update({ status: 'done' }).eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const card = (children, extra = {}) => ({
    background: 'var(--base-800)',
    border: '0.5px solid var(--base-600)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    ...extra
  })

  const label = {
    fontSize: '9px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    fontFamily: 'var(--font-sans)',
    marginBottom: '12px',
    display: 'block',
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
          {today}
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 400, fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '6px' }}>
          {greeting}, {userName || 'friend'} ✦
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', fontWeight: 300 }}>
          "{quote}"
        </p>
      </div>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>

        {/* Mood check-in */}
        <div style={card()}>
          <span style={label}>Today's check-in</span>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>Mood</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => { setMood(n); setCheckinSaved(false) }} style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: '0.5px solid',
                  borderColor: mood === n ? 'var(--gold-300)' : 'var(--base-600)',
                  background: mood === n ? 'var(--gold-300)' : 'transparent',
                  color: mood === n ? 'var(--base-950)' : 'var(--muted)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500,
                  transition: 'all 0.15s',
                }}>{n}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>Energy</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => { setEnergy(n); setCheckinSaved(false) }} style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: '0.5px solid',
                  borderColor: energy === n ? 'var(--rose-300)' : 'var(--base-600)',
                  background: energy === n ? 'var(--rose-300)' : 'transparent',
                  color: energy === n ? 'var(--base-950)' : 'var(--muted)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500,
                  transition: 'all 0.15s',
                }}>{n}</button>
              ))}
            </div>
          </div>
          <button onClick={saveCheckin} style={{
            width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
            fontSize: '12px', fontWeight: 500, transition: 'all 0.2s',
            background: checkinSaved ? 'var(--base-700)' : 'var(--gold-300)',
            color: checkinSaved ? 'var(--muted)' : 'var(--base-950)',
          }}>
            {checkinSaved ? '✓ saved' : 'save check-in'}
          </button>
        </div>

        {/* Today's tasks */}
        <div style={card({}, { gridColumn: 'span 2' })}>
          <span style={label}>Today's focus</span>
          <form onSubmit={addTask} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Add a task..."
              style={{
                flex: 1, background: 'var(--base-700)', border: '0.5px solid var(--base-600)',
                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
            <button type="submit" style={{
              padding: '8px 16px', background: 'var(--gold-300)', border: 'none',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500,
              color: 'var(--base-950)',
            }}>+ Add</button>
          </form>
          {tasks.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
              No tasks yet — add one above ✦
            </p>
          ) : (
            tasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 0', borderBottom: '0.5px solid var(--base-700)',
              }}>
                <button onClick={() => completeTask(task.id)} style={{
                  width: '18px', height: '18px', borderRadius: '4px',
                  border: '1px solid var(--base-500)', background: 'transparent',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} />
                <span style={{ fontSize: '13px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)' }}>
                  {task.title}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: '9px', padding: '2px 8px',
                  borderRadius: '99px', background: 'var(--base-700)',
                  color: 'var(--muted)', fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {task.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Habits today */}
        <div style={card()}>
          <span style={label}>Habits</span>
          {habits.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
              No habits yet — add them in the Habits page
            </p>
          ) : (
            habits.map(habit => (
              <div key={habit.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 0', borderBottom: '0.5px solid var(--base-700)',
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: '1px solid var(--base-500)', flexShrink: 0,
                }} />
                <span style={{ fontSize: '13px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)' }}>
                  {habit.name}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: '9px',
                  color: 'var(--muted)', fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {habit.category}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Quick stats */}
        <div style={card()}>
          <span style={label}>At a glance</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { num: tasks.length, label: 'tasks today' },
              { num: habits.length, label: 'active habits' },
              { num: mood || '—', label: 'mood today' },
              { num: energy || '—', label: 'energy today' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--base-700)', borderRadius: 'var(--radius-sm)',
                padding: '14px', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontSize: '32px',
                  color: 'var(--gold-300)', fontWeight: 400, lineHeight: 1,
                  marginBottom: '4px',
                }}>{stat.num}</div>
                <div style={{
                  fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', fontFamily: 'var(--font-sans)',
                }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}