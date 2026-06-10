import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays } from 'date-fns'
import DailyChallenges from '../components/DailyChallenges'
import Badges from '../components/Badges'

const quotes = [
  "You don't rise to the level of your goals, you fall to the level of your systems.",
  "Discipline is choosing between what you want now and what you want most.",
  "Rest is not a reward. It is part of the work.",
  "Progress, not perfection.",
  "Small steps every day lead to big changes.",
  "The secret is to show up. Every day.",
  "Energy, not time, is the fundamental currency of high performance.",
]

const SCENARIOS = [
  { id: 'great', label: '✦ great', color: '#a8c4a0' },
  { id: 'okay', label: '◎ okay', color: '#c9a87c' },
  { id: 'tired', label: '◑ tired', color: '#9eb5d4' },
  { id: 'sick', label: '◐ sick day', color: '#d4a5a5' },
  { id: 'adhd', label: '⊗ ADHD brain', color: '#b8a8d4' },
  { id: 'period', label: '◈ period', color: '#d4a5a5' },
  { id: 'lowfocus', label: '⊙ low focus', color: '#8a7060' },
]

const CIRCADIAN = [1,2,2,3,4,5,5,5,4,3,2,2,3,4,4,3,2,3,3,2,1,1,1,1]
const CIRCADIAN_LABELS = ['Deep sleep','Warming up','Morning rise','Peak focus','Flow state']

