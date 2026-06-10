import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BADGE_DEFS = [
  { id: 'first_focus', icon: '◷', name: 'Ignition', desc: 'First focus session — the hardest one is always the first', color: '#c9a87c', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'focus_10', icon: '◈', name: 'Flow State', desc: '10 focus sessions — you\'ve built a real practice', color: '#c9a87c', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 10 } },
  { id: 'deep_work', icon: '◉', name: 'Deep Worker', desc: '90-min session — entered the state where mastery happens', color: '#9eb5d4', rarity: 'uncommon', check: async (uid) => { const { data } = await supabase.from('focus_sessions').select('duration_minutes').eq('user_id', uid).gte('duration_minutes', 85).limit(1); return data?.length > 0 } },
  { id: 'focus_50', icon: '◎', name: 'The Obsessed', desc: '50 sessions — you\'re in the top 5% of focused humans', color: '#e8c97e', rarity: 'rare', check: async (uid) => { const { count } = await supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 50 } },
  { id: 'first_habit', icon: '◌', name: 'First Steps', desc: 'Logged your first habit — identity shift begins here', color: '#a8c4a0', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'habit_7', icon: '◍', name: 'Week One', desc: '7-day streak — neuroplasticity is visibly starting', color: '#a8c4a0', rarity: 'uncommon', check: async (uid, p) => { return (p?.streak || 0) >= 7 } },
  { id: 'habit_30', icon: '●', name: 'Iron Will', desc: '30 days — the habit is now part of who you are', color: '#e8c97e', rarity: 'rare', check: async (uid, p) => { return (p?.streak || 0) >= 30 } },
  { id: 'first_brain', icon: '✦', name: 'Idea Seed', desc: 'First brainstorm — every great thing started as a thought', color: '#c9a87c', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('brainstorm_projects').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'brain_5', icon: '✧', name: 'Idea Garden', desc: '5 projects — you think in systems, not just moments', color: '#b8a8d4', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('brainstorm_projects').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 5 } },
  { id: 'first_journal', icon: '◇', name: 'Inner Voice', desc: 'First journal entry — self-reflection is a superpower', color: '#d4a5a5', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'journal_14', icon: '◆', name: 'Chronicler', desc: '14 entries — you know yourself better than 95% of people', color: '#d4a5a5', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 14 } },
  { id: 'first_workout', icon: '↑', name: 'Moving', desc: 'First workout logged — movement is medicine', color: '#d4a5a5', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'workout_20', icon: '⇑', name: 'Athlete', desc: '20 workouts — your baseline has permanently shifted', color: '#e8c97e', rarity: 'rare', check: async (uid) => { const { count } = await supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 20 } },
  { id: 'onboarded', icon: '◐', name: 'Evolved', desc: 'Completed onboarding — you committed to the process', color: '#c9a87c', rarity: 'common', check: async (uid) => { const { data } = await supabase.from('profiles').select('onboarded').eq('id', uid).single(); return data?.onboarded } },
  { id: 'side_quest', icon: '♡', name: 'Side Quester', desc: 'Added your first hobby — life is more than productivity', color: '#b8a8d4', rarity: 'common', check: async (uid) => { const { count } = await supabase.from('hobbies').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
  { id: 'recovery', icon: '◑', name: 'Self-Aware', desc: 'Used a recovery skip — knowing your limits is strength', color: '#9eb5d4', rarity: 'uncommon', check: async (uid) => { const { count } = await supabase.from('scenario_flags').select('id', { count: 'exact', head: true }).eq('user_id', uid); return count >= 1 } },
]

export default function Badges({ session }) {
  const [unlocked, setUnlocked] = useState([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null)
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
      try { const earned = await badge.check(uid, profile); if (earned) toUnlock.push(badge.id) } catch {}
    }
    if (toUnlock.length > 0) {
      const { data: newOnes } = await supabase.from('achievements').insert(toUnlock.map(id => ({ user_id: uid, badge_id: id }))).select()
      if (newOnes?.length) {
        setUnlocked(p => [...p, ...newOnes])
        setNewBadge(BADGE_DEFS.find(b => b.id === newOnes[0].badge_id))
        setTimeout(() => setNewBadge(null), 4000)
      }
    }
    setLoading(false)
  }

  const unlockedIds = new Set(unlocked.map(u => u.badge_id))

  return (
    <div style={{ position: 'relative' }}>
      {/* New badge toast */}
      {newBadge && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: 'var(--base-800)', border: `1px solid ${newBadge.color}`, borderRadius: '14px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: `0 0 40px ${newBadge.color}44`, animation: 'toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <span style={{ fontSize: '24px', filter: `drop-shadow(0 0 8px ${newBadge.color})` }}>{newBadge.icon}</span>
          <div>
            <p style={{ fontSize: '9px', color: newBadge.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>badge unlocked</p>
            <p style={{ fontSize: '14px', color: 'var(--cream-200)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{newBadge.name}</p>
          </div>
        </div>
      )}

      {/* Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{unlocked.length}/{BADGE_DEFS.length} unlocked</span>
      </div>

      {/* Icon grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {BADGE_DEFS.map(badge => {
          const earned = unlockedIds.has(badge.id)
          return (
            <div
              key={badge.id}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltip({ badge, x: rect.left, y: rect.top })
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: earned ? badge.color + '22' : 'var(--base-700)',
                border: `1px solid ${earned ? badge.color + '88' : 'var(--base-600)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', cursor: 'default',
                filter: earned ? 'none' : 'grayscale(1)',
                opacity: earned ? 1 : 0.35,
                transition: 'all 0.2s',
                color: earned ? badge.color : 'var(--muted)',
                boxShadow: earned ? `0 0 8px ${badge.color}33` : 'none',
              }}
            >
              {badge.icon}
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 34,
          top: tooltip.y - 8,
          zIndex: 9999,
          background: 'var(--base-800)',
          border: `0.5px solid ${tooltip.badge.color}66`,
          borderRadius: '10px',
          padding: '10px 14px',
          maxWidth: '200px',
          pointerEvents: 'none',
          boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
        }}>
          <p style={{ fontSize: '12px', color: tooltip.badge.color, fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '4px' }}>{tooltip.badge.name}</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{tooltip.badge.desc}</p>
          <p style={{ fontSize: '9px', color: unlockedIds.has(tooltip.badge.id) ? '#a8c4a0' : 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {unlockedIds.has(tooltip.badge.id) ? '✓ earned' : 'locked'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(16px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  )
}