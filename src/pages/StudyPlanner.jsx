import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, differenceInDays, parseISO } from 'date-fns'

const SUBJECT_COLORS = ['#c9a87c','#d4a5a5','#9eb5d4','#a8c4a0','#b8a8d4','#7fc4b0','#d4b8a0','#e8c4c4']

export default function StudyPlanner({ session }) {
  const [subjects, setSubjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeSubject, setActiveSubject] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showSession, setShowSession] = useState(false)
  const [newSubject, setNewSubject] = useState({ name: '', exam_date: '', color: '#c9a87c', topics: '', confidence: 3 })
  const [newSession, setNewSession] = useState({ topic: '', duration_minutes: 30, quality: 3 })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const uid = session.user.id
    const { data: s } = await supabase.from('subjects').select('*').eq('user_id', uid).order('exam_date')
    setSubjects(s || [])
    const { data: rs } = await supabase.from('revision_sessions').select('*').eq('user_id', uid).order('date', { ascending: false })
    setSessions(rs || [])
  }

  async function addSubject(e) {
    e.preventDefault()
    const topicsArr = newSubject.topics.split(',').map(t => t.trim()).filter(Boolean)
    const { data } = await supabase.from('subjects').insert({
      user_id: session.user.id, name: newSubject.name, exam_date: newSubject.exam_date || null,
      color: newSubject.color, topics: topicsArr, confidence: newSubject.confidence,
    }).select().single()
    if (data) setSubjects(p => [...p, data])
    setNewSubject({ name: '', exam_date: '', color: '#c9a87c', topics: '', confidence: 3 })
    setShowAdd(false)
  }

  async function logSession(e) {
    e.preventDefault()
    if (!activeSubject) return
    const { data } = await supabase.from('revision_sessions').insert({
      user_id: session.user.id, subject_id: activeSubject.id,
      topic: newSession.topic, duration_minutes: newSession.duration_minutes,
      quality: newSession.quality, date: format(new Date(), 'yyyy-MM-dd')
    }).select().single()
    if (data) setSessions(p => [data, ...p])
    setNewSession({ topic: '', duration_minutes: 30, quality: 3 })
    setShowSession(false)
  }

  async function updateConfidence(id, confidence) {
    await supabase.from('subjects').update({ confidence }).eq('id', id)
    setSubjects(p => p.map(s => s.id === id ? { ...s, confidence } : s))
  }

  async function deleteSubject(id) {
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects(p => p.filter(s => s.id !== id))
    if (activeSubject?.id === id) setActiveSubject(null)
  }

  const getSubjectSessions = (id) => sessions.filter(s => s.subject_id === id)
  const getSubjectMinutes = (id) => getSubjectSessions(id).reduce((s, x) => s + (x.duration_minutes || 0), 0)
  const getDaysLeft = (examDate) => examDate ? Math.max(0, differenceInDays(parseISO(examDate), new Date())) : null
  const getRecommendedDaily = (subject) => {
    const days = getDaysLeft(subject.exam_date)
    if (!days) return null
    const topicsLeft = (subject.topics || []).length
    const baseHours = topicsLeft > 5 ? 2 : topicsLeft > 2 ? 1.5 : 1
    const urgencyMultiplier = days < 7 ? 2 : days < 14 ? 1.5 : 1
    return Math.round(baseHours * urgencyMultiplier * 10) / 10
  }

  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Study Planner</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>exam prep + revision tracker ✦</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeSubject && <button onClick={() => setShowSession(true)} style={{ padding: '10px 16px', background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted)' }}>+ Log session</button>}
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Add subject</button>
        </div>
      </div>

      {/* Exam countdown row */}
      {subjects.filter(s => s.exam_date).length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {subjects.filter(s => s.exam_date).sort((a, b) => getDaysLeft(a.exam_date) - getDaysLeft(b.exam_date)).map(s => {
            const days = getDaysLeft(s.exam_date)
            const urgent = days !== null && days <= 7
            return (
              <div key={s.id} style={{ background: 'var(--base-800)', border: `0.5px solid ${urgent ? s.color : 'var(--base-600)'}`, borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveSubject(s)}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: urgent ? s.color : 'var(--gold-300)', lineHeight: 1 }}>{days}</div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>days</div>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{s.name}</p>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{format(parseISO(s.exam_date), 'MMM d')}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: activeSubject ? '1fr 320px' : '1fr', gap: '16px' }}>
        {/* Subject grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', alignContent: 'start' }}>
          {subjects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '56px 0' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>no subjects yet ✦</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Add your first subject to start planning revision.</p>
            </div>
          ) : subjects.map(s => {
            const mins = getSubjectMinutes(s.id)
            const days = getDaysLeft(s.exam_date)
            const recommended = getRecommendedDaily(s)
            const isActive = activeSubject?.id === s.id
            return (
              <div key={s.id} onClick={() => setActiveSubject(isActive ? null : s)} style={{ background: 'var(--base-800)', border: `0.5px solid ${isActive ? s.color : 'var(--base-600)'}`, borderLeft: `3px solid ${s.color}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--cream-200)', fontWeight: 400 }}>{s.name}</h3>
                  <button onClick={e => { e.stopPropagation(); deleteSubject(s.id) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '14px' }}>×</button>
                </div>

                {/* Confidence */}
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Confidence</p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={e => { e.stopPropagation(); updateConfidence(s.id, n) }} style={{ width: '22px', height: '22px', borderRadius: '50%', border: `1px solid ${n <= s.confidence ? s.color : 'var(--base-600)'}`, background: n <= s.confidence ? s.color + '44' : 'transparent', cursor: 'pointer', fontSize: '9px', color: n <= s.confidence ? s.color : 'var(--muted)', transition: 'all 0.15s' }}>{n}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{Math.round(mins / 60 * 10) / 10}h studied</span>
                    {days !== null && <span style={{ fontSize: '10px', color: days <= 7 ? s.color : 'var(--muted)', fontFamily: 'var(--font-sans)', display: 'block' }}>{days}d left</span>}
                  </div>
                  {recommended && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>recommended</p>
                      <p style={{ fontSize: '14px', color: s.color, fontFamily: 'var(--font-serif)' }}>{recommended}h/day</p>
                    </div>
                  )}
                </div>

                {s.topics?.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {s.topics.slice(0, 3).map((t, i) => (
                      <span key={i} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '99px', background: s.color + '22', color: s.color, fontFamily: 'var(--font-sans)' }}>{t}</span>
                    ))}
                    {s.topics.length > 3 && <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>+{s.topics.length - 3}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Active subject detail */}
        {activeSubject && (
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '1.25rem', alignSelf: 'start' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '14px', fontWeight: 400 }}>{activeSubject.name} — sessions</h4>
            {getSubjectSessions(activeSubject.id).length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>no sessions logged yet</p>
            ) : getSubjectSessions(activeSubject.id).slice(0, 8).map(s => (
              <div key={s.id} style={{ padding: '8px 0', borderBottom: '0.5px solid var(--base-700)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{s.topic || 'General revision'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{s.duration_minutes}m</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{s.date}</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(n => <div key={n} style={{ width: '5px', height: '5px', borderRadius: '50%', background: n <= (s.quality || 3) ? activeSubject.color : 'var(--base-600)' }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add subject modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Add subject</h3>
            <form onSubmit={addSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Subject name</label><input value={newSubject.name} onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))} placeholder="Physics, Maths, Chemistry..." required autoFocus style={iStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Exam date (optional)</label><input type="date" value={newSubject.exam_date} onChange={e => setNewSubject(p => ({ ...p, exam_date: e.target.value }))} style={{ ...iStyle, colorScheme: 'dark' }} /></div>
                <div>
                  <label style={lStyle}>Color</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                    {SUBJECT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setNewSubject(p => ({ ...p, color: c }))} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: `2px solid ${newSubject.color === c ? 'var(--cream-200)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div><label style={lStyle}>Topics (comma separated)</label><input value={newSubject.topics} onChange={e => setNewSubject(p => ({ ...p, topics: e.target.value }))} placeholder="Kinematics, Thermodynamics, Optics..." style={iStyle} /></div>
              <div>
                <label style={lStyle}>Current confidence (1-5)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setNewSubject(p => ({ ...p, confidence: n }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `0.5px solid ${newSubject.confidence === n ? newSubject.color : 'var(--base-600)'}`, background: newSubject.confidence === n ? newSubject.color + '22' : 'transparent', color: newSubject.confidence === n ? newSubject.color : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add Subject ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log session modal */}
      {showSession && activeSubject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowSession(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Log {activeSubject.name} session</h3>
            <form onSubmit={logSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Topic</label>
                <input value={newSession.topic} onChange={e => setNewSession(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. Kirchhoff's Laws" style={iStyle} list="topics-list" autoFocus />
                <datalist id="topics-list">{(activeSubject.topics || []).map(t => <option key={t} value={t} />)}</datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Duration (min)</label><input type="number" value={newSession.duration_minutes} onChange={e => setNewSession(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} min={5} style={iStyle} /></div>
                <div><label style={lStyle}>Session quality</label>
                  <div style={{ display: 'flex', gap: '4px', paddingTop: '8px' }}>
                    {[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setNewSession(p => ({ ...p, quality: n }))} style={{ flex: 1, height: '32px', borderRadius: '6px', border: `0.5px solid ${newSession.quality === n ? activeSubject.color : 'var(--base-600)'}`, background: newSession.quality === n ? activeSubject.color + '33' : 'transparent', color: newSession.quality === n ? activeSubject.color : 'var(--muted)', cursor: 'pointer', fontSize: '12px' }}>{n}</button>)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowSession(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Log ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}