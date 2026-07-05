import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to EVOLVE ✦',
    subtitle: 'your life operating system',
    desc: 'EVOLVE adapts to your personality, protects your streaks when life gets hard, and grows with you. Let\'s get you set up in 2 minutes.',
    icon: '✦',
    color: '#c9a87c',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    subtitle: 'everything at a glance',
    desc: 'Every morning, check in your mood and energy. Flag if you\'re tired, sick, or having an ADHD day — EVOLVE protects your streaks automatically on hard days.',
    icon: '⌂',
    color: '#c9a87c',
    tip: 'Try the mood modes (top right) — they rearrange the dashboard to match how you feel.',
  },
  {
    id: 'habits',
    title: 'Habits & Streaks',
    subtitle: 'identity-based progress',
    desc: 'Add habits you want to build. Check them off daily. If you flag a recovery day, your streak is protected — no shame, no resets.',
    icon: '◎',
    color: '#a8c4a0',
    tip: 'Science says 66 days to form a habit. EVOLVE tracks every one.',
  },
  {
    id: 'focus',
    title: 'Focus Sessions',
    subtitle: 'deep work, tracked',
    desc: 'Start a focus session before you work. EVOLVE guides you through warmup → peak → cooldown phases based on your ultradian rhythm. Log your emotion after each session.',
    icon: '◷',
    color: '#9eb5d4',
    tip: 'Your first 15 min is warmup — don\'t do hard work yet. Save the peak window for your hardest problems.',
  },
  {
    id: 'studyroom',
    title: 'Study Room',
    subtitle: 'focus together',
    desc: 'Join a room with friends and study together. Your animated character appears on screen. Chat in real time. The social facilitation effect is real — you work harder when others can see you.',
    icon: '◉',
    color: '#b8a8d4',
    tip: 'Go to Friends first to add people, then invite them to a private study room.',
  },
  {
    id: 'health',
    title: 'Health Module',
    subtitle: 'your body, tracked',
    desc: 'Log food with macros, track water and sleep, monitor your cycle, and spot illness patterns. All private, all yours.',
    icon: '◑',
    color: '#d4a5a5',
    tip: 'The more you log, the better EVOLVE understands your patterns.',
  },
  {
    id: 'ai',
    title: 'AI Features',
    subtitle: 'your personal coach',
    desc: 'Life Coach knows your data — your habits, streaks, moods, and goals — and coaches you accordingly. Side Quests gives you an AI guide for every hobby you add.',
    icon: '◈',
    color: '#c9a87c',
    tip: 'The more you use EVOLVE, the smarter your Life Coach gets.',
  },
  {
    id: 'username',
    title: 'Set your username',
    subtitle: 'so friends can find you',
    desc: 'Your username lets friends add you and invite you to study rooms. Pick something you\'ll share.',
    icon: '♡',
    color: '#d4a5a5',
    isUsernameStep: true,
  },
  {
    id: 'ready',
    title: 'You\'re all set ✦',
    subtitle: 'start evolving',
    desc: 'EVOLVE is ready. Start by adding a habit, logging your first check-in, or jumping into a focus session.',
    icon: '✦',
    color: '#c9a87c',
  },
]

export default function Onboarding({ session, onComplete }) {
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [saving, setSaving] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isUserStep = current.isUsernameStep

  async function handleNext() {
    if (isUserStep) {
      if (!username.trim()) { setUsernameError('Please set a username'); return }
      setSaving(true)
      const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', clean).neq('id', session.user.id).maybeSingle()
      if (existing) { setUsernameError('That username is taken — try another'); setSaving(false); return }
      await supabase.from('profiles').update({ username: clean }).eq('id', session.user.id)
      setSaving(false)
    }
    if (isLast) {
      await supabase.from('profiles').update({ onboarded: true }).eq('id', session.user.id)
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  function handleSkip() {
    supabase.from('profiles').update({ onboarded: true }).eq('id', session.user.id)
    onComplete()
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#0e0a06', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${current.color}0f 0%, transparent 70%)`, transition: 'background 0.6s ease', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>

        {/* Progress bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(138,112,96,0.6)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {step + 1} of {STEPS.length}
            </span>
            {!isLast && (
              <button onClick={handleSkip} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'rgba(138,112,96,0.5)', fontFamily: 'var(--font-sans)' }}>
                skip tour →
              </button>
            )}
          </div>
          <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: current.color, borderRadius: '99px', transition: 'width 0.4s ease, background 0.4s ease' }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2.5rem', marginBottom: '16px', animation: 'slideUp 0.35s ease' }}>

          {/* Icon */}
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: current.color + '18', border: `1px solid ${current.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: current.color, marginBottom: '24px' }}>
            {current.icon}
          </div>

          {/* Text */}
          <p style={{ fontSize: '10px', color: current.color, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px' }}>
            {current.subtitle}
          </p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontStyle: 'italic', fontWeight: 400, color: '#f0e6d8', marginBottom: '16px', lineHeight: 1.2 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(138,112,96,0.85)', fontFamily: 'var(--font-sans)', lineHeight: 1.8, marginBottom: current.tip || isUserStep ? '20px' : '0' }}>
            {current.desc}
          </p>

          {/* Tip */}
          {current.tip && (
            <div style={{ padding: '12px 16px', background: current.color + '0f', border: `0.5px solid ${current.color}33`, borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', color: current.color, fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
                ✦ {current.tip}
              </p>
            </div>
          )}

          {/* Username input */}
          {isUserStep && (
            <div>
              <div style={{ display: 'flex', gap: '0' }}>
                <span style={{ padding: '11px 12px 11px 16px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRight: 'none', borderRadius: '10px 0 0 10px', color: 'rgba(138,112,96,0.6)', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>@</span>
                <input
                  value={username}
                  onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)); setUsernameError('') }}
                  placeholder="your_username"
                  autoFocus
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '0 10px 10px 0', padding: '11px 14px', color: '#f0e6d8', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                />
              </div>
              {usernameError && <p style={{ fontSize: '12px', color: '#d4a5a5', fontFamily: 'var(--font-sans)', marginTop: '8px' }}>{usernameError}</p>}
              <p style={{ fontSize: '11px', color: 'rgba(138,112,96,0.5)', fontFamily: 'var(--font-sans)', marginTop: '8px' }}>lowercase, underscores ok, max 24 chars</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: '13px 20px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(138,112,96,0.6)' }}>
              ←
            </button>
          )}
          <button onClick={handleNext} disabled={saving} style={{ flex: 1, padding: '14px', background: current.color, border: 'none', borderRadius: '12px', cursor: saving ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, color: '#0e0a06', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'saving...' : isLast ? 'Start evolving ✦' : isUserStep && !username ? 'Skip for now →' : 'Continue →'}
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? '20px' : '6px', height: '6px', borderRadius: '99px', background: i === step ? current.color : 'rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}