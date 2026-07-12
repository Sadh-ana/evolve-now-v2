import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/layout/Sidebar'
import AmbientLayer from './components/AmbientLayer'
import MoodMode, { applyMoodMode, MOOD_MODES } from './components/MoodMode'
import AppErrorBoundary from './components/AppErrorBoundary'
import SpotlightTour from './components/SpotlightTour'
import { LoadingState } from './components/ui'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Habits = lazy(() => import('./pages/Habits'))
const Focus = lazy(() => import('./pages/Focus'))
const Journal = lazy(() => import('./pages/Journal'))
const Stats = lazy(() => import('./pages/Stats'))
const Brainstorm = lazy(() => import('./pages/Brainstorm'))
const Hobbies = lazy(() => import('./pages/Hobbies'))
const Physical = lazy(() => import('./pages/Physical'))
const Vision = lazy(() => import('./pages/Vision'))
const Health = lazy(() => import('./pages/Health'))
const Settings = lazy(() => import('./pages/Settings'))
const StudyRoom = lazy(() => import('./pages/StudyRoom'))
const LifeCoach = lazy(() => import('./pages/LifeCoach'))
const DailyChallenges = lazy(() => import('./components/DailyChallenges'))
const Badges = lazy(() => import('./components/Badges'))
const Friends = lazy(() => import('./pages/Friends'))
const Landing = lazy(() => import('./pages/Landing'))
const Auth = lazy(() => import('./pages/Auth'))
const Onboarding = lazy(() => import('./pages/Onboarding'))

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [userName, setUserName] = useState('')
  const [onboarded, setOnboarded] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [moodMode, setMoodMode] = useState('normal')
  const [showTour, setShowTour] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) fetchProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setOnboarded(true); setShowAuth(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.style.setProperty('--base-950', '#f5f0eb')
      root.style.setProperty('--base-900', '#ede5dc')
      root.style.setProperty('--base-800', '#e0d4c8')
      root.style.setProperty('--base-700', '#d0c0b0')
      root.style.setProperty('--base-600', '#b8a898')
      root.style.setProperty('--cream-200', '#2a1f14')
      root.style.setProperty('--muted', '#6b5040')
      root.style.setProperty('--gold-300', '#8a5a2a')
    } else {
      root.style.setProperty('--base-950', '#1a120b')
      root.style.setProperty('--base-900', '#1e1510')
      root.style.setProperty('--base-800', '#231a12')
      root.style.setProperty('--base-700', '#2a1f14')
      root.style.setProperty('--base-600', '#3d2a1a')
      root.style.setProperty('--cream-200', '#e8d5c0')
      root.style.setProperty('--muted', '#8a7060')
      root.style.setProperty('--gold-300', '#c9a87c')
    }
  }, [darkMode])

  async function fetchProfile(uid) {
    const { data } = await supabase.from('profiles').select('name, onboarded').eq('id', uid).single()
    if (data) {
      setUserName(data.name || '')
      setOnboarded(!!data.onboarded)
    } else {
      setOnboarded(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0e0a06', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8a7060', fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'italic' }}>loading...</p>
    </div>
  )

  if (!session) {
    if (showAuth) return (
      <Suspense fallback={<LoadingState />}>
        <Auth onBack={() => setShowAuth(false)} />
      </Suspense>
    )
    return (
      <Suspense fallback={<LoadingState />}>
        <Landing onEnter={() => setShowAuth(true)} />
      </Suspense>
    )
  }

  if (!onboarded) return (
    <Suspense fallback={<LoadingState />}>
      <Onboarding
        session={session}
        onComplete={() => {
          setOnboarded(true)
          setShowTour(true)
          fetchProfile(session.user.id)
        }}
      />
    </Suspense>
  )

  const ComingSoon = ({ page }) => (
    <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '8px' }}>{page}</h2>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>coming soon ✦</p>
      </div>
    </div>
  )

  // Pages rendered with display:none when not active — preserves state when switching tabs
  const allPages = [
    { id: 'dashboard', el: <Dashboard session={session} moodMode={moodMode} /> },
    { id: 'tasks', el: <Tasks session={session} /> },
    { id: 'calendar', el: <Calendar session={session} /> },
    { id: 'habits', el: <Habits session={session} /> },
    { id: 'focus', el: <Focus session={session} /> },
    { id: 'journal', el: <Journal session={session} /> },
    { id: 'stats', el: <Stats session={session} /> },
    { id: 'brainstorm', el: <Brainstorm session={session} /> },
    { id: 'physical', el: <Physical session={session} /> },
    { id: 'hobbies', el: <Hobbies session={session} /> },
    { id: 'vision', el: <Vision session={session} /> },
    { id: 'health', el: <Health session={session} /> },
    { id: 'settings', el: <Settings session={session} /> },
    { id: 'studyroom', el: <StudyRoom session={session} /> },
    { id: 'lifecoach', el: <LifeCoach session={session} /> },
    { id: 'challenges', el: <DailyChallenges session={session} /> },
    { id: 'badges', el: <Badges session={session} /> },
    { id: 'friends', el: <Friends session={session} setActivePage={setActivePage} /> },
  ]

  const isStudyRoom = activePage === 'studyroom'

  return (
    <AppErrorBoundary>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--base-950)' }}>
        <AmbientLayer />

        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          userName={userName}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Main content area */}
        <div style={{
          marginLeft: '220px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Mood mode picker */}
          <div data-tour="mood-mode" style={{ position: 'fixed', top: '16px', right: '20px', zIndex: 200 }}>
            <MoodMode current={moodMode} onChange={id => {
              setMoodMode(id)
              const mode = MOOD_MODES.find(m => m.id === id)
              if (mode) applyMoodMode(mode)
            }} />
          </div>

          {/* All pages — hidden when not active, preserving state */}
          <Suspense fallback={<LoadingState />}>
            {allPages.map(({ id, el }) => (
              <div
                key={id}
                style={{
                  display: activePage === id ? 'flex' : 'none',
                  flexDirection: 'column',
                  flex: activePage === id ? 1 : undefined,
                  overflowY: id === 'studyroom' ? 'hidden' : 'auto',
                  height: '100%',
                }}
              >
                {el}
              </div>
            ))}

            {/* Fallback for unknown pages */}
            {!allPages.find(p => p.id === activePage) && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <ComingSoon page={activePage} />
              </div>
            )}
          </Suspense>
        </div>

        {showTour && <SpotlightTour onFinish={() => setShowTour(false)} />}
      </div>
    </AppErrorBoundary>
  )
}

export default App