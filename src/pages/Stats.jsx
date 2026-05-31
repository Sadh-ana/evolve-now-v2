import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Stats({ session }) {
  const [focusSessions, setFocusSessions] = useState([])
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [checkins, setCheckins] = useState([])
  const [tasks, setTasks] = useState([])
  const [missedEvent, setMissedEvent] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const uid = session.user.id
    const start30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')

    const [{ data: fs }, { data: h }, { data: l }, { data: ci }, { data: t }] = await Promise.all([
      supabase.from('focus_sessions').select('*').eq('user_id', uid).gte('date', start30).order('date'),
      supabase.from('habits').select('*').eq('user_id', uid),
      supabase.from('habit_logs').select('*').eq('user_id', uid).gte('completed_on', start30),
      supabase.from('checkins').select('*').eq('user_id', uid).gte('date', start30).order('date'),
      supabase.from('tasks').select('*').eq('user_id', uid).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ])

    setFocusSessions(fs || [])
    setHabits(h || [])
    setLogs(l || [])
    setCheckins(ci || [])
    setTasks(t || [])
  }

  // Weekly focus data (last 7 weeks)
  const weeklyFocus = Array.from({ length: 7 }, (_, i) => {
    const weekStart = startOfWeek(subDays(new Date(), i * 7))
    const weekEnd = endOfWeek(subDays(new Date(), i * 7))
    const mins = focusSessions.filter(s => {
      const d = parseISO(s.date)
      return d >= weekStart && d <= weekEnd
    }).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    return { week: format(weekStart, 'MMM d'), mins, hours: Math.round((mins / 60) * 10) / 10 }
  }).reverse()

  // Mood trend (last 14 days)
  const moodTrend = Array.from({ length: 14 }, (_, i) => {
    const date = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
    const ci = checkins.find(c => c.date === date)
    return { date: format(subDays(new Date(), 13 - i), 'MMM d'), mood: ci?.mood || null, energy: ci?.energy || null }
  })

  // Emotion breakdown from focus sessions
  const emotionCounts = focusSessions.reduce((acc, s) => {
    if (s.emotion) acc[s.emotion] = (acc[s.emotion] || 0) + 1
    return acc
  }, {})
  const emotionData = Object.entries(emotionCounts).map(([e, c]) => ({ emotion: e, count: c })).sort((a, b) => b.count - a.count)

  // Habit completion rate
  const habitRate = habits.map(h => {
    const total = 30
    const done = logs.filter(l => l.habit_id === h.id).length
    return { name: h.name.slice(0, 20), rate: Math.round((done / total) * 100) }
  }).sort((a, b) => b.rate - a.rate).slice(0, 6)

  // Task stats
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalFocusHours = Math.round(focusSessions.reduce((s, x) => s + (x.duration_minutes || 0), 0) / 60 * 10) / 10
  const avgMood = checkins.length ? Math.round(checkins.reduce((s, c) => s + c.mood, 0) / checkins.length * 10) / 10 : null
  const habitStreak = (() => {
    let s = 0; let d = new Date()
    while (true) {
      const ds = format(d, 'yyyy-MM-dd')
      const dayDone = habits.length > 0 && habits.every(h => logs.some(l => l.habit_id === h.id && l.completed_on === ds))
      if (!dayDone) break; s++; d = subDays(d, 1)
    }
    return s
  })()

  const emColors = { flowing: '#a8c4a0', grinding: '#c9a87c', stuck: '#9eb5d4', anxious: '#d4a5a5', drained: '#b8a8d4', hollow: '#8a7060', disconnected: '#7fc4b0', numb: '#d4b8a0' }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '8px', padding: '8px 12px' }}>
        <p style={{ fontSize: '11px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ fontSize: '11px', color: p.color || 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{p.name}: {p.value}</p>)}
      </div>
    )
  }

  const card = { background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Stats</h2>
        <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>last 30 days ✦</p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { val: totalFocusHours, label: 'focus hours', sub: 'last 30 days' },
          { val: doneTasks, label: 'tasks crushed', sub: 'last 30 days' },
          { val: avgMood ? `${avgMood}/5` : '—', label: 'avg mood', sub: 'last 30 days' },
          { val: habitStreak, label: 'perfect days', sub: 'all habits done' },
        ].map((s, i) => (
          <div key={i} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', color: 'var(--gold-300)', fontWeight: 400, lineHeight: 1, marginBottom: '6px' }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        {/* Weekly focus */}
        <div style={card}>
          <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '16px' }}>Weekly focus hours</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyFocus} barSize={20}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {weeklyFocus.map((_, i) => <Cell key={i} fill={i === weeklyFocus.length - 1 ? 'var(--gold-300)' : 'var(--base-600)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mood trend */}
        <div style={card}>
          <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '16px' }}>Mood & energy (14 days)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moodTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis domain={[1, 5]} hide />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="mood" stroke="var(--gold-300)" strokeWidth={2} dot={false} name="mood" connectNulls />
              <Line type="monotone" dataKey="energy" stroke="var(--rose-300)" strokeWidth={2} dot={false} name="energy" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Habit completion */}
        <div style={card}>
          <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '14px' }}>Habit completion rate (30 days)</p>
          {habitRate.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>no habits yet</p> : habitRate.map((h, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{h.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{h.rate}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '99px', background: `linear-gradient(90deg, var(--gold-300), var(--rose-300))`, width: `${h.rate}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Emotion breakdown */}
        <div style={card}>
          <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '14px' }}>Session emotions</p>
          {emotionData.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>no sessions logged yet</p> : emotionData.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: emColors[e.emotion] || 'var(--muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', flex: 1, textTransform: 'capitalize' }}>{e.emotion}</span>
              <div style={{ height: '4px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden', width: '80px' }}>
                <div style={{ height: '100%', borderRadius: '99px', background: emColors[e.emotion] || 'var(--muted)', width: `${(e.count / (focusSessions.filter(s => s.emotion).length || 1)) * 100}%` }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', minWidth: '16px', textAlign: 'right' }}>{e.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}