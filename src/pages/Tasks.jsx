import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

const CATEGORIES = [
  { id: 'academic', label: 'Academic', color: '#c9a87c' },
  { id: 'physical', label: 'Physical', color: '#d4a5a5' },
  { id: 'mental', label: 'Mental', color: '#9eb5d4' },
  { id: 'creative', label: 'Creative', color: '#a8c4a0' },
  { id: 'social', label: 'Social', color: '#d4b8a0' },
  { id: 'life', label: 'Life Admin', color: '#b8a8d4' },
  { id: 'general', label: 'General', color: '#8a7060' },
]

const PRIORITIES = [
  { id: 'do-first', label: 'Do First', color: '#d4a5a5', desc: 'Urgent & Important' },
  { id: 'schedule', label: 'Schedule', color: '#c9a87c', desc: 'Important, not Urgent' },
  { id: 'delegate', label: 'Delegate', color: '#9eb5d4', desc: 'Urgent, not Important' },
  { id: 'drop', label: 'Drop', color: '#8a7060', desc: 'Neither' },
]

export default function Tasks({ session }) {
  const [tasks, setTasks] = useState([])
  const [view, setView] = useState('list')
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [celebrating, setCelebrating] = useState(null)
  const [completedToday, setCompletedToday] = useState(0)
  const [newTask, setNewTask] = useState({
    title: '', category: 'general', priority: 'do-first',
    due_date: '', effort: 2, notes: ''
  })

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks').select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    const today = format(new Date(), 'yyyy-MM-dd')
    setCompletedToday((data || []).filter(t => t.status === 'done' && t.updated_at?.startsWith(today)).length)
  }

  async function addTask(e) {
    e.preventDefault()
    if (!newTask.title.trim()) return
    const { data } = await supabase.from('tasks').insert({
      user_id: session.user.id, title: newTask.title.trim(),
      category: newTask.category, priority: newTask.priority,
      due_date: newTask.due_date || null, effort: newTask.effort,
      notes: newTask.notes, status: 'todo',
    }).select().single()
    if (data) setTasks(prev => [data, ...prev])
    setNewTask({ title: '', category: 'general', priority: 'do-first', due_date: '', effort: 2, notes: '' })
    setShowAdd(false)
  }

  async function completeTask(id) {
    setCelebrating(id)
    setTimeout(async () => {
      await supabase.from('tasks').update({ status: 'done' }).eq('id', id)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
      setCompletedToday(prev => prev + 1)
      setCelebrating(null)
    }, 500)
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function updateStatus(id, status) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const filtered = tasks.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pending = filtered.filter(t => t.status !== 'done')
  const done = filtered.filter(t => t.status === 'done')
  const pct = filtered.length ? Math.round((done.length / filtered.length) * 100) : 0

  const getCat = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[6]
  const getPri = id => PRIORITIES.find(p => p.id === id) || PRIORITIES[3]
  const getDue = dateStr => {
    if (!dateStr) return null
    const d = parseISO(dateStr)
    if (isToday(d)) return { label: 'Today', color: '#d4a5a5' }
    if (isTomorrow(d)) return { label: 'Tomorrow', color: '#c9a87c' }
    if (isPast(d)) return { label: 'Overdue', color: '#c4728a' }
    return { label: format(d, 'MMM d'), color: 'var(--muted)' }
  }

  const inputStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const labelStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  const TaskCard = ({ task }) => {
    const cat = getCat(task.category)
    const pri = getPri(task.priority)
    const due = getDue(task.due_date)
    const isDone = task.status === 'done'
    const isCelebrating = celebrating === task.id
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px',
        borderRadius: 'var(--radius-md)', marginBottom: '8px',
        background: isCelebrating ? 'var(--base-700)' : 'var(--base-800)',
        border: `0.5px solid ${isCelebrating ? 'var(--gold-300)' : 'var(--base-600)'}`,
        opacity: isDone ? 0.5 : 1, transition: 'all 0.3s',
        transform: isCelebrating ? 'scale(1.01)' : 'scale(1)',
      }}>
        <button onClick={() => !isDone && completeTask(task.id)} style={{
          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
          border: `1.5px solid ${isDone ? 'var(--gold-300)' : pri.color}`,
          background: isDone ? 'var(--gold-300)' : isCelebrating ? pri.color : 'transparent',
          cursor: isDone ? 'default' : 'pointer', fontSize: '10px', color: 'var(--base-950)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
        }}>{isDone && '✓'}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', marginBottom: '5px', lineHeight: 1.4, color: isDone ? 'var(--muted)' : 'var(--cream-200)', textDecoration: isDone ? 'line-through' : 'none' }}>
            {task.title}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '99px', background: cat.color + '22', color: cat.color, fontFamily: 'var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{cat.label}</span>
            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '99px', background: pri.color + '22', color: pri.color, fontFamily: 'var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{pri.label}</span>
            {due && <span style={{ fontSize: '9px', color: due.color, fontFamily: 'var(--font-sans)' }}>◷ {due.label}</span>}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: '3px' }}>
              {[1,2,3,4,5].map(n => <span key={n} style={{ width: '5px', height: '5px', borderRadius: '50%', background: n <= (task.effort || 2) ? 'var(--gold-300)' : 'var(--base-600)' }} />)}
            </span>
          </div>
        </div>
        {!isDone && <button onClick={() => deleteTask(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>×</button>}
      </div>
    )
  }

  const ListView = () => (
    <div>
      {pending.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 0' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>all clear ✦</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>No pending tasks. You've earned a moment.</p>
        </div>
      )}
      {pending.map(t => <TaskCard key={t.id} task={t} />)}
      {done.length > 0 && <>
        <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-sans)', margin: '24px 0 12px' }}>Completed ✓</p>
        {done.slice(0, 5).map(t => <TaskCard key={t.id} task={t} />)}
      </>}
    </div>
  )

  const KanbanView = () => {
    const cols = [
      { id: 'todo', label: 'To Do', color: 'var(--muted)', next: 'in-progress' },
      { id: 'in-progress', label: 'In Progress', color: 'var(--gold-300)', next: 'done' },
      { id: 'done', label: 'Done', color: 'var(--rose-300)', next: 'todo' },
    ]
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        {cols.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id)
          return (
            <div key={col.id} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', background: 'var(--base-700)', color: 'var(--muted)', padding: '1px 8px', borderRadius: '99px', fontFamily: 'var(--font-sans)' }}>{colTasks.length}</span>
              </div>
              {colTasks.map(t => (
                <div key={t.id} onClick={() => updateStatus(t.id, col.next)} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--base-700)',
                  border: '0.5px solid var(--base-600)', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <p style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', marginBottom: '5px' }}>{t.title}</p>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '99px', background: getCat(t.category).color + '22', color: getCat(t.category).color, fontFamily: 'var(--font-sans)' }}>{getCat(t.category).label}</span>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>empty</p>}
            </div>
          )
        })}
      </div>
    )
  }

  const MatrixView = () => {
    const quadrants = [
      { id: 'do-first', label: 'Do First', sub: 'Urgent + Important', color: '#d4a5a5' },
      { id: 'schedule', label: 'Schedule', sub: 'Important, Not Urgent', color: '#c9a87c' },
      { id: 'delegate', label: 'Delegate', sub: 'Urgent, Not Important', color: '#9eb5d4' },
      { id: 'drop', label: 'Drop', sub: 'Neither', color: '#8a7060' },
    ]
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {quadrants.map(q => {
            const qTasks = filtered.filter(t => t.priority === q.id && t.status !== 'done')
            return (
              <div key={q.id} style={{ background: q.color + '0a', border: `1px solid ${q.color}30`, borderRadius: 'var(--radius-lg)', padding: '16px', minHeight: '160px' }}>
                <span style={{ fontSize: '12px', color: q.color, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{q.label}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: '12px' }}>{q.sub}</span>
                {qTasks.map(t => (
                  <div key={t.id} style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => completeTask(t.id)} style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1px solid ${q.color}`, background: 'transparent', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{t.title}</span>
                  </div>
                ))}
                {qTasks.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>nothing here</p>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Tasks</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
            {completedToday > 0 ? `${completedToday} crushed today ✦` : 'what are we tackling today?'}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>
          + New Task
        </button>
      </div>

      {/* Progress bar */}
      {filtered.length > 0 && (
        <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-lg)', padding: '14px 1.25rem', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)' }}>{done.length} of {filtered.length} complete</span>
            <span style={{ fontSize: '11px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{pct}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, var(--gold-300), var(--rose-300))', width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '3px', gap: '2px' }}>
          {[{ id: 'list', label: '≡ List' }, { id: 'kanban', label: '⊞ Kanban' }, { id: 'matrix', label: '⊕ Matrix' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: view === v.id ? 500 : 400, background: view === v.id ? 'var(--gold-300)' : 'transparent', color: view === v.id ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s' }}>
              {v.label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search tasks..." style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-md)', padding: '7px 14px', color: 'var(--cream-200)', fontSize: '12px', fontFamily: 'var(--font-sans)', outline: 'none', width: '160px' }} />
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterCat('all')} style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: filterCat === 'all' ? 'var(--gold-300)' : 'transparent', color: filterCat === 'all' ? 'var(--base-950)' : 'var(--muted)', transition: 'all 0.15s' }}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', background: filterCat === c.id ? c.color : 'transparent', color: filterCat === c.id ? 'var(--base-950)' : c.color, transition: 'all 0.15s' }}>{c.label}</button>
          ))}
        </div>
      </div>

      {view === 'list' && <ListView />}
      {view === 'kanban' && <KanbanView />}
      {view === 'matrix' && <MatrixView />}

      {/* Add Task Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>New Task</h3>
            <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Task</label>
                <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="What needs to be done?" autoFocus required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label} — {p.desc}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>Effort (1–5)</label>
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '8px' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setNewTask(p => ({ ...p, effort: n }))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '0.5px solid', borderColor: newTask.effort >= n ? 'var(--gold-300)' : 'var(--base-600)', background: newTask.effort >= n ? 'var(--gold-300)' : 'transparent', color: newTask.effort >= n ? 'var(--base-950)' : 'var(--muted)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea value={newTask.notes} onChange={e => setNewTask(p => ({ ...p, notes: e.target.value }))} placeholder="Any extra context..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add Task ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}