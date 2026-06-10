import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TRAITS = [
  { id: 'scholar', label: 'Scholar', icon: '◷', color: '#9eb5d4', desc: 'Focus sessions' },
  { id: 'warrior', label: 'Warrior', icon: '↑', color: '#d4a5a5', desc: 'Workouts logged' },
  { id: 'sage', label: 'Sage', icon: '✦', color: '#c9a87c', desc: 'Habit streaks' },
  { id: 'creator', label: 'Creator', icon: '◈', color: '#a8c4a0', desc: 'Brainstorm pages' },
  { id: 'explorer', label: 'Explorer', icon: '♡', color: '#b8a8d4', desc: 'Side quests active' },
]

function TraitRing({ trait, level, maxLevel = 10 }) {
  const pct = Math.min(level / maxLevel, 1)
  const r = 28
  const circ = 2 * Math.PI * r
  const [anim, setAnim] = useState(0)
  useEffect(() => { setTimeout(() => setAnim(pct), 200) }, [pct])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '70px', height: '70px' }}>
        <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="35" cy="35" r={r} fill="none" stroke="var(--base-600)" strokeWidth="4" />
          <circle cx="35" cy="35" r={r} fill="none" stroke={trait.color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - anim)}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '16px', color: trait.color }}>{trait.icon}</span>
          <span style={{ fontSize: '9px', color: trait.color, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>L{level}</span>
        </div>
      </div>
      <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{trait.label}</span>
    </div>
  )
}

export default function Avatar({ session, compact = false }) {
  const [stats, setStats] = useState({ focus: 0, workouts: 0, habits: 0, brainstorm: 0, hobbies: 0, totalXP: 0, level: 1 })
  const [name, setName] = useState('')
  const [archetype, setArchetype] = useState('')

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const uid = session.user.id
    const [{ data: profile }, { data: focus }, { data: workouts }, { data: habits }, { data: pages }, { data: hobbies }] = await Promise.all([
      supabase.from('profiles').select('name, archetype').eq('id', uid).single(),
      supabase.from('focus_sessions').select('id').eq('user_id', uid),
      supabase.from('workouts').select('id').eq('user_id', uid),
      supabase.from('habit_logs').select('id').eq('user_id', uid),
      supabase.from('brainstorm_pages').select('id').eq('user_id', uid),
      supabase.from('hobbies').select('id').eq('user_id', uid),
    ])
    if (profile) { setName(profile.name || ''); setArchetype(profile.archetype || '') }
    const f = focus?.length || 0
    const w = workouts?.length || 0
    const h = habits?.length || 0
    const b = pages?.length || 0
    const hb = hobbies?.length || 0
    const xp = f * 15 + w * 20 + h * 5 + b * 10 + hb * 25
    const level = Math.floor(xp / 100) + 1
    setStats({ focus: Math.min(f, 10), workouts: Math.min(w, 10), habits: Math.min(h, 10), brainstorm: Math.min(b, 10), hobbies: Math.min(hb, 10), totalXP: xp, level })
  }

  const traitLevels = [stats.focus, stats.workouts, stats.habits, stats.brainstorm, stats.hobbies]
  const xpInLevel = stats.totalXP % 100
  const dominantTrait = TRAITS[traitLevels.indexOf(Math.max(...traitLevels))]

  if (compact) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${dominantTrait?.color || '#c9a87c'}44, ${dominantTrait?.color || '#c9a87c'}22)`, border: `1.5px solid ${dominantTrait?.color || '#c9a87c'}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', animation: 'pulseGlow 3s ease-in-out infinite', flexShrink: 0 }}>
        {dominantTrait?.icon || '✦'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Level {stats.level} · {stats.totalXP} XP</div>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '16px', padding: '24px' }}>
      {/* Avatar orb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${dominantTrait?.color || '#c9a87c'}44, ${dominantTrait?.color || '#c9a87c'}11)`, border: `2px solid ${dominantTrait?.color || '#c9a87c'}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', animation: 'pulseGlow 3s ease-in-out infinite' }}>
            {dominantTrait?.icon || '✦'}
          </div>
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--gold-300)', border: '2px solid var(--base-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--base-950)', fontFamily: 'var(--font-sans)' }}>
            {stats.level}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '2px' }}>{name || 'Evolving...'}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'capitalize', marginBottom: '8px' }}>{archetype?.replace(/-/g, ' ') || 'Unknown archetype'}</div>
          <div style={{ fontSize: '10px', color: dominantTrait?.color || 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>Dominant: {dominantTrait?.label}</div>
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Level {stats.level}</span>
          <span style={{ fontSize: '10px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{xpInLevel}/100 XP</span>
        </div>
        <div style={{ height: '5px', background: 'var(--base-600)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '99px',
            background: `linear-gradient(90deg, ${dominantTrait?.color || '#c9a87c'}, #e8c97e)`,
            width: `${xpInLevel}%`,
            transition: 'width 1.2s cubic-bezier(0.34, 1.2, 0.64, 1)',
            boxShadow: `0 0 8px ${dominantTrait?.color || '#c9a87c'}88`,
          }} />
        </div>
      </div>

      {/* Trait rings */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {TRAITS.map((trait, i) => (
          <TraitRing key={trait.id} trait={trait} level={traitLevels[i]} />
        ))}
      </div>

      <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--base-700)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Total XP earned</span>
        <span style={{ fontSize: '13px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{stats.totalXP} ✦</span>
      </div>
    </div>
  )
}