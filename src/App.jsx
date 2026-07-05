import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { requestPermission } from './lib/notifications'
import Sidebar from './components/layout/Sidebar'
import AmbientLayer from './components/AmbientLayer'
import Search from './components/Search'
import MoodMode, { applyMoodMode, MOOD_MODES } from './components/MoodMode'
import { LoadingState } from './components/ui'
import AppErrorBoundary from './components/AppErrorBoundary'
import { PrivacyPolicy, TermsOfService } from './pages/Legal'

const Auth = lazy(() => import('./pages/Auth'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Landing = lazy(() => import('./pages/Landing'))
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
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'))
const Reading = lazy(() => import('./pages/Reading'))
const StudyRoom = lazy(() => import('./pages/StudyRoom'))
const LifeCoach = lazy(() => import('./pages/LifeCoach'))
const Friends = lazy(() => import('./pages/Friends'))
const DailyChallenges = lazy(() => import('./components/DailyChallenges'))
const Badges = lazy(() => import('./components/Badges'))

function PageWrap({ children }) {
  return <div style={{ animation: 'pageEnter 0.28s ease forwards' }}>{children}</div>
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboarded, setOnboarded] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [userName, setUserName] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [moodMode, setMoodMode] = useState('normal')
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setSession(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Global `/` key for search, `Escape` to close
  useEffect(() => {
    function handleKey(e) {
      if (e.key === '/' && !searchOpen && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [searchOpen])

  // Dark/light mode
  useEffect(() => {
    document.body.classList.toggle('light', !darkMode)
  }, [darkMode])

  async function fetchProfile(uid) {
    const { data } = await supabase.from('profiles').select('name, onboarded').eq('id', uid).single()
    if (data) { setUserName(data.name || ''); setOnboarded(data.onboarded ?? false) }
    else setOnboarded(false)
    setLoading(false)
  }

  useEffect(() => { if (session) setTimeout(() => requestPermission(), 3000) }, [session])

  if (loading) return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <div style={{ minHeight: '100vh', background: 'var(--base-950)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic' }}>loading...</p>
        </div>
      </Suspense>
    </AppErrorBoundary>
  )

  // Allow direct hash links to legal pages even when unauthenticated
  const directHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
  if (!session && (directHash === 'privacy' || directHash === 'terms')) {
    const comp = directHash === 'privacy' ? <PrivacyPolicy session={session} /> : <TermsOfService session={session} />
    return (
      <AppErrorBoundary>
        <Suspense fallback={<LoadingState />}>
          {comp}
        </Suspense>
      </AppErrorBoundary>
    )
  }

  if (!session) {
    if (showAuth) return (
      <AppErrorBoundary>
        <Suspense fallback={<LoadingState />}>
          <Auth onBack={() => setShowAuth(false)} />
        </Suspense>
      </AppErrorBoundary>
    )
    return (
      <AppErrorBoundary>
        <Suspense fallback={<LoadingState />}>
          <Landing onEnter={() => setShowAuth(true)} />
        </Suspense>
      </AppErrorBoundary>
    )
  }
  if (!onboarded) return (
  <Onboarding
    session={session}
    onComplete={() => {
      setOnboarded(true)
      fetchProfile(session.user.id)
    }}
  />
)

  const fullHeight = ['brainstorm', 'hobbies'].includes(activePage)

  const pages = {
    dashboard: <Dashboard session={session} moodMode={moodMode} />,
    tasks: <Tasks session={session} />,
    calendar: <Calendar session={session} />,
    habits: <Habits session={session} />,
    focus: <Focus session={session} />,
    journal: <Journal session={session} />,
    brainstorm: <Brainstorm session={session} />,
    hobbies: <Hobbies session={session} />,
    physical: <Physical session={session} />,
    health: <Health session={session} />,
    vision: <Vision session={session} />,
    stats: <Stats session={session} />,
    friends: <Friends session={session} setActivePage={setActivePage} />,
    settings: <Settings session={session} />,
    study: <StudyPlanner session={session} />,
    reading: <Reading session={session} />,
    study_room: <StudyRoom session={session} />,
    life_coach: <LifeCoach session={session} />,
    challenges: <DailyChallenges session={session} />,
    badges: <Badges session={session} />,
    privacy: <PrivacyPolicy session={session} />,
    terms: <TermsOfService session={session} />,
  }

  const pageFallback = (
    <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '8px' }}>{activePage}</h2>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>coming soon ✦</p>
      </div>
    </div>
  )

  return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--base-950)', position: 'relative' }}>
      <AmbientLayer />
      {searchOpen && <Search session={session} onNavigate={setActivePage} onClose={() => setSearchOpen(false)} />}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%' }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} userName={userName} darkMode={darkMode} setDarkMode={setDarkMode} onSearch={() => setSearchOpen(true)} />
        <main style={{ marginLeft: '220px', flex: 1, overflowY: fullHeight ? 'hidden' : 'auto', height: fullHeight ? '100vh' : 'auto', position: 'relative', zIndex: 1 }}>
          {/* Mood mode picker — top right */}
          <div style={{ position: 'absolute', top: '18px', right: '20px', zIndex: 2 }}>
            <MoodMode current={moodMode} onChange={setMoodMode} />
          </div>
          <PageWrap key={activePage}>
                <Suspense fallback={<LoadingState />}>
                  {pages[activePage] || pageFallback}
                </Suspense>
          </PageWrap>
        </main>
      </div>
        </div>
      </Suspense>
    </AppErrorBoundary>
  )
}

export default App