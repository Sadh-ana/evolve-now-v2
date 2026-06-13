import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const CHALLENGE_POOL = [
  { id: 'pomodoro_2', text: 'Do 2 focused Pomodoros today', icon: '◷', color: '#9eb5d4' },
  { id: 'no_phone_morning', text: 'No phone for first 30 min after waking', icon: '◎', color: '#c9a87c' },
  { id: 'single_task', text: 'One task, zero tabs', icon: '◈', color: '#9eb5d4' },
  { id: 'review_notes', text: '10 min reviewing yesterday\'s notes', icon: '✦', color: '#c9a87c' },
  { id: 'walk_15', text: '15-min walk, no headphones', icon: '↑', color: '#a8c4a0' },
  { id: 'water_2l', text: 'Hit 2L of water before 6pm', icon: '◌', color: '#7fc4b0' },
  { id: 'stretch_5', text: '5 min stretching before work', icon: '◇', color: '#a8c4a0' },
  { id: 'no_caffeine_after_2', text: 'No caffeine after 2pm', icon: '◑', color: '#d4a5a5' },
  { id: 'journal_3', text: 'Write 3 things you\'re grateful for', icon: '◇', color: '#d4a5a5' },
  { id: 'one_hard_thing', text: 'Do the thing you\'ve been avoiding first', icon: '◆', color: '#c9a87c' },
  { id: 'compliment', text: 'Say something genuine to someone', icon: '♡', color: '#d4a5a5' },
  { id: 'screen_break', text: '20-20-20 eye break every hour', icon: '◐', color: '#9eb5d4' },
  { id: 'read_20', text: 'Read 20 pages', icon: '◁', color: '#b8a8d4' },
  { id: 'learn_one_thing', text: 'Learn one concept, explain it simply', icon: '✦', color: '#b8a8d4' },
  { id: 'no_social_media_am', text: 'No social media before noon', icon: '◎', color: '#c9a87c' },
]

function getDailyChallenges(dateStr) {
  const seed = dateStr.split('-').reduce((a, b) => a + parseInt(b), 0)
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) % 100)
    const hb = ((seed * 31 + b.id.charCodeAt(0)) % 100)
    return ha - hb
  })
  return shuffled.slice(0, 3)
}

export default function ChallengesCompact({ session }) {
  const [completed, setCompleted] = useState([])
  const today = format(new Date(), 'yyyy-MM-dd')
  const challenges = getDailyChallenges(today)

  useEffect(() => { fetchCompleted() }, [])

  async function fetchCompleted() {
    try {
      const { data } = await supabase.from('daily_challenge_logs').select('challenge_id').eq('user_id', session.user.id).eq('date', today)
      setCompleted((data || []).map(d => d.challenge_id))
    } catch {}
  }

  async function toggle(challengeId) {
    const uid = session.user.id
    const done = completed.includes(challengeId)
    if (done) {
      await supabase.from('daily_challenge_logs').delete().eq('user_id', uid).eq('challenge_id', challengeId).eq('date', today)
      setCompleted(p => p.filter(c => c !== challengeId))
    } else {
      await supabase.from('daily_challenge_logs').insert({ user_id: uid, challenge_id: challengeId, date: today })
      setCompleted(p => [...p, challengeId])
    }
  }

  const doneCount = challenges.filter(c => completed.includes(c.id)).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{doneCount}/3 done today</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {challenges.map(c => {
          const done = completed.includes(c.id)
          return (
            <div key={c.id} onClick={() => toggle(c.id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
              background: done ? c.color + '12' : 'var(--base-700)',
              border: `0.5px solid ${done ? c.color + '44' : 'var(--base-600)'}`,
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${done ? c.color : 'var(--base-500)'}`,
                background: done ? c.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', color: done ? 'var(--base-950)' : 'transparent',
              }}>✓</div>
              <span style={{ fontSize: '12px', color: done ? 'var(--muted)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', textDecoration: done ? 'line-through' : 'none', flex: 1 }}>{c.text}</span>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{c.icon}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}