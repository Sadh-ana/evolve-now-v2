import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

const BADGE_META = {
  first_focus: { icon: '◷', name: 'Ignition', color: '#c9a87c' },
  focus_10: { icon: '◈', name: 'Flow State', color: '#c9a87c' },
  deep_work: { icon: '◉', name: 'Deep Worker', color: '#9eb5d4' },
  focus_50: { icon: '◎', name: 'The Obsessed', color: '#e8c97e' },
  first_habit: { icon: '◌', name: 'First Steps', color: '#a8c4a0' },
  habit_7: { icon: '◍', name: 'Week One', color: '#a8c4a0' },
  habit_30: { icon: '●', name: 'Iron Will', color: '#e8c97e' },
  first_brain: { icon: '✦', name: 'Idea Seed', color: '#c9a87c' },
  brain_5: { icon: '✧', name: 'Idea Garden', color: '#b8a8d4' },
  first_journal: { icon: '◇', name: 'Inner Voice', color: '#d4a5a5' },
  journal_14: { icon: '◆', name: 'Chronicler', color: '#d4a5a5' },
  first_workout: { icon: '↑', name: 'Moving', color: '#d4a5a5' },
  workout_20: { icon: '⇑', name: 'Athlete', color: '#e8c97e' },
  onboarded: { icon: '◐', name: 'Evolved', color: '#c9a87c' },
  side_quest: { icon: '♡', name: 'Side Quester', color: '#b8a8d4' },
  recovery: { icon: '◑', name: 'Self-Aware', color: '#9eb5d4' },
}

