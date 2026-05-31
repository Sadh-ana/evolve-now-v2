import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

const PROMPTS = [
  "What's one thing that felt hard today, and why do you think that is?",
  "What are you grateful for right now — something small and specific?",
  "What would make tomorrow 10% better than today?",
  "Describe your energy today in 3 words.",
  "What's one thing you want to let go of before you sleep?",
  "What did you learn today — about the world or yourself?",
  "What's something you've been avoiding? What's really behind that?",
  "If your future self looked back at today, what would they appreciate?",
  "What's one small win from today, however minor?",
  "What's draining you right now — and what would refill you?",
]

export default function Journal({ session }) {
  const [entries, setEntries] = useState([])
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(3)
  const [prompt, setPrompt] = useState('')
  const [view, setView] = useState('write')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetchEntries()
    setPrompt(PROMPTS[new Date().getDay() % PROMPTS.length])
  }, [])

  async function fetchEntries() {
    const { data } = await supabase.from('journal_entries').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(30)
    setEntries(data || [])
    const todayE = data?.find(e => e.date === today)
    if (todayE) { setContent(todayE.content || ''); setMood(todayE.mood || 3) }
  }

  async function saveEntry() {
    setSaving(true)
    const uid = session.user.id
    const todayEntry = entries.find(e => e.date === today)
    if (todayEntry) {
      await supabase.from('journal_entries').update({ content, mood, prompt }).eq('id', todayEntry.id)
      setEntries(p => p.map(e => e.id === todayEntry.id ? { ...e, content, mood } : e))
    } else {
      const { data } = await supabase.from('journal_entries').insert({ user_id: uid, content, mood, prompt, date: today }).select().single()
      if (data) setEntries(p => [data, ...p])
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const moodColors = { 1: '#b8a8d4', 2: '#9eb5d4', 3: '#c9a87c', 4: '#a8c4a0', 5: '#d4a5a5' }
  const moodLabels = { 1: 'rough', 2: 'low', 3: 'okay', 4: 'good', 5: 'great' }

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Journal</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '3px', gap: '2px' }}>
          {[{ id: 'write', label: "Today" }, { id: 'history', label: 'Archive' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', background: view === v.id ? 'var(--gold-300)' : 'transparent', color: view === v.id ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s' }}>{v.label}</button>
          ))}
        </div>
      </div>

      {view === 'write' && (
        <div>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--gold-300)', fontSize: '16px', flexShrink: 0 }}>✦</span>
            <p style={{ fontSize: '14px', color: 'var(--cream-300)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', flex: 1, lineHeight: 1.5 }}>{prompt}</p>
            <button onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-sans)', flexShrink: 0, whiteSpace: 'nowrap' }}>shuffle</button>
          </div>

          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: '10px' }}>Today's mood</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setMood(n)} style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: `1px solid ${mood === n ? moodColors[n] : 'var(--base-600)'}`, background: mood === n ? moodColors[n] + '22' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', color: mood === n ? moodColors[n] : 'var(--muted)', transition: 'all 0.15s', fontWeight: mood === n ? 500 : 400 }}>
                  {moodLabels[n]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '12px' }}>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write freely — this is just for you. No structure, no rules. Just what's on your mind right now..." style={{ width: '100%', minHeight: '260px', background: 'transparent', border: 'none', padding: '20px', color: 'var(--cream-200)', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none', lineHeight: 1.75, fontWeight: 300 }} />
            <div style={{ padding: '10px 20px', borderTop: '0.5px solid var(--base-700)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{content.split(' ').filter(Boolean).length} words</span>
              <button onClick={saveEntry} disabled={saving} style={{ padding: '8px 20px', background: saved ? 'var(--base-700)' : 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: saved ? 'var(--muted)' : 'var(--base-950)', transition: 'all 0.2s' }}>
                {saving ? 'saving...' : saved ? '✓ saved' : 'save entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>no entries yet ✦</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Write today and this becomes your archive.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {entries.map(e => (
                <div key={e.id} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--cream-200)' }}>{format(parseISO(e.date), 'EEEE, MMMM d')}</span>
                    {e.mood && <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '99px', background: moodColors[e.mood] + '22', color: moodColors[e.mood], fontFamily: 'var(--font-sans)' }}>{moodLabels[e.mood]}</span>}
                  </div>
                  {e.prompt && <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', marginBottom: '8px' }}>✦ {e.prompt}</p>}
                  <p style={{ fontSize: '13px', color: 'var(--cream-300)', fontFamily: 'var(--font-sans)', fontWeight: 300, lineHeight: 1.65 }}>{e.content?.slice(0, 220)}{(e.content?.length || 0) > 220 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}