import { supabase } from '../../lib/supabase'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'calendar', label: 'Calendar', icon: '◻' },
  { id: 'habits', label: 'Habits', icon: '◎' },
  { id: 'focus', label: 'Focus', icon: '◷' },
  { id: 'study_room', label: 'Study Room', icon: '◉' },
  { id: 'journal', label: 'Journal', icon: '✦' },
  { id: 'brainstorm', label: 'Brainstorm', icon: '∞' },
  { id: 'hobbies', label: 'Side Quests', icon: '♡' },
  { id: 'health', label: 'Health', icon: '◑' },
  { id: 'physical', label: 'Physical', icon: '↑' },
  { id: 'vision', label: 'Vision', icon: '⊕' },
  { id: 'life_coach', label: 'Life Coach', icon: '◈' },
  { id: 'challenges', label: 'Challenges', icon: '⊗' },
  { id: 'badges', label: 'Badges', icon: '✦' },
  { id: 'stats', label: 'Stats', icon: '∿' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar({ activePage, setActivePage, userName, darkMode, setDarkMode }) {
  return (
    <div style={{
      width: '220px', minWidth: '220px', height: '100vh',
      background: 'var(--base-900)', borderRight: '0.5px solid var(--base-600)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: 100,
    }}>

      {/* Logo + theme toggle */}
      <div style={{ padding: '22px 20px 16px', borderBottom: '0.5px solid var(--base-700)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '1px' }}>evolve</h1>
          <p style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>your life OS</p>
        </div>
        {setDarkMode && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ background: 'var(--base-700)', border: 'none', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', fontSize: '13px', color: 'var(--muted)', marginTop: '2px', transition: 'all 0.2s' }}
            title="Toggle theme"
          >
            {darkMode ? '☀' : '◑'}
          </button>
        )}
      </div>

      {/* User chip */}
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--base-700)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--base-800)', borderRadius: '10px', border: '0.5px solid var(--base-600)' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold-300), var(--rose-300))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600, color: 'var(--base-950)',
            fontFamily: 'var(--font-sans)', flexShrink: 0,
          }}>
            {userName ? userName[0].toUpperCase() : '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName || 'User'}
            </p>
            <p style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>evolving ✦</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
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
              marginBottom: '1px',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (activePage !== item.id) {
                e.currentTarget.style.background = 'var(--base-800)'
                e.currentTarget.style.color = 'var(--cream-300)'
              }
            }}
            onMouseLeave={e => {
              if (activePage !== item.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--muted)'
              }
            }}
          >
            {/* Active indicator */}
            {activePage === item.id && (
              <div style={{
                position: 'absolute', left: 0, top: '50%',
                transform: 'translateY(-50%)',
                width: '2.5px', height: '16px',
                borderRadius: '0 2px 2px 0',
                background: 'var(--gold-300)',
              }} />
            )}
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
            {activePage === item.id && (
              <span style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold-300)', flexShrink: 0 }} />
            )}
          </button>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '12px 10px', borderTop: '0.5px solid var(--base-700)' }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%', padding: '9px 12px',
            borderRadius: 'var(--radius-sm)', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            fontSize: '12px', background: 'transparent',
            color: 'var(--muted)', textAlign: 'left',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--rose-300)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          <span style={{ fontSize: '12px' }}>←</span> Sign out
        </button>
      </div>
    </div>
  )
}