export default function Dashboard({ session, setActivePage, moodMode = 'normal' }) {
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [checkin, setCheckin] = useState(null)
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [checkinSaved, setCheckinSaved] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [userName, setUserName] = useState('')
  const [archetype, setArchetype] = useState('')
  const [scenario, setScenario] = useState(null)
  const [focusSessions, setFocusSessions] = useState([])
  const [burnoutAlert, setBurnoutAlert] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  const quote = quotes[new Date().getDay() % quotes.length]
  const today = format(new Date(), 'EEEE, MMMM d')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const circadianPhase = CIRCADIAN[hour] || 2
  const brainMode = CIRCADIAN_LABELS[Math.min(circadianPhase, 4)]
  const isRecoveryDay = scenario === 'sick' || scenario === 'period' || scenario === 'adhd' || scenario === 'tired'

  const moodConfig = {
    normal: { showCircadian: true, showScenarios: true, showHabits: true, showStats: true, showXP: true, showChallenges: true, showBadges: true, showReport: true },
    calm: { showCircadian: false, showScenarios: false, showHabits: true, showStats: false, showXP: false, showChallenges: false, showBadges: false, showReport: false },
    minimal: { showCircadian: false, showScenarios: false, showHabits: false, showStats: true, showXP: false, showChallenges: false, showBadges: false, showReport: false },
    dopamine: { showCircadian: true, showScenarios: true, showHabits: true, showStats: true, showXP: true, showChallenges: true, showBadges: true, showReport: true },
    tired: { showCircadian: true, showScenarios: true, showHabits: true, showStats: false, showXP: false, showChallenges: false, showBadges: false, showReport: false },
    focus: { showCircadian: true, showScenarios: false, showHabits: false, showStats: false, showXP: false, showChallenges: true, showBadges: false, showReport: false },
    energised: { showCircadian: true, showScenarios: true, showHabits: true, showStats: true, showXP: true, showChallenges: true, showBadges: true, showReport: false },
  }
  const cfg = moodConfig[moodMode] || moodConfig.normal

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const uid = session.user.id
    const { data: profile } = await supabase.from('profiles').select('name, archetype').eq('id', uid).single()
    if (profile) { setUserName(profile.name || ''); setArchetype(profile.archetype || '') }

    const { data: taskData } = await supabase.from('tasks').select('*').eq('user_id', uid).eq('status', 'todo').order('created_at', { ascending: false }).limit(5)
    setTasks(taskData || [])

    const { data: habitData } = await supabase.from('habits').select('*').eq('user_id', uid).limit(6)
    setHabits(habitData || [])

    const { data: checkinData } = await supabase.from('checkins').select('*').eq('user_id', uid).eq('date', format(new Date(), 'yyyy-MM-dd')).maybeSingle()
    if (checkinData) { setCheckin(checkinData); setMood(checkinData.mood); setEnergy(checkinData.energy); setCheckinSaved(true) }

    const { data: sessionData } = await supabase.from('focus_sessions').select('*').eq('user_id', uid).gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd')).order('date', { ascending: false })
    setFocusSessions(sessionData || [])

    const { data: hlData } = await supabase.from('habit_logs').select('*').eq('user_id', uid).gte('completed_on', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
    setHabitLogs(hlData || [])

    const { data: recentCheckins } = await supabase.from('checkins').select('energy').eq('user_id', uid).order('date', { ascending: false }).limit(4)
    if (recentCheckins && recentCheckins.length >= 3) {
      setBurnoutAlert(recentCheckins.slice(0, 3).every(c => c.energy <= 2))
    }
  }

  async function saveCheckin() {
    const uid = session.user.id
    const date = format(new Date(), 'yyyy-MM-dd')
    if (checkin) {
      await supabase.from('checkins').update({ mood, energy }).eq('id', checkin.id)
    } else {
      const { data } = await supabase.from('checkins').insert({ user_id: uid, mood, energy, date }).select().single()
      setCheckin(data)
    }
    setCheckinSaved(true)
  }

  async function addTask(e) {
    e.preventDefault()
    if (!newTask.trim()) return
    const { data } = await supabase.from('tasks').insert({ user_id: session.user.id, title: newTask.trim(), status: 'todo', priority: 'medium' }).select().single()
    if (data) setTasks(prev => [data, ...prev].slice(0, 5))
    setNewTask('')
  }

  async function completeTask(id) {
    await supabase.from('tasks').update({ status: 'done' }).eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function toggleHabit(habitId) {
    const uid = session.user.id
    const date = format(new Date(), 'yyyy-MM-dd')
    const done = habitLogs.some(l => l.habit_id === habitId && l.completed_on === date)
    if (done) {
      await supabase.from('habit_logs').delete().eq('user_id', uid).eq('habit_id', habitId).eq('completed_on', date)
      setHabitLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.completed_on === date)))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ user_id: uid, habit_id: habitId, completed_on: date }).select().single()
      if (data) setHabitLogs(prev => [...prev, data])
    }
  }

  async function generateWeeklyReport() {
    setGeneratingReport(true)
    const uid = session.user.id
    const start7 = format(subDays(new Date(), 7), 'yyyy-MM-dd')
    const [{ data: fs }, { data: t }, { data: ci }, { data: h }, { data: l }] = await Promise.all([
      supabase.from('focus_sessions').select('*').eq('user_id', uid).gte('date', start7),
      supabase.from('tasks').select('*').eq('user_id', uid).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('checkins').select('*').eq('user_id', uid).gte('date', start7),
      supabase.from('habits').select('*').eq('user_id', uid),
      supabase.from('habit_logs').select('*').eq('user_id', uid).gte('completed_on', start7),
    ])
    const totalFocus = (fs || []).reduce((s, x) => s + (x.duration_minutes || 0), 0)
    const doneTasks = (t || []).filter(x => x.status === 'done').length
    const avgMood = (ci || []).length ? ((ci || []).reduce((s, c) => s + c.mood, 0) / ci.length).toFixed(1) : 'no data'
    const habitCompletion = (h || []).length > 0 ? Math.round(((l || []).length / ((h || []).length * 7)) * 100) : 0
    const emotions = [...new Set((fs || []).map(s => s.emotion).filter(Boolean))]
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: `You are EVOLVE's weekly AI coach. Generate a short, warm, insightful weekly review. Be specific. Format: **Week summary** (2 sentences), **What's working** (1-2 things), **What to watch** (1 thing), **Next week focus** (1 priority), **One thing to drop**. Be honest, not a cheerleader.`,
          messages: [{ role: 'user', content: `My week: ${Math.round(totalFocus / 60)} hours focused, ${doneTasks} tasks done, avg mood ${avgMood}/5, habits ${habitCompletion}% done. Emotions: ${emotions.join(', ') || 'not tracked'}.` }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'Could not generate.'
      setWeeklyReport(text)
      await supabase.from('weekly_reports').insert({ user_id: uid, report_text: text, week_start: start7 })
    } catch { setWeeklyReport('Connection failed. Try again.') }
    setGeneratingReport(false)
  }

  const todayMins = focusSessions.filter(s => s.date === format(new Date(), 'yyyy-MM-dd')).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const weekMins = focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const habitXP = habitLogs.length * 5
  const focusXP = focusSessions.reduce((s, x) => s + Math.floor((x.duration_minutes || 0) * 0.5), 0)
  const totalXP = habitXP + focusXP
  const level = totalXP < 100 ? 1 : totalXP < 300 ? 2 : totalXP < 600 ? 3 : totalXP < 1000 ? 4 : totalXP < 2000 ? 5 : 6
  const nextLevelXP = [0, 100, 300, 600, 1000, 2000, 5000][level]
  const prevLevelXP = [0, 0, 100, 300, 600, 1000, 2000][level]
  const xpPct = Math.round(((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)
  const levelName = ['', 'Initiate', 'Novice', 'Practitioner', 'Adept', 'Expert', 'Master'][level]

  const card = (extra = {}) => ({ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', ...extra })
  const lbl = { fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '12px', display: 'block' }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>

      {/* BURNOUT ALERT */}
      {burnoutAlert && (
        <div style={{ background: '#d4a5a510', border: '0.5px solid var(--rose-300)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--rose-300)', fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>⚠ Early burnout signal detected</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Your energy has been low 3 days in a row. Lighter day suggested — 2 tasks max.</p>
          </div>
          <button onClick={() => setBurnoutAlert(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* RECOVERY BANNER */}
      {isRecoveryDay && (
        <div style={{ background: '#9eb5d415', border: '0.5px solid #9eb5d4', borderRadius: 'var(--radius-lg)', padding: '12px 20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#9eb5d4', fontFamily: 'var(--font-sans)' }}>◑ Recovery day active — habit streaks protected. Rest without guilt.</p>
        </div>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>{today}</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 400, fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '6px' }}>
          {greeting}, {userName || 'friend'} ✦
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', fontWeight: 300 }}>"{quote}"</p>
        {archetype && (
          <p style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', marginTop: '6px', letterSpacing: '0.06em' }}>
            ◈ {archetype.replace(/-/g, ' ')} mode active
          </p>
        )}
      </div>

      {cfg.showScenarios && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>How are you today?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SCENARIOS.map(sc => (
              <button key={sc.id} onClick={() => setScenario(scenario === sc.id ? null : sc.id)} style={{
                padding: '6px 14px', borderRadius: '99px',
                border: `0.5px solid ${scenario === sc.id ? sc.color : 'var(--base-600)'}`,
                background: scenario === sc.id ? sc.color + '20' : 'transparent',
                color: scenario === sc.id ? sc.color : 'var(--muted)',
                fontFamily: 'var(--font-sans)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
              }}>{sc.label}</button>
            ))}
          </div>
        </div>
      )}

      {cfg.showCircadian && (
        <div style={card({ marginBottom: '16px', padding: '16px 20px' })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Brain rhythm — circadian state</span>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '99px', background: 'var(--base-700)', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', border: '0.5px solid var(--base-600)' }}>{brainMode}</span>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
          {CIRCADIAN.map((v, i) => (
            <div key={i} style={{ flex: 1, height: '6px', borderRadius: '99px', background: i === hour ? 'var(--gold-300)' : v >= 4 ? '#9eb5d490' : v >= 3 ? '#9eb5d450' : v >= 2 ? '#9eb5d420' : 'var(--base-700)', transition: 'all 0.3s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['6am','9am','12pm','3pm','6pm','9pm','12am'].map(t => (
            <span key={t} style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{t}</span>
          ))}
        </div>
        </div>
      )}

      {/* TOP ROW — check-in + tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '14px' }}>
        <div style={card()}>
          <span style={lbl}>Today's check-in</span>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>Mood</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => { setMood(n); setCheckinSaved(false) }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '0.5px solid', borderColor: mood === n ? 'var(--gold-300)' : 'var(--base-600)', background: mood === n ? 'var(--gold-300)' : 'transparent', color: mood === n ? 'var(--base-950)' : 'var(--muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500, transition: 'all 0.15s' }}>{n}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>Energy</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => { setEnergy(n); setCheckinSaved(false) }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '0.5px solid', borderColor: energy === n ? 'var(--rose-300)' : 'var(--base-600)', background: energy === n ? 'var(--rose-300)' : 'transparent', color: energy === n ? 'var(--base-950)' : 'var(--muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500, transition: 'all 0.15s' }}>{n}</button>
              ))}
            </div>
          </div>
          <button onClick={saveCheckin} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, transition: 'all 0.2s', background: checkinSaved ? 'var(--base-700)' : 'var(--gold-300)', color: checkinSaved ? 'var(--muted)' : 'var(--base-950)' }}>
            {checkinSaved ? '✓ saved' : 'save check-in'}
          </button>
        </div>

        <div style={card()}>
          <span style={lbl}>Today's focus</span>
          <form onSubmit={addTask} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a task..." style={{ flex: 1, background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }} />
            <button type="submit" style={{ padding: '8px 16px', background: 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>+ Add</button>
          </form>
          {tasks.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No tasks yet — add one above ✦</p>
          ) : tasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid var(--base-700)' }}>
              <button onClick={() => completeTask(task.id)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid var(--base-500)', background: 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              <span style={{ fontSize: '13px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)', flex: 1 }}>{task.title}</span>
              <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '99px', background: 'var(--base-700)', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{task.priority}</span>
            </div>
          ))}
        </div>
      </div>

      {(cfg.showHabits || cfg.showStats || cfg.showXP) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>

          {cfg.showHabits && (
            <div style={card()}>
              <span style={lbl}>Habits — {habitLogs.filter(l => l.completed_on === format(new Date(), 'yyyy-MM-dd')).length}/{habits.length} done</span>
              {habits.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>No habits yet</p>
              ) : habits.map(habit => {
                const done = habitLogs.some(l => l.habit_id === habit.id && l.completed_on === format(new Date(), 'yyyy-MM-dd'))
                return (
                  <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid var(--base-700)' }}>
                    <button onClick={() => toggleHabit(habit.id)} style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${done ? 'var(--gold-300)' : 'var(--base-500)'}`, background: done ? 'var(--gold-300)' : 'transparent', color: done ? 'var(--base-950)' : 'transparent', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✓</button>
                    <span style={{ fontSize: '13px', color: done ? 'var(--muted)' : 'var(--cream-300)', fontFamily: 'var(--font-sans)', textDecoration: done ? 'line-through' : 'none', flex: 1 }}>{habit.name}</span>
                    {isRecoveryDay && !done && <span style={{ fontSize: '9px', color: '#9eb5d4', fontFamily: 'var(--font-sans)' }}>protected</span>}
                  </div>
                )
              })}
            </div>
          )}

          {cfg.showStats && (
            <div style={card()}>
              <span style={lbl}>At a glance</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[
                  { num: tasks.length, label: 'tasks left' },
                  { num: `${habitLogs.filter(l => l.completed_on === format(new Date(), 'yyyy-MM-dd')).length}/${habits.length}`, label: 'habits done' },
                  { num: todayMins > 0 ? `${todayMins}m` : '—', label: 'focused today' },
                  { num: weekMins > 0 ? `${Math.round(weekMins / 60)}h` : '—', label: 'this week' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'var(--base-700)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--gold-300)', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>{stat.num}</div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: '12px', borderTop: '0.5px solid var(--base-700)' }}>
                <p style={{ ...lbl, marginBottom: '10px' }}>Life dimensions</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {[
                    { label: 'Mind', pct: Math.min(100, (todayMins / 60) * 20), color: '#9eb5d4' },
                    { label: 'Body', pct: (habitLogs.filter(l => l.completed_on === format(new Date(), 'yyyy-MM-dd')).length / Math.max(habits.length, 1)) * 100, color: '#a8c4a0' },
                    { label: 'Create', pct: 35, color: '#b8a8d4' },
                    { label: 'Social', pct: 50, color: '#d4a5a5' },
                    { label: 'Growth', pct: mood * 20, color: '#c9a87c' },
                  ].map(dim => (
                    <div key={dim.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <svg width="34" height="34" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="17" cy="17" r="13" fill="none" stroke="var(--base-600)" strokeWidth="3" />
                        <circle cx="17" cy="17" r="13" fill="none" stroke={dim.color} strokeWidth="3" strokeDasharray={`${2 * Math.PI * 13}`} strokeDashoffset={`${2 * Math.PI * 13 * (1 - dim.pct / 100)}`} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                      </svg>
                      <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{dim.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cfg.showXP && (
            <div style={card()}>
              <span style={lbl}>Your EVOLVE level</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #e8c97e, #c9a87c, #8a7060)', boxShadow: '0 0 20px rgba(201,168,124,0.4)' }} />
                  <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', background: 'rgba(26,18,11,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--cream-200)' }}>{level}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: '6px' }}>{levelName}</p>
                  <div style={{ height: '4px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-300), var(--rose-300))', width: `${Math.max(2, xpPct)}%`, borderRadius: '99px', transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>{totalXP} XP · {nextLevelXP - totalXP} to next</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {cfg.showReport && (
        <div style={{ marginTop: '14px', marginBottom: '14px' }}>
          <div style={card()}>
            <span style={lbl}>Weekly AI report</span>
            {weeklyReport ? (
              <div style={{ fontSize: '11px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, maxHeight: '100px', overflowY: 'auto' }}>
                {weeklyReport.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: '3px', color: line.startsWith('**') ? 'var(--gold-300)' : 'var(--cream-300)', fontWeight: line.startsWith('**') ? 500 : 300 }}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            ) : (
              <button onClick={generateWeeklyReport} disabled={generatingReport} style={{ padding: '7px 14px', background: generatingReport ? 'var(--base-700)' : 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: generatingReport ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, color: generatingReport ? 'var(--muted)' : 'var(--base-950)' }}>
                {generatingReport ? 'generating...' : 'Generate ✦'}
              </button>
            )}
          </div>
        </div>
      )}

      {(cfg.showChallenges || cfg.showBadges) && (
        <div style={{ display: 'grid', gridTemplateColumns: (cfg.showChallenges && cfg.showBadges) ? '1fr 1fr' : '1fr', gap: '14px' }}>
          {cfg.showChallenges && (
            <div style={card()}>
              <span style={lbl}>Daily challenges</span>
              <DailyChallenges session={session} />
            </div>
          )}
          {cfg.showBadges && (
            <div style={card()}>
              <span style={lbl}>Badges</span>
              <Badges session={session} />
            </div>
          )}
        </div>
      )}

    </div>
  )
}