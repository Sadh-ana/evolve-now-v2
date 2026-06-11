import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

// Science-backed challenge pool with evidence citations
const CHALLENGE_POOLS = [
  // Focus & cognitive
  { id: 'f1', text: 'Complete one 25-min Pomodoro before checking your phone', science: 'Task initiation is the hardest part — 25 min feels achievable (Cirillo, 1980)', xp: 20, icon: '◷', color: '#9eb5d4' },
  { id: 'f2', text: 'Do a full 90-min deep work session without interruptions', science: 'Ultradian BRAC cycle peaks at 90 min — this is your cognitive limit (Kleitman)', xp: 40, icon: '◷', color: '#9eb5d4' },
  { id: 'f3', text: 'Start your hardest task within 10 minutes of sitting down', science: 'Activation energy is the enemy — starting is 80% of completion', xp: 25, icon: '◷', color: '#9eb5d4' },
  { id: 'f4', text: 'No phone for the first 45 minutes after waking', science: 'Morning dopamine baseline stays clean — cognitive reserve is highest before input overload', xp: 30, icon: '◷', color: '#9eb5d4' },
  { id: 'f5', text: 'Use the Feynman technique on one concept today', science: 'Teaching something you barely understand exposes knowledge gaps instantly (Feynman)', xp: 30, icon: '◷', color: '#9eb5d4' },

  // Habits & physical
  { id: 'h1', text: 'Complete every single habit on your list today', science: 'Full completion activates the endowment effect — you feel more ownership over your streak', xp: 35, icon: '◎', color: '#a8c4a0' },
  { id: 'h2', text: 'Move your body for at least 20 minutes', science: 'BDNF (brain-derived neurotrophic factor) peaks post-exercise — memory and focus improve', xp: 25, icon: '◎', color: '#a8c4a0' },
  { id: 'h3', text: 'Drink 2L of water before 6pm', science: '2% dehydration reduces cognitive performance by 20% (Masento et al., 2014)', xp: 20, icon: '◎', color: '#a8c4a0' },
  { id: 'h4', text: 'Be in bed ready to sleep by 10:30pm tonight', science: 'Sleep before midnight has 2x the slow-wave sleep density of post-midnight sleep', xp: 30, icon: '◎', color: '#a8c4a0' },

  // Mind & reflection
  { id: 'm1', text: 'Write 3 specific things you\'re genuinely grateful for', science: 'Specificity matters — vague gratitude has no measurable effect (Emmons & McCullough, 2003)', xp: 15, icon: '✦', color: '#c9a87c' },
  { id: 'm2', text: 'Do a 5-minute brain dump — write everything on your mind', science: 'Externalising cognitive load reduces working memory strain (Cognitive Load Theory, Sweller)', xp: 15, icon: '✦', color: '#c9a87c' },
  { id: 'm3', text: 'Read 20 pages of something non-academic', science: 'Reading fiction reduces cortisol and stress by 68% in 6 minutes (University of Sussex, 2009)', xp: 20, icon: '✦', color: '#c9a87c' },
  { id: 'm4', text: 'Spend 15 minutes on a hobby with zero productivity pressure', science: 'Intrinsic motivation activities restore executive function (SDT, Ryan & Deci, 2000)', xp: 20, icon: '✦', color: '#c9a87c' },
  { id: 'm5', text: 'Sit quietly for 5 minutes without any input — just think', science: 'Default mode network activation (mind-wandering) consolidates memory and sparks insight', xp: 20, icon: '✦', color: '#c9a87c' },

  // Social & growth
  { id: 'g1', text: 'Say something genuine to someone today — not small talk', science: 'Oxytocin release benefits both giver and receiver equally (Kosfeld et al., 2005)', xp: 25, icon: '⊕', color: '#d4a5a5' },
  { id: 'g2', text: 'Learn one new concept and explain it simply', science: 'Feynman technique: if you can\'t explain it simply, you don\'t know it', xp: 30, icon: '⊕', color: '#d4a5a5' },
  { id: 'g3', text: 'Do one thing that makes your future self\'s life easier', science: 'Temporal self-continuity — people with stronger future-self connection make better decisions', xp: 25, icon: '⊕', color: '#d4a5a5' },
  { id: 'g4', text: 'End today by writing tomorrow\'s top 3 priorities', science: 'Zeigarnik effect — incomplete tasks consume working memory. Writing closes the loop', xp: 20, icon: '⊕', color: '#d4a5a5' },
]

function getDailySet(seed) {
  const rng = (n) => {
    let h = (seed + n * 2654435761) >>> 0
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0
    return (h ^ (h >>> 16)) >>> 0
  }
  const picked = []
  const used = new Set()
  let i = 0
  while (picked.length < 3 && i < 200) {
    const idx = rng(i++) % CHALLENGE_POOLS.length
    if (!used.has(idx)) { used.add(idx); picked.push(CHALLENGE_POOLS[idx]) }
  }
  return picked
}

