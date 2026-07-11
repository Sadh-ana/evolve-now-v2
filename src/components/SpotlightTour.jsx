import { useState, useEffect, useRef } from 'react'

const TOUR_STEPS = [
  {
    target: '[data-tour="sidebar-dashboard"]',
    title: 'Dashboard',
    desc: 'Your home base. Check in your mood and energy every morning. Flag tough days to protect your streaks.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-habits"]',
    title: 'Habits',
    desc: 'Build habits that stick. Check them off daily — EVOLVE protects your streak on recovery days.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-focus"]',
    title: 'Focus',
    desc: 'Start a session before you work. Warmup → Peak → Cooldown. Science-backed phases for deep work.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-studyroom"]',
    title: 'Study Room',
    desc: 'Study with friends in real time. Your animated character appears on screen. Add friends first!',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-friends"]',
    title: 'Friends',
    desc: 'Add friends by username, send study invites, and build accountability together.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-health"]',
    title: 'Health',
    desc: 'Track food, water, sleep, cycle, and illness. All private, all yours.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-lifecoach"]',
    title: 'Life Coach',
    desc: 'Your AI coach knows your data — habits, moods, streaks — and gives real, personalised advice.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-vision"]',
    title: 'Vision & Timeline',
    desc: 'Set goals by horizon (1 month, 1 year, dream). Track your evolution over time.',
    position: 'right',
  },
  {
    target: '[data-tour="mood-mode"]',
    title: 'Mood Modes',
    desc: 'Change how EVOLVE looks and feels based on your energy. Low cortisol? Minimal mode. Full energy? Dopamine mode.',
    position: 'left',
  },
  {
    target: '[data-tour="sidebar-settings"]',
    title: 'Settings',
    desc: 'Set your archetype, username, peak focus time, and health flags. This shapes everything.',
    position: 'right',
  },
]

function getRect(selector) {
  const el = document.querySelector(selector)
  if (!el) return null
  return el.getBoundingClientRect()
}

export default function SpotlightTour({ onFinish }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  useEffect(() => {
    updateRect()
  }, [step])

  function updateRect() {
    const r = getRect(TOUR_STEPS[step].target)
    setRect(r)
  }

  function next() {
    if (step === TOUR_STEPS.length - 1) {
      finish()
    } else {
      setStep(s => s + 1)
    }
  }

  function finish() {
    setVisible(false)
    setTimeout(onFinish, 300)
  }

  if (!visible) return null

  const current = TOUR_STEPS[step]
  const pad = 6

  const spotlight = rect ? {
    x: rect.left - pad,
    y: rect.top - pad,
    w: rect.width + pad * 2,
    h: rect.height + pad * 2,
  } : null

  // Tooltip position
  const tooltipWidth = 280
  const tooltipOffset = 16
  let tooltipStyle = {}
  if (rect) {
    if (current.position === 'right') {
      tooltipStyle = {
        left: rect.right + tooltipOffset,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      }
    } else {
      tooltipStyle = {
        right: window.innerWidth - rect.left + tooltipOffset,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      }
    }
  } else {
    tooltipStyle = {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none' }}>

      {/* Dark overlay with spotlight cutout */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'all' }} onClick={next}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.w}
                height={spotlight.h}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#spotlight-mask)"
        />
        {/* Glowing border around spotlight */}
        {spotlight && (
          <rect
            x={spotlight.x}
            y={spotlight.y}
            width={spotlight.w}
            height={spotlight.h}
            rx="8"
            fill="none"
            stroke="#c9a87c"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 0 8px rgba(201,168,124,0.8))' }}
          />
        )}
      </svg>

      {/* Tooltip */}
      <div style={{
        position: 'fixed',
        ...tooltipStyle,
        width: tooltipWidth,
        background: 'var(--base-800)',
        border: '0.5px solid var(--gold-300)',
        borderRadius: '14px',
        padding: '18px',
        pointerEvents: 'all',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(201,168,124,0.15)',
        animation: 'tooltipIn 0.25s cubic-bezier(0.34,1.2,0.64,1)',
        zIndex: 9001,
      }}>

        {/* Arrow */}
        {rect && current.position === 'right' && (
          <div style={{
            position: 'absolute',
            left: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '8px solid var(--gold-300)',
          }} />
        )}
        {rect && current.position === 'left' && (
          <div style={{
            position: 'absolute',
            right: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '8px solid var(--gold-300)',
          }} />
        )}

        <p style={{ fontSize: '10px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
          {step + 1} of {TOUR_STEPS.length}
        </p>
        <p style={{ fontSize: '16px', color: 'var(--cream-200)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '8px' }}>
          {current.title}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, marginBottom: '16px' }}>
          {current.desc}
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              height: '3px',
              flex: 1,
              borderRadius: '99px',
              background: i <= step ? 'var(--gold-300)' : 'var(--base-600)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={finish} style={{ flex: 1, padding: '8px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)' }}>
            Skip tour
          </button>
          <button onClick={next} style={{ flex: 2, padding: '8px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--base-950)' }}>
            {step === TOUR_STEPS.length - 1 ? 'Done ✦' : 'Next →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.95); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
      `}</style>
    </div>
  )
}