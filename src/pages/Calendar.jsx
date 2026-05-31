import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay, parseISO, differenceInDays } from 'date-fns'

const CAT_COLORS = {
  academic: '#c9a87c', physical: '#d4a5a5', mental: '#9eb5d4',
  creative: '#a8c4a0', social: '#d4b8a0', life: '#b8a8d4',
  exam: '#e8c4c4', general: '#8a7060',
}

export default function Calendar({ session }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month')
  const [events, setEvents] = useState([])
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', category: 'general', is_exam: false, date: format(new Date(), 'yyyy-MM-dd'), start_time: '', end_time: '' })

  useEffect(() => { fetchEvents() }, [currentDate])

  async function fetchEvents() {
    const start = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd')
    const end = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd')
    const { data } = await supabase.from('events').select('*').eq('user_id', session.user.id).gte('date', start).lte('date', end).order('date')
    setEvents(data || [])
  }

  async function addEvent(e) {
    e.preventDefault()
    if (!newEvent.title.trim()) return
    const { data } = await supabase.from('events').insert({
      user_id: session.user.id, title: newEvent.title,
      category: newEvent.is_exam ? 'exam' : newEvent.category,
      is_exam: newEvent.is_exam, date: newEvent.date,
      start_time: newEvent.start_time || null, end_time: newEvent.end_time || null,
    }).select().single()
    if (data) setEvents(prev => [...prev, data])
    setShowAdd(false)
    setNewEvent({ title: '', category: 'general', is_exam: false, date: format(selectedDay, 'yyyy-MM-dd'), start_time: '', end_time: '' })
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })
  const dayEvents = day => events.filter(e => isSameDay(parseISO(e.date), day))
  const selectedEvents = dayEvents(selectedDay)

  const upcomingExams = events
    .filter(e => e.is_exam && parseISO(e.date) >= new Date())
    .sort((a, b) => parseISO(a.date) - parseISO(b.date))
    .slice(0, 4)

  const inputStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const labelStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Calendar</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>plan with intention ✦</p>
        </div>
        <button onClick={() => { setNewEvent(p => ({ ...p, date: format(selectedDay, 'yyyy-MM-dd') })); setShowAdd(true) }} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>
          + New Event
        </button>
      </div>

      {/* Exam countdowns */}
      {upcomingExams.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {upcomingExams.map(exam => {
            const d = differenceInDays(parseISO(exam.date), new Date())
            return (
              <div key={exam.id} style={{ background: 'var(--base-800)', border: '0.5px solid #e8c4c440', borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: '#e8c4c4', fontWeight: 400, lineHeight: 1 }}>{d}</span>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>📝 {exam.title}</p>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{d === 0 ? 'today!' : d === 1 ? 'tomorrow' : 'days away'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px' }}>
        {/* Calendar */}
        <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '0.5px solid var(--base-600)' }}>
            <button onClick={() => setCurrentDate(d => subMonths(d, 1))} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '18px' }}>←</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', color: 'var(--cream-200)', fontWeight: 400 }}>{format(currentDate, 'MMMM yyyy')}</h3>
              <div style={{ display: 'flex', background: 'var(--base-700)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                {['month', 'agenda'].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: view === v ? 'var(--gold-300)' : 'transparent', color: view === v ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s', textTransform: 'capitalize' }}>{v}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setCurrentDate(d => addMonths(d, 1))} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '18px' }}>→</button>
          </div>
          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '0.5px solid var(--base-600)' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>
          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {days.map((day, i) => {
              const de = dayEvents(day)
              const inMonth = isSameMonth(day, currentDate)
              const isT = isToday(day)
              const isSel = isSameDay(day, selectedDay)
              return (
                <div key={i} onClick={() => setSelectedDay(day)} style={{
                  minHeight: '80px', padding: '6px',
                  borderRight: '0.5px solid var(--base-700)', borderBottom: '0.5px solid var(--base-700)',
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: isSel ? 'var(--base-700)' : 'transparent',
                }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontFamily: 'var(--font-sans)', background: isT ? 'var(--gold-300)' : 'transparent', color: isT ? 'var(--base-950)' : inMonth ? 'var(--cream-300)' : 'var(--base-600)', fontWeight: isT ? 500 : 400, marginBottom: '4px' }}>
                    {format(day, 'd')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {de.slice(0, 2).map(ev => (
                      <div key={ev.id} style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '3px', background: (CAT_COLORS[ev.category] || '#8a7060') + '33', color: CAT_COLORS[ev.category] || '#8a7060', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.is_exam && '📝 '}{ev.title}
                      </div>
                    ))}
                    {de.length > 2 && <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>+{de.length - 2}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          {view === 'agenda' && (
            <div style={{ padding: '16px 20px' }}>
              {(() => {
                const next30 = eachDayOfInterval({ start: new Date(), end: subDays(addMonths(new Date(), 1), 1) })
                const agendaDays = next30.filter(day => dayEvents(day).length > 0)
                if (agendaDays.length === 0) return <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No upcoming events ✦</p>
                return agendaDays.map((day, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: isToday(day) ? 'var(--gold-300)' : 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: isToday(day) ? 500 : 400, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{isToday(day) ? 'Today — ' : ''}{format(day, 'EEE, MMM d')}</p>
                    {dayEvents(day).map(ev => (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--base-700)', borderRadius: '8px', marginBottom: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_COLORS[ev.category] || '#8a7060', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', flex: 1 }}>{ev.is_exam && '📝 '}{ev.title}</span>
                        {ev.start_time && <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{ev.start_time}</span>}
                        <button onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '14px' }}>×</button>
                      </div>
                    ))}
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Day panel */}
        <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--cream-200)', fontWeight: 400 }}>
              {format(selectedDay, 'EEE, MMM d')}
              {isToday(selectedDay) && <span style={{ fontSize: '10px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', marginLeft: '8px', fontStyle: 'normal' }}>today</span>}
            </h4>
            <button onClick={() => { setNewEvent(p => ({ ...p, date: format(selectedDay, 'yyyy-MM-dd') })); setShowAdd(true) }} style={{ background: 'transparent', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', cursor: 'pointer', color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>+</button>
          </div>
          {selectedEvents.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>free day ✦</p>
          ) : (
            selectedEvents.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 0', borderBottom: '0.5px solid var(--base-700)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_COLORS[ev.category] || '#8a7060', flexShrink: 0, marginTop: '3px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{ev.is_exam && '📝 '}{ev.title}</p>
                  {ev.start_time && <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginTop: '2px' }}>{ev.start_time}{ev.end_time && ` — ${ev.end_time}`}</p>}
                </div>
                <button onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '14px' }}>×</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Event</h3>
            <form onSubmit={addEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event name" required autoFocus style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={newEvent.category} onChange={e => setNewEvent(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                    {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Start Time</label>
                  <input type="time" value={newEvent.start_time} onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>End Time</label>
                  <input type="time" value={newEvent.end_time} onChange={e => setNewEvent(p => ({ ...p, end_time: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>
              {/* Exam toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" onClick={() => setNewEvent(p => ({ ...p, is_exam: !p.is_exam }))} style={{ width: '40px', height: '22px', borderRadius: '99px', background: newEvent.is_exam ? 'var(--gold-300)' : 'var(--base-600)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: '3px', left: newEvent.is_exam ? '20px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                </button>
                <span style={{ fontSize: '13px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>Mark as exam / important deadline</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add Event ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}