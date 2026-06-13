import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BADGE_DEFS = [
  { id: 'first_focus', icon: '◷', name: 'Ignition', desc: 'Completed your first focus session — the hardest one is always the first', color: '#c9a87c', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'focus_10', icon: '◈', name: 'Flow State', desc: '10 focus sessions logged — you\'ve built a real practice', color: '#c9a87c', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 10 } },
  { id: 'deep_work', icon: '◉', name: 'Deep Worker', desc: 'Completed a 90-minute session — entered the state where mastery happens', color: '#9eb5d4', rarity: 'uncommon', check: async (uid) => { const { data } = await supabase.from('focus_sessions').select('duration_minutes').eq('user_id', uid).gte('duration_minutes', 85).limit(1); return data?.length > 0 } },
  { id: 'focus_50', icon: '◎', name: 'The Obsessed', desc: '50 focus sessions logged — you\'re in the top 5% of focused humans', color: '#e8c97e', rarity: 'rare', check: async (uid) => { const { count } = await supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 50 } },
  { id: 'first_habit', icon: '◌', name: 'First Steps', desc: 'Logged your first habit — identity shift begins here', color: '#a8c4a0', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'habit_7', icon: '◍', name: 'Week One', desc: '7-day habit streak — neuroplasticity is visibly starting', color: '#a8c4a0', rarity: 'uncommon', check: async (uid, p) => { return (p?.streak || 0) >= 7 } },
  { id: 'habit_30', icon: '●', name: 'Iron Will', desc: '30 consecutive habit days — the habit is now part of who you are', color: '#e8c97e', rarity: 'rare', check: async (uid, p) => { return (p?.streak || 0) >= 30 } },
  { id: 'first_brain', icon: '✦', name: 'Idea Seed', desc: 'Created your first brainstorm project — every great thing started as a thought', color: '#c9a87c', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('brainstorm_projects').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'brain_5', icon: '✧', name: 'Idea Garden', desc: '5 brainstorm projects created — you think in systems, not just moments', color: '#b8a8d4', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('brainstorm_projects').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 5 } },
  { id: 'first_journal', icon: '◇', name: 'Inner Voice', desc: 'Wrote your first journal entry — self-reflection is a superpower', color: '#d4a5a5', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'journal_14', icon: '◆', name: 'Chronicler', desc: '14 journal entries written — you know yourself better than 95% of people', color: '#d4a5a5', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 14 } },
  { id: 'first_workout', icon: '↑', name: 'Moving', desc: 'Logged your first workout — movement is medicine', color: '#d4a5a5', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'workout_20', icon: '⇑', name: 'Athlete', desc: '20 workouts logged — your baseline has permanently shifted', color: '#e8c97e', rarity: 'rare', check: async (uid) => { const { count } = await supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 20 } },
  { id: 'onboarded', icon: '◐', name: 'Evolved', desc: 'Completed EVOLVE onboarding — you committed to the process', color: '#c9a87c', rarity: 'common', check: async (uid) => { const { data } = await supabase.from('profiles').select('onboarded').eq('id', uid).single(); return data?.onboarded } },
  { id: 'side_quest', icon: '♡', name: 'Side Quester', desc: 'Added your first hobby — life is more than productivity', color: '#b8a8d4', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('hobbies').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'recovery', icon: '◑', name: 'Self-Aware', desc: 'Used a recovery skip to protect a streak — knowing your limits is strength', color: '#9eb5d4', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('scenario_flags').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
]

const RARITY_COLORS = { common: '#8a7060', uncommon: '#a8c4a0', rare: '#e8c97e', legendary: '#e8c4c4' }

export default function Badges({ session }) {
  const [unlocked, setUnlocked] = useState([])
  const [newBadge, setNewBadge] = useState(null)

  useEffect(() => { checkBadges() }, [])

  async function checkBadges() {
    const uid = session.user.id
    const { data: existing } = await supabase.from('achievements').select('badge_id').eq('user_id', uid)
    const existingIds = new Set((existing || []).map(e => e.badge_id))
    setUnlocked(existing || [])

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single()
    const toUnlock = []
    for (const badge of BADGE_DEFS) {
      if (existingIds.has(badge.id)) continue
      try {
        const earned = await badge.check(uid, profile)
        if (earned) toUnlock.push(badge.id)
      } catch (e) {}
    }

    if (toUnlock.length > 0) {
      const inserts = toUnlock.map(id => ({ user_id: uid, badge_id: id }))
      const { data: newOnes } = await supabase.from('achievements').insert(inserts).select()
      if (newOnes?.length) {
        setUnlocked(p => [...p, ...newOnes])
        setNewBadge(BADGE_DEFS.find(b => b.id === newOnes[0].badge_id))
        setTimeout(() => setNewBadge(null), 4000)
      }
    }
  }

  const unlockedIds = new Set(unlocked.map(u => u.badge_id))
  const unlockedBadges = BADGE_DEFS.filter(b => unlockedIds.has(b.id))
  const lockedBadges = BADGE_DEFS.filter(b => !unlockedIds.has(b.id))

  return (
    <div style={{ padding: '32px', maxWidth: '900px', position: 'relative' }}>
      {newBadge && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: 'var(--base-800)', border: `1px solid ${newBadge.color}`, borderRadius: '16px', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', boxShadow: `0 0 40px ${newBadge.color}44`, animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div style={{ fontSize: '32px' }}>{newBadge.icon}</div>
          <div>
            <p style={{ fontSize: '10px', color: newBadge.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>badge unlocked</p>
            <p style={{ fontSize: '16px', color: 'var(--cream-200)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{newBadge.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{newBadge.desc}</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px' }}>Badges</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{unlockedBadges.length} of {BADGE_DEFS.length} unlocked ✦</p>
      </div>

      {unlockedBadges.length > 0 && (
        <>
          <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '14px' }}>Earned</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '32px' }}>
            {unlockedBadges.map(b => (
              <div key={b.id} style={{ background: b.color + '0f', border: `0.5px solid ${b.color}44`, borderRadius: '14px', padding: '18px', textAlign: 'center', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px', filter: `drop-shadow(0 0 8px ${b.color}88)` }}>{b.icon}</div>
                <p style={{ fontSize: '14px', color: b.color, fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '4px' }}>{b.name}</p>
                <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{b.desc}</p>
                <div style={{ marginTop: '8px', fontSize: '9px', color: RARITY_COLORS[b.rarity], fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{b.rarity}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '14px' }}>Locked</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
        {lockedBadges.map(b => (
          <div key={b.id} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '18px', textAlign: 'center', opacity: 0.45 }}>
            <div style={{ fontSize: '32px', marginBottom: '10px', filter: 'grayscale(1)' }}>{b.icon}</div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '4px' }}>{b.name}</p>
            <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{b.desc}</p>
            <div style={{ marginTop: '8px', fontSize: '9px', color: RARITY_COLORS[b.rarity], fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{b.rarity}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}