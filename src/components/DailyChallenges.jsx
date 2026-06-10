import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

// Science-based challenge pools — specific, doable, rooted in behavioural research
const CHALLENGE_POOL = [
  // Cognitive / focus (based on deliberate practice + spacing effect)
  { id: 'pomodoro_2', text: 'Do 2 focused Pomodoros today', detail: 'Two 25-min blocks = peak cognitive output for most brains', icon: '◷', color: '#9eb5d4', category: 'mind' },
  { id: 'no_phone_morning', text: 'No phone for first 30 min after waking', detail: 'Cortisol spike + dopamine baseline reset — your focus will thank you', icon: '◎', color: '#c9a87c', category: 'mind' },
  { id: 'single_task', text: 'Do one task with zero tabs open', detail: 'Context-switching costs 23 min of refocus. One thing. All the way.', icon: '◈', color: '#9eb5d4', category: 'mind' },
  { id: 'review_notes', text: 'Spend 10 min reviewing yesterday\'s notes', detail: 'Spaced repetition increases retention by up to 80%', icon: '✦', color: '#c9a87c', category: 'mind' },

  // Physical (movement science + energy management)
  { id: 'walk_15', text: 'Take a 15-min walk — no headphones', detail: 'Default mode network activation = creative breakthroughs happen here', icon: '↑', color: '#a8c4a0', category: 'body' },
  { id: 'water_2l', text: 'Hit 2L of water before 6pm', detail: 'Even 1% dehydration drops cognitive performance by 10%', icon: '◌', color: '#7fc4b0', category: 'body' },
  { id: 'stretch_5', text: '5 min of stretching before you start work', detail: 'Reduces cortisol, increases blood flow to prefrontal cortex', icon: '◇', color: '#a8c4a0', category: 'body' },
  { id: 'no_caffeine_after_2', text: 'No caffeine after 2pm today', detail: 'Caffeine half-life is 6 hrs. That 3pm coffee ruins 9pm sleep quality', icon: '◑', color: '#d4a5a5', category: 'body' },

  // Emotional regulation + wellbeing
  { id: 'journal_3', text: 'Write 3 things you\'re actually grateful for', detail: 'Specificity matters — vague gratitude has no measurable effect', icon: '◇', color: '#d4a5a5', category: 'mind' },
  { id: 'one_hard_thing', text: 'Do the thing you\'ve been avoiding first', detail: 'Completion of avoided tasks drops background anxiety by ~40%', icon: '◆', color: '#c9a87c', category: 'growth' },
  { id: 'compliment', text: 'Say something genuine to someone today', detail: 'Oxytocin release benefits both giver and receiver equally', icon: '♡', color: '#d4a5a5', category: 'social' },
  { id: 'screen_break', text: 'Take a 20-20-20 eye break every hour', detail: '20 sec looking 20 feet away every 20 min reduces eye strain 60%', icon: '◐', color: '#9eb5d4', category: 'body' },

  // Growth / learning
  { id: 'read_20', text: 'Read 20 pages of your current book', detail: '20 pages/day = 18 books/year. Most people read 1.', icon: '◁', color: '#b8a8d4', category: 'growth' },
  { id: 'learn_one_thing', text: 'Learn one new concept and explain it simply', detail: 'Feynman technique: if you can\'t explain it simply, you don\'t know it', icon: '✦', color: '#b8a8d4', category: 'growth' },
  { id: 'no_social_media_am', text: 'No social media before noon', detail: 'Morning social media primes threat-detection, not focus', icon: '◎', color: '#c9a87c', category: 'mind' },
]

function getDailyChallenges(dateStr) {
  // Deterministic daily selection — same challenges all day, changes at midnight
  const seed = dateStr.split('-').reduce((a, b) => a + parseInt(b), 0)
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) % 100)
    const hb = ((seed * 31 + b.id.charCodeAt(0)) % 100)
    return ha - hb
  })
  return shuffled.slice(0, 3)
}

export default function DailyChallenges({ session }) {
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')
  const challenges = getDailyChallenges(today)

  useEffect(() => { fetchCompleted() }, [])

  async function fetchCompleted() {
    try {
      const { data } = await supabase
        .from('daily_challenge_logs')
        .select('challenge_id')
        .eq('user_id', session.user.id)
        .eq('date', today)
      setCompleted((data || []).map(d => d.challenge_id))
    } catch {}
    setLoading(false)
  }

  async function toggle(challengeId) {
    const uid = session.user.id
    const done = completed.includes(challengeId)
    if (done) {
      await supabase.from('daily_challenge_logs').delete()
        .eq('user_id', uid).eq('challenge_id', challengeId).eq('date', today)
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
        <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{doneCount}/3 done today</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {challenges.map((c, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: completed.includes(c.id) ? c.color : 'var(--base-600)', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {challenges.map(c => {
          const done = completed.includes(c.id)
          return (
            <div
              key={c.id}
              onClick={() => toggle(c.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                background: done ? c.color + '12' : 'var(--base-700)',
                border: `0.5px solid ${done ? c.color + '44' : 'var(--base-600)'}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                border: `1.5px solid ${done ? c.color : 'var(--base-500)'}`,
                background: done ? c.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', color: done ? 'var(--base-950)' : 'transparent',
                transition: 'all 0.2s',
              }}>✓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', color: done ? 'var(--muted)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, textDecoration: done ? 'line-through' : 'none', marginBottom: '2px', lineHeight: 1.3 }}>{c.text}</p>
                <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, fontStyle: 'italic' }}>{c.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}