import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const HORIZONS = [
  { id: '1month', label: '1 month', color: '#d4a5a5' },
  { id: '3months', label: '3 months', color: '#c9a87c' },
  { id: '1year', label: '1 year', color: '#9eb5d4' },
  { id: '5years', label: '5 years', color: '#a8c4a0' },
  { id: 'dream', label: 'Big dream', color: '#b8a8d4' },
]
const CATEGORIES = [
  { id: 'academic', label: 'Academic', color: '#c9a87c' },
  { id: 'career', label: 'Career', color: '#9eb5d4' },
  { id: 'physical', label: 'Physical', color: '#d4a5a5' },
  { id: 'creative', label: 'Creative', color: '#a8c4a0' },
  { id: 'financial', label: 'Financial', color: '#7fc4b0' },
  { id: 'social', label: 'Relationships', color: '#d4b8a0' },
  { id: 'personal', label: 'Personal', color: '#b8a8d4' },
]
const VALUES = ['Curiosity', 'Excellence', 'Courage', 'Authenticity', 'Discipline', 'Creativity', 'Connection', 'Freedom', 'Growth', 'Impact', 'Integrity', 'Joy', 'Leadership', 'Learning', 'Resilience', 'Wisdom']
const REVIEW_QS = ['What went well this week?', 'What did you let yourself down on — and why, honestly?', 'What\'s carrying into next week unfinished?', 'Which habit needs most attention right now?', 'What\'s your single #1 priority for next week?']

