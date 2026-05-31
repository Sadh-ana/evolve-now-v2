import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Sidebar from './components/layout/Sidebar'
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
import Vision from './pages/Vision'
import Onboarding from './pages/Onboarding'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) fetchName(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchName(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchName(uid) {
    const { data } = await supabase.from('profiles').select('name').eq('id', uid).single()
    if (data) setUserName(data.name || '')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--base-950)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic' }}>loading...</p>
    </div>
  )

  if (!session) return <Auth />

  const ComingSoon = ({ page }) => (
    <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '8px' }}>{page}</h2>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>coming soon ✦</p>
      </div>
    </div>
  )

  const pages = { dashboard: <Dashboard session={session} />, tasks: <Tasks session={session} />, calendar: <Calendar session={session} />, habits: <Habits session={session} />, focus: <Focus session={session} />, journal: <Journal session={session} />, stats: <Stats session={session} />, physical: <ComingSoon page="Physical" />, hobbies: <ComingSoon page="Hobbies & Side Quests" />, vision: <ComingSoon page="Vision" /> }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--base-950)' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} userName={userName} />
      <main style={{ marginLeft: '220px', flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {pages[activePage] || <ComingSoon page={activePage} />}
      </main>
    </div>
  )
}

export default App