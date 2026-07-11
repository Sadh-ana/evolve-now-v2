import { useState, useEffect, useCallback } from 'react'

const TOUR_STEPS = [
  {
    target: '[data-tour="sidebar-dashboard"]',
    title: 'Dashboard',
    desc: 'Your home base. Check in mood and energy every morning. Flag tough days to protect your streaks.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-habits"]',
    title: 'Habits',
    desc: 'Build habits that stick. Check them off daily — EVOLVE protects your streak on recovery days automatically.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-focus"]',
    title: 'Focus Sessions',
    desc: 'Start a session before you work. Warmup → Peak → Cooldown phases based on your ultradian rhythm.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-studyroom"]',
    title: 'Study Room',
    desc: 'Study with friends in real time. Your animated character appears on screen — social facilitation is real.',
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
    desc: 'Your AI coach knows your data — habits, moods, streaks — and gives real personalised advice.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-vision"]',
    title: 'Vision & Timeline',
    desc: 'Set goals by horizon. Track your evolution over time with a visual timeline of every milestone.',
    position: 'right',
  },
  {
    target: '[data-tour="mood-mode"]',
    title: 'Mood Modes',
    desc: 'Change how EVOLVE looks and feels. Low cortisol? Minimal. Full energy? Dopamine mode.',
    position: 'left',
  },
  {
    target: '[data-tour="sidebar-settings"]',
    title: 'Settings',
    desc: 'Set your archetype, username, peak focus time, and health flags. This shapes everything in EVOLVE.',
    position: 'right',
  },
]

export default function SpotlightTour({ onFinish }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(false)

  const updateRect = useCallback(() => {
    const el = document.querySelector(TOUR_STEPS[step].target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setTimeout(() => {
        const r = el.getBoundingClientRect()
        setRect(r)
      }, 150)
    } else {
      setRect(null)
    }
  }, [step])

  useEffect(() => {
    setTimeout(() => setVisible(true), 200)
  }, [])

  useEffect(() => {
    if (visible) updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [step, visible, updateRect])

  function next() {
    if (step === TOUR_STEPS.length - 1) {
      finish()
    } else {
      setStep(s => s + 1)
    }
  }

  function finish() {
    setVisible(false)
    setTimeout(onFinish, 200)
  }

  if (!visible) return null

  const current = TOUR_STEPS[step]
  const pad = 8

  const spotlight = rect ? {
    x: rect.left - pad,
    y: rect.top - pad,
    w: rect.width + pad * 2,
    h: rect.height + pad * 2,
  } : null

  const tooltipWidth = 260
  const gap = 14
  let tooltipLeft, tooltipTop, arrowStyle

  if (rect) {
    if (current.position === 'right') {
      tooltipLeft = rect.right + gap
      tooltipTop = Math.min(
        Math.max(rect.top + rect.height / 2 - 120, 16),
        window.innerHeight - 280
      )
      arrowStyle = {
        position: 'absolute', left: -8, top: 80,
        width: 0, height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: '8px solid var(--gold-300)',
      }
    } else {
      tooltipLeft = rect.left - tooltipWidth - gap
      tooltipTop = Math.min(
        Math.max(rect.top + rect.height / 2 - 120, 16),
        window.innerHeight - 280
      )
      arrowStyle = {
        position: 'absolute', right: -8, top: 80,
        width: 0, height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: '8px solid var(--gold-300)',
      }
    }
  } else {
    tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2
    tooltipTop = window.innerHeight / 2 - 130
    arrowStyle = null
  }

  // Keep tooltip on screen
  tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000 }}>

      {/* SVG overlay */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
        onClick={next}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x} y={spotlight.y}
                width={spotlight.w} height={spotlight.h}
                rx="10" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
        {spotlight && (
          <rect
            x={spotlight.x} y={spotlight.y}
            width={spotlight.w} height={spotlight.h}
            rx="10" fill="none"
            stroke="#c9a87c" strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 12px rgba(201,168,124,0.9))' }}
          />
        )}
      </svg>

      {/* Tooltip */}
      <div
        key={step}
        style={{
          position: 'fixed',
          left: tooltipLeft,
          top: tooltipTop,
          width: tooltipWidth,
          background: 'var(--base-800)',
          border: '1px solid var(--gold-300)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 40px rgba(201,168,124,0.2)',
          animation: 'tourIn 0.25s cubic-bezier(0.34,1.2,0.64,1)',
          zIndex: 9001,
          cursor: 'default',
        }}
        onClick={e => e.stopPropagation()}
      >
        {arrowStyle && <div style={arrowStyle} />}

        {/* Step indicator */}
        <p style={{ fontSize: '9px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
          {step + 1} / {TOUR_STEPS.length}
        </p>

        <p style={{ fontSize: '17px', color: 'var(--cream-200)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '8px', lineHeight: 1.2 }}>
          {current.title}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.65, marginBottom: '16px' }}>
          {current.desc}
        </p>

        {/* Progress bar */}
        <div style={{ height: '3px', background: 'var(--base-600)', borderRadius: '99px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / TOUR_STEPS.length) * 100}%`,
            background: 'var(--gold-300)',
            borderRadius: '99px',
            transition: 'width 0.4s ease',
          }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={finish}
            style={{ flex: 1, padding: '8px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)' }}
          >
            Skip
          </button>
          <button
            onClick={next}
            style={{ flex: 2, padding: '8px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--base-950)' }}
          >
            {step === TOUR_STEPS.length - 1 ? 'Done ✦' : 'Next →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tourIn {
          from { opacity: 0; transform: scale(0.94) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}