import { supabase } from '../../lib/supabase'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'calendar', label: 'Calendar', icon: '◻' },
  { id: 'habits', label: 'Habits', icon: '◎' },
  { id: 'focus', label: 'Focus', icon: '◷' },
  { id: 'journal', label: 'Journal', icon: '✦' },
  { id: 'physical', label: 'Physical', icon: '↑' },
  { id: 'hobbies', label: 'Hobbies', icon: '♡' },
  { id: 'vision', label: 'Vision', icon: '◈' },
  { id: 'stats', label: 'Stats', icon: '∿' },
]

export default function Sidebar({ activePage, setActivePage, userName }) {
  return (
    <div style={{
      width: '220px',
      minWidth: '220px',
      height: '100vh',
      background: 'var(--base-900)',
      borderRight: '0.5px solid var(--base-600)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{
        padding: '28px 24px 20px',
        borderBottom: '0.5px solid var(--base-700)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '28px',
          fontStyle: 'italic',
          fontWeight: 400,
          color: 'var(--cream-200)',
          marginBottom: '2px',
        }}>evolve</h1>
        <p style={{
          fontSize: '10px',
          color: 'var(--muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-sans)',
        }}>your life OS</p>
      </div>

      {/* User */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '0.5px solid var(--base-700)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--gold-300)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--base-950)',
          fontFamily: 'var(--font-sans)',
          marginBottom: '8px',
        }}>
          {userName ? userName[0].toUpperCase() : '?'}
        </div>
        <p style={{
          fontSize: '13px',
          color: 'var(--cream-200)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
        }}>{userName || 'User'}</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: activePage === item.id ? 500 : 400,
              background: activePage === item.id ? 'var(--base-700)' : 'transparent',
              color: activePage === item.id ? 'var(--cream-200)' : 'var(--muted)',
              textAlign: 'left',
              transition: 'all 0.15s',
              marginBottom: '2px',
            }}
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {activePage === item.id && (
              <span style={{
                marginLeft: 'auto',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'var(--gold-300)',
              }} />
            )}
          </button>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '16px 12px', borderTop: '0.5px solid var(--base-700)' }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            background: 'transparent',
            color: 'var(--muted)',
            textAlign: 'left',
            transition: 'all 0.15s',
          }}
        >
          ← Sign out
        </button>
      </div>
    </div>
  )
}