import { useState } from 'react'

export const MOOD_MODES = [
  {
    id: 'normal',
    label: 'Normal',
    icon: '◎',
    desc: 'Default EVOLVE',
    vars: {},
  },
  {
    id: 'calm',
    label: 'Low cortisol',
    icon: '◌',
    desc: 'Less on screen. Breathe.',
    vars: {
      '--base-950': '#141010',
      '--base-900': '#181414',
      '--base-800': '#1c1818',
      '--base-700': '#221e1e',
      '--base-600': '#3a2e2e',
      '--gold-300': '#c4a882',
      '--cream-200': '#e0d0c4',
      '--muted': '#7a6860',
    },
    overlay: 'rgba(180,140,140,0.03)',
    blur: true,
    compact: true,
  },
  {
    id: 'minimal',
    label: 'Minimal',
    icon: '◻',
    desc: 'Just what matters.',
    vars: {
      '--base-950': '#111111',
      '--base-900': '#161616',
      '--base-800': '#1a1a1a',
      '--base-700': '#222222',
      '--base-600': '#333333',
      '--gold-300': '#c0a060',
      '--cream-200': '#d8d0c8',
      '--muted': '#707070',
    },
    compact: true,
  },
  {
    id: 'dopamine',
    label: 'Dopamine',
    icon: '✦',
    desc: 'Full energy. Let it flow.',
    vars: {
      '--base-950': '#160f08',
      '--base-900': '#1c1208',
      '--base-800': '#221808',
      '--gold-300': '#f0c060',
      '--gold-400': '#f8d878',
      '--cream-200': '#f4e8d0',
      '--rose-300': '#e8b0b0',
    },
    glow: true,
    overlay: 'rgba(240,192,96,0.04)',
  },
  {
    id: 'tired',
    label: 'Tired',
    icon: '◑',
    desc: 'Warm light. Wake up gently.',
    vars: {
      '--base-950': '#1a1208',
      '--base-900': '#201808',
      '--base-800': '#2a200c',
      '--base-700': '#342810',
      '--base-600': '#4a3820',
      '--gold-300': '#e8b860',
      '--cream-200': '#f0dca8',
      '--muted': '#907848',
    },
    overlay: 'rgba(232,184,96,0.06)',
    warmLight: true,
  },
  {
    id: 'focus',
    label: 'Deep focus',
    icon: '◈',
    desc: 'Dark. Clean. No distractions.',
    vars: {
      '--base-950': '#0a0a0a',
      '--base-900': '#0e0e0e',
      '--base-800': '#121212',
      '--base-700': '#181818',
      '--base-600': '#282828',
      '--gold-300': '#a08040',
      '--cream-200': '#c8c0b8',
      '--muted': '#606060',
    },
    compact: true,
    highContrast: false,
  },
  {
    id: 'energised',
    label: 'Energised',
    icon: '◉',
    desc: 'Sharp. Crisp. Ready.',
    vars: {
      '--base-950': '#0c0f18',
      '--base-900': '#101520',
      '--base-800': '#141a28',
      '--base-700': '#1c2438',
      '--base-600': '#2c3858',
      '--gold-300': '#90b8e8',
      '--cream-200': '#d8e8f8',
      '--rose-300': '#a8c8f0',
      '--muted': '#6888a8',
    },
    overlay: 'rgba(144,184,232,0.04)',
  },
]

export function applyMoodMode(mode) {
  const root = document.documentElement
  // Reset all first
  const defaults = {
    '--base-950': '#1a120b', '--base-900': '#1e1510', '--base-800': '#231a12',
    '--base-700': '#2a1f14', '--base-600': '#3d2a1a', '--gold-300': '#c9a87c',
    '--gold-400': '#e8c97e', '--cream-200': '#e8d5c0', '--rose-300': '#d4a5a5',
    '--muted': '#8a7060',
  }
  Object.entries(defaults).forEach(([k, v]) => root.style.setProperty(k, v))
  if (mode.vars) Object.entries(mode.vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

export default function MoodMode({ current, onChange }) {
  const [open, setOpen] = useState(false)
  const mode = MOOD_MODES.find(m => m.id === current) || MOOD_MODES[0]

  function select(m) {
    applyMoodMode(m)
    onChange(m.id)
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: '99px',
          background: 'var(--base-800)', border: '0.5px solid var(--base-600)',
          cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-300)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--base-600)'}
      >
        <span style={{ fontSize: '12px' }}>{mode.icon}</span>
        <span>{mode.label}</span>
        <span style={{ fontSize: '9px', opacity: 0.5 }}>▾</span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 1000,
            background: 'var(--base-900)', border: '0.5px solid var(--base-600)',
            borderRadius: '14px', padding: '8px', minWidth: '220px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
            {MOOD_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => select(m)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '8px', border: 'none',
                  background: current === m.id ? 'var(--base-700)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (current !== m.id) e.currentTarget.style.background = 'var(--base-800)' }}
                onMouseLeave={e => { if (current !== m.id) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: '14px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                <div>
                  <p style={{ fontSize: '12px', color: current === m.id ? 'var(--cream-200)' : 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: current === m.id ? 500 : 400, marginBottom: '1px' }}>{m.label}</p>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{m.desc}</p>
                </div>
                {current === m.id && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--gold-300)' }}>✦</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}