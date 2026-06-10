import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { requestPermission } from './lib/notifications'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Sidebar from './components/layout/Sidebar'
import AmbientLayer from './components/AmbientLayer'
import Search from './components/Search'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Habits from './pages/Habits'
import Focus from './pages/Focus'
import Journal from './pages/Journal'
import Stats from './pages/Stats'
import Brainstorm from './pages/Brainstorm'
import Hobbies from './pages/Hobbies'
import Physical from './pages/Physical'
import Health from './pages/Health'
import Vision from './pages/Vision'
import Settings from './pages/Settings'
import StudyPlanner from './pages/StudyPlanner'
import Reading from './pages/Reading'
import StudyRoom from './pages/StudyRoom'
import LifeCoach from './pages/LifeCoach'
import DailyChallenges from './components/DailyChallenges'
import Badges from './components/Badges'
import MoodMode, { applyMoodMode, MOOD_MODES } from './components/MoodMode'

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
    <div style={{ minHeight: '100vh', background: 'var(--base-950)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic' }}>loading...</p>
    </div>
  )

  if (!session) return <Auth />
  if (!onboarded) return <Onboarding session={session} onComplete={() => { setOnboarded(true); fetchProfile(session.user.id) }} />

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
    settings: <Settings session={session} />,
    study: <StudyPlanner session={session} />,
    reading: <Reading session={session} />,
    study_room: <StudyRoom session={session} />,
    life_coach: <LifeCoach session={session} />,
    challenges: <DailyChallenges session={session} />,
    badges: <Badges session={session} />,
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
            {pages[activePage] || pageFallback}
          </PageWrap>
        </main>
      </div>
    </div>
  )
}

export default App