export default function Vision({ session }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalXP: 0, level: 1, days: 0 })
  const [view, setView] = useState('timeline')

  useEffect(() => { fetchTimeline() }, [])

  async function fetchTimeline() {
    const uid = session.user.id

    const [
      { data: profile },
      { data: achievements },
      { data: hobbies },
      { data: brainstormProjects },
      { data: focusSessions },
      { data: habitLogs },
      { data: workouts },
    ] = await Promise.all([
      supabase.from('profiles').select('created_at, name, onboarded').eq('id', uid).single(),
      supabase.from('achievements').select('badge_id, created_at').eq('user_id', uid).order('created_at'),
      supabase.from('hobbies').select('name, created_at').eq('user_id', uid).order('created_at'),
      supabase.from('brainstorm_projects').select('name, created_at').eq('user_id', uid).order('created_at'),
      supabase.from('focus_sessions').select('duration_minutes, date, created_at').eq('user_id', uid).order('created_at'),
      supabase.from('habit_logs').select('completed_on, created_at').eq('user_id', uid).order('created_at'),
      supabase.from('workouts').select('activity, date, created_at').eq('user_id', uid).order('created_at'),
    ])

    const ev = []

    // Account creation
    if (profile?.created_at) {
      ev.push({
        date: profile.created_at, icon: '✦', color: '#c9a87c',
        title: 'Your journey began', desc: `${profile.name || 'You'} joined EVOLVE`, type: 'milestone'
      })
    }

    // Badges
    ;(achievements || []).forEach(a => {
      const meta = BADGE_META[a.badge_id]
      if (meta) ev.push({
        date: a.created_at, icon: meta.icon, color: meta.color,
        title: `Badge unlocked: ${meta.name}`, desc: '', type: 'badge'
      })
    })

    // Hobbies
    ;(hobbies || []).forEach(h => {
      ev.push({
        date: h.created_at, icon: '♡', color: '#b8a8d4',
        title: `Started a side quest`, desc: h.name, type: 'hobby'
      })
    })

    // Brainstorm projects
    ;(brainstormProjects || []).forEach(b => {
      ev.push({
        date: b.created_at, icon: '◈', color: '#9eb5d4',
        title: `New idea: ${b.name}`, desc: 'Brainstorm project created', type: 'brainstorm'
      })
    })

    // First focus session milestone
    if (focusSessions?.length > 0) {
      ev.push({
        date: focusSessions[0].created_at, icon: '◷', color: '#9eb5d4',
        title: 'First focus session', desc: `${focusSessions[0].duration_minutes} minutes`, type: 'focus'
      })
      // Total hours milestones
      let cumulative = 0
      const milestones = [60, 300, 600, 1500, 3000] // minutes: 1h, 5h, 10h, 25h, 50h
      const hit = new Set()
      for (const s of focusSessions) {
        cumulative += s.duration_minutes || 0
        for (const m of milestones) {
          if (cumulative >= m && !hit.has(m)) {
            hit.add(m)
            ev.push({
              date: s.created_at, icon: '◎', color: '#e8c97e',
              title: `${Math.round(m / 60)} hours of focus reached`, desc: 'Cumulative deep work milestone', type: 'focus-milestone'
            })
          }
        }
      }
    }

    // First habit log
    if (habitLogs?.length > 0) {
      ev.push({
        date: habitLogs[0].created_at, icon: '◌', color: '#a8c4a0',
        title: 'First habit completed', desc: 'The beginning of a streak', type: 'habit'
      })
    }

    // First workout
    if (workouts?.length > 0) {
      ev.push({
        date: workouts[0].created_at, icon: '↑', color: '#d4a5a5',
        title: 'First workout logged', desc: workouts[0].activity || 'Movement begins', type: 'workout'
      })
    }

    // Sort chronologically
    ev.sort((a, b) => new Date(a.date) - new Date(b.date))
    setEvents(ev)

    // Stats
    const habitXP = (habitLogs || []).length * 5
    const focusXP = (focusSessions || []).reduce((s, x) => s + Math.floor((x.duration_minutes || 0) * 0.5), 0)
    const totalXP = habitXP + focusXP
    const level = totalXP < 100 ? 1 : totalXP < 300 ? 2 : totalXP < 600 ? 3 : totalXP < 1000 ? 4 : totalXP < 2000 ? 5 : 6
    const days = profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at)) / 86400000) : 0
    setStats({ totalXP, level, days })

    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic' }}>loading your journey...</p>
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '8px' }}>Your Evolution ✦</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '20px' }}>
          {stats.days} {stats.days === 1 ? 'day' : 'days'} on EVOLVE · Level {stats.level} · {stats.totalXP} XP earned
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          {[
            { val: events.length, label: 'milestones' },
            { val: events.filter(e => e.type === 'badge').length, label: 'badges earned' },
            { val: stats.level, label: 'current level' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
        {['goals','values','review','timeline'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: view === v ? 'var(--gold-300)' : 'transparent', color: view === v ? 'var(--base-950)' : 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '12px' }}>
            {v === 'review' ? 'Weekly Review' : v === 'timeline' ? 'Timeline' : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {view !== 'timeline' ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
          <p style={{ fontStyle: 'italic' }}>{view === 'review' ? 'Weekly review — switch to Dashboard to generate a review.' : `The ${view} view is coming soon.`}</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>your story starts now ✦</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Complete tasks, log habits, and focus sessions to build your timeline.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '1.5px',
            background: 'linear-gradient(to bottom, var(--gold-300)44, var(--base-600) 80%, transparent)',
          }} />

          {events.map((ev, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: '20px', animation: `fadeInUp 0.5s ease ${Math.min(i * 0.05, 1)}s both` }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-32px', top: '4px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: ev.color + '22', border: `1.5px solid ${ev.color}88`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: ev.color, flexShrink: 0,
                boxShadow: `0 0 10px ${ev.color}44`,
              }}>{ev.icon}</div>

              {/* Card */}
              <div style={{
                background: 'var(--base-800)', border: '0.5px solid var(--base-600)',
                borderLeft: `2px solid ${ev.color}66`,
                borderRadius: '12px', padding: '12px 16px',
                marginLeft: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: ev.desc ? '2px' : 0 }}>{ev.title}</p>
                    {ev.desc && <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>{ev.desc}</p>}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {format(parseISO(ev.date), 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* "You are here" marker */}
          <div style={{ position: 'relative', marginTop: '8px' }}>
            <div style={{
              position: 'absolute', left: '-32px', top: '4px',
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'var(--gold-300)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'var(--base-950)', flexShrink: 0,
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}>✦</div>
            <div style={{ marginLeft: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--gold-300)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>you are here — still evolving</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}