export default function Vision({ session }) {
  const [goals, setGoals] = useState([])
  const [view, setView] = useState('goals')
  const [showAdd, setShowAdd] = useState(false)
  const [ng, setNg] = useState({ title: '', horizon: '1year', category: 'personal' })
  const [horizonFilter, setHorizonFilter] = useState('all')
  const [values, setValues] = useState([])
  const [review, setReview] = useState({})
  const [reviewSaved, setReviewSaved] = useState(false)

  useEffect(() => { fetchGoals() }, [])

  async function fetchGoals() {
    const { data } = await supabase.from('goals').select('*').eq('user_id', session.user.id).order('created_at')
    setGoals(data || [])
  }

  async function addGoal(e) {
    e.preventDefault()
    const { data } = await supabase.from('goals').insert({ user_id: session.user.id, ...ng }).select().single()
    if (data) setGoals(p => [...p, data])
    setNg({ title: '', horizon: '1year', category: 'personal' }); setShowAdd(false)
  }

  async function toggleGoal(id, cur) {
    const status = cur === 'done' ? 'active' : 'done'
    await supabase.from('goals').update({ status }).eq('id', id)
    setGoals(p => p.map(g => g.id === id ? { ...g, status } : g))
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(p => p.filter(g => g.id !== id))
  }

  const getH = id => HORIZONS.find(h => h.id === id) || HORIZONS[2]
  const getC = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[6]
  const filtered = horizonFilter === 'all' ? goals : goals.filter(g => g.horizon === horizonFilter)
  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Vision</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>who you're becoming ✦</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '3px', gap: '2px' }
          }>
            {['goals','values','review'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', background: view === v ? 'var(--gold-300)' : 'transparent', color: view === v ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                {v === 'review' ? 'Weekly Review' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {view === 'goals' && (
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Goal</button>
          )}
        </div>
      </div>

      {view === 'goals' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => setHorizonFilter('all')} style={{ padding: '6px 14px', borderRadius: '8px', border: '0.5px solid var(--base-600)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: horizonFilter === 'all' ? 'var(--gold-300)' : 'transparent', color: horizonFilter === 'all' ? 'var(--base-950)' : 'var(--muted)' }}>All</button>
            {HORIZONS.map(h => (
              <button key={h.id} onClick={() => setHorizonFilter(h.id)} style={{ padding: '6px 14px', borderRadius: '8px', border: `0.5px solid ${h.color}44`, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: horizonFilter === h.id ? h.color : 'transparent', color: horizonFilter === h.id ? 'var(--base-950)' : h.color }}>
                {h.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>where are you going? ✦</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Set your first goal. No goal is too big or too small.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(goal => {
                const h = getH(goal.horizon)
                const c = getC(goal.category)
                const done = goal.status === 'done'
                return (
                  <div key={goal.id} style={{ background: 'var(--base-800)', border: `0.5px solid ${done ? 'rgba(201,168,124,0.3)' : 'var(--base-600)'}`, borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', opacity: done ? 0.6 : 1, transition: 'all 0.2s' }}>
                    <button onClick={() => toggleGoal(goal.id, goal.status)} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1.5px solid ${done ? 'var(--gold-300)' : 'var(--base-500)'}`, background: done ? 'var(--gold-300)' : 'transparent', cursor: 'pointer', flexShrink: 0, fontSize: '10px', color: 'var(--base-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {done && '✓'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', color: done ? 'var(--muted)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, textDecoration: done ? 'line-through' : 'none', marginBottom: '4px' }}>{goal.title}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '99px', background: h.color + '22', color: h.color, fontFamily: 'var(--font-sans)' }}>{h.label}</span>
                        <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '99px', background: c.color + '22', color: c.color, fontFamily: 'var(--font-sans)' }}>{c.label}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '16px', flexShrink: 0 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === 'values' && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '20px', lineHeight: 1.6 }}>
            Your values are the compass behind every decision. Pick 3–5 that are genuinely true — not aspirational, not what you think you should pick.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {VALUES.map(v => {
              const sel = values.includes(v)
              return (
                <button key={v} onClick={() => setValues(sel ? values.filter(x => x !== v) : values.length < 5 ? [...values, v] : values)} style={{ padding: '8px 16px', borderRadius: '12px', border: `0.5px solid ${sel ? 'var(--gold-300)' : 'var(--base-600)'}`, background: sel ? 'rgba(201,168,124,0.12)' : 'var(--base-800)', color: sel ? 'var(--gold-300)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: sel ? 500 : 300, transition: 'all 0.15s' }}>
                  {sel && '✦ '}{v}
                </button>
              )
            })}
          </div>
          {values.length > 0 && (
            <div style={{ background: 'var(--base-800)', border: '0.5px solid rgba(201,168,124,0.3)', borderRadius: '14px', padding: '1.5rem' }}>
              <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Your values</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {values.map((v, i) => (
                  <span key={v} style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--cream-200)' }}>
                    {v}{i < values.length - 1 ? ' ·' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {values.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
              Select up to 5 values above ↑
            </p>
          )}
        </div>
      )}

      {view === 'review' && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '20px', fontStyle: 'italic', lineHeight: 1.6 }}>
            The Sunday ritual. 10 minutes, every week. The most underrated productivity habit there is.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {REVIEW_QS.map((q, i) => (
              <div key={i} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1.25rem' }}>
                <span style={{ fontSize: '10px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>0{i + 1}</span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--cream-200)', margin: '6px 0 10px' }}>{q}</p>
                <textarea
                  value={review[`q${i}`] || ''}
                  onChange={e => setReview(p => ({ ...p, [`q${i}`]: e.target.value }))}
                  rows={2}
                  placeholder="Be honest with yourself..."
                  style={{ width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '8px', padding: '10px 12px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none', fontWeight: 300, lineHeight: 1.6 }}
                />
              </div>
            ))}
            <button
              onClick={() => { setReviewSaved(true); setTimeout(() => setReviewSaved(false), 3000) }}
              style={{ padding: '13px', background: reviewSaved ? 'var(--base-700)' : 'var(--gold-300)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: reviewSaved ? 'var(--muted)' : 'var(--base-950)', transition: 'all 0.2s' }}
            >
              {reviewSaved ? '✓ Review saved — see you next Sunday' : 'Save weekly review ✦'}
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Goal</h3>
            <form onSubmit={addGoal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lStyle}>Goal</label>
                <input value={ng.title} onChange={e => setNg(p => ({ ...p, title: e.target.value }))} placeholder="What do you want to achieve?" required autoFocus style={iStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lStyle}>Horizon</label>
                  <select value={ng.horizon} onChange={e => setNg(p => ({ ...p, horizon: e.target.value }))} style={iStyle}>
                    {HORIZONS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lStyle}>Category</label>
                  <select value={ng.category} onChange={e => setNg(p => ({ ...p, category: e.target.value }))} style={iStyle}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add Goal ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}