export default function DailyChallenges({ session, compact = false }) {
  const [challenges, setChallenges] = useState([])
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { load() }, [])

  async function load() {
    const uid = session.user.id
    const { data } = await supabase.from('daily_challenges').select('*').eq('user_id', uid).eq('date', today).maybeSingle()
    if (data) {
      setChallenges(data.challenges || [])
      setCompleted(data.completed || [])
    } else {
      const seed = parseInt(today.replace(/-/g, ''))
      const set = getDailySet(seed)
      const { data: saved } = await supabase.from('daily_challenges').insert({ user_id: uid, date: today, challenges: set, completed: [] }).select().single()
      if (saved) { setChallenges(saved.challenges || []); setCompleted([]) }
    }
    setLoading(false)
  }

  async function complete(challenge) {
    if (completed.includes(challenge.id)) return
    const newCompleted = [...completed, challenge.id]
    setCompleted(newCompleted)
    await supabase.from('daily_challenges').update({ completed: newCompleted }).eq('user_id', session.user.id).eq('date', today)
    try {
      await supabase.from('xp_logs').insert({ user_id: session.user.id, amount: challenge.xp, reason: challenge.text, category: 'challenge' })
    } catch (e) { /* xp_logs might not exist */ }
  }

  if (loading) return null

  const allDone = challenges.length > 0 && challenges.every(c => completed.includes(c.id))
  const doneCount = challenges.filter(c => completed.includes(c.id)).length
  const xpTotal = challenges.reduce((s, c) => s + c.xp, 0)
  const xpEarned = challenges.filter(c => completed.includes(c.id)).reduce((s, c) => s + c.xp, 0)

  if (compact) return (
    <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '2px' }}>Daily Challenges</span>
          <span style={{ fontSize: '11px', color: allDone ? '#a8c4a0' : 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
            {allDone ? 'all done ✦' : `${doneCount}/3 · ${xpTotal - xpEarned} XP left`}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--gold-300)', fontStyle: 'italic' }}>{xpEarned}<span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>/{xpTotal}</span></div>
      </div>

      {/* Mini progress */}
      <div style={{ height: '3px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-300), var(--rose-300))', width: `${(doneCount / 3) * 100}%`, borderRadius: '99px', transition: 'width 0.5s ease' }} />
      </div>

      {challenges.map(c => {
        const done = completed.includes(c.id)
        return (
          <div key={c.id} onClick={() => !done && complete(c)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderBottom: '0.5px solid var(--base-700)', cursor: done ? 'default' : 'pointer', opacity: done ? 0.55 : 1, transition: 'opacity 0.3s' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${done ? c.color : 'var(--base-500)'}`, background: done ? c.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--base-950)', transition: 'all 0.25s', marginTop: '1px' }}>
              {done && '✓'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', color: done ? 'var(--muted)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4, marginBottom: '2px' }}>{c.text}</p>
              <p style={{ fontSize: '10px', color: c.color, fontFamily: 'var(--font-sans)', opacity: 0.7 }}>+{c.xp} XP</p>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '780px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '4px' }}>Daily Challenges</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
          3 challenges · resets midnight · each grounded in behavioural science
        </p>
      </div>

      {/* XP Progress */}
      <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>
            {doneCount === 0 ? 'Nothing done yet — start anywhere' : doneCount === 1 ? 'One down. Momentum is building.' : doneCount === 2 ? 'Two done. Finish what you started.' : '✦ All three. You showed up.'}
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--gold-300)', fontStyle: 'italic' }}>{xpEarned}/{xpTotal} XP</span>
        </div>
        <div style={{ height: '6px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-300), var(--rose-300))', width: `${(doneCount / 3) * 100}%`, borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.34,1.2,0.64,1)' }} />
        </div>
      </div>

      {allDone && (
        <div style={{ background: 'rgba(168,196,160,0.07)', border: '0.5px solid rgba(168,196,160,0.3)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', color: '#a8c4a0', marginBottom: '4px' }}>all challenges complete ✦</p>
          <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>New set tomorrow. Consistency compounds.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {challenges.map((c, i) => {
          const done = completed.includes(c.id)
          return (
            <div key={c.id} style={{ background: done ? 'var(--base-800)' : 'var(--base-800)', border: `1px solid ${done ? c.color + '44' : 'var(--base-600)'}`, borderRadius: '16px', padding: '22px', transition: 'all 0.3s', opacity: done ? 0.65 : 1, position: 'relative', overflow: 'hidden' }}>
              {/* Top accent line */}
              {!done && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${c.color}66, transparent)` }} />}

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <button onClick={() => !done && complete(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${done ? c.color : 'var(--base-500)'}`, background: done ? c.color : 'transparent', cursor: done ? 'default' : 'pointer', fontSize: '11px', color: 'var(--base-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', marginTop: '2px' }}>
                  {done && '✓'}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: c.color }}>{c.icon}</span>
                    <span style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)' }}>challenge {i + 1}</span>
                  </div>
                  <p style={{ fontSize: '16px', color: done ? 'var(--muted)' : 'var(--cream-200)', fontFamily: 'var(--font-sans)', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.5, marginBottom: '10px', fontWeight: 400 }}>{c.text}</p>

                  {/* Science note */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px 12px', background: 'var(--base-700)', borderRadius: '8px', borderLeft: `2px solid ${c.color}44` }}>
                    <span style={{ fontSize: '10px', color: c.color, flexShrink: 0 }}>✦</span>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.5 }}>{c.science}</p>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: done ? 'var(--muted)' : c.color, lineHeight: 1 }}>+{c.xp}</div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '24px', padding: '14px 18px', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px' }}>
        <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.6 }}>
          ✦ Variable reward schedule (Skinner): challenges change daily so your brain can't habituate to them. Predictable rewards stop working in 2 weeks. Unpredictable ones work indefinitely.
        </p>
      </div>
    </div>
  )
}