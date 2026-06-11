import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BADGE_DEFS = [
  { id: 'onboarded', icon: '✦', name: 'Evolved', desc: 'Completed EVOLVE onboarding', color: '#c9a87c', rarity: 'common' },
  { id: 'first_focus', icon: '◷', name: 'Ignition', desc: 'Completed your first focus session', color: '#c9a87c', rarity: 'common' },
  { id: 'focus_10', icon: '◷', name: 'Flow State', desc: '10 focus sessions logged', color: '#9eb5d4', rarity: 'uncommon' },
  { id: 'focus_50', icon: '◷', name: 'The Obsessed', desc: '50 focus sessions logged', color: '#e8c97e', rarity: 'rare' },
  { id: 'deep_work', icon: '◷', name: 'Deep Worker', desc: 'Completed a 90-minute session', color: '#9eb5d4', rarity: 'uncommon' },
  { id: 'first_habit', icon: '◎', name: 'First Steps', desc: 'Logged your first habit completion', color: '#a8c4a0', rarity: 'common' },
  { id: 'habit_streak_7', icon: '◎', name: 'Week One', desc: 'Completed habits 7 days in a row', color: '#a8c4a0', rarity: 'uncommon' },
  { id: 'habit_streak_30', icon: '◎', name: 'Iron Will', desc: 'Completed habits 30 days in a row', color: '#e8c97e', rarity: 'rare' },
  { id: 'first_journal', icon: '✦', name: 'Inner Voice', desc: 'Wrote your first journal entry', color: '#d4a5a5', rarity: 'common' },
  { id: 'journal_14', icon: '✦', name: 'The Chronicler', desc: '14 journal entries written', color: '#d4a5a5', rarity: 'uncommon' },
  { id: 'first_brain', icon: '◈', name: 'Idea Seed', desc: 'Created your first brainstorm project', color: '#c9a87c', rarity: 'common' },
  { id: 'brain_5', icon: '◈', name: 'Idea Garden', desc: '5 brainstorm projects', color: '#b8a8d4', rarity: 'uncommon' },
  { id: 'first_workout', icon: '↑', name: 'Moving', desc: 'Logged your first workout', color: '#d4a5a5', rarity: 'common' },
  { id: 'workout_20', icon: '↑', name: 'Athlete', desc: '20 workouts logged', color: '#e8c97e', rarity: 'rare' },
  { id: 'side_quest', icon: '♡', name: 'Side Quester', desc: 'Added your first hobby', color: '#b8a8d4', rarity: 'common' },
  { id: 'recovery', icon: '◌', name: 'Self-Aware', desc: 'Used a scenario flag (recovery day)', color: '#9eb5d4', rarity: 'uncommon' },
  { id: 'first_coach', icon: '◈', name: 'Introspective', desc: 'Had your first Life Coach session', color: '#c9a87c', rarity: 'common' },
  { id: 'challenge_complete', icon: '⊗', name: 'Challenger', desc: 'Completed all 3 daily challenges', color: '#a8c4a0', rarity: 'uncommon' },
]

const RARITY_COLORS = { common: '#8a7060', uncommon: '#a8c4a0', rare: '#e8c97e', legendary: '#e8c4c4' }
const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, legendary: 3 }

