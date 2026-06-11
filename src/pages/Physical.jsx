import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const ACTIVITIES = [
  { id: 'run', label: 'Running', icon: '→', color: '#d4a5a5' },
  { id: 'calisthenics', label: 'Calisthenics', icon: '↑', color: '#c9a87c' },
  { id: 'weights', label: 'Weights', icon: '◎', color: '#9eb5d4' },
  { id: 'football', label: 'Football', icon: '◈', color: '#a8c4a0' },
  { id: 'badminton', label: 'Badminton', icon: '✦', color: '#b8a8d4' },
  { id: 'yoga', label: 'Yoga', icon: '◌', color: '#7fc4b0' },
  { id: 'swim', label: 'Swimming', icon: '≈', color: '#9eb5d4' },
  { id: 'hiit', label: 'HIIT', icon: '⊗', color: '#d4a5a5' },
  { id: 'stretch', label: 'Mobility', icon: '∿', color: '#a8c4a0' },
  { id: 'walk', label: 'Walk/Hike', icon: '◷', color: '#d4b8a0' },
  { id: 'other', label: 'Other', icon: '—', color: '#8a7060' },
]

// Science-based workout plan generator
// Based on ACSM guidelines, progressive overload, and periodization principles
function generatePlan({ level, goal, days, duration, equipment }) {
  const plans = {
    beginner: {
      strength: {
        3: {
          name: 'Foundation Strength',
          science: 'ACSM recommends 2–3 days/week for beginners with 48h recovery between sessions. Compound movements first for maximum motor unit recruitment.',
          days: [
            { name: 'Full Body A', exercises: ['Bodyweight squats 3×12', 'Push-ups 3×8', 'Dumbbell rows 3×10', 'Glute bridges 3×15', 'Plank 3×20s'] },
            { name: 'Rest / Walk', exercises: ['10–20 min light walk', 'Gentle stretching'] },
            { name: 'Full Body B', exercises: ['Lunges 3×10 each', 'Incline push-ups 3×10', 'Resistance band rows 3×12', 'Hip thrusts 3×12', 'Dead bug 3×8'] },
            { name: 'Rest', exercises: ['Active recovery or rest'] },
            { name: 'Full Body C', exercises: ['Step-ups 3×10', 'Pike push-ups 3×8', 'Bent-over rows 3×10', 'Romanian deadlift 3×10', 'Side plank 2×20s'] },
            { name: 'Rest', exercises: ['Rest'] },
            { name: 'Rest', exercises: ['Rest'] },
          ]
        }
      },
      cardio: {
        3: {
          name: 'Cardio Base Build',
          science: 'Zone 2 training (conversational pace) builds aerobic base. Beginners benefit most from consistent low-intensity before adding intervals.',
          days: [
            { name: 'Easy Run/Walk', exercises: ['20 min at conversational pace', 'Heart rate: 60–70% max', 'Warm-up 5 min walk'] },
            { name: 'Rest', exercises: ['Rest or gentle yoga'] },
            { name: 'Interval Day', exercises: ['5 min warm-up', '6× (1 min run + 2 min walk)', '5 min cool down walk'] },
            { name: 'Rest', exercises: ['Rest'] },
            { name: 'Longer Effort', exercises: ['30 min steady pace', 'Should feel challenging but sustainable'] },
            { name: 'Rest', exercises: ['Rest'] },
            { name: 'Rest', exercises: ['Rest'] },
          ]
        }
      },
      weight_loss: {
        4: {
          name: 'Metabolic Foundation',
          science: 'Combining resistance training with cardio maximises EPOC (excess post-exercise oxygen consumption). Muscle mass increases basal metabolic rate.',
          days: [
            { name: 'Strength A', exercises: ['Squats 3×15', 'Push-ups 3×10', 'Rows 3×12', 'Plank 3×30s'] },
            { name: 'Cardio', exercises: ['30 min brisk walk or light jog', 'Aim for slight breathlessness'] },
            { name: 'Strength B', exercises: ['Lunges 3×12', 'Shoulder press 3×10', 'Deadlift 3×10', 'Mountain climbers 3×20'] },
            { name: 'HIIT', exercises: ['5 min warm-up', '4× (40s work / 20s rest): burpees, jump squats, high knees, push-ups', '5 min cool down'] },
            { name: 'Rest', exercises: ['Rest'] },
            { name: 'Active', exercises: ['30 min walk, swim, or yoga'] },
            { name: 'Rest', exercises: ['Rest'] },
          ]
        }
      }
    },
    intermediate: {
      strength: {
        4: {
          name: 'Upper/Lower Split',
          science: 'Upper/lower split allows 2× frequency per muscle group per week — optimal for hypertrophy per meta-analysis (Schoenfeld, 2016). Progressive overload is non-negotiable.',
          days: [
            { name: 'Upper A (Push)', exercises: ['Bench press 4×8', 'Overhead press 3×10', 'Incline DB press 3×12', 'Lateral raises 3×15', 'Tricep dips 3×10'] },
            { name: 'Lower A', exercises: ['Squat 4×8', 'Romanian deadlift 3×10', 'Leg press 3×12', 'Walking lunges 3×12', 'Calf raises 4×15'] },
            { name: 'Rest / Cardio', exercises: ['20–30 min zone 2 cardio optional'] },
            { name: 'Upper B (Pull)', exercises: ['Pull-ups / lat pulldown 4×8', 'Barbell rows 3×10', 'Cable rows 3×12', 'Face pulls 3×15', 'Bicep curls 3×12'] },
            { name: 'Lower B', exercises: ['Deadlift 4×6', 'Front squat 3×8', 'Leg curl 3×12', 'Hip thrust 4×10', 'Reverse lunges 3×10'] },
            { name: 'Rest', exercises: ['Rest'] },
            { name: 'Rest', exercises: ['Rest'] },
          ]
        }
      },
      cardio: {
        5: {
          name: '80/20 Polarised Training',
          science: '80/20 rule (Seiler, 2010): 80% of training at low intensity, 20% at high. Used by elite endurance athletes. Prevents overtraining while building VO2max.',
          days: [
            { name: 'Easy Run', exercises: ['40–50 min zone 2', 'Fully conversational pace'] },
            { name: 'Intervals', exercises: ['10 min warm-up', '5× 4 min at hard effort / 3 min easy', '10 min cool down'] },
            { name: 'Easy Run', exercises: ['30–40 min easy'] },
            { name: 'Rest', exercises: ['Rest or yoga'] },
            { name: 'Tempo Run', exercises: ['10 min warm-up', '20–25 min at comfortably hard pace', '10 min cool down'] },
            { name: 'Long Run', exercises: ['60–75 min easy — this builds aerobic base'] },
            { name: 'Rest', exercises: ['Full rest'] },
          ]
        }
      }
    }
  }

  const levelPlan = plans[level] || plans.beginner
  const goalPlan = levelPlan[goal] || levelPlan.strength
  const daysPlan = goalPlan[days] || goalPlan[Object.keys(goalPlan)[0]]
  return daysPlan
}

