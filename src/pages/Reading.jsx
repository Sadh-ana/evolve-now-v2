import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays } from 'date-fns'

export default function Reading({ session }) {
  const [books, setBooks] = useState([])
  const [readingLogs, setReadingLogs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showLog, setShowLog] = useState(null) // book id to log pages for
  const [newBook, setNewBook] = useState({ title: '', author: '', total_pages: '', status: 'reading' })
  const [pagesRead, setPagesRead] = useState(30)
  const [view, setView] = useState('reading') // reading | completed | all

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const uid = session.user.id
    const { data: b } = await supabase.from('books').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setBooks(b || [])
    const start30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const { data: l } = await supabase.from('reading_logs').select('*').eq('user_id', uid).gte('date', start30)
    setReadingLogs(l || [])
  }

  async function addBook(e) {
    e.preventDefault()
    const { data } = await supabase.from('books').insert({
      user_id: session.user.id, title: newBook.title, author: newBook.author,
      total_pages: parseInt(newBook.total_pages) || null, status: newBook.status,
      started_date: newBook.status === 'reading' ? format(new Date(), 'yyyy-MM-dd') : null,
    }).select().single()
    if (data) setBooks(p => [data, ...p])
    setNewBook({ title: '', author: '', total_pages: '', status: 'reading' })
    setShowAdd(false)
  }

  async function logPages(bookId) {
    const book = books.find(b => b.id === bookId)
    if (!book) return
    const newPage = Math.min(book.current_page + pagesRead, book.total_pages || Infinity)
    const isComplete = book.total_pages && newPage >= book.total_pages

    const { data: log } = await supabase.from('reading_logs').insert({
      user_id: session.user.id, book_id: bookId, pages_read: pagesRead, date: format(new Date(), 'yyyy-MM-dd')
    }).select().single()
    if (log) setReadingLogs(p => [...p, log])

    const updates = { current_page: newPage }
    if (isComplete) { updates.status = 'completed'; updates.completed_date = format(new Date(), 'yyyy-MM-dd') }
    await supabase.from('books').update(updates).eq('id', bookId)
    setBooks(p => p.map(b => b.id === bookId ? { ...b, ...updates } : b))
    setShowLog(null); setPagesRead(30)
  }

  async function rateBook(id, rating) {
    await supabase.from('books').update({ rating }).eq('id', id)
    setBooks(p => p.map(b => b.id === id ? { ...b, rating } : b))
  }

  async function deleteBook(id) {
    await supabase.from('books').delete().eq('id', id)
    setBooks(p => p.filter(b => b.id !== id))
  }

  const filtered = books.filter(b => view === 'all' ? true : view === 'reading' ? b.status === 'reading' : b.status === 'completed')
  const totalPages30 = readingLogs.reduce((s, l) => s + (l.pages_read || 0), 0)
  const avgPagesDay = Math.round(totalPages30 / 30)
  const booksCompleted = books.filter(b => b.status === 'completed').length

  const iStyle = { width: '100%', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', borderRadius: '10px', padding: '10px 14px', color: 'var(--cream-200)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }
  const lStyle = { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)' }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: 'var(--cream-200)', marginBottom: '4px' }}>Reading</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>books, pages, ideas ✦</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', background: 'var(--gold-300)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--base-950)' }}>+ Add book</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { val: books.filter(b => b.status === 'reading').length, label: 'currently reading' },
          { val: booksCompleted, label: 'completed' },
          { val: `${avgPagesDay}`, label: 'pages/day avg' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--gold-300)', lineHeight: 1, marginBottom: '4px' }}>{s.val}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[{ id: 'reading', label: 'Reading now' }, { id: 'completed', label: 'Completed' }, { id: 'all', label: 'All' }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', background: view === v.id ? 'var(--gold-300)' : 'var(--base-800)', color: view === v.id ? 'var(--base-950)' : 'var(--muted)' }}>{v.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontStyle: 'italic', color: 'var(--gold-300)', marginBottom: '8px' }}>no books yet ✦</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Add your first book to start tracking.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(book => {
            const progress = book.total_pages ? Math.round((book.current_page / book.total_pages) * 100) : null
            return (
              <div key={book.id} style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '48px', height: '64px', borderRadius: '4px', background: 'var(--base-700)', border: '0.5px solid var(--base-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', color: 'var(--gold-300)', fontStyle: 'italic' }}>{book.title[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '2px', fontWeight: 400 }}>{book.title}</h3>
                    {book.author && <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>by {book.author}</p>}

                    {progress !== null && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{book.current_page} / {book.total_pages} pages</span>
                          <span style={{ fontSize: '10px', color: 'var(--gold-300)', fontFamily: 'var(--font-sans)' }}>{progress}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--base-700)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-300), var(--rose-300))', width: `${progress}%`, borderRadius: '99px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )}

                    {book.status === 'completed' && book.rating && (
                      <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
                        {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: '12px', color: n <= book.rating ? 'var(--gold-300)' : 'var(--base-600)' }}>★</span>)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                    {book.status === 'reading' && (
                      <button onClick={() => setShowLog(book.id)} style={{ padding: '6px 14px', background: 'var(--gold-300)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, color: 'var(--base-950)' }}>+ Log</button>
                    )}
                    {book.status === 'completed' && !book.rating && (
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1,2,3,4,5].map(n => <button key={n} onClick={() => rateBook(book.id, n)} style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--base-600)', padding: 0 }}>★</button>)}
                      </div>
                    )}
                    <button onClick={() => deleteBook(book.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--base-600)', fontSize: '14px', padding: '4px' }}>×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Add book</h3>
            <form onSubmit={addBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lStyle}>Title</label><input value={newBook.title} onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))} placeholder="Book title" required autoFocus style={iStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lStyle}>Author</label><input value={newBook.author} onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))} placeholder="Author name" style={iStyle} /></div>
                <div><label style={lStyle}>Total pages</label><input type="number" value={newBook.total_pages} onChange={e => setNewBook(p => ({ ...p, total_pages: e.target.value }))} placeholder="300" style={iStyle} /></div>
              </div>
              <div><label style={lStyle}>Status</label>
                <select value={newBook.status} onChange={e => setNewBook(p => ({ ...p, status: e.target.value }))} style={iStyle}>
                  <option value="reading">Currently reading</option>
                  <option value="want-to-read">Want to read</option>
                  <option value="completed">Already completed</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Add ✦</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowLog(null)}>
          <div style={{ background: 'var(--base-800)', border: '0.5px solid var(--base-600)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--cream-200)', marginBottom: '20px' }}>Log reading session</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={lStyle}>Pages read today</label>
              <input type="number" value={pagesRead} onChange={e => setPagesRead(parseInt(e.target.value) || 0)} min={1} style={iStyle} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLog(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '0.5px solid var(--base-600)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => logPages(showLog)} style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--gold-300)', color: 'var(--base-950)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Log pages ✦</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}