export default function Badges({ session, compact = false }) {
  const [unlockedIds, setUnlockedIds] = useState(new Set())
  const [newBadge, setNewBadge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => { loadAndCheck() }, [])

  async function loadAndCheck() {
    const uid = session.user.id
    try {
      // Load existing achievements
      const { data: existing } = await supabase.from('achievements').select('badge_id, unlocked_at').eq('user_id', uid)
      const ids = new Set((existing || []).map(e => e.badge_id))
      setUnlockedIds(ids)

      // Gather stats for checking new badges
      const [
        { count: focusCount },
        { count: habitCount },
        { count: journalCount },
        { count: brainCount },
        { count: workoutCount },
        { count: hobbyCount },
        { count: flagCount },
        { count: coachCount },
        { data: profile },
        { data: longSession },
        { data: challenges },
      ] = await Promise.all([
        supabase.from('focus_sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('brainstorm_projects').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('hobbies').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('scenario_flags').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('life_coach_messages').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('role', 'user'),
        supabase.from('profiles').select('onboarded').eq('id', uid).single(),
        supabase.from('focus_sessions').select('duration_minutes').eq('user_id', uid).gte('duration_minutes', 85).limit(1),
        supabase.from('daily_challenges').select('completed, challenges').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
      ])

      // Check habit streak
      const { data: habitLogs } = await supabase.from('habit_logs').select('completed_on').eq('user_id', uid).order('completed_on', { ascending: false }).limit(60)
      const streak = calcStreak(habitLogs || [])

      // Check challenge completion
      const allChallengesDone = (challenges || []).some(c => {
        const done = c.completed || []
        const total = c.challenges || []
        return done.length >= 3 && total.length >= 3
      })

      const earned = {
        onboarded: profile?.onboarded,
        first_focus: (focusCount || 0) >= 1,
        focus_10: (focusCount || 0) >= 10,
        focus_50: (focusCount || 0) >= 50,
        deep_work: (longSession || []).length > 0,
        first_habit: (habitCount || 0) >= 1,
        habit_streak_7: streak >= 7,
        habit_streak_30: streak >= 30,
        first_journal: (journalCount || 0) >= 1,
        journal_14: (journalCount || 0) >= 14,
        first_brain: (brainCount || 0) >= 1,
        brain_5: (brainCount || 0) >= 5,
        first_workout: (workoutCount || 0) >= 1,
        workout_20: (workoutCount || 0) >= 20,
        side_quest: (hobbyCount || 0) >= 1,
        recovery: (flagCount || 0) >= 1,
        first_coach: (coachCount || 0) >= 1,
        challenge_complete: allChallengesDone,
      }

      // Find newly earned
      const toUnlock = Object.entries(earned)
        .filter(([id, val]) => val && !ids.has(id))
        .map(([id]) => id)

      if (toUnlock.length > 0) {
        const inserts = toUnlock.map(id => ({ user_id: uid, badge_id: id }))
        await supabase.from('achievements').insert(inserts)
        const newIds = new Set([...ids, ...toUnlock])
        setUnlockedIds(newIds)
        const firstNew = BADGE_DEFS.find(b => b.id === toUnlock[0])
        if (firstNew) { setNewBadge(firstNew); setTimeout(() => setNewBadge(null), 4000) }
      }
    } catch (e) {
      console.error('Badge check error:', e)
    }
    setLoading(false)
  }

  function calcStreak(logs) {
    if (!logs.length) return 0
    const dates = [...new Set(logs.map(l => l.completed_on))].sort().reverse()
    let streak = 0
    let prev = null
    for (const d of dates) {
      if (!prev) { streak = 1; prev = d; continue }
      const diff = (new Date(prev) - new Date(d)) / 86400000
      if (diff === 1) { streak++; prev = d } else break
    }
    return streak
  }

  const unlocked = BADGE_DEFS.filter(b => unlockedIds.has(b.id))
  const locked = BADGE_DEFS.filter(b => !unlockedIds.has(b.id))

  if (loading) return (
    <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', color: 'var(--muted)' }}>checking achievements...</p>
    </div>
  )

  if (compact) return (
    <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Badges</span>
        <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{unlocked.length}/{BADGE_DEFS.length} unlocked</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {unlocked.length === 0 ? (
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>keep going — badges unlock automatically ✦</p>
        ) : unlocked.map(b => (
          <div key={b.id} title={`${b.name}: ${b.desc}`} style={{ width: '34px', height: '34px', borderRadius: '8px', background: b.color + '22', border: `1px solid ${b.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{b.icon}</div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', position: 'relative' }}>
      {newBadge && (
        <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 9999, background: 'var(--base-800)', border: `1px solid ${newBadge.color}`, borderRadius: '18px', padding: '18px 22px', display: 'flex', gap: '14px', alignItems: 'center', boxShadow: `0 8px 40px ${newBadge.color}44`, animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ fontSize: '36px', filter: `drop-shadow(0 0 8px ${newBadge.color})` }}>{newBadge.icon}</div>
          <div>
            <p style={{ fontSize: '9px', color: newBadge.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '3px' }}>badge unlocked ✦</p>
            <p style={{ fontSize: '17px', color: 'var(--cream-200)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{newBadge.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '2px' }}>{newBadge.desc}</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px' }}>Badges</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
          {unlocked.length} of {BADGE_DEFS.length} unlocked ✦ earned automatically as you use EVOLVE
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '14px 20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{unlocked.length} earned</span>
          <span style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{Math.round((unlocked.length / BADGE_DEFS.length) * 100)}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-300), var(--rose-300))', width: `${(unlocked.length / BADGE_DEFS.length) * 100}%`, borderRadius: '99px', transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {unlocked.length > 0 && (
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-sans)', marginBottom: '16px' }}>Earned ({unlocked.length})</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {unlocked.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]).map(b => (
              <div key={b.id} style={{ background: b.color + '0f', border: `1px solid ${b.color}44`, borderRadius: '16px', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${b.color}, transparent)` }} />
                <div style={{ fontSize: '36px', marginBottom: '12px', filter: `drop-shadow(0 0 10px ${b.color}88)` }}>{b.icon}</div>
                <p style={{ fontSize: '15px', color: b.color, fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '5px' }}>{b.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, marginBottom: '8px' }}>{b.desc}</p>
                <span style={{ fontSize: '9px', color: RARITY_COLORS[b.rarity], fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '99px', border: `0.5px solid ${RARITY_COLORS[b.rarity]}44` }}>{b.rarity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-sans)', marginBottom: '16px' }}>Locked ({locked.length})</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {locked.map(b => (
            <div key={b.id} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '16px', padding: '20px', textAlign: 'center', opacity: 0.4 }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', filter: 'grayscale(1) brightness(0.5)' }}>{b.icon}</div>
              <p style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '5px' }}>{b.name}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, marginBottom: '8px' }}>{b.desc}</p>
              <span style={{ fontSize: '9px', color: RARITY_COLORS[b.rarity], fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{b.rarity}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}