export default function Physical({ session }) {
  const [view, setView] = useState('log')
  const [workouts, setWorkouts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [nw, setNw] = useState({ activity: 'calisthenics', duration_minutes: 30, intensity: 'moderate', notes: '', date: format(new Date(), 'yyyy-MM-dd') })
  const [activePlan, setActivePlan] = useState(null)
  // Plan generator state
  const [planConfig, setPlanConfig] = useState({ level: 'beginner', goal: 'strength', days: 3, duration: 45, equipment: 'minimal' })
  const [generatedPlan, setGeneratedPlan] = useState(null)

  useEffect(() => { fetchWorkouts(); fetchActivePlan() }, [])

  async function fetchWorkouts() {
    const { data } = await supabase.from('workouts').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(30)
    setWorkouts(data || [])
  }

  async function add(e) {
    e.preventDefault()
    const { data } = await supabase.from('workouts').insert({ user_id: session.user.id, ...nw }).select().single()
    if (data) setWorkouts(p => [data, ...p])
    setShowAdd(false)
    setNw({ activity: 'calisthenics', duration_minutes: 30, intensity: 'moderate', notes: '', date: format(new Date(), 'yyyy-MM-dd') })
  }

  async function fetchActivePlan() {
    const { data } = await supabase.from('workout_plans')
      .select('*').eq('user_id', session.user.id).eq('active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (data) setActivePlan(data)
  }

  async function savePlan() {
    if (!generatedPlan) return
    await supabase.from('workout_plans').update({ active: false }).eq('user_id', session.user.id)
    const { data } = await supabase.from('workout_plans').insert({
      user_id: session.user.id,
      name: generatedPlan.name,
      config: planConfig,
      plan: generatedPlan,
      active: true,
      start_date: format(new Date(), 'yyyy-MM-dd'),
    }).select().single()
    if (data) {
      setActivePlan(data)
      alert(`Plan saved! "${generatedPlan.name}" is now your active plan.`)
    }
  }

  function buildPlan() {
    const plan = generatePlan(planConfig)
    setGeneratedPlan(plan)
  }

  const getAct = id => ACTIVITIES.find(a => a.id === id) || ACTIVITIES[10]
  const totalMins = workouts.reduce((s, w) => s + (w.duration_minutes || 0), 0)
  const thisWeek = workouts.filter(w => w.date >= format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd')).length

  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-sans)' }
  const optBtn = (active, color = 'var(--gold-300)') => ({ padding: '7px 14px', borderRadius: '8px', border: `0.5px solid ${active ? color : 'var(--base-600)'}`, background: active ? color + '18' : 'transparent', color: active ? color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', transition: 'all 0.15s' })

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Physical</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>movement is medicine ✦</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            {[{ id: 'log', label: '↑ Log' }, { id: 'plan', label: '◈ Build Plan' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', background: view === v.id ? 'var(--gold-300)' : 'transparent', color: view === v.id ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s' }}>{v.label}</button>
            ))}
          </div>
          {view === 'log' && (
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Log session</button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { val: thisWeek, label: 'sessions this week' },
          { val: workouts.length, label: 'total logged' },
          { val: `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`, label: 'total time' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--gold-300)', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* LOG VIEW */}
      {view === 'log' && activePlan && (() => {
        const dayIndex = Math.floor((new Date() - new Date(activePlan.start_date)) / 86400000) % 7
        const todayWorkout = activePlan.plan?.days?.[dayIndex]
        if (!todayWorkout) return null
        return (
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>today's workout — {activePlan.name}</p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', color: 'var(--cream-200)', margin: 0 }}>{todayWorkout.name}</p>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Day {dayIndex + 1}/7</span>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {todayWorkout.exercises?.map((ex, i) => (
                <div key={i} style={{ background: 'var(--base-900)', borderRadius: '12px', padding: '12px', fontSize: '12px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)' }}>
                  {ex}
                </div>
              ))}
            </div>
          </div>
        )
      })()}
      {view === 'log' && (
        workouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>no sessions yet ✦</p>
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '20px' }}>Log your first session — chess counts too.</p>
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>Log your first session</button>
          </div>
        ) : workouts.map(w => {
          const act = getAct(w.activity)
          return (
            <div key={w.id} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: act.color + '22', border: `1.5px solid ${act.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: act.color, flexShrink: 0 }}>{act.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, marginBottom: '4px' }}>{act.label}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '99px', background: act.color + '22', color: act.color, fontFamily: 'var(--font-sans)' }}>{w.intensity}</span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{w.duration_minutes} min</span>
                  {w.notes && <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>{w.notes}</span>}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>{w.date}</span>
            </div>
          )
        })
      )}

      {/* PLAN VIEW */}
      {view === 'plan' && (
        <div>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '20px', lineHeight: 1.7 }}>
              Built on ACSM guidelines, Schoenfeld hypertrophy research, and Seiler's polarised training model. Answer 4 questions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={lStyle}>Experience level</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ id: 'beginner', label: 'Beginner', desc: '< 6 months' }, { id: 'intermediate', label: 'Intermediate', desc: '6m–2 years' }, { id: 'advanced', label: 'Advanced', desc: '2+ years' }].map(l => (
                    <button key={l.id} onClick={() => setPlanConfig(p => ({ ...p, level: l.id }))} style={{ ...optBtn(planConfig.level === l.id), padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{l.label}</span>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lStyle}>Primary goal</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'strength', label: 'Build strength' },
                    { id: 'cardio', label: 'Cardio / endurance' },
                    { id: 'weight_loss', label: 'Fat loss' },
                    { id: 'general', label: 'General fitness' },
                  ].map(g => <button key={g.id} onClick={() => setPlanConfig(p => ({ ...p, goal: g.id }))} style={optBtn(planConfig.goal === g.id)}>{g.label}</button>)}
                </div>
              </div>

              <div>
                <label style={lStyle}>Days per week</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[2, 3, 4, 5, 6].map(d => <button key={d} onClick={() => setPlanConfig(p => ({ ...p, days: d }))} style={optBtn(planConfig.days === d)}>{d} days</button>)}
                </div>
              </div>

              <div>
                <label style={lStyle}>Equipment available</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'none', label: 'None (bodyweight)' },
                    { id: 'minimal', label: 'Minimal (bands/dumbbells)' },
                    { id: 'gym', label: 'Full gym' },
                  ].map(e => <button key={e.id} onClick={() => setPlanConfig(p => ({ ...p, equipment: e.id }))} style={optBtn(planConfig.equipment === e.id)}>{e.label}</button>)}
                </div>
              </div>
            </div>

            <button onClick={buildPlan} style={{ marginTop: '24px', width: '100%', padding: '14px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--base-950)' }}>
              Generate my plan ✦
            </button>
          </div>

          {generatedPlan && (
            <div>
              <div style={{ background: 'rgba(168,196,160,0.06)', border: '0.5px solid rgba(168,196,160,0.3)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', color: '#a8c4a0', marginBottom: '6px' }}>{generatedPlan.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.6 }}>✦ {generatedPlan.science}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {generatedPlan.days.map((day, i) => (
                  <div key={i} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: day.exercises[0] !== 'Rest' ? '12px' : 0 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: day.name.includes('Rest') ? 'var(--base-700)' : 'var(--gold-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: day.name.includes('Rest') ? 'var(--muted)' : 'var(--base-950)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontStyle: 'italic', color: day.name.includes('Rest') ? 'var(--muted)' : 'var(--cream-200)' }}>{day.name}</p>
                    </div>
                    {!day.name.includes('Rest') && (
                      <div style={{ marginLeft: '40px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {day.exercises.map((ex, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold-300)', flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)' }}>{ex}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={savePlan} style={{ marginTop: '16px', width: '100%', padding: '13px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--base-950)' }}>
                save as my active plan ✦
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Log Session</h3>
            <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lStyle}>Activity</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ACTIVITIES.map(a => <button key={a.id} type="button" onClick={() => setNw(p => ({ ...p, activity: a.id }))} style={{ padding: '6px 12px', borderRadius: '8px', border: `0.5px solid ${nw.activity === a.id ? a.color : 'var(--base-600)'}`, background: nw.activity === a.id ? a.color + '22' : 'transparent', color: nw.activity === a.id ? a.color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px' }}>{a.icon} {a.label}</button>)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Duration (min)</label><input type="number" value={nw.duration_minutes} onChange={e => setNw(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} min={1} style={iStyle} /></div>
                <div><label style={lStyle}>Intensity</label>
                  <select value={nw.intensity} onChange={e => setNw(p => ({ ...p, intensity: e.target.value }))} style={iStyle}>
                    {['light', 'moderate', 'intense'].map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Date</label><input type="date" value={nw.date} onChange={e => setNw(p => ({ ...p, date: e.target.value }))} style={{ ...iStyle, colorScheme: 'dark' }} /></div>
                <div><label style={lStyle}>Notes</label><input value={nw.notes} onChange={e => setNw(p => ({ ...p, notes: e.target.value }))} placeholder="How it felt, PRs..." style={iStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Log ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}